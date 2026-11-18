import { createServerFn } from "@tanstack/react-start";
import { detectHumanNames } from "@/lib/humanNameModeration";

export type ModeratedContentType = "story" | "reply" | "tip" | "reach-out";
export type ModerationDecision = "approve" | "revise" | "block";
export type SafetyLevel = "safe" | "caution" | "unsafe" | "crisis";

export interface AiModerationRequest {
  contentType: ModeratedContentType;
  title?: string;
  body: string;
}

export interface AiModerationResult {
  decision: ModerationDecision;
  safetyLevel: SafetyLevel;
  crisisAlert: boolean;
  summary: string;
  flags: string[];
  guidance: string;
  suggestedRewrite?: string;
}

export type AiModerationResponse =
  { ok: true; moderation: AiModerationResult } | { ok: false; error: string };

export interface OpenAiModerationApiResultItem {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores?: Record<string, number>;
}

export interface OpenAiModerationApiResponse {
  id?: string;
  model?: string;
  results?: OpenAiModerationApiResultItem[];
  error?: {
    message?: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  harassment: "Harassment or bullying",
  "harassment/threatening": "Threatening harassment",
  hate: "Hate speech",
  "hate/threatening": "Threatening hate speech",
  illicit: "Illicit activity",
  "illicit/violent": "Violent illicit activity",
  "self-harm": "Self-harm content",
  "self-harm/intent": "Self-harm intent",
  "self-harm/instructions": "Self-harm instructions",
  sexual: "Sexual content",
  "sexual/minors": "Unsafe content involving minors",
  violence: "Violence",
  "violence/graphic": "Graphic violence",
};

const SELF_HARM_CATEGORIES = ["self-harm", "self-harm/intent", "self-harm/instructions"];
const CAUTION_CATEGORIES = ["harassment", "hate", "violence"];
const CAUTION_SCORE_THRESHOLD = 0.35;

export function buildModerationInput(data: AiModerationRequest): string {
  const title = data.title?.trim();
  const body = data.body.trim();
  return title ? `${title}\n\n${body}` : body;
}

/**
 * Enforces the "No actual human names allowed" moderation rule across public
 * submissions (`story`, `reply`, `tip`). Returns null when no human names are found.
 */
export function screenNoHumanNames(data: AiModerationRequest): AiModerationResult | null {
  if (data.contentType === "reach-out") {
    return null;
  }

  const titleCheck = data.title ? detectHumanNames(data.title) : null;
  const bodyCheck = detectHumanNames(data.body);

  const combinedNames = Array.from(
    new Set([...(titleCheck?.detectedNames ?? []), ...bodyCheck.detectedNames]),
  );

  if (combinedNames.length === 0) {
    return null;
  }

  const previewList = combinedNames.slice(0, 4).join(", ");
  const extraCount = combinedNames.length > 4 ? ` (+${combinedNames.length - 4} more)` : "";

  return {
    decision: "block",
    safetyLevel: "unsafe",
    crisisAlert: false,
    summary: `No real human names are allowed on Olive (detected: ${previewList}${extraCount}).`,
    flags: ["No real human names allowed", `Detected name(s): ${previewList}${extraCount}`],
    guidance:
      "For everyone's privacy and safety, replace actual human names with roles (like 'my friend' or 'a classmate') or anonymous labels like [Person A].",
    suggestedRewrite: bodyCheck.hasHumanNames ? bodyCheck.anonymizedText : undefined,
  };
}

export function mapOpenAiModerationResult(
  item: OpenAiModerationApiResultItem,
  contentType: ModeratedContentType = "story",
): AiModerationResult {
  const categories = item.categories ?? {};
  const scores = item.category_scores ?? {};

  const triggeredKeys = Object.entries(categories)
    .filter(([, isTriggered]) => Boolean(isTriggered))
    .map(([key]) => key);

  const flags = triggeredKeys.map((key) => CATEGORY_LABELS[key] ?? key);

  const hasCrisisCategory = SELF_HARM_CATEGORIES.some((key) => Boolean(categories[key]));
  if (hasCrisisCategory) {
    return {
      decision: "block",
      safetyLevel: "crisis",
      crisisAlert: true,
      summary: "This message indicates possible self-harm or crisis distress.",
      flags: flags.length > 0 ? flags : ["Self-harm concern"],
      guidance:
        "You don't have to carry this alone. Please use the free, confidential support resources below right away.",
    };
  }

  if (item.flagged || triggeredKeys.length > 0) {
    const labelList = flags.length > 0 ? flags.join(", ") : "Community safety guidelines";
    return {
      decision: "block",
      safetyLevel: "unsafe",
      crisisAlert: false,
      summary: `Flagged by OpenAI Moderation for: ${labelList}.`,
      flags: flags.length > 0 ? flags : ["Safety policy violation"],
      guidance:
        contentType === "reach-out"
          ? "Please remove hostile, threatening, or unsafe language before sending your note."
          : "Please remove harmful, harassing, or unsafe language before posting to keep Olive safe for teens.",
    };
  }

  const cautionMatches = CAUTION_CATEGORIES.filter(
    (key) => typeof scores[key] === "number" && scores[key] >= CAUTION_SCORE_THRESHOLD,
  );

  if (cautionMatches.length > 0) {
    const cautionFlags = cautionMatches.map(
      (key) => `Elevated ${CATEGORY_LABELS[key]?.toLowerCase() ?? key} tone`,
    );
    return {
      decision: "revise",
      safetyLevel: "caution",
      crisisAlert: false,
      summary:
        "Passed strict safety blocks, though parts of your message may sound intense or sharp.",
      flags: cautionFlags,
      guidance:
        contentType === "reach-out"
          ? "Consider softening any heated phrasing so the other person feels safe reading your note."
          : "Consider softening any harsh wording so readers focus on your perspective rather than tone.",
    };
  }

  return {
    decision: "approve",
    safetyLevel: "safe",
    crisisAlert: false,
    summary: "No safety concerns or real human names detected.",
    flags: [],
    guidance:
      contentType === "reach-out"
        ? "Your note looks respectful and safe to send."
        : "Your message is anonymous and ready to submit.",
  };
}

export function mergeSafetyAndNameModeration(
  openAiResult: AiModerationResult,
  nameResult: AiModerationResult | null,
): AiModerationResult {
  if (!nameResult) {
    return openAiResult;
  }

  if (openAiResult.crisisAlert || openAiResult.safetyLevel === "crisis") {
    return {
      ...openAiResult,
      flags: Array.from(new Set([...openAiResult.flags, ...nameResult.flags])),
      suggestedRewrite: nameResult.suggestedRewrite ?? openAiResult.suggestedRewrite,
    };
  }

  const mergedFlags = Array.from(new Set([...nameResult.flags, ...openAiResult.flags]));
  const hasAdditionalOpenAiIssue =
    openAiResult.decision === "block" || openAiResult.decision === "revise";

  return {
    decision: "block",
    safetyLevel: "unsafe",
    crisisAlert: false,
    summary: hasAdditionalOpenAiIssue
      ? `${nameResult.summary} Also flagged: ${openAiResult.summary}`
      : nameResult.summary,
    flags: mergedFlags,
    guidance: hasAdditionalOpenAiIssue
      ? `${nameResult.guidance} ${openAiResult.guidance}`
      : nameResult.guidance,
    suggestedRewrite: nameResult.suggestedRewrite ?? openAiResult.suggestedRewrite,
  };
}

export const moderateWithAI = createServerFn({ method: "POST" })
  .validator((data: AiModerationRequest) => data)
  .handler(async ({ data }): Promise<AiModerationResponse> => {
    const input = buildModerationInput(data);
    if (!input || input.length < 2) {
      return {
        ok: false,
        error: "Please enter a message before running the AI Moderator check.",
      };
    }

    const nameModeration = screenNoHumanNames(data);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      if (nameModeration) {
        return {
          ok: true,
          moderation: nameModeration,
        };
      }
      return {
        ok: false,
        error:
          "AI Moderator could not run because OPENAI_API_KEY is not configured in Settings > Secrets (or .env).",
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "omni-moderation-latest",
          input,
        }),
      });

      const payload = (await response.json()) as OpenAiModerationApiResponse;

      if (!response.ok) {
        if (nameModeration) {
          return {
            ok: true,
            moderation: nameModeration,
          };
        }
        const apiMessage = payload?.error?.message || `HTTP ${response.status}`;
        return {
          ok: false,
          error: `OpenAI Moderation request failed: ${apiMessage}`,
        };
      }

      const firstResult = payload.results?.[0];
      if (!firstResult) {
        if (nameModeration) {
          return {
            ok: true,
            moderation: nameModeration,
          };
        }
        return {
          ok: false,
          error: "OpenAI Moderation returned an empty result. Please try again.",
        };
      }

      const openAiModeration = mapOpenAiModerationResult(firstResult, data.contentType);
      return {
        ok: true,
        moderation: mergeSafetyAndNameModeration(openAiModeration, nameModeration),
      };
    } catch (err) {
      if (nameModeration) {
        return {
          ok: true,
          moderation: nameModeration,
        };
      }
      const message = err instanceof Error ? err.message : "Unexpected OpenAI Moderation error.";
      console.error("OpenAI Moderation error:", err);
      return {
        ok: false,
        error: `AI Moderator check failed: ${message}`,
      };
    }
  });

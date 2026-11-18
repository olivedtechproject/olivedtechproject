import { describe, expect, it } from "vitest";
import {
  buildModerationInput,
  mapOpenAiModerationResult,
  mergeSafetyAndNameModeration,
  screenNoHumanNames,
} from "../lib/aiModerator";
import { detectHumanNames } from "../lib/humanNameModeration";

describe("OpenAI Safety Moderation Mapping", () => {
  it("combines title and body cleanly into moderation input", () => {
    expect(
      buildModerationInput({
        contentType: "story",
        title: "AITW for locking my door?",
        body: "My brother kept taking my headphones.",
      }),
    ).toBe("AITW for locking my door?\n\nMy brother kept taking my headphones.");

    expect(
      buildModerationInput({
        contentType: "reply",
        body: "Try talking calmly after dinner.",
      }),
    ).toBe("Try talking calmly after dinner.");
  });

  it("approves clean non-flagged content with low category scores", () => {
    const mapped = mapOpenAiModerationResult(
      {
        flagged: false,
        categories: {
          harassment: false,
          hate: false,
          violence: false,
          "self-harm": false,
        },
        category_scores: {
          harassment: 0.02,
          hate: 0.001,
          violence: 0.005,
        },
      },
      "story",
    );

    expect(mapped.decision).toBe("approve");
    expect(mapped.safetyLevel).toBe("safe");
    expect(mapped.crisisAlert).toBe(false);
    expect(mapped.flags).toEqual([]);
  });

  it("flags elevated unblocked tone as revise/caution", () => {
    const mapped = mapOpenAiModerationResult(
      {
        flagged: false,
        categories: {
          harassment: false,
          hate: false,
          violence: false,
        },
        category_scores: {
          harassment: 0.42,
          hate: 0.01,
          violence: 0.02,
        },
      },
      "reach-out",
    );

    expect(mapped.decision).toBe("revise");
    expect(mapped.safetyLevel).toBe("caution");
    expect(mapped.crisisAlert).toBe(false);
    expect(mapped.flags).toEqual(["Elevated harassment or bullying tone"]);
  });

  it("blocks flagged harassment/hate/violence content", () => {
    const mapped = mapOpenAiModerationResult(
      {
        flagged: true,
        categories: {
          harassment: true,
          "harassment/threatening": true,
          "self-harm": false,
        },
      },
      "reply",
    );

    expect(mapped.decision).toBe("block");
    expect(mapped.safetyLevel).toBe("unsafe");
    expect(mapped.crisisAlert).toBe(false);
    expect(mapped.flags).toEqual(["Harassment or bullying", "Threatening harassment"]);
  });

  it("triggers crisisAlert and blocks on self-harm categories", () => {
    const mapped = mapOpenAiModerationResult(
      {
        flagged: true,
        categories: {
          "self-harm": true,
          "self-harm/intent": true,
        },
      },
      "story",
    );

    expect(mapped.decision).toBe("block");
    expect(mapped.safetyLevel).toBe("crisis");
    expect(mapped.crisisAlert).toBe(true);
    expect(mapped.flags).toEqual(["Self-harm content", "Self-harm intent"]);
  });
});

describe("No Actual Human Names Moderation", () => {
  it("detects dedicated first names, full names, and honorifics and anonymizes them", () => {
    const res = detectHumanNames(
      "My friend Emma Johnson and Mr. Smith said Jake was upset with me.",
    );

    expect(res.hasHumanNames).toBe(true);
    expect(res.detectedNames).toEqual(["Emma Johnson", "Mr. Smith", "Jake"]);
    expect(res.anonymizedText).toBe(
      "My friend [Person A] and [Person B] said [Person C] was upset with me.",
    );
  });

  it("detects names introduced via relationships even for ambiguous words", () => {
    const res = detectHumanNames("My friend Grace ignored me in class today.");
    expect(res.hasHumanNames).toBe(true);
    expect(res.detectedNames).toEqual(["Grace"]);
    expect(res.anonymizedText).toBe("My friend [Person A] ignored me in class today.");
  });

  it("does not falsely flag Olive, role nouns, or generated anonymous usernames", () => {
    const clean = detectHumanNames(
      "Olive helps Mindful-Otter-482 and SunnyFox23 talk calmly with my sister and our teacher on Monday. I hope we have grace and patience.",
    );

    expect(clean.hasHumanNames).toBe(false);
    expect(clean.detectedNames).toEqual([]);
    expect(clean.anonymizedText).toContain("Mindful-Otter-482");
  });

  it("blocks stories, replies, and tips with real names while exempting private reach-out notes", () => {
    const storyBlock = screenNoHumanNames({
      contentType: "story",
      title: "AITW for yelling at Sarah?",
      body: "Sarah took my charger without asking.",
    });
    expect(storyBlock).not.toBeNull();
    expect(storyBlock?.decision).toBe("block");
    expect(storyBlock?.flags).toContain("No real human names allowed");
    expect(storyBlock?.suggestedRewrite).toBe("[Person A] took my charger without asking.");

    const reachOutResult = screenNoHumanNames({
      contentType: "reach-out",
      title: "Note to Sarah",
      body: "Hey Sarah, sorry for earlier.",
    });
    expect(reachOutResult).toBeNull();
  });

  it("merges OpenAI approval with human-name blocking so real names are always blocked", () => {
    const openAiApproved = mapOpenAiModerationResult(
      {
        flagged: false,
        categories: {},
        category_scores: { harassment: 0.01 },
      },
      "story",
    );
    const nameResult = screenNoHumanNames({
      contentType: "story",
      body: "My brother Liam ate my leftovers.",
    });

    const merged = mergeSafetyAndNameModeration(openAiApproved, nameResult);
    expect(merged.decision).toBe("block");
    expect(merged.safetyLevel).toBe("unsafe");
    expect(merged.flags).toContain("No real human names allowed");
    expect(merged.suggestedRewrite).toBe("My brother [Person A] ate my leftovers.");
  });
});

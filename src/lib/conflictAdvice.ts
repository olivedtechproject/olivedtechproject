import { createServerFn } from "@tanstack/react-start";

export interface ConflictAdviceRequest {
  title: string;
  body: string;
  userContext?: {
    nickname?: string;
    pastTopics?: string[];
    excludedContexts?: string[];
    recentStoriesCount?: number;
    userDraftOrLetter?: string;
  };
}

export interface ConflictAdviceResponse {
  headline: string;
  perspectiveCheck: string;
  emotionalRegulationSteps: Array<{
    step: string;
    detail: string;
  }>;
  conflictResolutionPlan: Array<{
    action: string;
    detail: string;
    exampleScript?: string;
  }>;
  personalizedNote?: string;
}

export const getConflictAdvice = createServerFn({ method: "POST" })
  .validator((data: ConflictAdviceRequest) => data)
  .handler(async ({ data }): Promise<ConflictAdviceResponse> => {
    const { title, body, userContext } = data;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Graceful supportive fallback if API key is not configured in environment
      return generateLocalConflictAdvice(title, body, userContext);
    }

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const contextSummary = userContext
        ? `User context from their activity on the Olive site:
- Current identity: ${userContext.nickname || "Anonymous"}
- Previous topic history/concerns: ${(userContext.pastTopics || []).join(", ") || "None recorded"}
- Sensitivity / excluded topics: ${(userContext.excludedContexts || []).join(", ") || "None"}
- Past stories count: ${userContext.recentStoriesCount || 0}
${userContext.userDraftOrLetter ? `- Additional user notes/reach-out draft: ${userContext.userDraftOrLetter}` : ""}`
        : "No previous user history.";

      const prompt = `You are Olive, a compassionate, emotionally intelligent conflict-resolution and emotional-regulation mentor for teens.
A teen is asking "Am I in the wrong?" about a real conflict they are going through.

TEEN'S STORY:
Title: "${title}"
Details: "${body}"

${contextSummary}

YOUR MISSION:
1. Provide a gentle reality check on whether they were in the wrong (validate their true feelings while honestly addressing any unhelpful reactions).
2. Give actionable, somatic and psychological steps the teen can do RIGHT NOW to regulate their intense emotions (heart rate, anger, anxiety, shame).
3. Give concrete, realistic action steps the teen can take to resolve this conflict, including exact words or text message scripts they can say to the other person.
4. If relevant, weave in a personal encouraging note reflecting their previous info on the site.

Keep tone warm, teen-accessible (non-judgmental, non-clinical), practical, and empowering.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are Olive, an expert emotional-regulation and restorative conflict-resolution mentor for teens. Always respond with constructive, calm, practical steps.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: "A short, supportive 1-sentence reflection.",
              },
              perspectiveCheck: {
                type: Type.STRING,
                description:
                  "Honest, balanced perspective on whether they were in the wrong and what both sides might be feeling.",
              },
              emotionalRegulationSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING, description: "Name of the calming action" },
                    detail: { type: Type.STRING, description: "How to do it right now" },
                  },
                  required: ["step", "detail"],
                },
                description: "3 to 4 concrete steps to calm down and regulate emotions.",
              },
              conflictResolutionPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: {
                      type: Type.STRING,
                      description: "Concrete next step to resolve the conflict",
                    },
                    detail: { type: Type.STRING, description: "Why and how to do it" },
                    exampleScript: {
                      type: Type.STRING,
                      description: "Exact words, dialogue, or text message to send",
                    },
                  },
                  required: ["action", "detail"],
                },
                description: "2 to 3 real steps to resolve the conflict with the other person.",
              },
              personalizedNote: {
                type: Type.STRING,
                description: "Encouraging closing note connecting to their Olive journey.",
              },
            },
            required: [
              "headline",
              "perspectiveCheck",
              "emotionalRegulationSteps",
              "conflictResolutionPlan",
            ],
          },
        },
      });

      const parsedText = response.text;
      if (!parsedText) {
        return generateLocalConflictAdvice(title, body, userContext);
      }

      const result = JSON.parse(parsedText) as ConflictAdviceResponse;
      return result;
    } catch (err) {
      console.error("Gemini conflict advice error:", err);
      return generateLocalConflictAdvice(title, body, userContext);
    }
  });

function generateLocalConflictAdvice(
  title: string,
  body: string,
  userContext?: ConflictAdviceRequest["userContext"],
): ConflictAdviceResponse {
  const isSibling = /brother|sister|sibling/i.test(`${title} ${body}`);
  const isFriend = /friend|bff|lunch|group chat|text/i.test(`${title} ${body}`);

  return {
    headline: "Take a breath — your feelings make sense, and there is a healthy path through this.",
    perspectiveCheck: isSibling
      ? "Living in the same space makes tensions feel amplified. Your frustration is valid, but reacting in the heat of the moment often shifts the focus from their boundary violation to your reaction."
      : isFriend
        ? "Friendship misunderstandings often happen when intentions get lost in silence or misread cues. You have every right to feel hurt, but giving yourself space before answering prevents regret."
        : "Conflicts feel overwhelming when emotions are raw. Both your perspective and the other person's experience deserve room to breathe.",
    emotionalRegulationSteps: [
      {
        step: "Box Breathing (4-4-4-4)",
        detail:
          "Inhale through your nose for 4 seconds, hold for 4 seconds, exhale slowly for 4 seconds, and hold for 4 seconds. Repeat 4 times to signal your nervous system that you are safe.",
      },
      {
        step: "Physical Distance Reset",
        detail:
          "Put your phone face-down or step into a different room for 15 minutes. Breaking eye contact with the trigger gives your prefrontal cortex time to get back online.",
      },
      {
        step: "Unsent Brain Dump",
        detail:
          "Write out every raw, angry thought on paper or in your private notes. Don't censor anything. Once your heart rate slows down, delete or tear it up.",
      },
    ],
    conflictResolutionPlan: [
      {
        action: "Open with an observation rather than an accusation",
        detail:
          "When people feel attacked, they get defensive. Starting with how you experienced the moment makes them listen.",
        exampleScript: isSibling
          ? `"Hey, I got really frustrated earlier because I felt like my personal space wasn't respected. I want us to be cool, but I need you to ask before taking my stuff."`
          : `"Hey, when things happened earlier I felt really caught off guard and hurt. I value our friendship and want to talk things out when you have a minute."`,
      },
      {
        action: "Ask for their perspective",
        detail:
          "Give them a chance to explain without interrupting, even if you disagree at first.",
        exampleScript: `"Can you help me understand where you were coming from?"`,
      },
    ],
    personalizedNote: userContext?.nickname
      ? `You're taking the hard, mature step by pausing to reflect, ${userContext.nickname}. Extend the branch when you're ready.`
      : "You're taking the hard, mature step by pausing to reflect. Extend the branch when you're ready.",
  };
}

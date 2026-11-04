import { describe, expect, it } from "vitest";
import { gatherUserSiteHistory, recordUserPostedStory } from "../lib/userSiteHistory";

describe("AI Conflict Advice & User Site History", () => {
  it("gathers initial user site history safely", () => {
    const history = gatherUserSiteHistory("QuietFox42");
    expect(history.nickname).toBe("QuietFox42");
    expect(Array.isArray(history.pastTopics)).toBe(true);
    expect(Array.isArray(history.excludedContexts)).toBe(true);
  });

  it("records user posted stories into local history", () => {
    recordUserPostedStory("Argument over shared desk", "We fought because he took all the space.");
    const history = gatherUserSiteHistory("QuietFox42");
    expect(history.recentStoriesCount).toBeGreaterThanOrEqual(1);
    expect(history.pastStoriesSnippets?.some((s) => s.includes("Argument over shared desk"))).toBe(
      true,
    );
  });
});

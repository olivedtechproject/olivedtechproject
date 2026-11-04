import { describe, expect, it } from "vitest";
import { detectStoryContexts, getAccountStorageKey, KNOWN_CONTEXTS } from "../lib/feedAlgorithm";

describe("Feed Algorithm Context Detection & Preferences", () => {
  it("detects friend and lunch contexts from story content", () => {
    const contexts = detectStoryContexts(
      "My best friend sat with someone else at lunch",
      "We always sit together. Today she sat with a new girl and ignored me.",
    );

    expect(contexts).toContain("Friendships & Lunch Cliques");
  });

  it("detects family and privacy contexts from journal incident", () => {
    const contexts = detectStoryContexts(
      "Brother read my journal",
      "My little brother read my journal and told my mom something private.",
    );

    expect(contexts).toContain("Family & Siblings");
    expect(contexts).toContain("Privacy & Personal Boundaries");
  });

  it("generates separate account storage keys based on user nickname", () => {
    expect(getAccountStorageKey("TeenUser123")).toBe("olive_feed_algo_teenuser123");
    expect(getAccountStorageKey("")).toBe("olive_feed_algo_guest");
    expect(getAccountStorageKey(null)).toBe("olive_feed_algo_guest");
  });

  it("has predefined context categories with valid keywords", () => {
    expect(KNOWN_CONTEXTS.length).toBeGreaterThan(0);
    for (const ctx of KNOWN_CONTEXTS) {
      expect(ctx.id).toBeDefined();
      expect(ctx.name).toBeDefined();
      expect(ctx.keywords.length).toBeGreaterThan(0);
    }
  });
});

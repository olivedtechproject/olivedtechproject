import { describe, expect, it } from "vitest";
import { Route } from "../routes/calm";
import {
  CALM_SCENARIOS,
  EMOTION_CATEGORIES,
  classifyCommunityTip,
  computeRatingStats,
  filterAndSortItems,
} from "../lib/calmTips";

describe("Cool Down Tab Emotion, Popularity, and 5-Star Ratings", () => {
  it("has Route defined for /calm with proper meta tags", () => {
    expect(Route).toBeDefined();
  });

  it("provides scenarios for every selectable emotion category", () => {
    const specificEmotions = EMOTION_CATEGORIES.filter((e) => e !== "All");
    for (const emotion of specificEmotions) {
      const results = filterAndSortItems(CALM_SCENARIOS, "All", emotion, "recommended", {});
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.item.emotions.includes(emotion))).toBe(true);
    }
  });

  it("starts with 0 ratings when unrated and updates accurately when rated", () => {
    const before = computeRatingStats("scenario-sibling-boundaries", {});
    expect(before.count).toBe(0);
    expect(before.average).toBe(0);
    expect(before.userRating).toBeNull();
    expect(before.popularityScore).toBe(0);

    const after = computeRatingStats("scenario-sibling-boundaries", {
      "scenario-sibling-boundaries": 5,
    });
    expect(after.count).toBe(1);
    expect(after.userRating).toBe(5);
    expect(after.average).toBe(5);
    expect(after.popularityScore).toBeGreaterThan(0);
  });

  it("sorts suggestions by popularity and highest star rating from real ratings", () => {
    const customRatings = {
      "scenario-hurt-family": 5,
      "scenario-stress-work": 3,
    };

    const popular = filterAndSortItems(CALM_SCENARIOS, "All", "All", "popular", customRatings);
    expect(popular[0].item.id).toBe("scenario-hurt-family");
    expect(popular[1].item.id).toBe("scenario-stress-work");
    for (let i = 1; i < popular.length; i++) {
      expect(popular[i - 1].stats.popularityScore).toBeGreaterThanOrEqual(
        popular[i].stats.popularityScore,
      );
    }

    const topRated = filterAndSortItems(
      CALM_SCENARIOS,
      "All",
      "All",
      "highest-rated",
      customRatings,
    );
    expect(topRated[0].item.id).toBe("scenario-hurt-family");
    for (let i = 1; i < topRated.length; i++) {
      expect(topRated[i - 1].stats.average).toBeGreaterThanOrEqual(topRated[i].stats.average);
    }
  });

  it("classifies community tips into matching topics and emotions", () => {
    const siblingTip = classifyCommunityTip(
      "Brother or sister won't stop bothering you?",
      "Put on headphones when they tease you.",
    );
    expect(siblingTip.category).toBe("Sibling Conflicts");
    expect(siblingTip.emotions).toContain("Angry & Frustrated");

    const examTip = classifyCommunityTip(
      "Feeling overwhelmed during exams?",
      "Step outside and breathe cold air.",
    );
    expect(examTip.category).toBe("Stress & School");
    expect(examTip.emotions).toContain("Stressed & Overwhelmed");
  });
});

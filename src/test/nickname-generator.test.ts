import { describe, expect, it } from "vitest";
import { generateRandomNickname } from "../lib/nicknameGenerator";

describe("Random Nickname Generator", () => {
  it("generates a non-empty string nickname", () => {
    const name = generateRandomNickname();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(4);
  });

  it("generates different nicknames across multiple calls", () => {
    const names = new Set<string>();
    for (let i = 0; i < 20; i++) {
      names.add(generateRandomNickname());
    }
    // With 34 adjectives * 32 nouns * 90 numbers = ~97,920 combinations,
    // 20 rolls will virtually always be distinct
    expect(names.size).toBeGreaterThanOrEqual(15);
  });

  it("ends with a two-digit number for uniqueness", () => {
    const name = generateRandomNickname();
    expect(/\d{2}$/.test(name)).toBe(true);
  });
});

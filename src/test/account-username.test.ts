import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  deriveDeterministicUsername,
  generateAccountUsername,
  getAssignedAccountUsername,
} from "../lib/accountAuth";

describe("Permanent Account Username Assignment", () => {
  it("generates Reddit-style Adjective-Noun-### usernames", () => {
    const name = generateAccountUsername();
    expect(name).toMatch(/^[A-Z][a-z]+-[A-Z][a-z]+-\d{3}$/);
  });

  it("preserves user_metadata.assigned_username without changing it", () => {
    const user = {
      id: "user-abc-123",
      email: "teen@example.com",
      user_metadata: { assigned_username: "Mindful-Otter-482" },
    } as unknown as User;

    expect(getAssignedAccountUsername(user)).toBe("Mindful-Otter-482");
  });

  it("derives a deterministic permanent username for legacy accounts lacking metadata", () => {
    const first = deriveDeterministicUsername("legacy-user-999");
    const second = deriveDeterministicUsername("legacy-user-999");
    const other = deriveDeterministicUsername("legacy-user-1000");

    expect(first).toBe(second);
    expect(first).toMatch(/^[A-Z][a-z]+-[A-Z][a-z]+-\d{3}$/);
    expect(first).not.toBe(other);
  });

  it("returns null when no user is signed in", () => {
    expect(getAssignedAccountUsername(null)).toBeNull();
    expect(getAssignedAccountUsername(undefined)).toBeNull();
  });
});

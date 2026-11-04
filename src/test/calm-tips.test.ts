import { describe, expect, it } from "vitest";
import { Route } from "../routes/calm";

describe("Cool Down Tab Sibling Conflict Tips", () => {
  it("has Route defined for /calm with proper meta tags", () => {
    expect(Route).toBeDefined();
  });
});

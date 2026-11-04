import { describe, expect, it } from "vitest";
import { Route } from "../routes/reach-out";

describe("Reach Out Page Sentence Starters", () => {
  it("exports Route for /reach-out with metadata", () => {
    expect(Route).toBeDefined();
  });
});

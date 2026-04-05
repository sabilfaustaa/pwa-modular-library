import { describe, expect, it } from "vitest";
import { version } from "../src";

describe("version export", () => {
  it("should export current version", () => {
    expect(version).toBe("0.1.0");
  });
});

import { describe, expect, it } from "vitest";
import { version } from "../src";

describe("version export", () => {
  it("should export current version", () => {
    expect(version).toBe("1.1.0");
  });
});

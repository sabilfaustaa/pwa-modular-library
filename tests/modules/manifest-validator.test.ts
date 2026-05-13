/**
 * Test: Manifest Validator
 *
 * Validasi struktur web app manifest.json.
 * Module: src/modules/manifest/manifest-validator.ts
 */

import { describe, it, expect } from "vitest";
import { validateManifest } from "../../src/modules/manifest/manifest-validator";
import type { ManifestWarning } from "../../src/modules/manifest/manifest-validator"; // eslint-disable-line @typescript-eslint/no-unused-vars

/** Manifest valid lengkap untuk reusable di test. */
function validManifest() {
  return {
    name: "My PWA App",
    short_name: "PWA",
    start_url: "/",
    display: "standalone",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

describe("validateManifest", () => {
  // --- Valid manifest ---
  it("should return empty warnings for valid manifest", () => {
    const warnings = validateManifest(validManifest());
    expect(warnings).toEqual([]);
  });

  it("should accept display=fullscreen", () => {
    const manifest = { ...validManifest(), display: "fullscreen" };
    const warnings = validateManifest(manifest);
    expect(warnings.filter((w) => w.field === "display")).toEqual([]);
  });

  it("should accept display=minimal-ui", () => {
    const manifest = { ...validManifest(), display: "minimal-ui" };
    const warnings = validateManifest(manifest);
    expect(warnings.filter((w) => w.field === "display")).toEqual([]);
  });

  it("should accept display=browser", () => {
    const manifest = { ...validManifest(), display: "browser" };
    const warnings = validateManifest(manifest);
    expect(warnings.filter((w) => w.field === "display")).toEqual([]);
  });

  // --- Invalid shape ---
  it("should return error for null", () => {
    const warnings = validateManifest(null);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].field).toBe("*");
  });

  it("should return error for array", () => {
    const warnings = validateManifest([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].field).toBe("*");
  });

  it("should return error for string", () => {
    const warnings = validateManifest("not an object");
    expect(warnings).toHaveLength(1);
    expect(warnings[0].field).toBe("*");
  });

  // --- Missing name ---
  it("should warn when name is missing", () => {
    const manifest = { ...validManifest() };
    delete (manifest as Record<string, unknown>).name;
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "name")).toBeDefined();
  });

  it("should warn when name is empty", () => {
    const manifest = { ...validManifest(), name: "   " };
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "name")).toBeDefined();
  });

  // --- Missing short_name ---
  it("should warn when short_name is missing", () => {
    const manifest = { ...validManifest() };
    delete (manifest as Record<string, unknown>).short_name;
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "short_name")).toBeDefined();
  });

  it("should warn when short_name is empty", () => {
    const manifest = { ...validManifest(), short_name: "" };
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "short_name")).toBeDefined();
  });

  // --- Missing start_url ---
  it("should warn when start_url is missing", () => {
    const manifest = { ...validManifest() };
    delete (manifest as Record<string, unknown>).start_url;
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "start_url")).toBeDefined();
  });

  // --- Invalid display ---
  it("should warn when display is missing", () => {
    const manifest = { ...validManifest() };
    delete (manifest as Record<string, unknown>).display;
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "display")).toBeDefined();
  });

  it("should warn when display is invalid", () => {
    const manifest = { ...validManifest(), display: "popup" };
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "display")).toBeDefined();
  });

  // --- Missing icons ---
  it("should warn when icons is missing", () => {
    const manifest = { ...validManifest() };
    delete (manifest as Record<string, unknown>).icons;
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "icons")).toBeDefined();
  });

  it("should warn when icons is empty array", () => {
    const manifest = { ...validManifest(), icons: [] };
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "icons")).toBeDefined();
  });

  // --- Missing specific icon sizes ---
  it("should warn when 192x192 icon is missing", () => {
    const manifest = {
      ...validManifest(),
      icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    };
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "icons" && w.message.includes("192x192"))).toBeDefined();
  });

  it("should warn when 512x512 icon is missing", () => {
    const manifest = {
      ...validManifest(),
      icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    };
    const warnings = validateManifest(manifest);
    expect(warnings.find((w) => w.field === "icons" && w.message.includes("512x512"))).toBeDefined();
  });

  it("should accept icons with multiple sizes in one file", () => {
    const manifest = {
      ...validManifest(),
      icons: [{ src: "/icon.png", sizes: "192x192 512x512", type: "image/png" }],
    };
    const warnings = validateManifest(manifest);
    expect(warnings.filter((w) => w.field === "icons")).toEqual([]);
  });

  // --- Multiple warnings ---
  it("should return multiple warnings for severely broken manifest", () => {
    const manifest = {};
    const warnings = validateManifest(manifest);
    expect(warnings.length).toBeGreaterThan(3);
    const fields = warnings.map((w) => w.field);
    expect(fields).toContain("name");
    expect(fields).toContain("short_name");
    expect(fields).toContain("start_url");
    expect(fields).toContain("display");
    expect(fields).toContain("icons");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CORE_PILOT_DOC_PATH = join(process.cwd(), "..", "docs", "CORE_PILOT.md");

/** Customer-facing Core Pilot help must not leak internal roadmap, version, or implementation jargon. */
const CORE_PILOT_HELP_BANNED_PHRASES: readonly string[] = [
  "v1.1",
  " v1 ",
  "v2",
  "future scope",
  "azure extractor",
  "no azure extractor",
  "extractor zip",
  "repo root",
  "runid",
  "operator shell",
  "cloudprovider:",
  "accelerated v1",
  "mcp",
  "hosted tier 2",
  "wif",
  "phase b",
  "v1 scope",
  "v1 vs",
  "v1 happy path",
  "repository root",
] as const;

function readCorePilotHelpMarkdown(): string {
  return readFileSync(CORE_PILOT_DOC_PATH, "utf8");
}

describe("core-pilot help copy guard", () => {
  it("keeps docs/CORE_PILOT.md free of internal roadmap and implementation jargon", () => {
    const normalized = readCorePilotHelpMarkdown().toLowerCase();
    const violations = CORE_PILOT_HELP_BANNED_PHRASES.filter((phrase) => normalized.includes(phrase));

    expect(violations).toEqual([]);
  });

  it("describes cloud connectors as available for Azure, AWS, and GCP", () => {
    const text = readCorePilotHelpMarkdown();

    expect(text).toMatch(/Cloud connectors are available/i);
    expect(text).toMatch(/Azure, AWS, and GCP/i);
  });

  it("frames evidence-only path without requiring a cloud connector", () => {
    const text = readCorePilotHelpMarkdown().toLowerCase();

    expect(text).toContain("evidence-only review path");
    expect(text).toContain("connector access has not yet been approved");
    expect(text).not.toContain("no azure extractor");
  });
});

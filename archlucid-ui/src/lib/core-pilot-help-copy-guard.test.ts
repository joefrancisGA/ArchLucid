import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { firstArchitectureReviewHelpCopyContainsBannedPattern } from "@/lib/first-architecture-review-help-banned-copy";
import {
  CORE_PILOT_HELP_DISCLOSURE,
  CORE_PILOT_HELP_GUIDE_HEADINGS,
  CORE_PILOT_HELP_OPTIONAL_PATHS_SUMMARY,
  CORE_PILOT_HELP_OPTIONAL_PATHS_TITLE,
  CORE_PILOT_HELP_SUMMARY_COPY,
  CORE_PILOT_HELP_SUMMARY_TITLE,
} from "@/lib/core-pilot-help-guide-content";
import { CORE_PILOT_HELP_CLAIM_DISCIPLINE } from "@/lib/core-pilot-help-evidence-copy";
import { FIRST_ARCHITECTURE_REVIEW_ORIENTATION_BODY, FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE } from "@/lib/first-architecture-review-help-copy";

const CORE_PILOT_DOC_PATH = join(process.cwd(), "..", "docs", "CORE_PILOT.md");
const ORIENTATION_FOOTER_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "_sections",
  "CorePilotHelpClosingPanel.tsx",
);

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

    expect(text).toContain("fast path: evidence-only review");
    expect(text).toContain("connector access has not yet been approved");
    expect(text).not.toContain("no azure extractor");
  });

  it("uses section headings instead of markdown horizontal rules", () => {
    const source = readCorePilotHelpMarkdown();

    expect(source.split("\n").some((line) => /^---\s*$/.test(line.trim()))).toBe(false);
    expect(source).toContain("## Run the first review");
    expect(source).toContain("## Cloud connectors are optional for your first review");
    expect(source).toContain("## What can wait");
  });

  it("TB-1375: keeps CORE_PILOT.md free of Pilot-first and operator-path jargon", () => {
    const violations = firstArchitectureReviewHelpCopyContainsBannedPattern(readCorePilotHelpMarkdown());

    expect(violations).toEqual([]);
    expect(readCorePilotHelpMarkdown()).not.toMatch(/former first-hour/i);
  });

  it("TB-1375: keeps first-review help chrome copy free of Pilot-first and operator-path jargon", () => {
    const chromeCopy = [
      FIRST_ARCHITECTURE_REVIEW_PAGE_TITLE,
      FIRST_ARCHITECTURE_REVIEW_ORIENTATION_BODY,
      CORE_PILOT_HELP_SUMMARY_TITLE,
      CORE_PILOT_HELP_SUMMARY_COPY,
      CORE_PILOT_HELP_OPTIONAL_PATHS_TITLE,
      CORE_PILOT_HELP_OPTIONAL_PATHS_SUMMARY,
      CORE_PILOT_HELP_CLAIM_DISCIPLINE,
      CORE_PILOT_HELP_DISCLOSURE.whatThisGuideCovers.body,
      CORE_PILOT_HELP_DISCLOSURE.whenToUseCloudConnectors.body,
      CORE_PILOT_HELP_DISCLOSURE.actorIntakeForFindingEngines.body,
      CORE_PILOT_HELP_DISCLOSURE.universalIntakeMustEngineCoverage.body,
      CORE_PILOT_HELP_DISCLOSURE.whatCanWaitUntilLater.body,
      ...CORE_PILOT_HELP_GUIDE_HEADINGS.map((heading) => heading.title),
      readFileSync(ORIENTATION_FOOTER_PATH, "utf8"),
    ].join("\n");

    expect(firstArchitectureReviewHelpCopyContainsBannedPattern(chromeCopy)).toEqual([]);
    expect(chromeCopy.toLowerCase()).not.toContain("operator orientation");
  });
});

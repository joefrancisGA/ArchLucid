import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FIRST_ARCHITECTURE_REVIEW_PRIMARY_START_CTA_TEST_ID,
  FIRST_ARCHITECTURE_REVIEW_SPECIALTY_ROOT_TEST_ID,
  FIRST_PILOT_PATH_HELP_SPECIALTY_SOURCE_FILES,
  FIRST_PILOT_PATH_RETIRED_ALIAS_SLUG,
  sourceDeclaresHelpCorePilotSpecialtyCompanion,
  sourceDispatchesFirstArchitectureReviewSpecialtyCompanion,
} from "@/lib/first-pilot-path-help-specialty-guard-surfaces";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";

function readSpecialtyGuardSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("first-pilot-path specialty companion guard (TB-1379)", () => {
  it("keeps complete review workflow on HelpCorePilotGuideView with Start CTA chrome", () => {
    const guideViewSource = readSpecialtyGuardSource(FIRST_PILOT_PATH_HELP_SPECIALTY_SOURCE_FILES[0]!);
    const topicPageSource = readSpecialtyGuardSource(FIRST_PILOT_PATH_HELP_SPECIALTY_SOURCE_FILES[1]!);

    expect(sourceDeclaresHelpCorePilotSpecialtyCompanion(guideViewSource)).toBe(true);
    expect(sourceDispatchesFirstArchitectureReviewSpecialtyCompanion(topicPageSource)).toBe(true);
  });

  it("retires first-pilot-path bookmarks onto the canonical specialty route", () => {
    expect(resolveHelpTopicPermanentRedirect(FIRST_PILOT_PATH_RETIRED_ALIAS_SLUG)).toBe(
      FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
    );
  });

  it("documents specialty root and primary Start CTA test ids for reviewers", () => {
    expect(FIRST_ARCHITECTURE_REVIEW_SPECIALTY_ROOT_TEST_ID).toBe("help-core-pilot-guide");
    expect(FIRST_ARCHITECTURE_REVIEW_PRIMARY_START_CTA_TEST_ID).toBe("core-pilot-primary-start-cta");
  });
});

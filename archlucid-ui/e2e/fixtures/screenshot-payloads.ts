import type { GoldenManifestComparison } from "@/types/comparison";
import type { ArtifactDescriptor, ManifestSummary, RunComparison, RunDetail } from "@/types/authority";

import { fixtureLegacyRunComparison } from "./compare-legacy";
import { fixtureGoldenManifestComparison } from "./compare-structured";
import { fixtureArtifactDescriptorsNonEmpty } from "./artifact-descriptors";

import { fixtureManifestSummary } from "./manifest-summary";
import { fixtureRunDetail } from "./run-detail";
import {
  SCREENSHOT_LEFT_RUN_ID,
  SCREENSHOT_MANIFEST_ID,
  SCREENSHOT_RIGHT_RUN_ID,
  SCREENSHOT_RUN_ID,
} from "./ids";

/** Artifact list aligned with {@link fixtureRunDetailScreenshot} route keys. */
export function fixtureArtifactDescriptorsScreenshot(): ArtifactDescriptor[] {
  return fixtureArtifactDescriptorsNonEmpty().map((a) => ({
    ...a,
    manifestId: SCREENSHOT_MANIFEST_ID,
    runId: SCREENSHOT_RUN_ID,
  }));
}

export function fixtureRunDetailScreenshot(): RunDetail {
  const base = fixtureRunDetail();

  return {
    ...base,
    run: {
      ...base.run,
      runId: SCREENSHOT_RUN_ID,
      goldenManifestId: SCREENSHOT_MANIFEST_ID,
    },
  };
}

/** Manifest summary aligned with {@link fixtureRunDetailScreenshot}. */
export function fixtureManifestSummaryScreenshot(): ManifestSummary {
  const base = fixtureManifestSummary();

  return {
    ...base,
    manifestId: SCREENSHOT_MANIFEST_ID,
    runId: SCREENSHOT_RUN_ID,
  };
}

/** Compare payloads whose run ids match {@link SCREENSHOT_LEFT_RUN_ID} / {@link SCREENSHOT_RIGHT_RUN_ID}. */
export function fixtureLegacyRunComparisonScreenshot(): RunComparison {
  return {
    ...fixtureLegacyRunComparison(),
    leftRunId: SCREENSHOT_LEFT_RUN_ID,
    rightRunId: SCREENSHOT_RIGHT_RUN_ID,
  };
}

export function fixtureGoldenManifestComparisonScreenshot(): GoldenManifestComparison {
  return {
    ...fixtureGoldenManifestComparison(),
    baseRunId: SCREENSHOT_LEFT_RUN_ID,
    targetRunId: SCREENSHOT_RIGHT_RUN_ID,
  };
}
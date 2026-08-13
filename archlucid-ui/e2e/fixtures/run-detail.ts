import type { RunDetail } from "@/types/authority";

import { buildStaticDemoRunDetailFromShowcase } from "@/lib/operator/operator-static-demo";

import {
  FIXTURE_MANIFEST_ID,
  FIXTURE_PROJECT_ID,
  FIXTURE_RUN_ID,
} from "./ids";

/**
 * Run detail aligned to marketing showcase data (mock API for `claims-intake-*` run URL segments).
 * Reuses the static demo builder so findings (including `phi-minimization-risk`) are present for E2E.
 */
export function fixtureRunDetailAlignedToShowcase(urlRunId: string): RunDetail {
  return buildStaticDemoRunDetailFromShowcase(urlRunId);
}

/** Minimal run envelope that passes `coerceRunDetail` and matches operator run page expectations. */
export function fixtureRunDetail(): RunDetail {
  return {
    executionFlavorBuyerSummary:
      "Sealed review with traceable evidence, governed outcomes, and audit-ready deliverables.",
    run: {
      runId: FIXTURE_RUN_ID,
      projectId: FIXTURE_PROJECT_ID,
      description:
        "Claims Intake Modernization — integration boundaries, PHI handling posture, and sponsor-facing KPIs.",
      createdUtc: "2025-06-01T12:00:00.000Z",
      contextSnapshotId: "ctx-snap-fixture",
      graphSnapshotId: "graph-snap-fixture",
      findingsSnapshotId: "findings-snap-fixture",
      goldenManifestId: FIXTURE_MANIFEST_ID,
      decisionTraceId: "trace-fixture",
      artifactBundleId: "bundle-fixture",
    },
    contextSnapshot: { fixture: true },
    graphSnapshot: { fixture: true },
    findingsSnapshot: { fixture: true },
    decisionTrace: { fixture: true },
    goldenManifest: { fixture: true },
    artifactBundle: { fixture: true },
  };
}

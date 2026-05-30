import { FIRST_PILOT_BUYER_COPY } from "@/lib/first-pilot-buyer-copy";
import { FIRST_PILOT_OPERATING_RAIL_STEPS } from "@/lib/first-pilot-operating-rail-steps";
import { buildFirstPilotReadinessRows } from "@/lib/first-pilot-readiness-cockpit";
import type { CurrentPrincipal } from "@/lib/current-principal";
import type { FirstPilotOperatingRailSignals } from "@/lib/first-pilot-operating-rail-status";

import { describe, expect, it } from "vitest";

const principal: CurrentPrincipal = {
  maxAuthority: "ExecuteAuthority",
  authorityRank: 3,
  provenance: "auth-me",
};

const signals: FirstPilotOperatingRailSignals = {
  setupReady: true,
  setupUnhealthy: false,
  evidenceReady: false,
  latestRunId: null,
  firstCommittedRunId: null,
  hasCommittedManifest: false,
  readyToFinalize: false,
};

describe("first-pilot-buyer-copy", () => {
  it("operating rail ingest step leads with architecture review language", () => {
    const ingest = FIRST_PILOT_OPERATING_RAIL_STEPS.find((step) => step.id === "ingest-evidence");

    expect(ingest?.shortBody).toBe(FIRST_PILOT_BUYER_COPY.ingestEvidenceWithoutUpload);
    expect(ingest?.shortBody.toLowerCase()).not.toContain("dry run");
  });

  it("readiness cockpit proof and second-review rows use buyer-safe vocabulary", () => {
    const rows = buildFirstPilotReadinessRows({
      healthStatus: "Healthy",
      healthLoadFailed: false,
      runsLoadFailed: false,
      principal,
      signals: { ...signals, hasCommittedManifest: true },
      scorecard: null,
      scorecardLoadFailed: false,
      configLint: null,
    });

    const proofPipeline = rows.find((row) => row.id === "proof-pipeline");
    const secondReview = rows.find((row) => row.id === "second-review");

    expect(proofPipeline?.summary).toContain(FIRST_PILOT_BUYER_COPY.proofPipelineAction);
    expect(secondReview?.summary).toContain(FIRST_PILOT_BUYER_COPY.governanceDryRun);
  });
});

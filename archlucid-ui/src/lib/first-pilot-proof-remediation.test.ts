import { describe, expect, it } from "vitest";

import { resolveFirstPilotProofRemediation } from "@/lib/first-pilot-proof-remediation";

describe("resolveFirstPilotProofRemediation", () => {
  it("links roi basis to scorecard anchor", () => {
    const remediation = resolveFirstPilotProofRemediation("roi-basis-labels");

    expect(remediation.inAppHref).toBe("/scorecard#roi-baselines");
    expect(remediation.docPath).toContain("roi-baseline");
  });

  it("links committed evidence to review detail when runId is set", () => {
    const remediation = resolveFirstPilotProofRemediation("committed-run-evidence", "run-abc");

    expect(remediation.inAppHref).toBe("/reviews/run-abc");
  });

  it("falls back to triage doc for unknown findings", () => {
    const remediation = resolveFirstPilotProofRemediation("unknown-finding");

    expect(remediation.docPath).toBe("docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md");
    expect(remediation.inAppHref).toBeNull();
  });
});

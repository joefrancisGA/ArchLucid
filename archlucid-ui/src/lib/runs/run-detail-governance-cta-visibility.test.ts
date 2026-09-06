import { describe, expect, it, vi } from "vitest";

import * as demoUiEnv from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import {
  RUN_DETAIL_GOVERNANCE_CTA_LABEL,
  runDetailGovernanceWorkflowHref,
  shouldShowRunDetailGovernanceCta,
} from "@/lib/runs/run-detail-governance-cta-visibility";

describe("shouldShowRunDetailGovernanceCta", () => {
  it("shows in operator shell when manifest exists and governance is still pending", () => {
    expect(
      shouldShowRunDetailGovernanceCta({
        manifestId: "manifest-1",
        buyerPolishedArtifactTable: false,
        operatorGovernanceDecision: null,
        manifestStatus: "Draft",
      }),
    ).toBe(true);
  });

  it("hides in buyer-polished shell", () => {
    expect(
      shouldShowRunDetailGovernanceCta({
        manifestId: "manifest-1",
        buyerPolishedArtifactTable: true,
        operatorGovernanceDecision: null,
        manifestStatus: "Draft",
      }),
    ).toBe(false);
  });

  it("hides without a manifest id", () => {
    expect(
      shouldShowRunDetailGovernanceCta({
        manifestId: null,
        buyerPolishedArtifactTable: false,
        operatorGovernanceDecision: null,
        manifestStatus: "Draft",
      }),
    ).toBe(false);
  });

  it("hides when an operator governance decision is already recorded", () => {
    expect(
      shouldShowRunDetailGovernanceCta({
        manifestId: "manifest-1",
        buyerPolishedArtifactTable: false,
        operatorGovernanceDecision: "Approved",
        manifestStatus: "Draft",
      }),
    ).toBe(false);
  });

  it("hides when manifest governance gate already passed", () => {
    expect(
      shouldShowRunDetailGovernanceCta({
        manifestId: "manifest-1",
        buyerPolishedArtifactTable: false,
        operatorGovernanceDecision: null,
        manifestStatus: "Committed",
      }),
    ).toBe(false);
  });

  it("hides for curated buyer golden spine runs when buyer-polished env is active", () => {
    vi.spyOn(demoUiEnv, "isBuyerPolishedOperatorShellEnv").mockReturnValue(true);

    expect(
      shouldShowRunDetailGovernanceCta({
        runId: SHOWCASE_STATIC_DEMO_RUN_ID,
        manifestId: "manifest-1",
        buyerPolishedArtifactTable: false,
        operatorGovernanceDecision: null,
        manifestStatus: "Draft",
      }),
    ).toBe(false);

    vi.restoreAllMocks();
  });
});

describe("runDetailGovernanceWorkflowHref", () => {
  it("links governance workflow with run id query param", () => {
    expect(runDetailGovernanceWorkflowHref("run-abc")).toBe("/governance/approval-queue?runId=run-abc");
  });
});

describe("RUN_DETAIL_GOVERNANCE_CTA_LABEL", () => {
  it("uses approval forward copy", () => {
    expect(RUN_DETAIL_GOVERNANCE_CTA_LABEL).toBe("Submit for approval");
  });
});

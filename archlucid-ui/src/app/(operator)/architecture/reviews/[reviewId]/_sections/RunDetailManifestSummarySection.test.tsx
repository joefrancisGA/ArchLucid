import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ManifestSummary } from "@/types/authority";

import {
  COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_CHOSEN,
} from "@/lib/review-standards-cloud-target-display";

import { RunDetailManifestSummarySection } from "./RunDetailManifestSummarySection";

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => null,
}));

vi.mock("@/components/ManifestJsonActions", () => ({
  ManifestJsonActions: () => <div />,
}));

vi.mock("@/components/CopyIdButton", () => ({
  CopyIdButton: () => <button type="button" />,
}));

vi.mock("@/components/operator/OperatorEvidenceLimitsFooter", () => ({
  OperatorEvidenceLimitsFooter: () => <div />,
}));

const summary: ManifestSummary = {
  manifestId: "m1",
  runId: "r1",
  createdUtc: "2026-01-01T00:00:00Z",
  manifestHash: "hash",
  ruleSetId: "pack",
  ruleSetVersion: "1",
  status: "Committed",
  decisionCount: 0,
  warningCount: 0,
  unresolvedIssueCount: 0,
};

describe("RunDetailManifestSummarySection operator summary", () => {
  it("labels a missing summary and omits a stored empty summary", () => {
    const { unmount } = render(
      <RunDetailManifestSummarySection
        manifestSummary={summary}
        buyerPolishedShell={false}
      />,
    );

    expect(screen.getByText("Operator summary was not stored.")).toBeInTheDocument();
    unmount();

    render(
      <RunDetailManifestSummarySection
        manifestSummary={{ ...summary, operatorSummary: "" }}
        buyerPolishedShell={false}
      />,
    );

    expect(screen.queryByText("Operator summary was not stored.")).not.toBeInTheDocument();
  });

  it("labels stored-empty cloud target, focused scope off, and zero merge conflicts", () => {
    render(
      <RunDetailManifestSummarySection
        manifestSummary={{
          ...summary,
          effectiveGovernanceAtCommit: {
            hasEffectivePolicy: true,
            packAssignments: [],
            complianceRuleKeyCount: 0,
            conflictCount: 0,
          },
          reviewStandardsAtCommit: {
            cloudProvider: "",
            focusedPilotModeEnabled: false,
            policyReferences: [],
            reviewedQualityDimensions: [],
          },
        }}
        buyerPolishedShell={false}
      />,
    );

    expect(screen.getByText(/Cloud target was stored empty/)).toBeInTheDocument();
    expect(screen.getByText(/Focused review scope was off/)).toBeInTheDocument();
    expect(screen.getByText(/0 merge conflict\(s\)/)).toBeInTheDocument();
  });

  it("labels None cloud target as not chosen on committed manifest standards", () => {
    render(
      <RunDetailManifestSummarySection
        manifestSummary={{
          ...summary,
          reviewStandardsAtCommit: {
            cloudProvider: "None",
            focusedPilotModeEnabled: true,
            policyReferences: [],
            reviewedQualityDimensions: [],
          },
        }}
        buyerPolishedShell={false}
      />,
    );

    expect(screen.getByText(new RegExp(COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_CHOSEN))).toBeInTheDocument();
  });

  it("labels a missing focused review scope flag without guessing false", () => {
    render(
      <RunDetailManifestSummarySection
        manifestSummary={{
          ...summary,
          reviewStandardsAtCommit: {
            cloudProvider: "Azure",
            focusedPilotModeEnabled: null,
            policyReferences: [],
            reviewedQualityDimensions: [],
          },
        }}
        buyerPolishedShell={false}
      />,
    );

    expect(screen.getByText(/Focused review scope was not stored/)).toBeInTheDocument();
  });

  it("labels omitted review standards and effective governance at commit", () => {
    render(
      <RunDetailManifestSummarySection
        manifestSummary={summary}
        buyerPolishedShell={false}
      />,
    );

    expect(screen.getByText("Review standards at commit were not stored.")).toBeInTheDocument();
    expect(screen.getByText("Effective governance at commit was not stored on this summary.")).toBeInTheDocument();
  });

  it("labels a missing feasibility verdict without replacing a stored verdict section", () => {
    render(
      <RunDetailManifestSummarySection
        manifestSummary={summary}
        buyerPolishedShell={false}
      />,
    );

    expect(screen.getByText("Feasibility verdict was not stored.")).toBeInTheDocument();
  });
});

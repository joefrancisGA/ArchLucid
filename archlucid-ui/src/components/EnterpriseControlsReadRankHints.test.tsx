import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  enterpriseExecutePageHintReaderRank,
  governanceDashboardReaderActionLine,
  governanceResolutionRankReaderLine,
} from "@/lib/enterprise-controls-context-copy";

/** Read rank: mock before importing hint components (Vitest hoisting). */
vi.mock("@/components/OperatorNavAuthorityProvider", async () => {
  const { AUTHORITY_RANK } = await import("@/lib/nav-authority");

  return {
    useNavCallerAuthorityRank: (): number => AUTHORITY_RANK.ReadAuthority,
  };
});

import {
  EnterpriseControlsExecutePageHint,
  GovernanceDashboardReaderActionCue,
  GovernanceResolutionRankCue,
} from "./EnterpriseControlsContextHints";

/**
 * When rank is below Execute, mutation pages and governance reader cues surface — these paths share the same rank
 * source as `useEnterpriseMutationCapability` / nav filtering (`AUTHORITY_RANK.ExecuteAuthority` threshold).
 */
describe("EnterpriseControls read-tier hints (rank < Execute)", () => {
  it("Execute-page hint renders the canonical reader line (soft-disable messaging)", () => {
    render(<EnterpriseControlsExecutePageHint />);

    expect(screen.getByRole("note")).toHaveTextContent(enterpriseExecutePageHintReaderRank);
  });

  it("Governance resolution cue uses the reader evidence line", () => {
    render(<GovernanceResolutionRankCue />);

    expect(screen.getByRole("note")).toHaveTextContent(governanceResolutionRankReaderLine);
  });

  it("Governance dashboard reader cue is visible (rank-gated approvals copy)", () => {
    render(<GovernanceDashboardReaderActionCue />);

    expect(screen.getByRole("note")).toHaveTextContent(governanceDashboardReaderActionLine);
  });
});

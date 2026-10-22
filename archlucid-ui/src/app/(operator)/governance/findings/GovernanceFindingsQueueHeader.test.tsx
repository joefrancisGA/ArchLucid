import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsQueueHeader } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueHeader";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" }),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => null,
}));

const defaultHeaderProps = {
  isAssignedToMe: false,
  buyerPolishedShell: false,
  showGovernanceApprovalBanner: false,
  governanceApprovalProvenance: null,
  pageTitle: "Findings",
  pageSubtitle: "Architecture findings queue",
  navHref: "/governance/findings",
  assignedToMeStatusBadge: null,
  assignedToMeHeaderMetadata: undefined,
  assignedToMeHeaderActions: null,
  registerSummary: {
    openRisks: 0,
    expiringExceptions: 0,
    pendingOwner: 0,
    overdueReview: 0,
  },
  scopedRunId: null,
  loading: false,
  currentJobId: "triage-findings" as const,
  workingMode: false,
};

describe("GovernanceFindingsQueueHeader", () => {
  it("shows keyboard shortcut affordances under the architecture findings queue title (UU-33)", () => {
    render(<GovernanceFindingsQueueHeader {...defaultHeaderProps} />);

    const shortcutRow = screen.getByTestId("governance-findings-shortcuts");

    expect(shortcutRow).toHaveTextContent("alt+j");
    expect(shortcutRow).toHaveTextContent("alt+k");
    expect(shortcutRow).toHaveTextContent("alt+1");
    expect(shortcutRow).toHaveTextContent("alt+2");
    expect(shortcutRow).toHaveTextContent("alt+3");
    expect(shortcutRow).toHaveTextContent("when triage keys are enabled");
  });
});

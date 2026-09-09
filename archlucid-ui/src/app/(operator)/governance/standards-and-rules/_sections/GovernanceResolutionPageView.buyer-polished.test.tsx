import { render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import { FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES } from "@/lib/focused-pilot-mode-policy-packs";
import {
  GOVERNANCE_STANDARDS_RULES_BUYER_START_HERE_HELPER,
  GOVERNANCE_STANDARDS_RULES_PAGE_LEAD,
  GOVERNANCE_STANDARDS_RULES_PAGE_SUBTITLE_BUYER,
  GOVERNANCE_STANDARDS_RULES_PRIMARY_CONTENT_ID,
  GOVERNANCE_STANDARDS_RULES_SKIP_LINK_LABEL,
} from "@/lib/governance-standards-rules-page-copy";
import { focusedPilotShowcasePolicyPackHref } from "@/lib/standards-rules-focused-pilot-showcase";
import {
  STANDARDS_RULES_CLAIM_DISCIPLINE,
  STANDARDS_RULES_FOLLOW_UPS_TITLE,
} from "@/lib/standards-rules-evidence-copy";

import { GovernanceResolutionPageView } from "./GovernanceResolutionPageView";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: () => <div data-testid="ask-run-id-picker" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => null,
}));

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => null,
}));

function buildModel(overrides: Partial<GovernanceResolutionPageViewModel> = {}): GovernanceResolutionPageViewModel {
  return {
    buyerPolishedShell: true,
    canMutateEnterprisePolicySurfaces: false,
    data: null,
    loading: false,
    failure: null,
    lastRefreshedAt: null,
    load: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("GovernanceResolutionPageView buyer-polished shell", () => {
  it("renders standards/rules inspection content instead of approval workflow", () => {
    render(<GovernanceResolutionPageView model={buildModel()} />);

    expect(screen.getByRole("link", { name: GOVERNANCE_STANDARDS_RULES_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_STANDARDS_RULES_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("standards-rules-claim-discipline").textContent).toContain(
      STANDARDS_RULES_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(GOVERNANCE_STANDARDS_RULES_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("governance-standards-rules-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-standards-rules-intro")).toHaveTextContent(
      GOVERNANCE_STANDARDS_RULES_PAGE_LEAD,
    );
    expect(screen.getByTestId("governance-standards-rules-buyer-start-here-helper")).toHaveTextContent(
      GOVERNANCE_STANDARDS_RULES_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: STANDARDS_RULES_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    expect(screen.getByTestId("standards-rules-governance-status-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-standards-rules-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-demo-static-banner")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-last-refreshed")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Standards & rules", level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText(/Review the standards, policy rules, and checks applied to this review/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-summary-strip")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-table")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Severity: High").length).toBeGreaterThan(0);
    expect(screen.getByTestId("standards-rules-review-context-row")).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-pick-review-before-resolving-strip")).toBeInTheDocument();
    expect(screen.getByText(/Policy packs in scope \(6\)/i)).toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-filter-count")).toHaveTextContent(/Showing 6 of 6 rules/);
    expect(screen.getAllByLabelText("Status: Required").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Status: Not evidenced").length).toBeGreaterThan(0);
    expect(screen.getByTestId("standards-rules-table-intro")).toHaveTextContent(
      /Each rule is enforced from a policy pack and mapped to a standard or framework/,
    );
    expect(screen.getByText("Frameworks referenced")).toBeInTheDocument();
    expect(screen.getAllByTestId("standards-rules-policy-pack-provenance-tag").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Platform default").length).toBeGreaterThan(0);
    expect(screen.getByTestId("standards-rules-refresh")).toBeInTheDocument();
    expect(screen.getByTestId("governance-resolution-export-rules")).toBeInTheDocument();
    expect(screen.getByText("MFA enforced for privileged access")).toBeInTheDocument();

    for (const packName of FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES) {
      expect(screen.getAllByRole("link", { name: packName }).length).toBeGreaterThan(0);
    }

    expect(screen.getAllByRole("link", { name: "Security Architecture Baseline" })[0]).toHaveAttribute(
      "href",
      focusedPilotShowcasePolicyPackHref("security-architecture-baseline"),
    );

    expect(screen.queryByText(/Submit for approval/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Approval queue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 4 of 5/i)).not.toBeInTheDocument();

    const primary = screen.getByTestId("governance-standards-rules-primary-content");
    const orientation = screen.getByTestId("standards-rules-orientation-bottom");
    const table = screen.getByTestId("standards-rules-table");

    expect(primary).toContainElement(orientation);
    expect(table.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("hides the governance banner when the page load fails", () => {
    render(
      <GovernanceResolutionPageView
        model={buildModel({
          failure: {
            message: "Failed to load policy resolution",
            problem: null,
            correlationId: null,
          },
        })}
      />,
    );

    expect(screen.queryByTestId("standards-rules-governance-status-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("standards-rules-review-context-row")).not.toBeInTheDocument();
    expect(screen.getByTestId("standards-rules-load-failure-retry")).toBeInTheDocument();
    expect(screen.getByTestId("governance-resolution-export-rules")).toBeDisabled();
    expect(screen.queryByTestId("standards-rules-table")).not.toBeInTheDocument();
  });
});

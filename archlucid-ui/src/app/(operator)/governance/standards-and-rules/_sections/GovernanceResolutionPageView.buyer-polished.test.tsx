import { render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";



import { FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES } from "@/lib/focused-pilot-mode-policy-packs";

import { focusedPilotShowcasePolicyPackHref } from "@/lib/standards-rules-focused-pilot-showcase";

import { GovernanceResolutionPageView } from "./GovernanceResolutionPageView";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";



function buildModel(overrides: Partial<GovernanceResolutionPageViewModel> = {}): GovernanceResolutionPageViewModel {

  return {

    buyerPolishedShell: true,

    canMutateEnterprisePolicySurfaces: false,

    data: null,

    loading: false,

    failure: null,

    load: vi.fn(async () => undefined),

    ...overrides,

  };

}



describe("GovernanceResolutionPageView buyer-polished shell", () => {

  it("renders standards/rules inspection content instead of approval workflow", () => {

    render(<GovernanceResolutionPageView model={buildModel()} />);



    expect(screen.getByTestId("standards-rules-governance-status-banner")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: "Standards & rules", level: 2 })).toBeInTheDocument();

    expect(

      screen.getByText(/Review the standards, policy rules, and checks applied to this review/),

    ).toBeInTheDocument();

    expect(screen.getByTestId("standards-rules-summary-strip")).toBeInTheDocument();

    expect(screen.getByTestId("standards-rules-table")).toBeInTheDocument();

    expect(screen.getAllByLabelText("Severity: High").length).toBeGreaterThan(0);

    expect(screen.getByTestId("standards-rules-review-context-row")).toBeInTheDocument();

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

    expect(screen.queryByText(/Submit for governance approval/i)).not.toBeInTheDocument();

    expect(screen.queryByText(/Approval queue/i)).not.toBeInTheDocument();

    expect(screen.queryByText(/Step 4 of 5/i)).not.toBeInTheDocument();

  });



  it("hides the governance banner when the page load fails", () => {

    render(

      <GovernanceResolutionPageView

        model={buildModel({

          failure: {

            message: "Failed to load governance resolution",

            problem: null,

            correlationId: null,

          },

        })}

      />,

    );



    expect(screen.queryByTestId("standards-rules-governance-status-banner")).not.toBeInTheDocument();

    expect(screen.queryByTestId("standards-rules-review-context-row")).not.toBeInTheDocument();

    expect(screen.getByTestId("governance-resolution-export-rules")).toBeDisabled();

    expect(screen.queryByTestId("standards-rules-table")).not.toBeInTheDocument();

  });

});



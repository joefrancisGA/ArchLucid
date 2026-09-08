import "./operate-authority-ui-shaping.setup.tsx";

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  governanceResolutionChangeRelatedControlsReaderSupplement,
  governanceResolutionEffectivePolicyHeadingReader,
  governanceResolutionRawOutputAccordionLabel,
  governanceResolutionResolutionDetailsHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-overview-copy";
import { GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS } from "@/lib/governance/governance-workflow-section-copy";
import { scopeGovernanceWorkflowVitestReview } from "@/testing/governance-workflow-vitest-navigation";

import GovernanceResolutionPage from "./governance/standards-and-rules/page";
import { GovernanceWorkflowPageContent } from "./governance/_sections/GovernanceWorkflowPageContent";

import {
  apiHoisted,
  governanceWorkflowVitestNavigation,
  mutateCapability,
} from "./operate-authority-ui-shaping.fixtures";

describe("Enterprise authority UI shaping — governance", () => {
  it(
    "Approval workflow: submit Review ID and manifest inputs stay read-only when mutation capability is false",
    async () => {
      mutateCapability.current = false;
      scopeGovernanceWorkflowVitestReview(governanceWorkflowVitestNavigation, "gov-ui-shape-run");
      render(<GovernanceWorkflowPageContent />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: GOVERNANCE_OVERVIEW_PAGE_TITLE })).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId("governance-review-context-bar")).toBeInTheDocument();
      });

      expect(await screen.findByText(GOVERNANCE_WORKFLOW_OUTCOME_NO_REQUESTS)).toBeInTheDocument();
      expect((await screen.findAllByText("Submit for approval")).length).toBeGreaterThan(0);

      const submitVersion = await waitFor(() => {
        const input = document.getElementById("gov-submit-version") as HTMLInputElement | null;

        expect(input).not.toBeNull();

        return input!;
      });

      expect(submitVersion.readOnly).toBe(true);
    },
    15_000,
  );

  it("Approval workflow: submit Review ID is editable when mutation capability is true", async () => {
    mutateCapability.current = true;
    scopeGovernanceWorkflowVitestReview(governanceWorkflowVitestNavigation, "gov-ui-shape-run");
    render(<GovernanceWorkflowPageContent />);

    await waitFor(() => {
      expect(screen.getByTestId("governance-review-context-bar")).toBeInTheDocument();
    });

    await waitFor(() => {
      const submitVersion = document.getElementById("gov-submit-version") as HTMLInputElement | null;

      expect(submitVersion).not.toBeNull();
      expect(submitVersion!.readOnly).toBe(false);
    });

    expect(document.getElementById("gov-submit-run-select")).not.toBeNull();
  });

  it("Policy resolution: refresh section shows reader supplement when mutation capability is false", async () => {
    mutateCapability.current = false;
    const page = await GovernanceResolutionPage();
    render(page);

    await waitFor(() => {
      expect(apiHoisted.getGovernanceResolution).toHaveBeenCalled();
    });

    expect(screen.getByText(governanceResolutionChangeRelatedControlsReaderSupplement)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: governanceResolutionEffectivePolicyHeadingReader })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: governanceResolutionResolutionDetailsHeadingReader }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: governanceResolutionRawOutputAccordionLabel })).toBeInTheDocument();
  });

  it("Policy resolution: refresh section omits reader supplement when mutation capability is true", async () => {
    mutateCapability.current = true;
    const page = await GovernanceResolutionPage();
    render(page);

    await waitFor(() => {
      expect(apiHoisted.getGovernanceResolution).toHaveBeenCalled();
    });

    expect(screen.queryByText(governanceResolutionChangeRelatedControlsReaderSupplement)).toBeNull();
  });

  it("Policy resolution: Refresh stays enabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    const page = await GovernanceResolutionPage();
    render(page);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Refresh" })).not.toBeDisabled();
  });
});

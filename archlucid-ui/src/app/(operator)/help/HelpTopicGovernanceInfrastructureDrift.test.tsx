import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

import { HelpGovernanceInfrastructureDriftGuideView } from "@/app/(operator)/help/_sections/HelpGovernanceInfrastructureDriftGuideView";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE_HEADING,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_FOLLOW_UPS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-drift-help-evidence-copy";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";
import { resolveGuideHeadingsForStrip, shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HOW_IT_WORKS_STEPS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_COLUMNS,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TILE_ITEMS,
} from "@/lib/governance/governance-infrastructure-drift-help-guide-content";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { contextualHelpForPathname } from "@/lib/contextual-help-registry";

describe("HelpGovernanceInfrastructureDriftGuideView", () => {
  const entry = getProductDocumentationEntry("governance-infrastructure-drift");

  it("registers the drift help guide entry", () => {
    expect(entry?.slug).toBe("governance-infrastructure-drift");
    expect(entry?.title).toBe("Drift & snapshots");
    expect(entry?.summary).toBe(
      "Compare inventory snapshots, review semantic drift rows, and export advisory Terraform.",
    );
    expect(entry?.lastReviewed).toBe("2026-09-09");
    expect(entry?.releaseApplicability).toBe("infrastructure drift workbench orientation");
  });

  it("maps drift workbench routes to the drift help topic", () => {
    expect(pageHelpTopicForPathname(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH)?.slug).toBe(
      "governance-infrastructure-drift",
    );
    expect(pageHelpTopicForPathname("/help/governance-infrastructure-drift")?.slug).toBe(
      "governance-infrastructure-drift",
    );
  });

  it("uses drift-specific contextual help instead of governance approval copy", () => {
    const entryForDrift = contextualHelpForPathname(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH);

    expect(entryForDrift?.whatIsThisPage).toContain("inventory snapshots");
    expect(entryForDrift?.whatIsThisPage.toLowerCase()).not.toContain("approval queue");
  });

  it("shows overview, workflow sections, and table guidance", () => {
    if (entry === undefined) {
      throw new Error("Expected governance infrastructure drift documentation entry.");
    }

    render(<HelpGovernanceInfrastructureDriftGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-governance-infrastructure-drift-overview")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_OVERVIEW,
    );
    expect(document.getElementById("how-drift-compare-works")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL,
    );
    expect(document.getElementById("reading-the-drift-table")).toHaveTextContent("Reading the drift table");

    const tileItems = screen.getByTestId("help-governance-infrastructure-drift-tile-items");
    for (const item of GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TILE_ITEMS) {
      expect(within(tileItems).getByText(item.label)).toBeInTheDocument();
      expect(within(tileItems).getByText(item.detail)).toBeInTheDocument();
    }

    const tableColumns = screen.getByTestId("help-governance-infrastructure-drift-table-columns");
    for (const column of GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TABLE_COLUMNS) {
      expect(within(tableColumns).getByText(column.label)).toBeInTheDocument();
    }

    const stepper = screen.getByTestId("help-governance-infrastructure-drift-how-stepper");
    for (const step of GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_HOW_IT_WORKS_STEPS) {
      expect(within(stepper).getByText(step)).toBeInTheDocument();
    }
  });

  it("shows claim discipline once and cross-topic follow-up links", () => {
    if (entry === undefined) {
      throw new Error("Expected governance infrastructure drift documentation entry.");
    }

    render(<HelpGovernanceInfrastructureDriftGuideView entry={entry} />);

    if (!shouldOmitClaimDisciplineBand("help-governance-infrastructure-drift")) {
      expect(screen.getByTestId("help-governance-infrastructure-drift-claim-discipline")).toHaveTextContent(
        GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE,
      );
      expect(screen.getByRole("heading", { name: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
        "id",
        GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID,
      );
    } else {
      expect(
        screen.queryByRole("heading", { name: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_DISCIPLINE_HEADING }),
      ).not.toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const followUps = screen.getByTestId("help-governance-infrastructure-drift-sources");
    expectWhereToGoNextFollowUpLinks(within(followUps), GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_SOURCES);
  });

  it("links the primary action to the drift workbench", () => {
    if (entry === undefined) {
      throw new Error("Expected governance infrastructure drift documentation entry.");
    }

    render(<HelpGovernanceInfrastructureDriftGuideView entry={entry} />);

    const headerActions = screen.getByTestId("help-governance-infrastructure-drift-header-actions");

    expect(within(headerActions).getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
    );
    expect(GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_PRIMARY_ACTION.href).toBe(GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH);
  });

  it("renders TOC rail headings", () => {
    if (entry === undefined) {
      throw new Error("Expected governance infrastructure drift documentation entry.");
    }

    render(<HelpGovernanceInfrastructureDriftGuideView entry={entry} />);

    const headings = resolveGuideHeadingsForStrip(
      "help-governance-infrastructure-drift",
      GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_GUIDE_HEADINGS,
      GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CLAIM_HEADING_ID,
    );

    for (const heading of headings) {
      expect(screen.getAllByRole("link", { name: heading.title }).length).toBeGreaterThan(0);
    }
  });
});

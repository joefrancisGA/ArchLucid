import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpFindingsWorkspaceReadinessStrip", () => ({
  HelpFindingsWorkspaceReadinessStrip: () => <div data-testid="help-findings-workspace-readiness-mock" />,
}));

import { HelpFindingsGuideView } from "@/app/(operator)/help/_sections/HelpFindingsGuideView";
import {
  FINDINGS_HELP_CLAIM_DISCIPLINE,
  FINDINGS_HELP_SOURCES,
} from "@/lib/findings/findings-help-evidence-copy";
import {
  FINDINGS_HELP_EVIDENCE_ACTIONS,
  FINDINGS_HELP_OVERVIEW,
  FINDINGS_HELP_PAGE_SUBTITLE,
  FINDINGS_HELP_PAGE_TITLE,
  FINDINGS_HELP_PRIMARY_ACTIONS,
} from "@/lib/findings/findings-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_DEVELOPER_COPY = [
  "/governance/findings",
  "/governance/decision-register",
  "/governance/standards-and-rules",
  "/insights/evidence-graph",
  "/insights/search-review-evidence",
  "/v1/",
  "POST /",
  "GET /",
  "dotnet",
  "ArchLucid.Api",
  "controller",
  "feature flag",
  "canonical route",
  "legacy route",
  "API contract",
  "manifest must exist",
  "403",
  "404",
  "CLI:",
  "WORKFLOW_RECIPES_BY_PERSONA",
] as const;

describe("HelpFindingsGuideView", () => {
  const entry = getProductDocumentationEntry("findings");

  it("registers the findings help guide entry", () => {
    expect(entry?.slug).toBe("findings");
    expect(entry?.title).toBe(FINDINGS_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe(FINDINGS_HELP_PAGE_SUBTITLE);
    expect(entry?.sourcePaths).toContain("docs/library/customer-facing/FINDINGS_OPERATOR_GUIDE.md");
  });

  it("shows purpose, actions, orientation callout, and overview near the top", () => {
    if (entry === undefined) {
      throw new Error("Expected findings documentation entry.");
    }

    render(<HelpFindingsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: FINDINGS_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(FINDINGS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-findings-workspace-readiness-mock")).toBeInTheDocument();
    expect(screen.getByTestId("help-findings-claim-discipline")).toHaveTextContent(FINDINGS_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByTestId("help-findings-overview")).toHaveTextContent(FINDINGS_HELP_OVERVIEW);

    const actionPanel = screen.getByTestId("help-findings-action-panel");
    expect(
      within(actionPanel).getByRole("link", { name: FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.label }),
    ).toHaveAttribute("href", FINDINGS_HELP_PRIMARY_ACTIONS.openFindings.href);
    expect(
      within(actionPanel).getByRole("link", { name: FINDINGS_HELP_PRIMARY_ACTIONS.searchEvidence.label }),
    ).toHaveAttribute("href", FINDINGS_HELP_PRIMARY_ACTIONS.searchEvidence.href);
    expect(
      within(actionPanel).getByRole("link", { name: FINDINGS_HELP_PRIMARY_ACTIONS.governanceDecisions.label }),
    ).toHaveAttribute("href", FINDINGS_HELP_PRIMARY_ACTIONS.governanceDecisions.href);
    expect(
      within(actionPanel).getByRole("heading", { level: 2, name: "Go to findings" }),
    ).toBeInTheDocument();
  });

  it("renders revised sections, evidence action descriptions, and on-this-page navigation", () => {
    if (entry === undefined) {
      throw new Error("Expected findings documentation entry.");
    }

    render(<HelpFindingsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "What a finding is" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Anatomy of a finding" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Severity and impact" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inspect the evidence" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Respond to a finding" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Findings and governance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What each role usually does" })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getByTestId("help-findings-anatomy-panel")).toBeInTheDocument();
    expect(screen.getByTestId("help-findings-severity-table")).toBeInTheDocument();

    for (const source of FINDINGS_HELP_SOURCES) {
      const matches = screen.getAllByRole("link", { name: source.label });
      expect(matches.some((link) => link.getAttribute("href") === source.href)).toBe(true);
    }

    const evidenceActions = screen.getByTestId("help-findings-evidence-actions");
    for (const action of FINDINGS_HELP_EVIDENCE_ACTIONS) {
      expect(within(evidenceActions).getByRole("link", { name: action.label })).toHaveAttribute("href", action.href);
      expect(within(evidenceActions).getByText(action.description)).toBeInTheDocument();
    }

    const desktopToc = screen.getByTestId("help-topic-toc");
    expect(within(desktopToc).getByRole("link", { name: "What a finding is" })).toHaveAttribute(
      "href",
      "#what-a-finding-is",
    );
    expect(within(desktopToc).getByRole("link", { name: "What each role usually does" })).toHaveAttribute(
      "href",
      "#role-guidance",
    );
  });

  it("avoids developer-facing routes and implementation jargon in visible copy", () => {
    if (entry === undefined) {
      throw new Error("Expected findings documentation entry.");
    }

    render(<HelpFindingsGuideView entry={entry} />);

    const pageText = document.body.textContent?.toLowerCase() ?? "";

    for (const phrase of BANNED_DEVELOPER_COPY) {
      expect(pageText, `should not contain "${phrase}"`).not.toContain(phrase.toLowerCase());
    }
  });
});

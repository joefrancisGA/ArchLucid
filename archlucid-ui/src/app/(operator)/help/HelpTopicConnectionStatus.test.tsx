import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpConnectionStatusGuideView } from "@/app/(operator)/help/_sections/HelpConnectionStatusGuideView";
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
} from "@/lib/claim-discipline-test-helpers";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import {
  CONNECTION_STATUS_HELP_CLAIM_HEADING_ID,
  CONNECTION_STATUS_HELP_GUIDE_HEADINGS,
  CONNECTION_STATUS_HELP_PRIMARY_ACTION,
} from "@/lib/connection-status-help-guide-content";
import {
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE_HEADING,
  CONNECTION_STATUS_HELP_SOURCES,
} from "@/lib/connection-status-help-evidence-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("@/app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip", () => ({
  HelpConnectionStatusWorkspaceReadinessStrip: () => (
    <section id="help-connection-status-workspace-readiness">
      <h2 id="help-connection-status-workspace-readiness-heading">This workspace</h2>
    </section>
  ),
}));

function renderConnectionStatusGuide(): void {
  const entry = getProductDocumentationEntry("connection-status");

  if (entry === null) {
    throw new Error("Expected connection-status documentation entry.");
  }

  render(<HelpConnectionStatusGuideView entry={entry} />);
}

describe("HelpConnectionStatusGuideView (HCO)", () => {
  it("renders header CTA, status legend, and forbids broken diligence copy", () => {
    renderConnectionStatusGuide();

    expect(screen.getByTestId("help-connection-status-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-connection-status-page-title")).toHaveTextContent("Connection status");
    expect(screen.getByTestId("help-connection-status-primary-cta")).toHaveAttribute(
      "href",
      CONNECTION_STATUS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.queryByTestId("help-connection-status-action-panel")).toBeNull();
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.getByTestId("help-connection-status-status-legend")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-12");
    expect(screen.queryByText(/Sources package/i)).toBeNull();
    expectClaimDisciplineBandContent(
      screen,
      "help-connection-status",
      "help-connection-status-claim-discipline",
      CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-connection-status-claim-discipline-strip")).toHaveTextContent(
      CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineHeading(
      screen,
      "help-connection-status",
      CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE_HEADING,
      CONNECTION_STATUS_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.queryByRole("link", { name: CONNECTION_STATUS_HELP_PRIMARY_ACTION.label })).toBe(
      screen.getByTestId("help-connection-status-primary-cta"),
    );

    for (const source of CONNECTION_STATUS_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    for (const heading of resolveGuideHeadingsForStrip(
      "help-connection-status",
      CONNECTION_STATUS_HELP_GUIDE_HEADINGS,
      CONNECTION_STATUS_HELP_CLAIM_HEADING_ID,
    )) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpConnectionStatusGuideView } from "@/app/(operator)/help/_sections/HelpConnectionStatusGuideView";
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
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Guide last reviewed 2026-08-12 · administration connection status orientation",
    );
    expect(screen.queryByText(/Sources package/i)).toBeNull();
    expect(screen.getByTestId("help-connection-status-claim-discipline").textContent).toContain(
      CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      CONNECTION_STATUS_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.queryByRole("link", { name: CONNECTION_STATUS_HELP_PRIMARY_ACTION.label })).toBe(
      screen.getByTestId("help-connection-status-primary-cta"),
    );

    for (const source of CONNECTION_STATUS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    for (const heading of CONNECTION_STATUS_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpConnectionStatusGuideView } from "@/app/(operator)/help/_sections/HelpConnectionStatusGuideView";
import { CONNECTION_STATUS_HELP_PRIMARY_ACTION } from "@/lib/connection-status-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("@/app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip", () => ({
  HelpConnectionStatusWorkspaceReadinessStrip: () => (
    <div data-testid="help-connection-status-workspace-readiness-stub" />
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
      "Last reviewed 2026-08-12 · administration connection status orientation",
    );
    expect(screen.queryByText(/Sources package/i)).toBeNull();
    expect(screen.queryByRole("link", { name: CONNECTION_STATUS_HELP_PRIMARY_ACTION.label })).toBe(
      screen.getByTestId("help-connection-status-primary-cta"),
    );
  });
});

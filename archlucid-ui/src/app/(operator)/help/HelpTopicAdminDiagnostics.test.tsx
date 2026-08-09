import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpAdminDiagnosticsGuideView } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsGuideView";
import {
  ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS,
  ADMIN_DIAGNOSTICS_HELP_SOURCES,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpAdminDiagnosticsGuideView (HAE)", () => {
  const entry = getProductDocumentationEntry("admin-diagnostics");
  const loaded = tryLoadProductDocumentation("admin-diagnostics");

  it("registers admin-diagnostics with registry provenance metadata", () => {
    expect(entry?.slug).toBe("admin-diagnostics");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toContain("V1 GA");
  });

  it("loads OPERATOR_ADMIN_DIAGNOSTICS.md without bare route paths or CLI command strings", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.markdown).toContain("[System health](/administration/system-health)");
    expect(loaded?.markdown).not.toMatch(/`\/administration\/system-health`/);
    expect(loaded?.markdown).not.toContain("archlucid doctor");
  });

  it("renders specialty chrome with System health primary CTA and evidence links", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected admin-diagnostics documentation to load.");
    }

    render(<HelpAdminDiagnosticsGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-admin-diagnostics-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-admin-diagnostics-page-title").closest("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("V1 GA");
    expect(screen.getByTestId("help-admin-diagnostics-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sources for follow-up" })).toBeNull();

    const actionPanel = screen.getByTestId("help-admin-diagnostics-action-panel");

    expect(
      within(actionPanel).getByTestId("help-admin-diagnostics-primary-cta").closest("a"),
    ).toHaveAttribute("href", ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS.openSystemHealth.href);

    expect(
      within(actionPanel).getByRole("link", {
        name: ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS.openWorkspaceOverview.label,
      }),
    ).toHaveAttribute("href", ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS.openWorkspaceOverview.href);

    for (const link of ADMIN_DIAGNOSTICS_HELP_SOURCES) {
      expect(within(actionPanel).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ADMIN_DIAGNOSTICS_HELP_SOURCES.some((link) => link.href === ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH)).toBe(
      false,
    );

    const content = screen.getByTestId("help-admin-diagnostics-content");

    expect(within(content).getByRole("link", { name: "System health" })).toHaveAttribute(
      "href",
      "/administration/system-health",
    );
    expect(content.textContent ?? "").not.toContain("archlucid doctor");
    expect(content.textContent ?? "").not.toMatch(/`\/administration\/system-health`/);
  });
});

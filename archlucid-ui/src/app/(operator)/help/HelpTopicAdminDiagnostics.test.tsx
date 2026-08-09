import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HelpAdminDiagnosticsGuideView } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsGuideView";
import {
  ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
  ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTIONS,
  ADMIN_DIAGNOSTICS_HELP_SOURCES,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const useOperatorNavAuthority = vi.hoisted(() =>
  vi.fn(() => ({
    callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
  })),
);

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => useOperatorNavAuthority(),
}));

describe("HelpAdminDiagnosticsGuideView (HAE)", () => {
  const entry = getProductDocumentationEntry("admin-diagnostics");
  const loaded = tryLoadProductDocumentation("admin-diagnostics");

  beforeEach(() => {
    useOperatorNavAuthority.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.AdminAuthority,
    });
  });

  it("registers admin-diagnostics with registry provenance metadata", () => {
    expect(entry?.slug).toBe("admin-diagnostics");
    expect(entry?.lastReviewed).toBe("2026-08-09");
    expect(entry?.releaseApplicability).toContain("V1 GA");
    expect(entry?.pdfStatus).toBe("customer");
  });

  it("loads OPERATOR_ADMIN_DIAGNOSTICS.md without bare route paths or CLI command strings", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.markdown).toContain("[System health](/administration/system-health)");
    expect(loaded?.markdown).not.toMatch(/`\/administration\/system-health`/);
    expect(loaded?.markdown).not.toContain("archlucid doctor");
    expect(loaded?.markdown).not.toContain("System status");
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
    expect(screen.getByTestId("help-admin-diagnostics-page-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sources for follow-up" })).toBeNull();
    expect(screen.getAllByRole("heading", { name: /start here/i })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Go to live diagnostics" })).toBeInTheDocument();
    expect(screen.getByTestId("help-admin-diagnostics-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-download-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();

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
    expect(content.textContent ?? "").not.toContain("System status");
    expect(content.textContent ?? "").not.toContain("claim discipline");
    expect(content.textContent ?? "").not.toContain("Sources package");
    expect(content.textContent ?? "").not.toContain("signed-review diligence");
    expect(content.textContent ?? "").toContain(ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION);

    const signalTable = screen.getByTestId("help-admin-diagnostics-signal-table");

    expect(within(signalTable).getByRole("columnheader", { name: "Signal" })).toBeInTheDocument();
    expect(within(signalTable).getByRole("columnheader", { name: "Healthy state" })).toBeInTheDocument();
    expect(within(signalTable).getByRole("columnheader", { name: "What to do next" })).toBeInTheDocument();
    expect(within(signalTable).getAllByTestId("help-admin-diagnostics-signal-status").length).toBeGreaterThan(0);

    const orientation = screen.getByTestId("help-admin-diagnostics-page-orientation");
    const signalOrder = signalTable.compareDocumentPosition(orientation);

    expect(signalOrder & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("matches source link labels to registry titles", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected admin-diagnostics documentation to load.");
    }

    const troubleshooting = getProductDocumentationEntry("troubleshooting");
    const engineering = getProductDocumentationEntry("developer-troubleshooting");
    const configuration = getProductDocumentationEntry("configuration-reference");
    const cli = getProductDocumentationEntry("cli-usage");

    expect(ADMIN_DIAGNOSTICS_HELP_SOURCES.find((link) => link.href.includes("troubleshooting") && !link.adminOnly)?.label).toBe(
      troubleshooting?.title,
    );
    expect(ADMIN_DIAGNOSTICS_HELP_SOURCES.find((link) => link.adminOnly === true && link.href.includes("developer"))?.label).toBe(
      engineering?.title,
    );
    expect(ADMIN_DIAGNOSTICS_HELP_SOURCES.find((link) => link.href.includes("configuration-reference"))?.label).toBe(
      configuration?.title,
    );
    expect(ADMIN_DIAGNOSTICS_HELP_SOURCES.find((link) => link.href.includes("cli-usage"))?.label).toBe(cli?.title);
  });

  it("hides admin-only source links for non-admin callers", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected admin-diagnostics documentation to load.");
    }

    useOperatorNavAuthority.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
    });

    render(<HelpAdminDiagnosticsGuideView entry={entry} markdown={loaded.markdown} />);

    const actionPanel = screen.getByTestId("help-admin-diagnostics-action-panel");

    expect(within(actionPanel).getByRole("link", { name: "System health" })).toBeInTheDocument();
    expect(within(actionPanel).getByRole("link", { name: "Troubleshooting" })).toBeInTheDocument();
    expect(within(actionPanel).queryByRole("link", { name: "Engineering troubleshooting runbook" })).toBeNull();
    expect(within(actionPanel).queryByRole("link", { name: "Configuration reference" })).toBeNull();
    expect(within(actionPanel).queryByRole("link", { name: "CLI usage" })).toBeNull();
  });

  it("shows admin-only source links for admin callers", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected admin-diagnostics documentation to load.");
    }

    render(<HelpAdminDiagnosticsGuideView entry={entry} markdown={loaded.markdown} />);

    const actionPanel = screen.getByTestId("help-admin-diagnostics-action-panel");

    expect(within(actionPanel).getByRole("link", { name: "Engineering troubleshooting runbook" })).toBeInTheDocument();
    expect(within(actionPanel).getByRole("link", { name: "Configuration reference" })).toBeInTheDocument();
    expect(within(actionPanel).getByRole("link", { name: "CLI usage" })).toBeInTheDocument();
  });
});

import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HelpAdminDiagnosticsGuideView } from "@/app/(operator)/help/_sections/HelpAdminDiagnosticsGuideView";
import {
  ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
  ADMIN_DIAGNOSTICS_HELP_LIVE_SURFACES,
  ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION,
  ADMIN_DIAGNOSTICS_HELP_PAGE_SCOPE,
  ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION,
  ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS,
  ADMIN_DIAGNOSTICS_HELP_SIGNAL_HEALTHY_COLUMN,
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

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
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
    expect(entry?.releaseApplicability).toBeTruthy();
    expect(entry?.pdfStatus).toBe("customer");
  });

  it("loads OPERATOR_ADMIN_DIAGNOSTICS.md without bare route paths or CLI command strings", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.markdown).not.toMatch(/`\/administration\/system-health`/);
    expect(loaded?.markdown).not.toContain("archlucid doctor");
    expect(loaded?.markdown).not.toContain("System status");
    expect(loaded?.markdown).not.toContain("# Admin diagnostics");
    expect(loaded?.markdown).not.toContain("## Related Help topics");
  });

  it("renders specialty chrome with route links, scope line, skip link, and evidence table", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected admin-diagnostics documentation to load.");
    }

    render(<HelpAdminDiagnosticsGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-admin-diagnostics-guide")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to diagnostics guidance" })).toHaveAttribute(
      "href",
      "#help-admin-diagnostics-content",
    );
    expect(screen.getByTestId("help-admin-diagnostics-page-title").closest("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Admin diagnostics" })).toBeInTheDocument();
    expect(screen.getByTestId("help-admin-diagnostics-page-scope")).toHaveTextContent(
      ADMIN_DIAGNOSTICS_HELP_PAGE_SCOPE,
    );
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.getByTestId("help-admin-diagnostics-page-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sources for follow-up" })).toBeNull();
    expect(screen.getAllByRole("heading", { name: /start here/i })).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Go to live diagnostics" })).toBeNull();
    expect(screen.getByTestId("help-admin-diagnostics-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-download-pdf")).toBeNull();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();

    const primaryAction = screen.getByTestId("help-admin-diagnostics-primary-action");
    expect(primaryAction).toHaveAttribute("href", ADMIN_DIAGNOSTICS_HELP_PRIMARY_ACTION.href);
    expect(screen.getByTestId("help-admin-diagnostics-primary-admin-tag")).toHaveTextContent("Admin");

    const actionPanel = screen.getByTestId("help-admin-diagnostics-action-panel");
    const liveSurfaces = within(actionPanel).getByTestId("help-admin-diagnostics-live-surfaces");
    const relatedTopics = within(actionPanel).getByTestId("help-admin-diagnostics-related-topics");

    for (const link of ADMIN_DIAGNOSTICS_HELP_LIVE_SURFACES) {
      expect(within(liveSurfaces).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    for (const link of ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS) {
      expect(within(relatedTopics).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ADMIN_DIAGNOSTICS_HELP_LIVE_SURFACES.some((link) => link.href === ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH),
    ).toBe(false);

    const content = screen.getByTestId("help-admin-diagnostics-content");

    expect(within(content).queryByRole("link", { name: "System health" })).toBeNull();
    expect(within(content).queryByRole("link", { name: "Workspace overview" })).toBeNull();
    expect(content.textContent ?? "").not.toContain("archlucid doctor");
    expect(content.textContent ?? "").not.toMatch(/`\/administration\/system-health`/);
    expect(content.textContent ?? "").not.toContain("System status");
    expect(content.textContent ?? "").not.toContain("Workspace Overview");
    expect(content.textContent ?? "").not.toContain("claim discipline");
    expect(content.textContent ?? "").not.toContain("Sources package");
    expect(content.textContent ?? "").not.toContain("signed-review diligence");
    expect(content.textContent ?? "").toContain("Without Admin access");

    const orientation = screen.getByTestId("help-admin-diagnostics-page-orientation");
    expect(orientation).toHaveTextContent(ADMIN_DIAGNOSTICS_HELP_PAGE_ORIENTATION);

    const signalTable = screen.getByTestId("help-admin-diagnostics-signal-table");

    expect(within(signalTable).getByRole("columnheader", { name: "Signal" })).toBeInTheDocument();
    expect(within(signalTable).getByRole("columnheader", { name: ADMIN_DIAGNOSTICS_HELP_SIGNAL_HEALTHY_COLUMN })).toBeInTheDocument();
    expect(within(signalTable).getByRole("columnheader", { name: "What to do next" })).toBeInTheDocument();
    expect(within(signalTable).queryByTestId("help-admin-diagnostics-signal-status")).toBeNull();

    const signalOrder = signalTable.compareDocumentPosition(orientation);
    const actionPanelOrder = actionPanel.compareDocumentPosition(orientation);

    expect(signalOrder & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(actionPanelOrder & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("matches source link labels to registry titles", () => {
    const troubleshooting = getProductDocumentationEntry("troubleshooting");
    const engineering = getProductDocumentationEntry("engineering-troubleshooting");
    const cli = getProductDocumentationEntry("cli-usage");
    const reportAProblem = getProductDocumentationEntry("report-a-problem");

    expect(
      ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS.find((link) => link.href.includes("troubleshooting") && !link.adminOnly)?.label,
    ).toBe(troubleshooting?.title);
    expect(
      ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS.find(
        (link) => link.adminOnly === true && link.href.includes("engineering-troubleshooting"),
      )?.label,
    ).toBe(engineering?.title);
    expect(ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS.find((link) => link.href.includes("configuration-reference"))).toBeUndefined();
    expect(ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS.find((link) => link.href.includes("cli-usage"))?.label).toBe(cli?.title);
    expect(ADMIN_DIAGNOSTICS_HELP_RELATED_TOPICS.find((link) => link.href.includes("report-a-problem"))?.label).toBe(
      reportAProblem?.title,
    );
    expect(ADMIN_DIAGNOSTICS_HELP_LIVE_SURFACES.find((link) => link.href === "/")?.label).toBe("Home");
  });

  it("labels admin-gated links for non-admin callers instead of hiding them", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected admin-diagnostics documentation to load.");
    }

    useOperatorNavAuthority.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
    });

    render(<HelpAdminDiagnosticsGuideView entry={entry} markdown={loaded.markdown} />);

    const actionPanel = screen.getByTestId("help-admin-diagnostics-action-panel");
    const relatedTopics = within(actionPanel).getByTestId("help-admin-diagnostics-related-topics");

    expect(within(relatedTopics).getByRole("link", { name: "Troubleshooting" })).toBeInTheDocument();
    expect(within(relatedTopics).getByRole("link", { name: "Report a problem" })).toBeInTheDocument();
    expect(within(relatedTopics).getByRole("link", { name: "Engineering troubleshooting runbook" })).toBeInTheDocument();
    expect(within(relatedTopics).queryByRole("link", { name: "Configuration reference" })).not.toBeInTheDocument();
    expect(within(relatedTopics).getByRole("link", { name: "CLI usage" })).toBeInTheDocument();

    const adminTags = within(actionPanel).getAllByTestId("help-admin-diagnostics-admin-tag");
    expect(adminTags.length).toBeGreaterThanOrEqual(2);
  });

  it("shows admin tags on admin-only related topics for admin callers", () => {
    if (loaded === null || entry === undefined) {
      throw new Error("Expected admin-diagnostics documentation to load.");
    }

    render(<HelpAdminDiagnosticsGuideView entry={entry} markdown={loaded.markdown} />);

    const actionPanel = screen.getByTestId("help-admin-diagnostics-action-panel");
    const relatedTopics = within(actionPanel).getByTestId("help-admin-diagnostics-related-topics");

    expect(within(relatedTopics).getByRole("link", { name: "Engineering troubleshooting runbook" })).toBeInTheDocument();
    expect(within(relatedTopics).queryByRole("link", { name: "Configuration reference" })).not.toBeInTheDocument();
    expect(within(relatedTopics).getByRole("link", { name: "CLI usage" })).toBeInTheDocument();
  });
});

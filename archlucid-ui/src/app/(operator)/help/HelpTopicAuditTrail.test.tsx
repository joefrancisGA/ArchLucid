import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpAuditTrailGuideView } from "@/app/(operator)/help/_sections/HelpAuditTrailGuideView";
import { AUDIT_TRAIL_HELP_ANATOMY_FIELDS } from "@/lib/audit-trail-help-guide-content";
import { AUDIT_TRAIL_HELP_SOURCES } from "@/lib/audit-trail-help-evidence-copy";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS } from "@/lib/audit-trail-page-copy";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

const AUDIT_TRAIL_HELP_BANNED_SUBSTRINGS = [
  "day-one-developer",
  "ArchLucid.Api",
  "archlucid-ui",
  "V1_SCOPE.md",
  "FIRST_REAL_VALUE.md",
  "API_CONTRACTS.md",
  "AUDIT_COVERAGE_MATRIX.md",
  "dbo.AuditEvents",
  "IAuditRepository",
  "RunCreated",
  "RunId",
  "ILogger",
] as const;

describe("HelpTopicAuditTrail", () => {
  const loaded = tryLoadProductDocumentation("audit-trail");

  it("loads audit-trail documentation from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("keeps anatomy field labels aligned with live audit trail table headers", () => {
    expect(AUDIT_TRAIL_HELP_ANATOMY_FIELDS.map((field) => field.label)).toEqual([
      ...AUDIT_TRAIL_OPERATOR_TABLE_COLUMN_LABELS,
    ]);
  });

  it("purges contributor and engineering leakage from rendered audit-trail help", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const technicalReference = screen.getByTestId("help-audit-trail-technical-reference");
    const visible = (document.body.textContent ?? "").toLowerCase();
    const technicalText = (technicalReference.textContent ?? "").toLowerCase();
    const primaryVisible = visible.replace(technicalText, "");

    for (const banned of AUDIT_TRAIL_HELP_BANNED_SUBSTRINGS) {
      expect(primaryVisible, `rendered copy contains "${banned}"`).not.toContain(banned.toLowerCase());
    }
  });

  it("keeps buyer-safe audit guidance and in-app action links", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-audit-trail-header-open-audit-trail")).toHaveAttribute("href", "/governance/audit");
    const sourcesSection = within(screen.getByTestId("audit-trail-help-sources"));

    for (const source of AUDIT_TRAIL_HELP_SOURCES) {
      expectFollowUpLink(sourcesSection, source);
    }

    expect(screen.getByTestId("help-audit-trail-overview")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-immutability-claims")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-append-only-enforcement")).toBeInTheDocument();
    expect(screen.queryByText(/^Evidence:/)).toBeNull();
    expect(screen.queryByTestId("help-audit-trail-action-panel")).toBeNull();
    expect(screen.queryByTestId("help-audit-trail-refresh-button")).toBeNull();
  });

  it("renders technical reference body without a collapsible wrapper", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-audit-trail-technical-reference-body")).toBeInTheDocument();
  });

  it("keeps technical reference body mounted for hash navigation", async () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(await screen.findByTestId("help-audit-trail-technical-reference-body")).toBeInTheDocument();
  });

  it("opens technical reference when the immutability-enforcement hash is present", async () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    window.location.hash = "#immutability-enforcement";
    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(await screen.findByTestId("help-audit-trail-technical-reference-body")).toBeInTheDocument();
    expect(document.getElementById("immutability-enforcement")).not.toBeNull();
  });
});

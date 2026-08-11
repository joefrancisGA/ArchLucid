import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { auditTrailHelpPageSubtitle } from "@/lib/audit-trail-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/audit-trail",
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

import { HelpAuditTrailPageHeader } from "@/app/(operator)/help/_sections/HelpAuditTrailPageHeader";
import { AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF } from "@/lib/audit-trail-help-guide-content";

describe("HelpAuditTrailPageHeader", () => {
  const entry = getProductDocumentationEntry("audit-trail");

  it("renders breadcrumb, provenance, live audit trail CTA, and export actions", () => {
    if (entry === null) {
      throw new Error("Expected audit-trail documentation entry.");
    }

    render(<HelpAuditTrailPageHeader entry={entry} subtitle={auditTrailHelpPageSubtitle(false)} />);

    expect(screen.getByTestId("help-audit-trail-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByTestId("help-audit-trail-page-title")).toBeInTheDocument();
    expect(screen.getByText(auditTrailHelpPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-provenance")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-09");

    const sourceOfRecordLink = screen.getByRole("link", { name: "Data handling" });
    expect(sourceOfRecordLink).toHaveAttribute("href", AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF);
    expect(screen.getByTestId("help-audit-trail-source-of-record")).toHaveTextContent("Source of record: Data handling");

    expect(screen.getByTestId("help-audit-trail-header-open-audit-trail")).toHaveAttribute("href", "/governance/audit");
    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();

    const headerActions = screen.getByTestId("help-audit-trail-header-actions");
    expect(within(headerActions).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByTestId("help-topic-print-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-pdf-download-button")).toBeNull();
    expect(screen.queryByTestId("help-audit-trail-refresh-button")).toBeNull();
    expect(screen.queryByTestId("help-audit-trail-last-refreshed")).toBeNull();
  });
});

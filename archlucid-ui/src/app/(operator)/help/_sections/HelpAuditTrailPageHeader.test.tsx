import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { auditTrailHelpPageSubtitle } from "@/lib/audit-trail-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/audit-trail",
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => <div data-testid="help-topic-pdf-download-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

import { HelpAuditTrailPageHeader } from "@/app/(operator)/help/_sections/HelpAuditTrailPageHeader";

describe("HelpAuditTrailPageHeader", () => {
  const entry = getProductDocumentationEntry("audit-trail");

  it("renders h1, help, refresh, export actions, and last-refreshed metadata", () => {
    if (entry === null) {
      throw new Error("Expected audit-trail documentation entry.");
    }

    const onRefresh = vi.fn();

    render(
      <HelpAuditTrailPageHeader
        entry={entry}
        subtitle={auditTrailHelpPageSubtitle(false)}
        refreshing={false}
        lastRefreshedAt={new Date("2026-07-09T12:00:00.000Z")}
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Audit trail" })).toBeInTheDocument();
    expect(screen.getByText(auditTrailHelpPageSubtitle(false))).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-pdf-download-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-print-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-last-refreshed")).toHaveTextContent(/Last refreshed:/i);

    fireEvent.click(screen.getByTestId("help-audit-trail-refresh-button"));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

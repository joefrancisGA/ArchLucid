import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => <div data-testid="help-topic-pdf-download-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

import { HelpAuditTrailGuideView } from "@/app/(operator)/help/_sections/HelpAuditTrailGuideView";
import {
  AUDIT_TRAIL_HELP_OVERVIEW,
  AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR,
  AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER,
  AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF,
} from "@/lib/audit-trail-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpAuditTrailGuideView buyer-polished shell", () => {
  const loaded = tryLoadProductDocumentation("audit-trail");

  it("uses buyer subtitle, provenance, header CTA, and curated overview", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByText(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();

    const sourceOfRecordLink = screen.getByRole("link", { name: "Data handling" });
    expect(sourceOfRecordLink).toHaveAttribute("href", AUDIT_TRAIL_HELP_SOURCE_OF_RECORD_HREF);
    expect(screen.getByTestId("help-audit-trail-source-of-record")).toHaveTextContent("Related topic: Data handling");

    expect(screen.queryByTestId("page-contextual-help-button")).toBeNull();
    expect(screen.queryByTestId("help-audit-trail-refresh-button")).toBeNull();
    expect(screen.getByTestId("help-audit-trail-header-open-audit-trail")).toHaveAttribute("href", "/governance/audit");
    expect(screen.getByTestId("help-audit-trail-overview")).toHaveTextContent(AUDIT_TRAIL_HELP_OVERVIEW);
    expect(screen.getByTestId("audit-trail-help-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("help-audit-trail-action-panel")).toBeNull();
    expect(screen.getByTestId("help-audit-trail-immutability-claims")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
  });
});

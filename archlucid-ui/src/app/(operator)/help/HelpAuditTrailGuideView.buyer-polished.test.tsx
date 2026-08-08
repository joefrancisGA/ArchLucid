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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
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
  AUDIT_TRAIL_HELP_SCOPE_DETAILS_TRIGGER,
} from "@/lib/audit-trail-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpAuditTrailGuideView buyer-polished shell", () => {
  const loaded = tryLoadProductDocumentation("audit-trail");

  it("uses buyer subtitle, refresh, and overview without About scope chrome", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByText(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AUDIT_TRAIL_HELP_PAGE_SUBTITLE_OPERATOR)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-audit-trail-scope-details")).toBeNull();
    expect(screen.queryByText(AUDIT_TRAIL_HELP_SCOPE_DETAILS_TRIGGER)).toBeNull(); // TB-2093
    expect(screen.getByTestId("help-audit-trail-overview")).toHaveTextContent(AUDIT_TRAIL_HELP_OVERVIEW);
    expect(screen.getByTestId("help-audit-trail-action-panel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open audit trail" })).toHaveAttribute("href", "/governance/audit");
  });
});

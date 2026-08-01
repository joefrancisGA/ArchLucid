import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpAuditTrailGuideView } from "@/app/(operator)/help/_sections/HelpAuditTrailGuideView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
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
  "Last reviewed",
] as const;

describe("HelpTopicAuditTrail", () => {
  const loaded = tryLoadProductDocumentation("audit-trail");

  it("loads audit-trail documentation from the monorepo", () => {
    expect(loaded).not.toBeNull();
  });

  it("purges contributor and engineering leakage from prepared and rendered audit-trail help", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    const preparedMarkdown = prepareHelpMarkdownForPresentation(
      loaded.markdown,
      loaded.entry.sourcePaths[0] ?? "",
      { helpTopicSlug: loaded.entry.slug },
    ).toLowerCase();

    for (const banned of AUDIT_TRAIL_HELP_BANNED_SUBSTRINGS) {
      expect(preparedMarkdown, `prepared markdown contains "${banned}"`).not.toContain(banned.toLowerCase());
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    for (const banned of AUDIT_TRAIL_HELP_BANNED_SUBSTRINGS) {
      expect(visible, `rendered copy contains "${banned}"`).not.toContain(banned.toLowerCase());
    }
  });

  it("keeps buyer-safe audit guidance and in-app action links", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: "Open audit trail" })).toHaveAttribute("href", "/governance/audit");
    expect(screen.getByRole("link", { name: "Governance approval" })).toHaveAttribute(
      "href",
      "/help/governance-approval",
    );
    expect(screen.getByTestId("help-audit-trail-overview")).toBeInTheDocument();
  });
});

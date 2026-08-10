import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpAuditTrailGuideView } from "@/app/(operator)/help/_sections/HelpAuditTrailGuideView";
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

  it("purges contributor and engineering leakage from rendered audit-trail help", () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
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

    expect(screen.getByTestId("help-audit-trail-header-open-audit-trail")).toHaveAttribute("href", "/governance/audit");
    expect(screen.getAllByRole("link", { name: "Governance approval" })[0]).toHaveAttribute(
      "href",
      "/help/governance-approval",
    );
    expect(screen.getByTestId("help-audit-trail-overview")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-breadcrumb")).toHaveTextContent("Help");
    expect(screen.getByTestId("help-audit-trail-immutability-claims")).toBeInTheDocument();
    expect(screen.queryByTestId("help-audit-trail-refresh-button")).toBeNull();
  });

  it("keeps technical reference collapsed by default and mounts engineering detail after expand", async () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const technicalReference = screen.getByTestId("help-audit-trail-technical-reference");
    expect(technicalReference).not.toHaveAttribute("open");
    expect(screen.queryByTestId("help-audit-trail-technical-reference-body")).toBeNull();

    fireEvent.click(within(technicalReference).getByText("Technical reference"));

    expect(await screen.findByTestId("help-audit-trail-technical-reference-body")).toBeInTheDocument();
  });

  it("mounts technical reference body when hash navigation opens details without a toggle event", async () => {
    if (loaded === null) {
      throw new Error("Expected audit-trail documentation to load.");
    }

    render(<HelpAuditTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const technicalReference = screen.getByTestId(
      "help-audit-trail-technical-reference",
    ) as HTMLDetailsElement;
    technicalReference.open = true;
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(await screen.findByTestId("help-audit-trail-technical-reference-body")).toBeInTheDocument();
  });
});

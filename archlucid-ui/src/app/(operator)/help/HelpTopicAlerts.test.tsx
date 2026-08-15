import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpAlertsGuideHeroClient", () => ({
  HelpAlertsGuideHeroClient: () => <div data-testid="help-alerts-guide-hero-mock" />,
}));

import { HelpAlertsGuideView } from "@/app/(operator)/help/_sections/HelpAlertsGuideView";
import {
  ALERTS_HELP_GUIDE_HEADINGS,
  ALERTS_HELP_OVERVIEW,
  ALERTS_HELP_PAGE_SUBTITLE,
  ALERTS_HELP_PAGE_TITLE,
  ALERTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/alerts-help-guide-content";
import { ALERTS_HELP_CLAIM_DISCIPLINE } from "@/lib/alerts-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_DEVELOPER_COPY = [
  "/governance/alerts",
  "/governance/standards-and-rules",
  "/governance/policy-packs",
  "/governance/alert-rules",
  "deduplicated signal",
  "inbox row",
  "mutate rows",
  "effective governance",
  "composite rules",
  "policy-pack standards",
  "rules do not fire",
  "finalized review",
] as const;

describe("HelpAlertsGuideView", () => {
  const entry = getProductDocumentationEntry("alerts");

  it("registers the alerts help guide entry", () => {
    expect(entry?.slug).toBe("alerts");
    expect(entry?.title).toBe(ALERTS_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe(ALERTS_HELP_PAGE_SUBTITLE);
    expect(entry?.sourcePaths).toEqual([]);
    expect(entry?.lastReviewed).toBe("2026-08-09");
  });

  it("shows purpose, provenance, hero, and overview near the top with orientation strip at content end", () => {
    if (entry === undefined) {
      throw new Error("Expected alerts documentation entry.");
    }

    render(<HelpAlertsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: ALERTS_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(ALERTS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.getByTestId("help-alerts-guide-hero-mock")).toBeInTheDocument();
    expect(screen.getByTestId("help-alerts-overview")).toHaveTextContent(ALERTS_HELP_OVERVIEW);

    const contentColumn = screen.getByTestId("help-alerts-guide").querySelector(".min-w-0.space-y-8");
    expect(contentColumn).not.toBeNull();
    expect(within(contentColumn as HTMLElement).getByTestId("help-alerts-claim-discipline")).toHaveTextContent(
      ALERTS_HELP_CLAIM_DISCIPLINE,
    );
    expect(within(contentColumn as HTMLElement).getByTestId("help-alerts-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-alerts-orientation")).toBeInTheDocument();
  });

  it("renders revised sections and on-this-page navigation", () => {
    if (entry === undefined) {
      throw new Error("Expected alerts documentation entry.");
    }

    render(<HelpAlertsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "How alerts work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What can trigger an alert" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Where alerts are managed" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resolving an alert" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Related governance concepts" })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    const desktopToc = screen.getByTestId("help-topic-toc");
    expect(within(desktopToc).getByRole("link", { name: "How alerts work" })).toHaveAttribute(
      "href",
      "#how-alerts-work",
    );
  });

  it("keeps destination cards descriptive without duplicate inbox or rules CTAs", () => {
    if (entry === undefined) {
      throw new Error("Expected alerts documentation entry.");
    }

    render(<HelpAlertsGuideView entry={entry} />);

    const destinationCards = screen.getByTestId("help-alerts-destination-cards");
    expect(within(destinationCards).queryByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label })).not.toBeInTheDocument();
    expect(within(destinationCards).queryByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label })).not.toBeInTheDocument();
  });

  it("links related concepts to audit trail help instead of self-referential alerts", () => {
    if (entry === undefined) {
      throw new Error("Expected alerts documentation entry.");
    }

    render(<HelpAlertsGuideView entry={entry} />);

    const related = screen.getByTestId("help-alerts-related-concepts");
    expect(within(related).getByRole("link", { name: "Open audit trail help" })).toHaveAttribute(
      "href",
      "/help/audit-trail",
    );
    expect(within(related).queryByRole("link", { name: "Open alerts inbox" })).not.toBeInTheDocument();
  });

  it("avoids developer-facing routes and implementation jargon", () => {
    if (entry === undefined) {
      throw new Error("Expected alerts documentation entry.");
    }

    render(<HelpAlertsGuideView entry={entry} />);

    const pageText = document.body.textContent?.toLowerCase() ?? "";

    for (const phrase of BANNED_DEVELOPER_COPY) {
      expect(pageText, `should not contain "${phrase}"`).not.toContain(phrase.toLowerCase());
    }
  });
});

describe("alerts help specialty registry guard", () => {
  it("keeps app-rendered alerts help coherent with its section headings", () => {
    const entry = getProductDocumentationEntry("alerts");

    expect(entry?.sourcePaths).toEqual([]);
    expect(ALERTS_HELP_GUIDE_HEADINGS.map((heading) => heading.id)).toEqual([
      "how-alerts-work",
      "what-can-trigger-an-alert",
      "where-alerts-are-managed",
      "resolving-an-alert",
      "related-governance-concepts",
      "help-alerts-claim-discipline-heading",
      "where-to-go-next",
    ]);
  });
});

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/app/(operator)/help/_sections/HelpAlertsWorkspaceReadinessStrip", () => ({
  HelpAlertsWorkspaceReadinessStrip: () => <div data-testid="help-alerts-workspace-readiness-mock" />,
}));

import { HelpAlertsGuideView } from "@/app/(operator)/help/_sections/HelpAlertsGuideView";
import {
  ALERTS_HELP_OVERVIEW,
  ALERTS_HELP_PAGE_SUBTITLE,
  ALERTS_HELP_PAGE_TITLE,
  ALERTS_HELP_PRIMARY_ACTIONS,
} from "@/lib/alerts-help-guide-content";
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
  });

  it("shows purpose, actions, and overview near the top", () => {
    if (entry === undefined) {
      throw new Error("Expected alerts documentation entry.");
    }

    render(<HelpAlertsGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: ALERTS_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(ALERTS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-alerts-workspace-readiness-mock")).toBeInTheDocument();
    expect(screen.getByTestId("help-alerts-overview")).toHaveTextContent(ALERTS_HELP_OVERVIEW);

    const actionPanel = screen.getByTestId("help-alerts-action-panel");
    expect(
      within(actionPanel).getByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.openInbox.label }),
    ).toHaveAttribute("href", ALERTS_HELP_PRIMARY_ACTIONS.openInbox.href);
    expect(
      within(actionPanel).getByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.configureRules.label }),
    ).toHaveAttribute("href", ALERTS_HELP_PRIMARY_ACTIONS.configureRules.href);
    expect(
      within(actionPanel).getByRole("link", { name: ALERTS_HELP_PRIMARY_ACTIONS.governanceSetup.label }),
    ).toHaveAttribute("href", ALERTS_HELP_PRIMARY_ACTIONS.governanceSetup.href);
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

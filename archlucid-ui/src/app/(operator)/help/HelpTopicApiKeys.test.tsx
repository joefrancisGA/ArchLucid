import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpApiKeysGuideView } from "@/app/(operator)/help/_sections/HelpApiKeysGuideView";
import {
  API_KEYS_HELP_ACTION_PANEL_INTRO,
  API_KEYS_HELP_ACTION_PANEL_TITLE,
  API_KEYS_HELP_INSTEAD_SECTION_TITLE,
  API_KEYS_HELP_OVERVIEW,
  API_KEYS_HELP_PAGE_SUBTITLE,
  API_KEYS_HELP_PAGE_TITLE,
  API_KEYS_HELP_PRIMARY_ACTIONS,
  API_KEYS_HELP_RELEASE_AVAILABILITY_NOTE,
  API_KEYS_HELP_RELEASE_STATUS_LABEL,
} from "@/lib/api-keys-help-guide-content";
import {
  API_KEYS_HELP_CANONICAL_PATH,
  API_KEYS_HELP_CLAIM_DISCIPLINE,
  API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING,
  API_KEYS_HELP_FOLLOW_UPS_TITLE,
  API_KEYS_HELP_SOURCES,
} from "@/lib/api-keys-help-evidence-copy";
import { API_KEYS_SETTINGS_RETIRED_ROUTE_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpApiKeysGuideView", () => {
  const entry = getProductDocumentationEntry("api-keys");

  it("registers the API keys help guide entry", () => {
    expect(entry?.slug).toBe("api-keys");
    expect(entry?.title).toBe(API_KEYS_HELP_PAGE_TITLE);
  });

  it("renders release availability in the header, overview, and live action panel CTAs", () => {
    if (entry === undefined) {
      throw new Error("Expected api-keys documentation entry.");
    }

    const { container } = render(<HelpApiKeysGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: API_KEYS_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(API_KEYS_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();

    const pageTitle = screen.getByTestId("help-api-keys-page-title");
    const pageHeader = pageTitle.closest("[data-nav-href]");

    expect(pageHeader).not.toBeNull();
    expect(within(pageHeader as HTMLElement).getByText(API_KEYS_HELP_RELEASE_STATUS_LABEL)).toBeInTheDocument();

    const overview = screen.getByTestId("help-api-keys-overview");

    expect(overview).toHaveTextContent(API_KEYS_HELP_OVERVIEW);
    expect(overview.className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(API_KEYS_HELP_OVERVIEW.startsWith("API key management is not available")).toBe(true);

    const actionPanel = screen.getByTestId("help-api-keys-action-panel");

    expect(screen.getByRole("heading", { level: 2, name: API_KEYS_HELP_ACTION_PANEL_TITLE })).toBeInTheDocument();
    expect(within(actionPanel).getByText(API_KEYS_HELP_ACTION_PANEL_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("help-api-keys-availability-note")).toHaveTextContent(
      API_KEYS_HELP_RELEASE_AVAILABILITY_NOTE,
    );
    expect(API_KEYS_HELP_RELEASE_AVAILABILITY_NOTE.toLowerCase()).not.toContain("not available");

    expect(
      within(actionPanel).getByRole("link", { name: API_KEYS_HELP_PRIMARY_ACTIONS.usersAndRoles.label }),
    ).toHaveAttribute("href", API_KEYS_HELP_PRIMARY_ACTIONS.usersAndRoles.href);
    expect(
      within(actionPanel).getByRole("link", { name: API_KEYS_HELP_PRIMARY_ACTIONS.cliUsageHelp.label }),
    ).toHaveAttribute("href", API_KEYS_HELP_PRIMARY_ACTIONS.cliUsageHelp.href);
    expect(within(actionPanel).getByRole("link", { name: API_KEYS_HELP_PRIMARY_ACTIONS.audit.label })).toHaveAttribute(
      "href",
      API_KEYS_HELP_PRIMARY_ACTIONS.audit.href,
    );

    expect(container.innerHTML).not.toContain(API_KEYS_SETTINGS_RETIRED_ROUTE_PATH);
    expect(screen.queryByRole("link", { name: "Open API keys" })).toBeNull();
  });

  it("renders reachable steps, claim discipline heading, and help-specific Sources chips", () => {
    if (entry === undefined) {
      throw new Error("Expected api-keys documentation entry.");
    }

    render(<HelpApiKeysGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: API_KEYS_HELP_INSTEAD_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-api-keys-how-stepper")).toBeInTheDocument();
    expect(screen.queryByTestId("help-api-keys-step-follow-ups")).toBeNull();

    expect(screen.getByRole("heading", { name: API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("help-api-keys-claim-discipline")).toHaveTextContent(API_KEYS_HELP_CLAIM_DISCIPLINE);
    expect(screen.getByTestId("help-api-keys-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "not available",
    );
    expect(screen.getByRole("heading", { name: API_KEYS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const followUps = screen.getByTestId("help-api-keys-sources");

    expect(within(followUps).getAllByRole("link")).toHaveLength(API_KEYS_HELP_SOURCES.length);

    for (const source of API_KEYS_HELP_SOURCES) {
      expect(within(followUps).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getAllByRole("link", { name: API_KEYS_HELP_PRIMARY_ACTIONS.usersAndRoles.label })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: API_KEYS_HELP_PRIMARY_ACTIONS.cliUsageHelp.label })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: API_KEYS_HELP_PRIMARY_ACTIONS.audit.label })).toHaveLength(1);
  });

  it("renders a sticky TOC with four on-page sections including unavailability", () => {
    if (entry === undefined) {
      throw new Error("Expected api-keys documentation entry.");
    }

    render(<HelpApiKeysGuideView entry={entry} />);

    expect(screen.getByTestId("help-topic-toc")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: API_KEYS_HELP_ACTION_PANEL_TITLE })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: "What API keys are for" })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: API_KEYS_HELP_INSTEAD_SECTION_TITLE })).not.toHaveLength(0);
    expect(screen.getAllByRole("link", { name: API_KEYS_HELP_FOLLOW_UPS_TITLE })).not.toHaveLength(0);
    expect(screen.getByTestId("help-api-keys-page-title").closest("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      API_KEYS_HELP_CANONICAL_PATH,
    );
  });
});

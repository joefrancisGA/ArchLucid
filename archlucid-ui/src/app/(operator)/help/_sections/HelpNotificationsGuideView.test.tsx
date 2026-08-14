import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpNotificationsGuideView } from "@/app/(operator)/help/_sections/HelpNotificationsGuideView";
import {
  NOTIFICATIONS_HELP_GUIDE_HEADINGS,
  NOTIFICATIONS_HELP_HOW_TO_READ_STEPS,
  NOTIFICATIONS_HELP_PRIMARY_ACTION,
  NOTIFICATIONS_HELP_ROLE_PRECONDITION,
  NOTIFICATIONS_HELP_ROLE_PRECONDITION_TAG,
  NOTIFICATIONS_HELP_START_HERE_CARD_TITLE,
  NOTIFICATIONS_HELP_START_HERE_HELPER,
  NOTIFICATIONS_HELP_TILE_ITEMS,
  NOTIFICATIONS_HELP_WORKED_EXAMPLES,
} from "@/lib/notifications-help-guide-content";
import {
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE,
  NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING,
  NOTIFICATIONS_HELP_SOURCES,
  NOTIFICATIONS_HELP_TOPIC_LABEL,
} from "@/lib/notifications-help-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE } from "@/lib/notification-preference-center";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpNotificationsGuideView", () => {
  const entry = getProductDocumentationEntry("notifications");

  it("renders provenance, start-here card, channel tiles, worked examples, and readingBody", () => {
    if (entry === undefined) {
      throw new Error("Expected notifications documentation entry.");
    }

    render(<HelpNotificationsGuideView entry={entry} />);

    expect(screen.getByTestId("help-notifications-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · administration notifications orientation",
    );
    expect(screen.getByTestId("help-notifications-page-title")).toHaveTextContent("How notifications reach you");
    expect(screen.getByTestId("help-notifications-page-title").textContent).not.toBe(
      NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
    );
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-notifications-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-notifications-overview").textContent?.toLowerCase()).not.toContain(
      "delivery status",
    );
    expect(screen.getByTestId("help-notifications-role-precondition")).toHaveTextContent(
      NOTIFICATIONS_HELP_ROLE_PRECONDITION,
    );
    expect(screen.getByTestId("help-notifications-role-precondition-tag")).toHaveTextContent(
      NOTIFICATIONS_HELP_ROLE_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-notifications-start-here-helper")).toHaveTextContent(
      NOTIFICATIONS_HELP_START_HERE_HELPER,
    );
    expect(screen.getByRole("link", { name: NOTIFICATIONS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      NOTIFICATIONS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: NOTIFICATIONS_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: NOTIFICATIONS_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: NOTIFICATIONS_HELP_TOPIC_LABEL })).toBeInTheDocument();

    const tileItems = screen.getByTestId("help-notifications-tile-items");

    for (const item of NOTIFICATIONS_HELP_TILE_ITEMS) {
      const link = within(tileItems).getByRole("link", { name: item.label });

      expect(link).toHaveAttribute("href", item.href);
    }

    const stepper = screen.getByTestId("help-notifications-how-stepper");

    for (const step of NOTIFICATIONS_HELP_HOW_TO_READ_STEPS) {
      expect(within(stepper).getByText(step)).toBeInTheDocument();
    }

    expect(stepper.textContent?.toLowerCase()).not.toContain("delivery status");

    const workedExamples = screen.getByTestId("help-notifications-worked-examples");

    for (const example of NOTIFICATIONS_HELP_WORKED_EXAMPLES) {
      expect(within(workedExamples).getByText(example.scenario)).toBeInTheDocument();
      expect(within(workedExamples).getByText(example.detail)).toBeInTheDocument();
    }

    expect(screen.getByTestId("help-notifications-claim-discipline").textContent).toContain(
      NOTIFICATIONS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-notifications-claim-discipline").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByRole("heading", { level: 2, name: NOTIFICATIONS_HELP_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();

    const sourcesStrip = screen.getByTestId("help-notifications-sources");

    for (const source of NOTIFICATIONS_HELP_SOURCES) {
      expect(within(sourcesStrip).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.queryByRole("link", { name: "Read alerts help →" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Read Slack integration help →" })).not.toBeInTheDocument();

    for (const heading of NOTIFICATIONS_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});

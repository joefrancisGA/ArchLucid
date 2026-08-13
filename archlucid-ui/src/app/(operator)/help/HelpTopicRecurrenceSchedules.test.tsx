import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpRecurrenceSchedulesGuideView } from "@/app/(operator)/help/_sections/HelpRecurrenceSchedulesGuideView";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_HELP_DIGEST_SCHEDULE_LINK,
  RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS,
  RECURRENCE_SCHEDULES_HELP_SOURCES,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import {
  RECURRENCE_SCHEDULES_HELP_AUTOMATION_ITEMS,
  RECURRENCE_SCHEDULES_HELP_EXAMPLES,
  RECURRENCE_SCHEDULES_HELP_OVERVIEW,
  RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_HELP_PAGE_TITLE,
  RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION,
} from "@/lib/recurrence-schedules-help-guide-content";
import { RECURRENCE_SCHEDULES_MANAGE_PATH } from "@/lib/recurrence-schedules-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpRecurrenceSchedulesGuideView", () => {
  const entry = getProductDocumentationEntry("recurrence-schedules");

  it("registers the recurrence schedules help guide entry", () => {
    expect(entry?.slug).toBe("recurrence-schedules");
    expect(entry?.title).toBe(RECURRENCE_SCHEDULES_HELP_PAGE_TITLE);
    expect(entry?.summary).toBe("Automate follow-up review cadences for governed architecture reviews.");
    expect(entry?.lastReviewed).toBe("2026-08-12");
    expect(entry?.releaseApplicability).toBe("governance recurrence schedule orientation");
  });

  it("shows overview first and buyer-safe section order", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: RECURRENCE_SCHEDULES_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();

    const overview = screen.getByTestId("help-recurrence-schedules-overview");
    const followUpsHeading = screen.getByRole("heading", { name: RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE });

    expect(overview).toHaveTextContent(RECURRENCE_SCHEDULES_HELP_OVERVIEW);
    expect(overview.compareDocumentPosition(followUpsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows automation items, examples, health constraints, and vocabulary rail", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "What a schedule automates" })).toBeInTheDocument();

    const automationItems = screen.getByTestId("help-recurrence-schedules-automation-items");
    for (const item of RECURRENCE_SCHEDULES_HELP_AUTOMATION_ITEMS) {
      expect(within(automationItems).getByText(item.label)).toBeInTheDocument();
      expect(within(automationItems).getByRole("link", { name: item.sourceSurface })).toHaveAttribute("href", item.href);
    }

    const exampleCards = screen.getByTestId("help-recurrence-schedules-example-cards");
    for (const example of RECURRENCE_SCHEDULES_HELP_EXAMPLES) {
      expect(within(exampleCards).getByText(example.title)).toBeInTheDocument();
    }

    const constraints = screen.getByTestId("help-recurrence-schedules-health-constraints");
    for (const constraint of RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS) {
      expect(within(constraints).getByText(constraint.label)).toBeInTheDocument();
      expect(within(constraints).getByText(constraint.detail)).toBeInTheDocument();
    }

    expect(screen.getByTestId("digest-recurrence-schedule-vocabulary")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: RECURRENCE_SCHEDULES_HELP_DIGEST_SCHEDULE_LINK.label })).toHaveAttribute(
      "href",
      RECURRENCE_SCHEDULES_HELP_DIGEST_SCHEDULE_LINK.href,
    );
  });

  it("shows claim discipline once and cross-topic follow-up links", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    expect(screen.getByTestId("help-recurrence-schedules-claim-discipline")).toHaveTextContent(
      RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("heading", { name: RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const followUps = screen.getByTestId("help-recurrence-schedules-sources");
    for (const source of RECURRENCE_SCHEDULES_HELP_SOURCES) {
      expect(within(followUps).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });

  it("links the primary action to recurrence schedules management", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    const actionPanel = screen.getByTestId("help-recurrence-schedules-action-panel");

    expect(within(actionPanel).getByRole("link", { name: RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      RECURRENCE_SCHEDULES_MANAGE_PATH,
    );
    expect(RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION.href).toBe(RECURRENCE_SCHEDULES_MANAGE_PATH);
    expect(within(actionPanel).getAllByRole("link")).toHaveLength(1);
  });

  it("renders how-it-works steps and TOC rail", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "How recurrence schedules work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Two different kinds of schedule" })).toBeInTheDocument();
    expect(screen.getByTestId("help-recurrence-schedules-how-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-recurrence-schedules-guide").textContent).not.toMatch(/\bSources\b/);
  });
});

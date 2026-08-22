import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/recurrence-local-time", async () => {
  const actual = await vi.importActual<typeof import("@/lib/recurrence-local-time")>(
    "@/lib/recurrence-local-time",
  );

  return {
    ...actual,
    resolveRecurrenceDisplayTimeZoneId: () => "America/New_York",
  };
});

import { HelpRecurrenceSchedulesGuideView } from "@/app/(operator)/help/_sections/HelpRecurrenceSchedulesGuideView";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING,
  RECURRENCE_SCHEDULES_HELP_DIGEST_SCHEDULE_LINK,
  RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE,
  RECURRENCE_SCHEDULES_HELP_HEALTH_AUDIT_TRAIL_NOTE,
  RECURRENCE_SCHEDULES_HELP_HEALTH_CONSTRAINTS,
  RECURRENCE_SCHEDULES_HELP_SOURCES,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";
import {
  RECURRENCE_SCHEDULES_HELP_AUTOMATION_ITEMS,
  RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID,
  RECURRENCE_SCHEDULES_HELP_EXAMPLES,
  RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION,
  RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION_TAG,
  RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS,
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
    expect(entry?.summary).toBe("Automate follow-up review cadences for architecture reviews.");
    expect(entry?.lastReviewed).toBe("2026-08-12");
    expect(entry?.releaseApplicability).toBe("recurrence schedule orientation");
  });

  it("shows overview first and buyer-safe section order", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: RECURRENCE_SCHEDULES_HELP_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Guide last reviewed 2026-08-12 · recurrence schedule orientation",
    );

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
    expect(screen.getByRole("heading", { name: "Schedule health and trust" })).toBeInTheDocument();

    const automationItems = screen.getByTestId("help-recurrence-schedules-automation-items");
    for (const item of RECURRENCE_SCHEDULES_HELP_AUTOMATION_ITEMS) {
      expect(within(automationItems).getByText(item.label)).toBeInTheDocument();
      expect(within(automationItems).getByRole("link", { name: item.sourceSurface })).toHaveAttribute("href", item.href);
    }

    const exampleSection = screen.getByTestId("recurrence-schedule-examples");
    for (const example of RECURRENCE_SCHEDULES_HELP_EXAMPLES) {
      expect(within(exampleSection).getByText(example.title)).toBeInTheDocument();
      expect(within(exampleSection).getByText(`Cron (UTC): ${example.cronExpression}`)).toBeInTheDocument();
    }

    expect(screen.getAllByTestId("recurrence-schedule-example-human-cadence")).toHaveLength(
      RECURRENCE_SCHEDULES_HELP_EXAMPLES.length,
    );

    const constraints = screen.getByTestId("help-recurrence-schedules-health-constraints");
    expect(within(constraints).getByTestId("help-recurrence-schedules-health-audit-trail-note")).toHaveTextContent(
      RECURRENCE_SCHEDULES_HELP_HEALTH_AUDIT_TRAIL_NOTE,
    );
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

    if (!shouldOmitClaimDisciplineBand("help-recurrence-schedules")) {
      expect(screen.getByTestId("help-recurrence-schedules-claim-discipline")).toHaveTextContent(
        RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
      );
    }
    expect(screen.getByRole("heading", { name: RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("heading", { name: RECURRENCE_SCHEDULES_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const followUps = screen.getByTestId("help-recurrence-schedules-sources");
    for (const source of RECURRENCE_SCHEDULES_HELP_SOURCES) {
      expect(within(followUps).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });

  it("links the primary action to recurrence schedules management with finalized-review precondition", () => {
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
    expect(screen.getByTestId("help-recurrence-schedules-finalized-review-precondition")).toHaveTextContent(
      RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION,
    );
    expect(screen.getByTestId("help-recurrence-schedules-finalized-review-precondition-tag")).toHaveTextContent(
      RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION_TAG,
    );
  });

  it("renders how-it-works steps, TOC rail, and avoids banned run vocabulary", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: "How recurrence schedules work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Two different kinds of schedule" })).toBeInTheDocument();
    expect(screen.getByTestId("help-recurrence-schedules-how-stepper")).toBeInTheDocument();
    expect(screen.getByTestId("help-recurrence-schedules-guide").textContent).not.toMatch(/\bSources\b/);
    expect(screen.getByTestId("help-recurrence-schedules-guide").textContent?.toLowerCase()).not.toMatch(/\brun\b/);
    expect(RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS).toHaveLength(7);

    for (const heading of RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});

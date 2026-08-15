import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpRecurrenceSchedulesGuideView } from "@/app/(operator)/help/_sections/HelpRecurrenceSchedulesGuideView";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID,
  RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION,
  RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION_TAG,
  RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS,
  RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION,
} from "@/lib/recurrence-schedules-help-guide-content";
import {
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE,
  RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING,
  RECURRENCE_SCHEDULES_HELP_SOURCES,
} from "@/lib/recurrence-schedules-help-evidence-copy";
import { RECURRENCE_SCHEDULES_PAGE_SUBTITLE } from "@/lib/recurrence-schedules-copy";

describe("HelpRecurrenceSchedulesGuideView", () => {
  const entry = getProductDocumentationEntry("recurrence-schedules");

  it("renders header action, compact examples without visible cron, and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence-schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    expect(screen.getByTestId("help-recurrence-schedules-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-recurrence-schedules-page-title")).toHaveTextContent("Recurrence schedules");
    expect(RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE).not.toBe(RECURRENCE_SCHEDULES_PAGE_SUBTITLE);
    expect(screen.getByTestId("help-recurrence-schedules-finalized-review-precondition-tag")).toHaveTextContent(
      RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-recurrence-schedules-finalized-review-precondition")).toHaveTextContent(
      RECURRENCE_SCHEDULES_HELP_FINALIZED_REVIEW_PRECONDITION,
    );
    expect(screen.queryByTestId("help-recurrence-schedules-action-panel")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("link", { name: RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      RECURRENCE_SCHEDULES_HELP_PRIMARY_ACTION.href,
    );

    expect(screen.getByTestId("help-recurrence-schedules-claim-discipline")).toHaveTextContent(
      RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      RECURRENCE_SCHEDULES_HELP_CLAIM_HEADING_ID,
    );

    const cronNodes = screen.getAllByTestId("recurrence-schedule-example-cron");

    expect(cronNodes.length).toBeGreaterThan(0);
    expect(cronNodes.every((node) => node.classList.contains("sr-only"))).toBe(true);

    const sourcesStrip = screen.getByTestId("help-recurrence-schedules-sources");

    for (const source of RECURRENCE_SCHEDULES_HELP_SOURCES) {
      expect(within(sourcesStrip).getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
      expect(within(sourcesStrip).getByText(source.when)).toBeInTheDocument();
    }

    for (const heading of RECURRENCE_SCHEDULES_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});

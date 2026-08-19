import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpRecurrenceSchedulesGuideView } from "@/app/(operator)/help/_sections/HelpRecurrenceSchedulesGuideView";
import {
  RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE,
  RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE_BUYER,
  RECURRENCE_SCHEDULES_HELP_PRIMARY_CONTENT_ID,
  RECURRENCE_SCHEDULES_HELP_SKIP_LINK_LABEL,
} from "@/lib/recurrence-schedules-help-guide-content";
import { RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE } from "@/lib/recurrence-schedules-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpRecurrenceSchedulesGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("recurrence-schedules");

  it("renders skip link, buyer subtitle, orientation above overview, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected recurrence-schedules documentation entry.");
    }

    render(<HelpRecurrenceSchedulesGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: RECURRENCE_SCHEDULES_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${RECURRENCE_SCHEDULES_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(RECURRENCE_SCHEDULES_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-recurrence-schedule-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-recurrence-schedules-schedule-kind-body")).toBeInTheDocument();
    expect(screen.getByTestId("help-recurrence-schedules-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("help-recurrence-schedules-claim-discipline").textContent).toContain(
      RECURRENCE_SCHEDULES_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const primaryContent = document.getElementById(RECURRENCE_SCHEDULES_HELP_PRIMARY_CONTENT_ID);

    expect(primaryContent).not.toBeNull();

    const orderedLandmarks = within(primaryContent as HTMLElement)
      .getAllByTestId(/help-recurrence-schedules-(orientation-top|overview)/)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["help-recurrence-schedules-orientation-top", "help-recurrence-schedules-overview"]);
  });
});

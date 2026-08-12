import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsBrowseScheduleSubscriptionsVocabularyRail } from "@/components/DigestsBrowseScheduleSubscriptionsVocabularyRail";
import {
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_COMPACT_LINE,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_HEADING,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SUBSCRIPTIONS_LINK,
  DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_WHY_THREE,
} from "@/lib/vocabulary/digests-browse-schedule-subscriptions-vocabulary";

describe("DigestsBrowseScheduleSubscriptionsVocabularyRail (TB-2290)", () => {
  it("renders browse strip with peer links to schedule and subscriptions", () => {
    render(
      <DigestsBrowseScheduleSubscriptionsVocabularyRail currentSurfaceId="get-started" />,
    );

    const strip = screen.getByTestId("digests-browse-schedule-subscriptions-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "get-started");
    expect(strip.textContent ?? "").toContain(DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_COMPACT_LINE);

    const schedulePeer = screen.getByTestId(
      "digests-browse-schedule-subscriptions-vocabulary-peer-schedule",
    );
    expect(schedulePeer).toHaveTextContent(DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK.label);
    expect(schedulePeer).toHaveAttribute(
      "href",
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK.href,
    );

    const subscriptionsPeer = screen.getByTestId(
      "digests-browse-schedule-subscriptions-vocabulary-peer-subscriptions",
    );
    expect(subscriptionsPeer).toHaveTextContent(
      DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SUBSCRIPTIONS_LINK.label,
    );
  });

  it("renders full variant with why-three explanation", () => {
    render(
      <DigestsBrowseScheduleSubscriptionsVocabularyRail
        currentSurfaceId="schedule"
        variant="full"
      />,
    );

    expect(screen.getByTestId("digests-browse-schedule-subscriptions-vocabulary")).toHaveAttribute(
      "data-variant",
      "full",
    );
    expect(screen.getByText(DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_WHY_THREE)).toBeInTheDocument();
    expect(
      screen.getByTestId("digests-browse-schedule-subscriptions-vocabulary-current"),
    ).toHaveTextContent(DIGESTS_BROWSE_SCHEDULE_SUBSCRIPTIONS_SCHEDULE_LINK.label);
  });
});

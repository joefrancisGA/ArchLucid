import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsNotificationsVocabularyRail } from "@/components/DigestsNotificationsVocabularyRail";
import {
  DIGESTS_NOTIFICATIONS_COMPACT_LINE,
  DIGESTS_NOTIFICATIONS_DIGESTS_LINK,
  DIGESTS_NOTIFICATIONS_HEADING,
  DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK,
  DIGESTS_NOTIFICATIONS_WHY_TWO,
} from "@/lib/digests-notifications-vocabulary";

describe("DigestsNotificationsVocabularyRail (TB-2254)", () => {
  it("renders digests strip with peer link to notifications", () => {
    render(<DigestsNotificationsVocabularyRail currentSurfaceId="digests" />);

    const strip = screen.getByTestId("digests-notifications-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "digests");
    expect(strip.textContent ?? "").toContain(DIGESTS_NOTIFICATIONS_COMPACT_LINE);

    const peer = screen.getByTestId("digests-notifications-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK.label);
    expect(peer).toHaveAttribute("href", DIGESTS_NOTIFICATIONS_NOTIFICATIONS_LINK.href);
  });

  it("renders notifications strip with peer link to digests", () => {
    render(<DigestsNotificationsVocabularyRail currentSurfaceId="notifications" />);

    expect(screen.getByTestId("digests-notifications-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "notifications",
    );

    const peer = screen.getByTestId("digests-notifications-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DIGESTS_NOTIFICATIONS_DIGESTS_LINK.label);
    expect(peer).toHaveAttribute("href", DIGESTS_NOTIFICATIONS_DIGESTS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <DigestsNotificationsVocabularyRail currentSurfaceId="digests" variant="full" />,
    );

    const strip = screen.getByTestId("digests-notifications-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(DIGESTS_NOTIFICATIONS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_NOTIFICATIONS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("digests-notifications-vocabulary-current")).toHaveTextContent(
      DIGESTS_NOTIFICATIONS_DIGESTS_LINK.label,
    );
  });
});

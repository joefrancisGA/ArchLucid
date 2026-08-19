import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotificationPreferenceCenterEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CANONICAL_PATH,
  NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_DISCIPLINE,
  NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_DISCIPLINE_HEADING,
  NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_HEADING_ID,
  NOTIFICATION_PREFERENCE_CENTER_SETTINGS_FOLLOW_UPS_TITLE,
  NOTIFICATION_PREFERENCE_CENTER_SETTINGS_SOURCES,
  NOTIFICATION_PREFERENCE_CENTER_SETTINGS_SOURCES_INTRO,
} from "@/lib/notification-preference-center-evidence-copy";

describe("notification-preference-center-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CANONICAL_PATH).toBe("/administration/notifications");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<NotificationPreferenceCenterEvidenceOrientationStrip />);

    if (!shouldOmitClaimDisciplineBand("notification-preference-center")) { expect(screen.getByTestId("notification-preference-center-claim-discipline")).toHaveTextContent(
      NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(NOTIFICATION_PREFERENCE_CENTER_SETTINGS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("notification-preference-center-sources");

    for (const link of NOTIFICATION_PREFERENCE_CENTER_SETTINGS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<NotificationPreferenceCenterEvidenceOrientationStrip />);

    const claim = screen.getByTestId("notification-preference-center-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_HEADING_ID);
    expect(
      screen.getByRole("heading", { name: NOTIFICATION_PREFERENCE_CENTER_SETTINGS_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: NOTIFICATION_PREFERENCE_CENTER_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});

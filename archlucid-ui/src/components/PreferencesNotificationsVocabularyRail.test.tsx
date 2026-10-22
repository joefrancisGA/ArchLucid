import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreferencesNotificationsVocabularyRail } from "@/components/PreferencesNotificationsVocabularyRail";
import {
  PREFERENCES_NOTIFICATIONS_COMPACT_LINE,
  PREFERENCES_NOTIFICATIONS_HEADING,
  PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK,
  PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK,
  PREFERENCES_NOTIFICATIONS_WHY_TWO,
} from "@/lib/vocabulary/preferences-notifications-vocabulary";

describe("PreferencesNotificationsVocabularyRail (TB-2295)", () => {
  it("renders preferences strip with peer link to notifications", () => {
    render(<PreferencesNotificationsVocabularyRail currentSurfaceId="preferences" />);

    const strip = screen.getByTestId("preferences-notifications-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "preferences");
    expect(strip.textContent ?? "").toContain(PREFERENCES_NOTIFICATIONS_COMPACT_LINE);

    const peer = screen.getByTestId("preferences-notifications-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK.label);
    expect(peer).toHaveAttribute("href", PREFERENCES_NOTIFICATIONS_NOTIFICATIONS_LINK.href);
  });

  it("renders notifications strip with peer link to preferences", () => {
    render(<PreferencesNotificationsVocabularyRail currentSurfaceId="notifications" />);

    const peer = screen.getByTestId("preferences-notifications-vocabulary-peer-link");
    expect(peer).toHaveTextContent(PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK.label);
    expect(peer).toHaveAttribute("href", PREFERENCES_NOTIFICATIONS_PREFERENCES_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PreferencesNotificationsVocabularyRail currentSurfaceId="preferences" variant="full" />,
    );

    expect(screen.getByText(PREFERENCES_NOTIFICATIONS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PREFERENCES_NOTIFICATIONS_WHY_TWO)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRulesAlertsInboxVocabularyRail } from "@/components/AlertRulesAlertsInboxVocabularyRail";
import {
  ALERT_RULES_ALERTS_INBOX_COMPACT_LINE,
  ALERT_RULES_ALERTS_INBOX_HEADING,
  ALERT_RULES_ALERTS_INBOX_INBOX_LINK,
  ALERT_RULES_ALERTS_INBOX_RULES_LINK,
  ALERT_RULES_ALERTS_INBOX_WHY_TWO,
} from "@/lib/vocabulary/alert-rules-alerts-inbox-vocabulary";

describe("AlertRulesAlertsInboxVocabularyRail (TB-2289)", () => {
  it("renders alert-rules strip with peer link to alerts inbox", () => {
    render(<AlertRulesAlertsInboxVocabularyRail currentSurfaceId="alert-rules" />);

    const strip = screen.getByTestId("alert-rules-alerts-inbox-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "alert-rules");
    expect(strip.textContent ?? "").toContain(ALERT_RULES_ALERTS_INBOX_COMPACT_LINE);

    const peer = screen.getByTestId("alert-rules-alerts-inbox-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ALERT_RULES_ALERTS_INBOX_INBOX_LINK.label);
    expect(peer).toHaveAttribute("href", ALERT_RULES_ALERTS_INBOX_INBOX_LINK.href);
  });

  it("renders alerts-inbox strip with peer link to alert rules", () => {
    render(<AlertRulesAlertsInboxVocabularyRail currentSurfaceId="alerts-inbox" />);

    expect(screen.getByTestId("alert-rules-alerts-inbox-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "alerts-inbox",
    );

    const peer = screen.getByTestId("alert-rules-alerts-inbox-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ALERT_RULES_ALERTS_INBOX_RULES_LINK.label);
    expect(peer).toHaveAttribute("href", ALERT_RULES_ALERTS_INBOX_RULES_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <AlertRulesAlertsInboxVocabularyRail currentSurfaceId="alert-rules" variant="full" />,
    );

    const strip = screen.getByTestId("alert-rules-alerts-inbox-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ALERT_RULES_ALERTS_INBOX_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ALERT_RULES_ALERTS_INBOX_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("alert-rules-alerts-inbox-vocabulary-current")).toHaveTextContent(
      ALERT_RULES_ALERTS_INBOX_RULES_LINK.label,
    );
  });
});

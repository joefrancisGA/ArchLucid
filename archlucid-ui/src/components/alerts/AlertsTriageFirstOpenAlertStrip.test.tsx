import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertsTriageFirstOpenAlertStrip } from "./AlertsTriageFirstOpenAlertStrip";

describe("AlertsTriageFirstOpenAlertStrip", () => {
  it("opens linked finding and queues acknowledge", () => {
    const onAcknowledge = vi.fn();

    render(
      <AlertsTriageFirstOpenAlertStrip
        target={{
          alertId: "alert-1",
          title: "PHI boundary drift",
          severity: "Critical",
          openHref: "/architecture/reviews/run-a/findings/f-1",
        }}
        canAcknowledge
        onAcknowledge={onAcknowledge}
      />,
    );

    expect(screen.getByTestId("alerts-triage-first-open-alert-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-a/findings/f-1",
    );

    fireEvent.click(screen.getByTestId("alerts-triage-first-open-alert-acknowledge"));

    expect(onAcknowledge).toHaveBeenCalledWith("alert-1", "Acknowledge");
  });
});

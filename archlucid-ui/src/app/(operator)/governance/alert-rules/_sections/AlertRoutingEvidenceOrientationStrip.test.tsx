import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertRoutingEvidenceOrientationStrip } from "@/app/(operator)/governance/alert-rules/_sections/AlertRoutingEvidenceOrientationStrip";
import { ALERT_ROUTING_SOURCES, ALERT_ROUTING_TAB_PATH } from "@/lib/alert-routing-evidence-copy";

describe("AlertRoutingEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the Notifications tab", () => {
    render(<AlertRoutingEvidenceOrientationStrip />);

    expect(screen.getByTestId("alert-routing-sources")).toBeInTheDocument();
    expect(screen.getByTestId("alert-routing-claim-discipline")).toHaveTextContent(
      /Delivery configuration|CPA SOC 2|third-party pen/i,
    );

    const sources = screen.getByTestId("alert-routing-sources");

    for (const link of ALERT_ROUTING_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ALERT_ROUTING_SOURCES.some((link) => link.href === ALERT_ROUTING_TAB_PATH)).toBe(false);
  });
});

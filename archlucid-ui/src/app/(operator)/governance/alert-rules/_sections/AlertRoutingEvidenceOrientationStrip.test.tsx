import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ALERT_ROUTING_CLAIM_DISCIPLINE } from "@/lib/alert-routing-evidence-copy";

import { AlertRoutingEvidenceOrientationStrip } from "./AlertRoutingEvidenceOrientationStrip";

describe("AlertRoutingEvidenceOrientationStrip", () => {
  it("shows claim discipline without Sources for follow-up", () => {
    render(<AlertRoutingEvidenceOrientationStrip />);

    expect(screen.queryByTestId("alert-routing-sources")).toBeNull();
    expect(screen.getByTestId("alert-routing-claim-discipline")).toHaveTextContent(
      ALERT_ROUTING_CLAIM_DISCIPLINE,
    );
  });
});

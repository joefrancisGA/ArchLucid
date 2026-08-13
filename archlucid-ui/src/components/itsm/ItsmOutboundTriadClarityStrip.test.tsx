import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ItsmOutboundTriadClarityStrip } from "@/components/itsm/ItsmOutboundTriadClarityStrip";
import {
  ITSM_OUTBOUND_TRIAD_COMPACT_LINE,
  ITSM_OUTBOUND_TRIAD_HEADING,
  ITSM_OUTBOUND_TRIAD_WHY_THREE,
} from "@/lib/itsm/itsm-outbound-triad-clarity";

describe("ItsmOutboundTriadClarityStrip (TB-2236)", () => {
  it("renders compact strip by default", () => {
    render(<ItsmOutboundTriadClarityStrip />);

    const strip = screen.getByTestId("itsm-outbound-triad-clarity");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip.textContent ?? "").toContain(ITSM_OUTBOUND_TRIAD_COMPACT_LINE);
  });

  it("renders full variant with three job cards", () => {
    render(<ItsmOutboundTriadClarityStrip variant="full" />);

    const strip = screen.getByTestId("itsm-outbound-triad-clarity");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ITSM_OUTBOUND_TRIAD_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ITSM_OUTBOUND_TRIAD_WHY_THREE)).toBeInTheDocument();
    expect(screen.getByTestId("itsm-outbound-triad-clarity-job-create-ticket")).toBeInTheDocument();
    expect(
      screen.getByTestId("itsm-outbound-triad-clarity-job-disposition-finding"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("itsm-outbound-triad-clarity-job-inbound-human-review-queue"),
    ).toBeInTheDocument();
  });
});

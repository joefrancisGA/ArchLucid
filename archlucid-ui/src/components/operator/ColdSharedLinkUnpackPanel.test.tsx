import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColdSharedLinkUnpackPanel } from "@/components/operator/ColdSharedLinkUnpackPanel";
import { readLastVisitedWatermark, coldSharedLinkUnpackWatermarkKey } from "@/lib/usability/last-visited-watermark";

describe("ColdSharedLinkUnpackPanel (TB-2181)", () => {
  it("renders package context and persists dismiss watermark", () => {
    render(
      <ColdSharedLinkUnpackPanel
        runId="run-abc"
        presentation={{
          packageTitle: "Claims intake modernization",
          statusLabel: "Finalized",
          statusKind: "ready",
          whyYouAreHere: "You were invited to review this architecture review.",
          primaryCtaHref: "/architecture/reviews/run-abc?reviewTab=findings",
          primaryCtaLabel: "Review findings",
        }}
      />,
    );

    expect(screen.getByTestId("cold-shared-link-unpack-panel")).toBeInTheDocument();
    expect(screen.getByText("Claims intake modernization")).toBeInTheDocument();
    expect(screen.getByTestId("cold-shared-link-unpack-why")).toHaveTextContent("invited");

    fireEvent.click(screen.getByTestId("cold-shared-link-unpack-dismiss"));

    expect(screen.queryByTestId("cold-shared-link-unpack-panel")).toBeNull();
    expect(readLastVisitedWatermark(coldSharedLinkUnpackWatermarkKey("run-abc"))).not.toBeNull();
  });
});

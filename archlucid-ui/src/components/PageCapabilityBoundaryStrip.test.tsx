import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import {
  PAGE_CAPABILITY_BOUNDARY_ASK,
  PAGE_CAPABILITY_BOUNDARY_COMPARE,
  PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY,
  PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS,
  getPageCapabilityBoundary,
} from "@/lib/page-capability-boundary";

describe("PageCapabilityBoundaryStrip (TB-2197)", () => {
  it("renders ask disclosure with SoT items", () => {
    render(<PageCapabilityBoundaryStrip surfaceId="ask" />);

    const strip = screen.getByTestId("page-capability-boundary");
    expect(strip).toHaveAttribute("data-surface-id", "ask");
    expect(strip.tagName.toLowerCase()).toBe("details");
    expect(screen.getByText(PAGE_CAPABILITY_BOUNDARY_DISCLOSURE_SUMMARY)).toBeInTheDocument();

    const boundary = getPageCapabilityBoundary("ask");
    for (const item of boundary.items) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }
    expect(boundary).toEqual(PAGE_CAPABILITY_BOUNDARY_ASK);
  });

  it("renders compare surface items", () => {
    render(<PageCapabilityBoundaryStrip surfaceId="compare" />);

    expect(screen.getByTestId("page-capability-boundary")).toHaveAttribute(
      "data-surface-id",
      "compare",
    );
    expect(screen.getByText(PAGE_CAPABILITY_BOUNDARY_COMPARE.items[0]!)).toBeInTheDocument();
  });

  it("renders governanceFindings surface items", () => {
    render(<PageCapabilityBoundaryStrip surfaceId="governanceFindings" />);

    expect(screen.getByTestId("page-capability-boundary")).toHaveAttribute(
      "data-surface-id",
      "governanceFindings",
    );
    expect(
      screen.getByText(PAGE_CAPABILITY_BOUNDARY_GOVERNANCE_FINDINGS.items[0]!),
    ).toBeInTheDocument();
  });

  it("accepts a boundary override for tests", () => {
    render(
      <PageCapabilityBoundaryStrip
        surfaceId="ask"
        boundary={{
          heading: "Custom cannot-do heading",
          items: ["Does not deploy infrastructure."],
        }}
      />,
    );

    expect(screen.getByText("Custom cannot-do heading")).toBeInTheDocument();
    expect(screen.getByText("Does not deploy infrastructure.")).toBeInTheDocument();
  });
});

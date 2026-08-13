import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphSampleModeBanner } from "@/app/(operator)/insights/evidence-graph/_sections/GraphSampleModeBanner";
import {
  BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY,
  BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE,
} from "@/lib/buyer/buyer-polish-copy";

describe("GraphSampleModeBanner (TB-1363)", () => {
  it("discloses Claims Intake sample is not the operator workspace", () => {
    render(<GraphSampleModeBanner />);

    const banner = screen.getByTestId("graph-sample-mode-banner");

    expect(banner).toHaveTextContent(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE);
    expect(banner).toHaveTextContent(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY);
    expect(banner).toHaveTextContent("Claims Intake");
    expect(banner).toHaveTextContent("not your workspace");
    expect(banner).toHaveTextContent("not a review from your tenant");
  });

  it("collapses to a one-line status with disclosure when compact", () => {
    render(<GraphSampleModeBanner compact />);

    const banner = screen.getByTestId("graph-sample-mode-banner");

    expect(banner).toHaveAttribute("data-compact", "true");
    expect(banner).toHaveTextContent(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE);
    expect(screen.getByText("Why am I seeing this?")).toBeInTheDocument();
  });
});

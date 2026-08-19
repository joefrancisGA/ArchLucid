import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphSampleModeBanner } from "@/app/(operator)/insights/evidence-graph/_sections/GraphSampleModeBanner";
import {
  BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY,
  BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE,
} from "@/lib/buyer/buyer-polish-copy";

describe("GraphSampleModeBanner (TB-1363)", () => {
  it("labels the Claims Intake sample with positive framing", () => {
    render(<GraphSampleModeBanner />);

    const banner = screen.getByTestId("graph-sample-mode-banner");

    expect(banner).toHaveTextContent(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE);
    expect(banner).toHaveTextContent(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY);
    expect(banner).toHaveTextContent("Claims Intake");
    expect(banner).toHaveTextContent("Illustrative");
  });

  it("collapses to a one-line sample label when compact", () => {
    render(<GraphSampleModeBanner compact />);

    const banner = screen.getByTestId("graph-sample-mode-banner");

    expect(banner).toHaveAttribute("data-compact", "true");
    expect(banner).toHaveTextContent(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE);
    expect(screen.queryByText("Why am I seeing this?")).not.toBeInTheDocument();
    expect(banner).not.toHaveTextContent(BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY);
  });
});

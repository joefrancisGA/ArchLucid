import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { SHOWCASE_QUICK_NAV_SIGN_IN_CTA } from "@/lib/showcase-quick-nav-contract";

import { ShowcaseQuickNav } from "./ShowcaseQuickNav";

function samplePayload(): DemoCommitPagePreviewResponse {
  return {
    run: {
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      title: "Claims Intake Modernization",
      description: "Illustrative review",
      status: "Committed",
    },
    manifest: {
      manifestId: "11111111-1111-1111-1111-111111111111",
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      status: "Finalized",
    },
    runExplanation: { findingTraceConfidences: [] },
  } as DemoCommitPagePreviewResponse;
}

describe("ShowcaseQuickNav", () => {
  it("renders operator deep links when anonymous access is available", () => {
    render(<ShowcaseQuickNav payload={samplePayload()} operatorDeepLinksAvailable renderMode="static" />);

    expect(screen.getByRole("link", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open signed record" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: SHOWCASE_QUICK_NAV_SIGN_IN_CTA })).not.toBeInTheDocument();
  });

  it("renders sign-in CTA instead of operator deep links when access is gated", () => {
    render(<ShowcaseQuickNav payload={samplePayload()} operatorDeepLinksAvailable={false} renderMode="static" />);

    expect(screen.getByRole("link", { name: SHOWCASE_QUICK_NAV_SIGN_IN_CTA })).toHaveAttribute(
      "href",
      `/auth/signin?returnUrl=${encodeURIComponent(`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)}`,
    );
    expect(screen.queryByRole("link", { name: "Review" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open signed record" })).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SampleReviewDemoBanner } from "@/components/reviews/SampleReviewDemoBanner";
import { RunDetailDemoMarketingChrome } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailDemoMarketingChrome";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("SampleReviewDemoBanner", () => {
  it("renders one sample-data chip for the curated showcase review", () => {
    render(<SampleReviewDemoBanner runId={SHOWCASE_STATIC_DEMO_RUN_ID} />);

    expect(screen.getByTestId("sample-review-demo-banner")).toBeInTheDocument();
    expect(screen.getAllByTestId("demo-data-badge")).toHaveLength(1);
    expect(screen.getByText(/You are viewing a curated sample review/i)).toBeInTheDocument();
  });

  it("does not render for non-showcase runs", () => {
    render(<SampleReviewDemoBanner runId="tenant-review-123" />);

    expect(screen.queryByTestId("sample-review-demo-banner")).not.toBeInTheDocument();
  });

  it("does not duplicate the marketing chrome sample badge on showcase reviews", () => {
    render(
      <>
        <RunDetailDemoMarketingChrome
          showMarketingBanner={false}
          showSampleBadge={false}
          emphasizeSampleData
          usedStaticDemoRun
        />
        <SampleReviewDemoBanner runId={SHOWCASE_STATIC_DEMO_RUN_ID} />
      </>,
    );

    expect(screen.getAllByTestId("demo-data-badge")).toHaveLength(1);
  });
});

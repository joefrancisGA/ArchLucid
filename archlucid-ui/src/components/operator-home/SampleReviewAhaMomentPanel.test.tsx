import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { SampleReviewAhaMomentPanel } from "./SampleReviewAhaMomentPanel";
import { SHOWCASE_HOME_AHA_MOMENT, showcasePrimaryFindingHref } from "@/lib/showcase-home-aha-moment";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("SampleReviewAhaMomentPanel", () => {
  it("surfaces finding, why, evidence, and decision change with primary finding link", () => {
    render(
      <SampleReviewAhaMomentPanel
        moment={SHOWCASE_HOME_AHA_MOMENT}
        findingHref={showcasePrimaryFindingHref(SHOWCASE_STATIC_DEMO_RUN_ID)}
        ctaLabel="Open sample finding"
        ctaTestId="sample-aha-open"
        heading="Start with one sample finding"
        lead="Five-minute value moment."
      />,
    );

    expect(screen.getByTestId("sample-review-aha-moment-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Start with one sample finding" })).toBeInTheDocument();
    expect(screen.getByText(SHOWCASE_HOME_AHA_MOMENT.title)).toBeInTheDocument();
    expect(screen.getByText("Why it matters")).toBeInTheDocument();
    expect(screen.getByText("Evidence support")).toBeInTheDocument();
    expect(screen.getByText("Decision change")).toBeInTheDocument();
    expect(screen.getByText(SHOWCASE_HOME_AHA_MOMENT.decisionChange)).toBeInTheDocument();
    expect(screen.getByTestId("sample-aha-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/customer-intake-modernization/findings/sensitive-data-minimization-risk",
    );
  });
});

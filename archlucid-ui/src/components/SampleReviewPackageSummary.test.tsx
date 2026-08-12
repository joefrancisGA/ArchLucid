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

import { getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";

import { SampleReviewPackageSummary } from "./SampleReviewPackageSummary";

describe("SampleReviewPackageSummary", () => {
  it("shows sample evidence confidence and real-review CTA", () => {
    render(
      <SampleReviewPackageSummary
        runId="claims-intake-modernization"
        manifestId="manifest-1"
        artifactCount={3}
        findingCount={9}
      />,
    );

    expect(screen.getByRole("heading", { name: "Your first-value moment" })).toBeInTheDocument();
    expect(screen.getByText(SHOWCASE_HOME_AHA_MOMENT.decisionChange)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Claims Intake sample review" })).toBeInTheDocument();
    expect(screen.getByText(/Numbers are illustrative only/i)).toBeInTheDocument();
    expect(screen.getByText("Demo only")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open signed record" })).toHaveAttribute("href", getShowcaseManifestHref());
    expect(screen.getByRole("link", { name: "Start a real review" })).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByTestId("sample-review-package-aha-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/claims-intake-modernization/findings/phi-minimization-risk",
    );
  });
});

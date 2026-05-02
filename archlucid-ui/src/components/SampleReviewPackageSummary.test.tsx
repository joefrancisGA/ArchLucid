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

    expect(screen.getByRole("heading", { name: "Claims Intake sample review package" })).toBeInTheDocument();
    expect(screen.getByText(/This is demo data/i)).toBeInTheDocument();
    expect(screen.getByText("Demo only")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open sample manifest" })).toHaveAttribute("href", "/manifests/manifest-1");
    expect(screen.getByRole("link", { name: "Start a real review" })).toHaveAttribute("href", "/reviews/new");
  });
});

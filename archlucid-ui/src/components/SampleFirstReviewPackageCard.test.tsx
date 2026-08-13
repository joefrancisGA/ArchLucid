import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  BUYER_HOME_PRIMARY_CTA,
  BUYER_HOME_SAMPLE_PACKAGE_HEADLINE,
  BUYER_HOME_SAMPLE_PACKAGE_LEAD,
  BUYER_HOME_SECONDARY_CTA,
} from "@/lib/buyer/buyer-polish-copy";

import { SampleFirstReviewPackageCard } from "./SampleFirstReviewPackageCard";

const recordCorePilotRailChecklistStep = vi.fn();

vi.mock("@/lib/core-pilot-rail-telemetry", () => ({
  recordCorePilotRailChecklistStep: (stepIndex: number) => recordCorePilotRailChecklistStep(stepIndex),
}));

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

describe("SampleFirstReviewPackageCard", () => {
  it("links to the curated sample review without demo disclaimer copy", () => {
    render(<SampleFirstReviewPackageCard buyerPolishedShell={false} />);

    expect(screen.getByRole("heading", { name: BUYER_HOME_SAMPLE_PACKAGE_HEADLINE })).toBeInTheDocument();
    expect(screen.getByText(BUYER_HOME_SAMPLE_PACKAGE_LEAD)).toBeInTheDocument();
    expect(screen.queryByText(/Illustrative sample review/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not as customer ROI evidence/i)).not.toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Approved with monitoring")).toBeInTheDocument();
    expect(screen.getByText(/audit evidence ready/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: BUYER_HOME_PRIMARY_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Create from evidence" })).toHaveAttribute("href", "/architecture/reviews/new");
  });

  it("records review-output telemetry when the sample is opened", () => {
    render(<SampleFirstReviewPackageCard buyerPolishedShell={false} />);

    fireEvent.click(screen.getByRole("link", { name: BUYER_HOME_PRIMARY_CTA }));

    expect(recordCorePilotRailChecklistStep).toHaveBeenCalledWith(3);
  });
});

describe("SampleFirstReviewPackageCard — buyer-polished shell", () => {
  it("uses sample-first CTAs and buyer journey copy without disclaimer", () => {
    render(<SampleFirstReviewPackageCard buyerPolishedShell={true} />);

    expect(
      screen.getByRole("heading", { name: BUYER_HOME_SAMPLE_PACKAGE_HEADLINE }),
    ).toBeInTheDocument();

    expect(screen.getByText(BUYER_HOME_SAMPLE_PACKAGE_LEAD)).toBeInTheDocument();
    expect(screen.queryByText(/Illustrative sample review/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: BUYER_HOME_PRIMARY_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: BUYER_HOME_SECONDARY_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.queryByRole("link", { name: "Open evidence graph" })).toBeNull();
    expect(screen.queryByRole("button", { name: /About this sample review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start a new request" })).toBeNull();
  });

  it("records review-output telemetry when the sample package link opens", () => {
    render(<SampleFirstReviewPackageCard buyerPolishedShell={true} />);

    fireEvent.click(screen.getByRole("link", { name: BUYER_HOME_PRIMARY_CTA }));

    expect(recordCorePilotRailChecklistStep).toHaveBeenCalledWith(3);
  });
});

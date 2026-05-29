import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const recordCorePilotRailChecklistStep = vi.fn();

const demoUiEnvMock = vi.hoisted(() => ({
  buyerPolishedShell: false,
}));

vi.mock("@/lib/core-pilot-rail-telemetry", () => ({
  recordCorePilotRailChecklistStep: (stepIndex: number) => recordCorePilotRailChecklistStep(stepIndex),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoUiEnvMock.buyerPolishedShell,
  };
});

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

import { BUYER_HOME_PRIMARY_CTA, BUYER_HOME_SAMPLE_PACKAGE_LEAD, BUYER_HOME_SAMPLE_PACKAGE_SUBTITLE, BUYER_HOME_SECONDARY_CTA } from "@/lib/buyer-polish-copy";
import { SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE } from "@/lib/showcase-static-demo";

import { SampleFirstReviewPackageCard } from "./SampleFirstReviewPackageCard";

describe("SampleFirstReviewPackageCard", () => {
  it("links to the curated sample review and labels demo evidence", () => {
    render(<SampleFirstReviewPackageCard />);

    expect(screen.getByRole("heading", { name: "Start with a completed architecture review package" })).toBeInTheDocument();
    expect(screen.getByText(/Illustrative sample review/i)).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Approved with monitoring")).toBeInTheDocument();
    expect(screen.getByText(/audit package ready/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open sample review package" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Create from my evidence" })).toHaveAttribute("href", "/reviews/new");
  });

  it("records review-output telemetry when the sample is opened", () => {
    render(<SampleFirstReviewPackageCard />);

    fireEvent.click(screen.getByRole("link", { name: "Open sample review package" }));

    expect(recordCorePilotRailChecklistStep).toHaveBeenCalledWith(3);
  });
});

describe("SampleFirstReviewPackageCard — buyer-polished shell", () => {
  beforeEach(() => {
    demoUiEnvMock.buyerPolishedShell = true;
  });

  afterEach(() => {
    demoUiEnvMock.buyerPolishedShell = false;
    vi.clearAllMocks();
  });

  it("uses executive-first CTA plus compact buyer journey copy", () => {
    render(<SampleFirstReviewPackageCard />);

    expect(
      screen.getByRole("heading", { name: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE }),
    ).toBeInTheDocument();

    expect(screen.getByText(BUYER_HOME_SAMPLE_PACKAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByText(BUYER_HOME_SAMPLE_PACKAGE_LEAD)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: BUYER_HOME_PRIMARY_CTA })).toHaveAttribute(
      "href",
      "/executive/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: BUYER_HOME_SECONDARY_CTA })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    expect(screen.queryByRole("link", { name: "Open evidence graph" })).toBeNull();
    expect(screen.getByRole("button", { name: /About this sample review package/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start a new request" })).toBeNull();
  });

  it("records review-output telemetry when the full package link opens", () => {
    render(<SampleFirstReviewPackageCard />);

    fireEvent.click(screen.getByRole("link", { name: BUYER_HOME_SECONDARY_CTA }));

    expect(recordCorePilotRailChecklistStep).toHaveBeenCalledWith(3);
  });
});

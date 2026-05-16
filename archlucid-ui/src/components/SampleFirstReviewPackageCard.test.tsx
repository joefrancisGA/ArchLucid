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

import { SampleFirstReviewPackageCard } from "./SampleFirstReviewPackageCard";

describe("SampleFirstReviewPackageCard", () => {
  it("links to the curated sample review and labels demo evidence", () => {
    render(<SampleFirstReviewPackageCard />);

    expect(screen.getByRole("heading", { name: "Start with a completed architecture review package" })).toBeInTheDocument();
    expect(screen.getByText(/Illustrative sample review/i)).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start with sample review" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Use my own input" })).toHaveAttribute("href", "/reviews/new");
  });

  it("records review-output telemetry when the sample is opened", () => {
    render(<SampleFirstReviewPackageCard />);

    fireEvent.click(screen.getByRole("link", { name: "Start with sample review" }));

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
      screen.getByRole("heading", { name: /Claims Intake Modernization Review Package/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Review the completed Claims Intake package through executive summary, signed manifest, evidence graph, governance approval, and audit trail/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start executive review" })).toHaveAttribute(
      "href",
      "/executive/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Open full review package" })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Review decision evidence" })).toHaveAttribute("href", "/#buyer-review-journey");
    expect(screen.getByRole("button", { name: /About this sample review package/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start a new request" })).toBeNull();
  });

  it("records review-output telemetry when the full package link opens", () => {
    render(<SampleFirstReviewPackageCard />);

    fireEvent.click(screen.getByRole("link", { name: "Open full review package" }));

    expect(recordCorePilotRailChecklistStep).toHaveBeenCalledWith(3);
  });
});

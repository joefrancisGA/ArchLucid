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

  it("uses primary manifest summary, outline walkthrough, and separated own-workspace link", () => {
    render(<SampleFirstReviewPackageCard />);

    expect(screen.getByRole("heading", { name: "Sample architecture review package" })).toBeInTheDocument();
    expect(screen.getByText(/Start with executive view — it is the clearest board-ready summary/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Includes manifest outputs, PHI minimization risk with traceability/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open executive view" })).toHaveAttribute(
      "href",
      "/executive/reviews/claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Manifest summary" })).toHaveAttribute(
      "href",
      "/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890",
    );
    expect(screen.getByRole("link", { name: "Optional guided walkthrough" })).toHaveAttribute(
      "href",
      "/showcase/claims-intake-modernization",
    );
    expect(screen.queryByRole("link", { name: "Open full review detail" })).toBeNull();
    expect(screen.getByRole("link", { name: "connect your own workspace" })).toHaveAttribute("href", "/reviews/new");
  });

  it("records review-output telemetry when the sample review package is opened", () => {
    render(<SampleFirstReviewPackageCard />);

    fireEvent.click(screen.getByRole("link", { name: /manifest summary/i }));

    expect(recordCorePilotRailChecklistStep).toHaveBeenCalledWith(3);
  });
});

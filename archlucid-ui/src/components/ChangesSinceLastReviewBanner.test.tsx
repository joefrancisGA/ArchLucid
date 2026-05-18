import { fireEvent, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BACKUP_ENV = process.env;

import { ChangesSinceLastReviewBanner } from "./ChangesSinceLastReviewBanner";

expect.extend(toHaveNoViolations);

describe("ChangesSinceLastReviewBanner", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...BACKUP_ENV };
    vi.restoreAllMocks();
  });

  it("renders comparison link with baseline and target run ids", () => {
    render(
      <ChangesSinceLastReviewBanner
        priorReviewDateLabel="May 9, 2026"
        priorRunId="prior-run"
        currentRunId="current-run"
        copy={{
          netChangeLine: "+1 new findings, -2 resolved",
          severityShiftLine: "1 new Critical, 2 resolved Medium",
        }}
      />,
    );

    fireEvent.click(screen.getByText(/Compared to your previous review on May 9, 2026/i));

    expect(screen.getByText("+1 new findings, -2 resolved")).toBeInTheDocument();
    expect(screen.getByText("1 new Critical, 2 resolved Medium")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /open full comparison/i });

    expect(link).toHaveAttribute(
      "href",
      "/compare?leftRunId=prior-run&rightRunId=current-run",
    );
  });

  it("uses buyer-polished compare link label and friendly query keys when demo chrome is enabled", async () => {
    process.env = { ...BACKUP_ENV, NEXT_PUBLIC_DEMO_MODE: "true", NEXT_PUBLIC_DEMO_STATIC_OPERATOR: "false" };

    const { ChangesSinceLastReviewBanner: Banner } = await import("./ChangesSinceLastReviewBanner");

    render(
      <Banner
        priorReviewDateLabel="May 9, 2026"
        priorRunId="claims-intake-run-v1"
        currentRunId="claims-intake-modernization"
        copy={{
          netChangeLine: "+1 new findings",
          severityShiftLine: null,
        }}
      />,
    );

    fireEvent.click(screen.getByText(/Compared to your previous review/i));

    const link = screen.getByRole("link", { name: /view review change comparison/i });

    expect(link).toHaveAttribute(
      "href",
      "/compare?priorRunId=claims-intake-run-v1&laterRunId=claims-intake-modernization",
    );
  });

  it("has no serious axe violations when expanded", async () => {
    const { container } = render(
      <ChangesSinceLastReviewBanner
        priorReviewDateLabel="Jan 1, 2026"
        priorRunId="left-id"
        currentRunId="right-id"
        copy={{
          netChangeLine: "+3 new findings",
          severityShiftLine: null,
        }}
      />,
    );

    fireEvent.click(screen.getByText(/Compared to your previous review/i));

    expect(await axe(container)).toHaveNoViolations();
  });
});

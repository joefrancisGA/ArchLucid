import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailSubmittedArchitectureSection } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailSubmittedArchitectureSection";

const markdownBrief = `## Sponsor report

Governed claims intake.

## Risks

| Risk | Severity |
| --- | --- |
| Partner outage | High |`;

describe("RunDetailSubmittedArchitectureSection narrative rendering", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders markdown in the legacy submitted-brief path", () => {
    render(
      <RunDetailSubmittedArchitectureSection
        architectureText={markdownBrief}
        canEditSource={false}
        editHref={null}
        useStructuredPresentation={false}
      />,
    );

    const preview = screen.getByTestId("submitted-architecture-preview");

    expect(within(preview).getByRole("heading", { level: 2, name: "Sponsor report" })).toBeInTheDocument();
    expect(within(preview).getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("## Sponsor report")).toBeNull();
  });

  it("distinguishes omitted architecture text from stored empty text", () => {
    const { rerender } = render(
      <RunDetailSubmittedArchitectureSection
        architectureText={null}
        canEditSource={false}
        editHref={null}
      />,
    );

    expect(screen.getAllByText("Submitted architecture text was not stored.")).toHaveLength(2);

    rerender(
      <RunDetailSubmittedArchitectureSection
        architectureText=""
        canEditSource={false}
        editHref={null}
      />,
    );

    expect(screen.getAllByText("Submitted architecture text was stored empty.")).toHaveLength(2);
  });

  it("keeps the new review copy state when a prior review timer expires", async () => {
    const { rerender } = render(
      <RunDetailSubmittedArchitectureSection
        architectureText="Prior review architecture"
        runId="run-1"
        manifestVersion="manifest-1"
        canEditSource={false}
        editHref={null}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();

    vi.advanceTimersByTime(1000);

    rerender(
      <RunDetailSubmittedArchitectureSection
        architectureText="New review architecture"
        runId="run-2"
        manifestVersion="manifest-2"
        canEditSource={false}
        editHref={null}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copied" }));
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();

    vi.advanceTimersByTime(1000);

    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});

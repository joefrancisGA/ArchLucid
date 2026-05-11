import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { QuickDecisionSummary } from "./QuickDecisionSummary";

expect.extend(toHaveNoViolations);

describe("QuickDecisionSummary", () => {
  it("shows empty state when there are no findings", () => {
    render(<QuickDecisionSummary runId="run-1" findings={[]} />);

    expect(screen.getByText("No findings to act on")).toBeInTheDocument();
  });

  it("renders top three by severity with links to finding detail", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-low",
        title: "Low title",
        recommendation: "Later.",
        severityValue: 0,
        findingOrder: 0,
      },
      {
        findingId: "f-high",
        title: "High title",
        recommendation: "Fix immediately. Then verify.",
        severityValue: 2,
        findingOrder: 1,
      },
      {
        findingId: "f-critical",
        title: "Critical title",
        recommendation: "Stop rollout.",
        severityValue: 3,
        findingOrder: 2,
      },
      {
        findingId: "f-extra",
        title: "Extra",
        recommendation: "Extra.",
        severityValue: 1,
        findingOrder: 3,
      },
    ];

    render(<QuickDecisionSummary runId="run-abc" findings={findings} />);

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(3);
    expect(links.map((el) => el.getAttribute("href"))).toEqual([
      "/reviews/run-abc/findings/f-critical",
      "/reviews/run-abc/findings/f-high",
      "/reviews/run-abc/findings/f-extra",
    ]);

    expect(screen.getByText("Fix immediately.")).toBeInTheDocument();
  });

  it("has no serious axe violations", async () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Issue one",
        recommendation: "Do thing.",
        severityValue: 3,
        findingOrder: 0,
      },
    ];

    const { container } = render(<QuickDecisionSummary runId="run-z" findings={findings} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

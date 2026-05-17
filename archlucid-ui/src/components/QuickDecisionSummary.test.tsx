import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { QuickDecisionSummary } from "./QuickDecisionSummary";

vi.mock("next/navigation", () => ({
  useRouter: (): { refresh: () => void } => ({ refresh: (): void => {} }),
}));

expect.extend(toHaveNoViolations);

describe("QuickDecisionSummary", () => {
  it("shows empty state when there are no findings", () => {
    render(<QuickDecisionSummary runId="run-1" findings={[]} />);

    expect(screen.getByText("No findings to act on")).toBeInTheDocument();
  });

  it("buyer-polished shell summarizes finalized posture when headline lists findings but quick rows are empty", () => {
    render(
      <QuickDecisionSummary
        runId="run-1"
        findings={[]}
        buyerPolishedShell
        headlineFindingCount={9}
        headlineWarningCount={1}
      />,
    );

    expect(
      screen.getByText(
        /This finalized review records 9 findings with no unresolved blocking issues\. One monitored PHI minimization risk remains in the manifest—review severity and controls below\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("No findings to act on")).not.toBeInTheDocument();
  });

  it("renders top three by severity with links to finding detail", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f-low",
        title: "Low title",
        recommendation: "Later.",
        severityValue: 0,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
      },
      {
        findingId: "f-high",
        title: "High title",
        recommendation: "Fix immediately. Then verify.",
        severityValue: 2,
        findingOrder: 1,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
      },
      {
        findingId: "f-critical",
        title: "Critical title",
        recommendation: "Stop rollout.",
        severityValue: 3,
        findingOrder: 2,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
      },
      {
        findingId: "f-extra",
        title: "Extra",
        recommendation: "Extra.",
        severityValue: 1,
        findingOrder: 3,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
      },
    ];

    render(<QuickDecisionSummary runId="run-abc" findings={findings} />);

    const findingDetailLinks = screen.getAllByRole("link").filter((el) => {
      const href = el.getAttribute("href") ?? "";

      return href.includes("/reviews/run-abc/findings/") && !href.includes("/graph");
    });

    expect(findingDetailLinks).toHaveLength(3);
    expect(findingDetailLinks.map((el) => el.getAttribute("href"))).toEqual([
      "/reviews/run-abc/findings/f-critical",
      "/reviews/run-abc/findings/f-high",
      "/reviews/run-abc/findings/f-extra",
    ]);

    expect(screen.getByText("Fix immediately.")).toBeInTheDocument();
  });

  it("shows View evidence graph link when synthetic evidence ref count is present", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Risk",
        recommendation: "Mitigate.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        evidenceRefCount: 1,
        confidenceLevel: "Medium",
      },
    ];

    render(<QuickDecisionSummary runId="run-z" findings={findings} />);

    const ev = screen.getByTestId("quick-decision-view-evidence");

    expect(ev).toBeInTheDocument();
    expect(ev.getAttribute("href") ?? "").toContain("/graph?");
    expect(ev.getAttribute("href") ?? "").toContain("runId=run-z");
  });

  it("has no serious axe violations", async () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "f1",
        title: "Issue one",
        recommendation: "Do thing.",
        severityValue: 3,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
      },
    ];

    const { container } = render(<QuickDecisionSummary runId="run-z" findings={findings} />);

    expect(await axe(container)).toHaveNoViolations();
  });
});

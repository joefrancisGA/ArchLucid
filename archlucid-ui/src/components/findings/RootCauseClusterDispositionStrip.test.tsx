import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RootCauseClusterDispositionStrip } from "@/components/findings/RootCauseClusterDispositionStrip";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

const recordBulkFindingDisposition = vi.fn();
const routerRefresh = vi.fn();

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  recordBulkFindingDisposition: (...args: unknown[]) => recordBulkFindingDisposition(...args),
}));

vi.mock("@/lib/await-minimum-visible-duration", () => ({
  awaitMinimumVisibleDuration: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

function finding(
  overrides: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: overrides.findingId,
    title: overrides.title ?? "Finding",
    recommendation: overrides.recommendation ?? "Fix it",
    severityValue: overrides.severityValue ?? 2,
    findingOrder: overrides.findingOrder ?? 0,
    aiReasoning: overrides.aiReasoning ?? { wireJson: "{}", reasoningTrace: "" },
    isMuted: overrides.isMuted ?? false,
    muteReason: overrides.muteReason ?? null,
    enforcementTier: overrides.enforcementTier ?? "PolicyViolation",
    humanReviewStatus: overrides.humanReviewStatus ?? 1,
    policyRuleId: overrides.policyRuleId,
  };
}

describe("RootCauseClusterDispositionStrip", () => {
  beforeEach(() => {
    recordBulkFindingDisposition.mockReset();
    routerRefresh.mockReset();
    recordBulkFindingDisposition.mockResolvedValue({ processedCount: 2 });
  });

  it("renders cluster actions when two related findings are open", () => {
    render(
      <RootCauseClusterDispositionStrip
        findings={[
          finding({ findingId: "a", policyRuleId: "cost.budget" }),
          finding({ findingId: "b", policyRuleId: "cost.budget" }),
        ]}
      />,
    );

    expect(screen.getByTestId("root-cause-cluster-disposition-strip")).toBeTruthy();
    expect(screen.getByText(/cost.budget/)).toBeTruthy();
    const acceptButton = screen.getByTestId("root-cause-cluster-accept-rule:cost.budget");
    expect(acceptButton.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByTestId("root-cause-cluster-rationale"), {
      target: { value: "Shared cost trade-off accepted for pilot scope." },
    });

    expect(acceptButton.hasAttribute("disabled")).toBe(false);
  });

  it("shows a durable success callout after applying a cluster disposition", async () => {
    render(
      <RootCauseClusterDispositionStrip
        findings={[
          finding({ findingId: "a", policyRuleId: "cost.budget" }),
          finding({ findingId: "b", policyRuleId: "cost.budget" }),
        ]}
      />,
    );

    fireEvent.change(screen.getByTestId("root-cause-cluster-rationale"), {
      target: { value: "Shared cost trade-off accepted for pilot scope." },
    });
    fireEvent.click(screen.getByTestId("root-cause-cluster-accept-rule:cost.budget"));
    fireEvent.click(screen.getByRole("button", { name: "Accept cluster" }));

    await waitFor(() => {
      expect(recordBulkFindingDisposition).toHaveBeenCalled();
      expect(screen.getByTestId("root-cause-cluster-disposition-success")).toHaveTextContent(
        "Marked 2 finding(s) as accepted.",
      );
      expect(routerRefresh).toHaveBeenCalled();
    });
  });
});

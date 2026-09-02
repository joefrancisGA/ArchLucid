import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RunDetailRunGovernanceDispositionActions } from "@/components/runs/RunDetailRunGovernanceDispositionActions";

const recordRunOperatorGovernanceDisposition = vi.fn();
const routerRefresh = vi.fn();

vi.mock("@/lib/api/architecture-runs", () => ({
  recordRunOperatorGovernanceDisposition: (...args: unknown[]) =>
    recordRunOperatorGovernanceDisposition(...args),
}));

vi.mock("@/lib/await-minimum-visible-duration", () => ({
  awaitMinimumVisibleDuration: vi.fn(async () => undefined),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

describe("RunDetailRunGovernanceDispositionActions", () => {
  beforeEach(() => {
    recordRunOperatorGovernanceDisposition.mockReset();
    routerRefresh.mockReset();
    recordRunOperatorGovernanceDisposition.mockResolvedValue(undefined);
  });

  it("shows a durable success callout after recording a disposition", async () => {
    render(<RunDetailRunGovernanceDispositionActions runId="run-1" hasCommitBlockingFailures={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Approve review" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Approved" }));

    await waitFor(() => {
      expect(recordRunOperatorGovernanceDisposition).toHaveBeenCalledWith("run-1", {
        decision: "Approved",
        rationale: null,
      });
      expect(screen.getByTestId("run-governance-disposition-success")).toHaveTextContent(
        "Review disposition recorded as Approved.",
      );
      expect(routerRefresh).toHaveBeenCalled();
    });
  });
});

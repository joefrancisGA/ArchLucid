import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReRunReviewButton } from "@/components/runs/ReRunReviewButton";

const executeArchitectureRunAsync = vi.fn();
const routerRefresh = vi.fn();

vi.mock("@/lib/api", () => ({
  executeArchitectureRunAsync: (...args: unknown[]) => executeArchitectureRunAsync(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

describe("ReRunReviewButton", () => {
  beforeEach(() => {
    executeArchitectureRunAsync.mockReset();
    routerRefresh.mockReset();
    executeArchitectureRunAsync.mockResolvedValue({ operationId: "op-1", location: null });
  });

  it("re-executes the review on the same run id", async () => {
    render(<ReRunReviewButton runId="run-abc" />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));

    await waitFor(() => {
      expect(executeArchitectureRunAsync).toHaveBeenCalledWith("run-abc");
      expect(routerRefresh).toHaveBeenCalled();
    });
  });
});

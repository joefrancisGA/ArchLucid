import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceFindingsBulkActions } from "@/components/usability/GovernanceFindingsBulkActions";
import { GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED } from "@/lib/governance/governance-mutation-outcome-copy";

const recordBulkFindingDisposition = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  recordBulkFindingDisposition: (...args: unknown[]) => recordBulkFindingDisposition(...args),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { showError, showSuccess } from "@/lib/toast";

describe("GovernanceFindingsBulkActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows inline error when reason is missing", () => {
    render(
      <GovernanceFindingsBulkActions
        selectedFindingIds={["f1", "f2"]}
        onApplied={vi.fn()}
        onDispositionSucceeded={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

    expect(screen.getByTestId("governance-bulk-disposition-inline-error")).toHaveTextContent(
      GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED,
    );
    expect(showError).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it("notifies parent with durable success message after bulk disposition succeeds", async () => {
    recordBulkFindingDisposition.mockResolvedValue({ processedCount: 2 });
    const onApplied = vi.fn();
    const onDispositionSucceeded = vi.fn();

    render(
      <GovernanceFindingsBulkActions
        selectedFindingIds={["f1", "f2"]}
        onApplied={onApplied}
        onDispositionSucceeded={onDispositionSucceeded}
      />,
    );

    fireEvent.change(screen.getByLabelText("Shared reason"), {
      target: { value: "Reviewed with architecture board." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
    expect(screen.getByTestId("mutation-reversibility-notice-governance_bulk_disposition")).toBeInTheDocument();
    expect(screen.getByTestId("disposition-export-impact-notice-Accepted")).toBeInTheDocument();
    expect(screen.getByTestId("disposition-export-before-after")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Apply disposition" }));

    await waitFor(() => {
      expect(onDispositionSucceeded).toHaveBeenCalledWith(
        "Marked 2 finding(s) as accepted.",
        expect.any(Function),
      );
    });

    expect(onApplied).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
  });
});

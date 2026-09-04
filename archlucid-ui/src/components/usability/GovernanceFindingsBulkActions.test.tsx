import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceFindingsBulkActions } from "@/components/usability/GovernanceFindingsBulkActions";
import { GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED } from "@/lib/governance/governance-mutation-outcome-copy";
import { DISPOSITION_RATIONALE_REQUIRED_MESSAGE } from "@/lib/review-quality/finding-governance-gates";

const recordBulkFindingDisposition = vi.fn();
const defaultDeferredRevisitDueUtc = vi.fn(() => "2026-10-03T00:00:00.000Z");
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  defaultDeferredRevisitDueUtc: () => defaultDeferredRevisitDueUtc(),
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

  it("disables bulk disposition buttons until a shared reason is entered (TB-2008)", () => {
    render(
      <GovernanceFindingsBulkActions
        selectedFindingIds={["f1", "f2"]}
        onApplied={vi.fn()}
        onDispositionSucceeded={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Accept all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Waive all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Defer all" })).toBeDisabled();
    expect(screen.getByText(GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED)).toBeInTheDocument();
    expect(showError).not.toHaveBeenCalled();
  });

  it("keeps accept and waive disabled until rationale meets minimum length", () => {
    render(
      <GovernanceFindingsBulkActions
        selectedFindingIds={["f1"]}
        onApplied={vi.fn()}
        onDispositionSucceeded={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Shared reason"), {
      target: { value: "too short" },
    });

    expect(screen.getByRole("button", { name: "Accept all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Waive all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Defer all" })).toBeEnabled();
    expect(screen.getByText(DISPOSITION_RATIONALE_REQUIRED_MESSAGE)).toBeInTheDocument();
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
        expect.objectContaining({
          message: "Marked 2 finding(s) as accepted.",
          correctionFindingIds: ["f1", "f2"],
          undo: expect.any(Function),
        }),
      );
    });

    expect(onApplied).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it("sends default revisit due when bulk deferring", async () => {
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
      target: { value: "Defer until next quarter planning." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Defer all" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply disposition" }));

    await waitFor(() => {
      expect(recordBulkFindingDisposition).toHaveBeenCalledWith(
        expect.objectContaining({
          disposition: "Deferred",
          revisitDueUtc: "2026-10-03T00:00:00.000Z",
        }),
        expect.any(Object),
      );
    });

    expect(defaultDeferredRevisitDueUtc).toHaveBeenCalled();
  });
});

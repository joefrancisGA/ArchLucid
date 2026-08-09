import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceFindingsBulkActions } from "@/components/usability/GovernanceFindingsBulkActions";
import { GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED } from "@/lib/governance-mutation-outcome-copy";

const recordBulkFindingDisposition = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  recordBulkFindingDisposition: (...args: unknown[]) => recordBulkFindingDisposition(...args),
}));

describe("GovernanceFindingsBulkActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows inline error when reason is missing", () => {
    render(
      <GovernanceFindingsBulkActions selectedFindingIds={["f1", "f2"]} onApplied={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

    expect(screen.getByTestId("governance-bulk-disposition-inline-error")).toHaveTextContent(
      GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED,
    );
  });

  it("shows durable success callout after bulk disposition succeeds", async () => {
    recordBulkFindingDisposition.mockResolvedValue({ processedCount: 2 });
    const onApplied = vi.fn();

    render(
      <GovernanceFindingsBulkActions selectedFindingIds={["f1", "f2"]} onApplied={onApplied} />,
    );

    fireEvent.change(screen.getByLabelText("Shared reason"), {
      target: { value: "Reviewed with architecture board." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

    await waitFor(() => {
      expect(screen.getByTestId("governance-bulk-disposition-success-callout")).toHaveTextContent(
        "Marked 2 finding(s) as accepted.",
      );
    });

    expect(onApplied).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });
});

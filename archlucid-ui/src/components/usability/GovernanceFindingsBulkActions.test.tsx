import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GovernanceFindingsBulkActions } from "@/components/usability/GovernanceFindingsBulkActions";
import { GOVERNANCE_BULK_DISPOSITION_REASON_REQUIRED } from "@/lib/governance/governance-mutation-outcome-copy";
import { ApiRequestError } from "@/lib/api-request-error";

const recordBulkFindingDisposition = vi.fn();
const listFindingDispositions = vi.fn();
const defaultDeferredRevisitDueUtc = vi.fn(() => "2026-10-03T00:00:00.000Z");
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  recordBulkFindingDisposition: (...args: unknown[]) => recordBulkFindingDisposition(...args),
  listFindingDispositions: (...args: unknown[]) => listFindingDispositions(...args),
}));

vi.mock("@/lib/findings/finding-disposition-revisit-window", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/findings/finding-disposition-revisit-window")>();

  return {
    ...actual,
    computeFindingDispositionRevisitDueUtc: () => defaultDeferredRevisitDueUtc(),
  };
});

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { showError, showSuccess } from "@/lib/toast";

describe("GovernanceFindingsBulkActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listFindingDispositions.mockImplementation(async (findingId: string) => {
      if (findingId === "f1") {
        return [{ currentDispositionRowVersionBase64: "AAA=" }];
      }

      if (findingId === "f2") {
        return [{ currentDispositionRowVersionBase64: "BBB=" }];
      }

      return [];
    });
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

  it("enables bulk actions once a shared reason is non-empty", () => {
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

    expect(screen.getByRole("button", { name: "Accept all" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Waive all" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Defer all" })).toBeEnabled();
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
    expect(recordBulkFindingDisposition).toHaveBeenCalledWith(
      expect.objectContaining({
        findingIds: ["f1", "f2"],
        expectedCurrentDispositionRowVersionBase64ByFindingId: {
          f1: "AAA=",
          f2: "BBB=",
        },
      }),
      expect.any(Object),
    );
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
          expectedCurrentDispositionRowVersionBase64ByFindingId: {
            f1: "AAA=",
            f2: "BBB=",
          },
        }),
        expect.any(Object),
      );
    });

    expect(defaultDeferredRevisitDueUtc).toHaveBeenCalled();
  });

  it("shows the conflict panel when bulk disposition returns 409", async () => {
    recordBulkFindingDisposition.mockRejectedValue(
      new ApiRequestError("Conflict", {
        httpStatus: 409,
        correlationId: null,
        problem: {
          type: "conflict",
          title: "Conflict",
          status: 409,
          detail: "lost race",
          currentDisposition: {
            eventId: "evt-winner",
            findingId: "f1",
            disposition: "Remediated",
            reviewerUserId: "bob",
            occurredAtUtc: "2026-09-08T12:00:00.000Z",
            currentDispositionRowVersionBase64: "WIN=",
          },
        },
      }),
    );

    render(
      <GovernanceFindingsBulkActions
        selectedFindingIds={["f1", "f2"]}
        onApplied={vi.fn()}
        onDispositionSucceeded={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Shared reason"), {
      target: { value: "Reviewed with architecture board." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply disposition" }));

    expect(await screen.findByTestId("governance-bulk-disposition-conflict")).toBeInTheDocument();
    expect(screen.getByTestId("governance-bulk-disposition-conflict-message")).toHaveTextContent(
      "The batch was not applied.",
    );
  });
});

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SECURENOW_INVESTIGATION_EFFORT_NOTES } from "@/lib/product-line/securenow-investigation-effort-copy";
import {
  SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_DISCIPLINE,
  secureNowInvestigationEffortInputStorageKeyForScope,
} from "@/lib/product-line/securenow-investigation-effort-input-storage";
import {
  loadSecureNowInvestigationEffortInputs,
  persistSecureNowInvestigationEffortInputsToAudit,
} from "@/lib/product-line/securenow-investigation-effort-sync";
import { SecureNowInvestigationEffortPageView } from "./SecureNowInvestigationEffortPageView";

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-a",
    workspaceId: "workspace-b",
    projectId: "project-c",
    workspaceLabel: "Working",
    projectLabel: "Default",
  }),
}));

vi.mock("@/hooks/use-securenow-collection-setup-input", () => ({
  useSecureNowCollectionSetupInput: () => ({
    collectionInput: {
      hasConfiguredProvider: false,
      azureSubscriptionIdsPresent: false,
      hasSuccessfulPull: false,
    },
    isPending: false,
  }),
}));

vi.mock("@/lib/product-line/securenow-investigation-effort-sync", () => ({
  loadSecureNowInvestigationEffortInputs: vi.fn(async () => {
    const { readSecureNowInvestigationEffortInputs } = await import(
      "@/lib/product-line/securenow-investigation-effort-input-storage"
    );
    return readSecureNowInvestigationEffortInputs();
  }),
  persistSecureNowInvestigationEffortInputsToAudit: vi.fn(async () => null),
}));

describe("SecureNowInvestigationEffortPageView", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  it("renders the four ROI notes", () => {
    render(<SecureNowInvestigationEffortPageView />);

    expect(
      screen.getByTestId("securenow-investigation-effort-page"),
    ).toBeInTheDocument();
    expect(screen.getByText(/NO_GO/)).toBeInTheDocument();
    expect(screen.getByText(/This page is not a savings claim\./)).toBeInTheDocument();
    for (const note of SECURENOW_INVESTIGATION_EFFORT_NOTES) {
      expect(screen.getByRole("link", { name: note.label })).toHaveAttribute("href", note.href);
    }
    expect(
      screen.getByTestId("securenow-investigation-effort-page"),
    ).not.toHaveTextContent(/\$/);
    expect(screen.getByTestId("securenow-investigation-effort-input-storage-discipline")).toHaveTextContent(
      SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_DISCIPLINE,
    );
    expect(screen.getByTestId("securenow-investigation-effort-scope-missing")).toHaveTextContent(
      "No successful capture yet",
    );
    expect(screen.getByTestId("securenow-investigation-effort-synthetic-example")).toHaveTextContent(
      "Synthetic worksheet walkthrough",
    );
    expect(screen.getByTestId("securenow-investigation-effort-synthetic-example")).toHaveTextContent("1,350");
  });

  it("keeps incomplete and fixture inputs out of the ROI result", () => {
    render(<SecureNowInvestigationEffortPageView />);

    expect(screen.getByTestId("securenow-investigation-effort-result")).toHaveTextContent(
      "ROI not calculated.",
    );
    expect(screen.getByTestId("securenow-investigation-effort-result-reason")).toHaveTextContent(
      "Enter all five inputs with positive numbers.",
    );

    fireEvent.change(screen.getByLabelText("Baseline hours (B)"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("After-product hours (A)"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Annual investigations (N)"), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("Fully loaded hourly rate (R)"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Annual product and operating cost (C)"), { target: { value: "10000" } });

    expect(screen.getByTestId("securenow-investigation-effort-result")).toHaveTextContent(
      "Those values are the fixture worksheet.",
    );
  });

  it("restores persisted non-fixture inputs on mount", async () => {
    window.localStorage.setItem(
      secureNowInvestigationEffortInputStorageKeyForScope("tenant-a", "workspace-b"),
      JSON.stringify({
        baselineHours: "5",
        afterHours: "3",
        annualInvestigations: "10",
        hourlyRate: "80",
        annualCost: "5000",
      }),
    );

    render(<SecureNowInvestigationEffortPageView />);

    await waitFor(() => {
      expect(screen.getByLabelText("Baseline hours (B)")).toHaveValue(5);
    });
    expect(screen.getByTestId("securenow-investigation-effort-result")).toHaveTextContent(
      "Entered inputs. Not a customer result.",
    );
    expect(screen.getByTestId("securenow-investigation-effort-result")).toHaveTextContent(
      "Gross annual analyst capacity value: 1600",
    );
    expect(screen.getByTestId("securenow-investigation-effort-result")).toHaveTextContent(
      "Net annual value estimate: -3400",
    );
  });

  it("only records a new audit event after the operator edits restored inputs", async () => {
    const savedInputs = {
      baselineHours: "5",
      afterHours: "3",
      annualInvestigations: "10",
      hourlyRate: "80",
      annualCost: "5000",
    };
    vi.mocked(loadSecureNowInvestigationEffortInputs).mockResolvedValueOnce(savedInputs);
    const save = vi.mocked(persistSecureNowInvestigationEffortInputsToAudit);
    save.mockClear();
    vi.useFakeTimers();

    try {
      await act(async () => {
        render(<SecureNowInvestigationEffortPageView />);
      });
      const baseline = screen.getByLabelText("Baseline hours (B)");
      expect(baseline).toHaveValue(5);

      act(() => vi.advanceTimersByTime(400));
      expect(save).not.toHaveBeenCalled();

      save.mockResolvedValueOnce("Investigation effort input save failed.");
      fireEvent.change(baseline, { target: { value: "6" } });
      await act(async () => vi.advanceTimersByTime(400));
      expect(save).toHaveBeenCalledExactlyOnceWith({ ...savedInputs, baselineHours: "6" });
      expect(screen.getByText("Investigation effort input save failed.")).toBeInTheDocument();

      fireEvent.change(baseline, { target: { value: "7" } });
      await act(async () => vi.advanceTimersByTime(400));
      expect(screen.queryByText("Investigation effort input save failed.")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("restores untouched fields when an operator edit precedes the load", async () => {
    const savedInputs = {
      baselineHours: "5",
      afterHours: "3",
      annualInvestigations: "10",
      hourlyRate: "80",
      annualCost: "5000",
    };
    const restore = Promise.withResolvers<typeof savedInputs>();
    vi.mocked(loadSecureNowInvestigationEffortInputs).mockReturnValueOnce(restore.promise);
    render(<SecureNowInvestigationEffortPageView />);

    const baseline = screen.getByLabelText("Baseline hours (B)");
    const afterHours = screen.getByLabelText("After-product hours (A)");
    fireEvent.change(baseline, { target: { value: "6" } });
    fireEvent.change(afterHours, { target: { value: "2" } });
    fireEvent.change(afterHours, { target: { value: "" } });

    await act(async () => restore.resolve(savedInputs));

    expect(baseline).toHaveValue(6);
    expect(afterHours).toHaveValue(null);
    expect(screen.getByLabelText("Annual investigations (N)")).toHaveValue(10);
    const cacheKey = secureNowInvestigationEffortInputStorageKeyForScope("tenant-a", "workspace-b");
    expect(JSON.parse(window.localStorage.getItem(cacheKey) ?? "null")).toEqual({
      ...savedInputs,
      baselineHours: "6",
      afterHours: "",
    });
  });
});

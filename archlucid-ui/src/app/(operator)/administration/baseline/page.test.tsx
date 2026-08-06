import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isNextPublicDemoMode: () => false,
  };
});

import { showError, showSuccess } from "@/lib/toast";
import { BaselineSettingsClient } from "./BaselineSettingsClient";

const emptyBaseline = {
  manualPrepHoursPerReview: null,
  peoplePerReview: null,
  capturedUtc: null,
  baselineReviewCycleHours: null,
  baselineReviewCycleSource: null,
  baselineReviewCycleCapturedUtc: null,
};

function createFetchMock(
  overrides: {
    readonly get?: typeof emptyBaseline;
    readonly putResponse?: typeof emptyBaseline;
  } = {},
): ReturnType<typeof vi.fn> {
  const getPayload = overrides.get ?? emptyBaseline;
  const putPayload = overrides.putResponse ?? getPayload;

  return vi.fn(async (input: string | URL, init?: RequestInit) => {
    if (String(input).endsWith("/api/proxy/v1/tenant/baseline") && (!init || init.method === "GET" || !init.method)) {
      return new Response(JSON.stringify(getPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (String(input).endsWith("/api/proxy/v1/tenant/baseline") && init?.method === "PUT") {
      return new Response(JSON.stringify(putPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("BaselineSettingsPage", () => {
  beforeEach(() => {
    vi.mocked(showSuccess).mockClear();
    vi.mocked(showError).mockClear();
  });

  it("renders summary, recommended path, and form after load", async () => {
    vi.stubGlobal("fetch", createFetchMock());
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-settings-summary")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
    expect(screen.getByText("Conservative defaults")).toBeInTheDocument();
    expect(screen.getByText(/Value report, Executive dashboard, ROI summary/)).toBeInTheDocument();
    expect(screen.getByTestId("baseline-settings-recommended-path")).toBeInTheDocument();
    expect(screen.getByTestId("baseline-open-guided-wizard")).toHaveTextContent("Open guided baseline wizard");
    expect(screen.getByText(/Recommended if you are not sure what values to enter/i)).toBeInTheDocument();
    expect(screen.getByTestId("baseline-use-conservative-defaults")).toBeInTheDocument();
    expect(screen.getByText("Review cycle baseline")).toBeInTheDocument();
    expect(screen.getByTestId("baseline-settings-methodology")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View ROI methodology" })).toHaveAttribute("href", "/help/pilot-roi-model");

    vi.unstubAllGlobals();
  });

  it("submits valid values and shows complete save confirmation", async () => {
    const fetchMock = createFetchMock({
      putResponse: {
        ...emptyBaseline,
        manualPrepHoursPerReview: 2,
        peoplePerReview: 3,
        capturedUtc: "2026-01-01T00:00:00Z",
        baselineReviewCycleHours: 12,
        baselineReviewCycleCapturedUtc: "2026-01-01T00:00:00Z",
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-manual-prep")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("baseline-review-cycle-hours"), { target: { value: "12" } });
    fireEvent.change(screen.getByTestId("baseline-manual-prep"), { target: { value: "2" } });
    fireEvent.change(screen.getByTestId("baseline-people"), { target: { value: "3" } });
    fireEvent.click(screen.getByTestId("baseline-save"));

    await waitFor(() => {
      const puts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PUT");
      expect(puts.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Baseline settings saved.");
    });

    vi.unstubAllGlobals();
  });

  it("blocks save when hours are not positive", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-manual-prep")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("baseline-manual-prep"), { target: { value: "-1" } });

    expect(screen.getByRole("alert")).toHaveTextContent(/between 0 and 10,000/i);
    expect(screen.getByTestId("baseline-save")).toBeDisabled();

    fireEvent.click(screen.getByTestId("baseline-save"));

    const puts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PUT");
    expect(puts).toHaveLength(0);
    expect(showError).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("shows a warning for unusually high review-cycle hours without blocking save", async () => {
    const fetchMock = createFetchMock({
      putResponse: {
        ...emptyBaseline,
        baselineReviewCycleHours: 250,
        baselineReviewCycleCapturedUtc: "2026-01-01T00:00:00Z",
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-review-cycle-hours")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("baseline-review-cycle-hours"), { target: { value: "250" } });
    expect(screen.getByText(/unusually high/i)).toBeInTheDocument();
    expect(screen.getByTestId("baseline-save")).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("baseline-save"));

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Partial baseline saved. Missing values will use conservative defaults.");
    });

    vi.unstubAllGlobals();
  });

  it("clears workspace values when using conservative defaults", async () => {
    const fetchMock = createFetchMock({
      get: {
        ...emptyBaseline,
        manualPrepHoursPerReview: 4,
        peoplePerReview: 5,
        capturedUtc: "2026-01-01T00:00:00Z",
        baselineReviewCycleHours: 10,
        baselineReviewCycleCapturedUtc: "2026-01-01T00:00:00Z",
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-use-conservative-defaults")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("baseline-use-conservative-defaults"));

    await waitFor(() => {
      const puts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PUT");
      expect(puts.length).toBeGreaterThan(0);
      const body = JSON.parse(String((puts[0]?.[1] as RequestInit).body)) as Record<string, unknown>;
      expect(body.manualPrepHoursPerReview).toBeNull();
      expect(body.peoplePerReview).toBeNull();
      expect(body.baselineReviewCycleHours).toBeNull();
    });

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith("Using conservative defaults.");
    });

    vi.unstubAllGlobals();
  });
});

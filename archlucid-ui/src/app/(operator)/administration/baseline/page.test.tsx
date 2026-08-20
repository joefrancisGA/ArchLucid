import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
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
import { BASELINE_SETTINGS_PAGE_TITLE, BASELINE_REVIEW_NOTE_SAVE_READINESS } from "@/lib/baseline-settings-present";
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

  it("renders operator header chrome without breadcrumb trail", async () => {
    vi.stubGlobal("fetch", createFetchMock());
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-settings-page-title")).toHaveTextContent(BASELINE_SETTINGS_PAGE_TITLE);
    expect(screen.queryByTestId("baseline-settings-page-breadcrumb")).toBeNull();
    expect(screen.queryByTestId("baseline-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("renders summary, recommended path, and form after load", async () => {
    vi.stubGlobal("fetch", createFetchMock());
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-settings-summary")).toBeInTheDocument();
    expect(screen.getByTestId("baseline-settings-status-tag")).toHaveTextContent("Not set");
    expect(screen.getByText("Conservative defaults")).toBeInTheDocument();
    const summary = await screen.findByTestId("baseline-settings-summary");
    expect(within(summary).getByRole("link", { name: "Value report" })).toHaveAttribute(
      "href",
      "/insights/sponsor-report",
    );
    expect(within(summary).getByRole("link", { name: "Sponsor dashboard" })).toHaveAttribute(
      "href",
      "/architecture/sponsor-dashboard",
    );
    expect(within(summary).getByRole("link", { name: "ROI summary" })).toHaveAttribute("href", "/insights/roi-summary");
    expect(screen.getByTestId("baseline-settings-recommended-path")).toBeInTheDocument();
    expect(screen.getByTestId("baseline-open-guided-wizard")).toHaveTextContent("Open guided baseline wizard");
    expect(screen.getByText(/Recommended if you are not sure what values to enter/i)).toBeInTheDocument();
    expect(screen.getByTestId("baseline-use-conservative-defaults")).toBeInTheDocument();
    expect(screen.getByTestId("baseline-review-cycle-card")).toBeInTheDocument();
    expect(screen.getByTestId("baseline-settings-methodology")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View ROI methodology" })).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows partly modeled ROI label when only one baseline field is set", async () => {
    vi.stubGlobal(
      "fetch",
      createFetchMock({
        get: {
          ...emptyBaseline,
          manualPrepHoursPerReview: 4,
        },
      }),
    );
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-settings-summary")).toBeInTheDocument();
    expect(screen.getByText("Partly modeled")).toBeInTheDocument();
    expect(screen.queryByText("Workspace-specific baseline")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("disables estimate note without review-cycle hours and blocks silent drop on save", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    render(<BaselineSettingsClient />);

    const hoursField = await screen.findByTestId("baseline-review-cycle-hours");
    const noteField = screen.getByTestId("baseline-review-cycle-note");
    expect(noteField).toBeDisabled();
    expect(screen.getByTestId("baseline-review-note-requires-hours")).toBeInTheDocument();

    fireEvent.change(hoursField, { target: { value: "12" } });
    expect(noteField).not.toBeDisabled();
    fireEvent.change(noteField, { target: { value: "Workshop estimate" } });
    fireEvent.change(hoursField, { target: { value: "" } });

    expect(noteField).toBeDisabled();
    expect(screen.getByTestId("baseline-save")).toBeDisabled();
    expect(screen.getByTestId("baseline-save-disabled-hint")).toHaveTextContent(
      BASELINE_REVIEW_NOTE_SAVE_READINESS,
    );

    fireEvent.click(screen.getByTestId("baseline-save"));

    const puts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PUT");
    expect(puts).toHaveLength(0);

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

  it("blocks save when hours are not positive without validation toast (TB-2009)", async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal("fetch", fetchMock);
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-manual-prep")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("baseline-manual-prep"), { target: { value: "-1" } });

    expect(screen.getByRole("alert")).toHaveTextContent(/between 0 and 10,000/i);
    expect(screen.getByTestId("baseline-save")).toBeDisabled();
    expect(screen.getByTestId("baseline-save-disabled-hint")).toHaveTextContent(/between 0 and 10,000/i);

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

  it("does not offer to remove a saved baseline the API cannot clear", async () => {
    const fetchMock = createFetchMock({
      get: {
        ...emptyBaseline,
        manualPrepHoursPerReview: 4,
        peoplePerReview: 5,
        capturedUtc: "2026-01-01T00:00:00Z",
        baselineReviewCycleHours: 10,
        baselineReviewCycleSource: "baseline_settings:Workshop estimate",
        baselineReviewCycleCapturedUtc: "2026-01-01T00:00:00Z",
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<BaselineSettingsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("baseline-use-conservative-defaults")).toBeDisabled();
    });

    expect(screen.getByTestId("baseline-modeled-defaults-helper")).toHaveTextContent(
      /Removing a saved baseline is not available in this release/i,
    );

    fireEvent.click(screen.getByTestId("baseline-use-conservative-defaults"));

    const puts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PUT");
    expect(puts).toHaveLength(0);
    expect(screen.getByTestId("baseline-manual-prep")).toHaveValue(4);

    vi.unstubAllGlobals();
  });

  it("blanks the form for modeled defaults without writing to the API", async () => {
    const fetchMock = createFetchMock({ get: emptyBaseline });
    vi.stubGlobal("fetch", fetchMock);
    render(<BaselineSettingsClient />);

    expect(await screen.findByTestId("baseline-use-conservative-defaults")).not.toBeDisabled();
    fireEvent.change(screen.getByTestId("baseline-review-cycle-hours"), { target: { value: "12" } });
    fireEvent.change(screen.getByTestId("baseline-manual-prep"), { target: { value: "2" } });

    fireEvent.click(screen.getByTestId("baseline-use-conservative-defaults"));

    expect(screen.getByTestId("baseline-review-cycle-hours")).toHaveValue(null);
    expect(screen.getByTestId("baseline-manual-prep")).toHaveValue(null);

    const puts = fetchMock.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PUT");
    expect(puts).toHaveLength(0);
    expect(showSuccess).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

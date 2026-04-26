import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/core-pilot-checklist-storage", () => ({
  CORE_PILOT_CHECKLIST_CHANGED_EVENT: "archlucid-core-pilot-checklist-changed",
  readCorePilotChecklistAllDone: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    listRunsByProjectPaged: vi.fn(),
  };
});

import { listRunsByProjectPaged } from "@/lib/api";
import { readCorePilotChecklistAllDone } from "@/lib/core-pilot-checklist-storage";

import { CommandCenterSection } from "./CommandCenterSection";

import type { RunSummary } from "@/types/authority";

const readDone = vi.mocked(readCorePilotChecklistAllDone);
const listRuns = vi.mocked(listRunsByProjectPaged);

const originalFetch = globalThis.fetch;

function stubFetchForCommandCenter() {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes("/api/proxy/v1/pilots/runs/recent-deltas")) {
      return new Response(
        JSON.stringify({
          items: [],
          requestedCount: 5,
          returnedCount: 0,
          medianTotalFindings: null,
          medianTimeToCommittedManifestTotalSeconds: null,
        }),
        { status: 200 },
      );
    }

    if (url.includes("/api/proxy/health/ready")) {
      return new Response(JSON.stringify({ status: "Healthy", entries: [] }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

describe("CommandCenterSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readDone.mockReturnValue(false);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders nothing when the Core Pilot checklist is incomplete", () => {
    render(<CommandCenterSection />);
    expect(screen.queryByRole("heading", { name: /^command center$/i })).toBeNull();
  });

  it("renders cards when the checklist is complete", async () => {
    readDone.mockReturnValue(true);
    listRuns.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForCommandCenter();

    render(<CommandCenterSection />);

    expect(screen.getByRole("heading", { name: /^command center$/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("command-center-runs-card")).toBeInTheDocument();
    });
    expect(screen.getByTestId("command-center-activity-card")).toBeInTheDocument();
    expect(screen.getByTestId("command-center-health-card")).toBeInTheDocument();
  });

  it("handles runs list API errors inside the runs card", async () => {
    readDone.mockReturnValue(true);
    listRuns.mockRejectedValue(new Error("runs unavailable"));
    stubFetchForCommandCenter();

    render(<CommandCenterSection />);

    await waitFor(() => {
      expect(screen.getByText(/runs unavailable/i)).toBeInTheDocument();
    });
  });

  it("shows pipeline StatusPill for runs needing attention", async () => {
    readDone.mockReturnValue(true);
    const run: RunSummary = {
      runId: "00000000-0000-0000-0000-000000000099",
      projectId: "default",
      description: "Demo",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
    };
    listRuns.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForCommandCenter();

    render(<CommandCenterSection />);

    expect(await screen.findByLabelText(/Run pipeline status: Ready for commit/i)).toBeInTheDocument();
  });
});

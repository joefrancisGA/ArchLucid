import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    listRunsByProjectPaged: vi.fn(),
  };
});

import { listRunsByProjectPaged } from "@/lib/api";

import { OperationalMetricsGate } from "./OperationalMetricsGate";

const listRuns = vi.mocked(listRunsByProjectPaged);

describe("OperationalMetricsGate", () => {
  it("renders nothing while loading", () => {
    listRuns.mockImplementation(() => new Promise(() => {}));

    render(
      <OperationalMetricsGate>
        <div data-testid="gated-child">Child</div>
      </OperationalMetricsGate>,
    );

    expect(screen.queryByTestId("gated-child")).not.toBeInTheDocument();
  });

  it("hides children when the workspace has zero runs", async () => {
    listRuns.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 1,
      hasMore: false,
    });

    render(
      <OperationalMetricsGate>
        <div data-testid="gated-child">Child</div>
      </OperationalMetricsGate>,
    );

    await waitFor(() => {
      expect(listRuns).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("gated-child")).not.toBeInTheDocument();
  });

  it("shows children when at least one run exists", async () => {
    listRuns.mockResolvedValue({
      items: [
        {
          runId: "00000000-0000-0000-0000-000000000001",
          projectId: "default",
          description: "Test",
          createdUtc: "2026-01-15T12:00:00.000Z",
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 1,
      hasMore: false,
    });

    render(
      <OperationalMetricsGate>
        <div data-testid="gated-child">Child</div>
      </OperationalMetricsGate>,
    );

    expect(await screen.findByTestId("gated-child")).toBeInTheDocument();
  });
});

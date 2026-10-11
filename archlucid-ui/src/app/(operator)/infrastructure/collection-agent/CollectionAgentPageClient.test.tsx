import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CollectionAgentPageClient } from "@/app/(operator)/infrastructure/collection-agent/CollectionAgentPageClient";

describe("CollectionAgentPageClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a failed run and expands its error summary", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              runId: "run-failed",
              agentVersion: "1.0.0",
              scheduleDescription: "Daily at 02:00 UTC",
              startedUtc: "2026-10-11T01:00:00Z",
              finishedUtc: "2026-10-11T01:05:00Z",
              status: "Failed",
              subscriptionsCoveredJson: "[\"sub-1\"]",
              errorSummary: "Resource Graph throttled the subscription.",
              importedSnapshotId: null,
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(<CollectionAgentPageClient />);

    expect(await screen.findByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("Daily at 02:00 UTC")).toBeInTheDocument();
    expect(screen.getByText("Resource Graph throttled the subscription.")).toBeInTheDocument();
    expect(screen.getByText("1 covered")).toBeInTheDocument();
  });

  it("disables Run now while a run is pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              runId: "run-running",
              agentVersion: "1.0.0",
              scheduleDescription: null,
              startedUtc: "2026-10-11T19:00:00Z",
              finishedUtc: null,
              status: "Running",
              subscriptionsCoveredJson: "[]",
              errorSummary: null,
              importedSnapshotId: null,
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(<CollectionAgentPageClient />);

    await waitFor(() => expect(screen.getByTestId("collection-agent-run-now")).toBeDisabled());
    expect(screen.getByText("Run pending")).toBeInTheDocument();
  });

  it("shows the API reason instead of an empty state when loading fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Collection storage is unavailable." }), {
          status: 503,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    render(<CollectionAgentPageClient />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Collection storage is unavailable.");
    expect(screen.queryByText("No collection runs yet.")).not.toBeInTheDocument();
  });
});

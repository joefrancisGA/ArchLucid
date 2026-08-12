import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_BODY,
  RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_HEADING,
} from "@/lib/runs/run-detail-first-screen-proof-status";

import { RunDetailFirstScreenProofStatusClient } from "./RunDetailFirstScreenProofStatusClient";

describe("RunDetailFirstScreenProofStatusClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows retry instead of vanishing when proof status fails to load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 503 })),
    );

    render(<RunDetailFirstScreenProofStatusClient runId="run-1" />);

    expect(await screen.findByTestId("run-detail-first-screen-proof-status-load-failed")).toBeInTheDocument();
    expect(screen.getByText(RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_BODY)).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Activity tab" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1?reviewTab=activity",
    );
    expect(screen.queryByTestId("run-detail-first-screen-proof-status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("run-detail-first-screen-proof-status-retry"));

    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});

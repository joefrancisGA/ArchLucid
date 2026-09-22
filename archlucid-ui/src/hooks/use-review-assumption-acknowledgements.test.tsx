import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReviewAssumptionAcknowledgements } from "@/hooks/use-review-assumption-acknowledgements";
import {
  getReviewAssumptionAcknowledgement,
  putReviewAssumptionAcknowledgement,
} from "@/lib/api/review-assumption-acknowledgement-api";
import { readAcknowledgedAssumptionIds } from "@/lib/review-quality/review-assumption-ack-store";

vi.mock("@/lib/api/review-assumption-acknowledgement-api", () => ({
  getReviewAssumptionAcknowledgement: vi.fn(),
  putReviewAssumptionAcknowledgement: vi.fn(),
}));

const RUN_ID = "0b0f7d2e-5b3d-4c8a-9d2f-1a2b3c4d5e6f";

let latest: ReturnType<typeof useReviewAssumptionAcknowledgements> | null = null;

function Probe(props: { readonly runId: string }) {
  latest = useReviewAssumptionAcknowledgements(props.runId);

  return null;
}

describe("useReviewAssumptionAcknowledgements", () => {
  beforeEach(() => {
    latest = null;
    window.localStorage.clear();
    vi.mocked(getReviewAssumptionAcknowledgement).mockReset();
    vi.mocked(putReviewAssumptionAcknowledgement).mockReset();
    vi.mocked(putReviewAssumptionAcknowledgement).mockResolvedValue({
      evaluationVersion: "assumption-acknowledgement-v1",
      acknowledgedUtc: "2026-09-11T00:00:00Z",
      actorUserId: "user-1",
      acknowledgedAssumptionIds: [],
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("hydrates server acknowledgements into state and the local cache", async () => {
    vi.mocked(getReviewAssumptionAcknowledgement).mockResolvedValue({
      evaluationVersion: "assumption-acknowledgement-v1",
      acknowledgedUtc: "2026-09-11T00:00:00Z",
      actorUserId: "user-1",
      acknowledgedAssumptionIds: ["server-ack"],
    });

    render(<Probe runId={RUN_ID} />);

    await waitFor(() => {
      expect(latest?.acknowledgedIds.has("server-ack")).toBe(true);
    });
    expect(readAcknowledgedAssumptionIds(RUN_ID).has("server-ack")).toBe(true);
  });

  it("pushes the updated set to the server when an assumption is acknowledged", async () => {
    vi.mocked(getReviewAssumptionAcknowledgement).mockResolvedValue({
      evaluationVersion: "assumption-acknowledgement-v1",
      acknowledgedUtc: "2026-09-11T00:00:00Z",
      actorUserId: "user-1",
      acknowledgedAssumptionIds: [],
    });

    render(<Probe runId={RUN_ID} />);

    await waitFor(() => {
      expect(getReviewAssumptionAcknowledgement).toHaveBeenCalledWith(RUN_ID);
    });

    act(() => {
      latest?.setAssumptionAcknowledged("assumption-a", true);
    });

    expect(latest?.acknowledgedIds.has("assumption-a")).toBe(true);
    expect(putReviewAssumptionAcknowledgement).toHaveBeenCalledWith(RUN_ID, new Set(["assumption-a"]));
  });

  it("stays localStorage-only for non-guid run ids", async () => {
    render(<Probe runId="run-1" />);

    act(() => {
      latest?.setAssumptionAcknowledged("assumption-a", true);
    });

    expect(latest?.acknowledgedIds.has("assumption-a")).toBe(true);
    expect(getReviewAssumptionAcknowledgement).not.toHaveBeenCalled();
    expect(putReviewAssumptionAcknowledgement).not.toHaveBeenCalled();
  });
});

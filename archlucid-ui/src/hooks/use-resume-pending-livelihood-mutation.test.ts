import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY,
  writeLivelihoodPendingMutation,
} from "@/lib/auth/livelihood-mutation-401-resume";

const replayLivelihoodPendingMutation = vi.fn();

vi.mock("@/lib/auth/livelihood-mutation-401-resume-replay", () => ({
  replayLivelihoodPendingMutation: (...args: unknown[]) => replayLivelihoodPendingMutation(...args),
}));

const notifyLivelihoodMutationReplayed = vi.fn();

vi.mock("@/lib/auth/livelihood-mutation-replay-notify", () => ({
  notifyLivelihoodMutationReplayed: (...args: unknown[]) => notifyLivelihoodMutationReplayed(...args),
}));

const usePathname = vi.fn();
const useSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));

import { useResumePendingLivelihoodMutation } from "@/hooks/use-resume-pending-livelihood-mutation";

describe("useResumePendingLivelihoodMutation (LW-052)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    replayLivelihoodPendingMutation.mockReset();
    notifyLivelihoodMutationReplayed.mockReset();
    usePathname.mockReturnValue("/architecture/reviews/run-1/findings/f-1");
    useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("replays when a sibling tab writes pending mutation to localStorage", async () => {
    replayLivelihoodPendingMutation.mockResolvedValue({ eventId: "evt-1" });

    renderHook(() =>
      useResumePendingLivelihoodMutation({
        enabled: true,
      }),
    );

    writeLivelihoodPendingMutation({
      kind: "finding_disposition",
      idempotencyKey: "55555555-5555-4555-8555-555555555555",
      returnPath: "/architecture/reviews/run-1/findings/f-1",
      savedAtUtc: "2026-09-10T12:00:00.000Z",
      requestLeftClient: true,
      payload: {
        findingId: "f-1",
        body: {
          disposition: "Accepted",
          runId: "run-1",
        },
      },
    });

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY,
        newValue: localStorage.getItem(LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY),
      }),
    );

    await waitFor(() => {
      expect(replayLivelihoodPendingMutation).toHaveBeenCalledTimes(1);
    });
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

const listFindingDispositions = vi.fn();
const recordFindingDisposition = vi.fn();
const refresh = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => new URLSearchParams("kbDispFindingId=finding-1&kbDispAction=accepted"),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  listFindingDispositions: (...args: unknown[]) => listFindingDispositions(...args),
  recordFindingDisposition: (...args: unknown[]) => recordFindingDisposition(...args),
}));

import { FindingKeyboardTriageHost } from "@/components/governance/findings/FindingKeyboardTriageHost";

describe("FindingKeyboardTriageHost pointer CAS (FP-10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listFindingDispositions.mockResolvedValue([
      {
        eventId: "evt-current",
        findingId: "finding-1",
        disposition: "Deferred",
        reviewerUserId: "alice",
        occurredAtUtc: "2026-09-08T10:00:00.000Z",
        currentDispositionRowVersionBase64: "AAA=",
      },
    ]);
    recordFindingDisposition.mockResolvedValue({
      eventId: "evt-applied",
      findingId: "finding-1",
      disposition: "Accepted",
      reviewerUserId: "alice",
      occurredAtUtc: "2026-09-08T11:00:00.000Z",
      currentDispositionRowVersionBase64: "BBB=",
    });
  });

  it("sends the pre-apply token on apply and the post-apply token on undo", async () => {
    render(<FindingKeyboardTriageHost resolveRunId={() => "run-1"} />);

    fireEvent.change(await screen.findByTestId("finding-keyboard-disposition-reason"), {
      target: { value: "Accept residual latency for the pilot window." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply disposition" }));

    await waitFor(() => {
      expect(recordFindingDisposition).toHaveBeenCalledWith(
        "finding-1",
        expect.objectContaining({
          disposition: "Accepted",
          expectedCurrentDispositionRowVersionBase64: "AAA=",
        }),
        expect.any(Object),
      );
    });

    fireEvent.click(screen.getByTestId("finding-keyboard-disposition-success-callout-undo"));

    await waitFor(() => {
      expect(recordFindingDisposition).toHaveBeenCalledWith(
        "finding-1",
        expect.objectContaining({
          disposition: "Deferred",
          expectedCurrentDispositionRowVersionBase64: "BBB=",
        }),
        expect.any(Object),
      );
    });
  });
});

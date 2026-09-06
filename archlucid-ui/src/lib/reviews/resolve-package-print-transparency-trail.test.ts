import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolvePackagePrintTransparencyTrail } from "@/lib/reviews/resolve-package-print-transparency-trail";
import type { RunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";

const getDraftRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
}));

function bundle(overrides: Partial<RunDetailCriticalPageBundle> = {}): RunDetailCriticalPageBundle {
  return {
    buyerSummary: {
      run: {
        runId: "11111111-1111-1111-1111-111111111111",
        projectId: "22222222-2222-2222-2222-222222222222",
        createdUtc: "2026-08-01T12:00:00Z",
        architectureRequestId: "draft-1",
      },
    },
    progressSummary: null,
    manifestSummary: null,
    artifacts: [],
    ...overrides,
  };
}

describe("resolvePackagePrintTransparencyTrail (PC-09 optional)", () => {
  beforeEach(() => {
    getDraftRequest.mockReset();
  });

  it("prefers manifest trail when presenter answers exist", async () => {
    const manifestTrail = {
      asserted: [{ key: "answer.latency", value: "Yes" }],
      inferred: [],
      skipped: [],
    };

    const trail = await resolvePackagePrintTransparencyTrail(
      bundle({
        manifestSummary: {
          manifestId: "manifest-1",
          status: "Committed",
          feasibilityVerdict: {
            kind: "Feasible",
            summary: "ok",
            transparencyTrail: manifestTrail,
          },
        } as RunDetailCriticalPageBundle["manifestSummary"],
      }),
    );

    expect(trail).toEqual(manifestTrail);
    expect(getDraftRequest).not.toHaveBeenCalled();
  });

  it("falls back to draft trail when manifest has no presenter answers", async () => {
    const draftTrail = {
      asserted: [{ key: "answer.encryption", value: "No", responderLabel: "Room" }],
      inferred: [],
      skipped: [],
    };

    getDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      document: { transparencyTrail: draftTrail, freeTextIntent: "x", actorSet: { actors: [] } },
    });

    const trail = await resolvePackagePrintTransparencyTrail(bundle());

    expect(getDraftRequest).toHaveBeenCalledWith("draft-1");
    expect(trail).toEqual(draftTrail);
  });

  it("returns manifest trail when draft fetch fails", async () => {
    const manifestTrail = {
      asserted: [{ key: "businessOutcome", value: "Reduce cost" }],
      inferred: [],
      skipped: [],
    };

    getDraftRequest.mockRejectedValue(new Error("not found"));

    const trail = await resolvePackagePrintTransparencyTrail(
      bundle({
        manifestSummary: {
          manifestId: "manifest-1",
          status: "Committed",
          feasibilityVerdict: {
            kind: "Feasible",
            summary: "ok",
            transparencyTrail: manifestTrail,
          },
        } as RunDetailCriticalPageBundle["manifestSummary"],
      }),
    );

    expect(trail).toEqual(manifestTrail);
  });
});

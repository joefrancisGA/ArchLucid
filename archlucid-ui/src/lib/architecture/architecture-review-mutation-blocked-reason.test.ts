import { describe, expect, it } from "vitest";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  architectureDraftAutosavePatchBlockedReason,
  architectureDraftCreateMutationBlockedReason,
} from "@/lib/architecture/architecture-draft-blocked-reason";
import { reviewFinalizeMutationBlockedReason } from "@/lib/runs/review-finalize-mutation-blocked-reason";
import { packagePrintMeetingCaptureBlockedReason } from "@/lib/reviews/package-print-meeting-capture-blocked-reason";

function sealedManifestConflict(detail: string): ApiLoadFailureState {
  return {
    message: "Conflict",
    problem: {
      title: "Conflict",
      status: 409,
      detail,
    },
    correlationId: "corr-sealed-409",
    httpStatus: 409,
    retryAfterSeconds: null,
  };
}

describe("architecture review mutation blockedReason helpers", () => {
  it("returns null for non-409 failures", () => {
    const failure: ApiLoadFailureState = {
      message: "Not found",
      problem: null,
      correlationId: null,
      httpStatus: 404,
      retryAfterSeconds: null,
    };

    expect(architectureDraftAutosavePatchBlockedReason(failure)).toBeNull();
    expect(architectureDraftCreateMutationBlockedReason(failure)).toBeNull();
    expect(reviewFinalizeMutationBlockedReason(failure)).toBeNull();
    expect(packagePrintMeetingCaptureBlockedReason(failure)).toBeNull();
  });

  it("surfaces sealed-manifest problem detail for draft autosave PATCH 409", () => {
    const failure = sealedManifestConflict(
      "Draft 'draft-001' sealed manifest hash verification failed before autosave.",
    );

    expect(architectureDraftAutosavePatchBlockedReason(failure)).toBe(
      "Draft 'draft-001' sealed manifest hash verification failed before autosave.",
    );
  });

  it("surfaces sealed-manifest problem detail for draft create POST 409", () => {
    const failure = sealedManifestConflict(
      "Draft intake blocked: authority lifecycle must be Drafting before create.",
    );

    expect(architectureDraftCreateMutationBlockedReason(failure)).toBe(
      "Draft intake blocked: authority lifecycle must be Drafting before create.",
    );
  });

  it("surfaces sealed-manifest problem detail for finalize commit POST 409", () => {
    const failure = sealedManifestConflict(
      "Run 'run-abc' authority lifecycle must be Complete before finalize.",
    );

    expect(reviewFinalizeMutationBlockedReason(failure)).toBe(
      "Run 'run-abc' authority lifecycle must be Complete before finalize.",
    );
  });

  it("surfaces sealed-manifest problem detail for package print meeting-capture 409", () => {
    const failure = sealedManifestConflict(
      "Meeting capture blocked: sealed manifest hash verification failed.",
    );

    expect(packagePrintMeetingCaptureBlockedReason(failure)).toBe(
      "Meeting capture blocked: sealed manifest hash verification failed.",
    );
  });
});

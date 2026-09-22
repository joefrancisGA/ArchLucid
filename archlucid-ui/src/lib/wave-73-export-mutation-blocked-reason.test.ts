import { describe, expect, it } from "vitest";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { consultingDocxMutationBlockedReason } from "@/lib/compare/consulting-docx-mutation-blocked-reason";
import { architecturePackageDocxMutationBlockedReason } from "@/lib/runs/architecture-package-docx-mutation-blocked-reason";
import { runPackageExportMutationBlockedReason } from "@/lib/runs/run-package-export-mutation-blocked-reason";
import { runSummaryExportMutationBlockedReason } from "@/lib/runs/run-summary-export-mutation-blocked-reason";
import { pilotsCollateralMutationBlockedReason } from "@/lib/pilots/pilots-collateral-mutation-blocked-reason";
import { sponsorRoiBoardPackMutationBlockedReason } from "@/lib/pilots/sponsor-roi-board-pack-mutation-blocked-reason";

function sealedManifestConflict(detail: string): ApiLoadFailureState {
  return {
    message: "Conflict",
    problem: {
      title: "Conflict",
      status: 409,
      detail,
    },
    correlationId: "corr-wave73-export-409",
    httpStatus: 409,
    retryAfterSeconds: null,
  };
}

describe("wave-73 export mutation blockedReason helpers (868–872)", () => {
  it("returns null for non-409 failures", () => {
    const failure: ApiLoadFailureState = {
      message: "Not found",
      problem: null,
      correlationId: null,
      httpStatus: 404,
      retryAfterSeconds: null,
    };

    expect(pilotsCollateralMutationBlockedReason(failure)).toBeNull();
    expect(sponsorRoiBoardPackMutationBlockedReason(failure)).toBeNull();
    expect(consultingDocxMutationBlockedReason(failure)).toBeNull();
    expect(runSummaryExportMutationBlockedReason(failure)).toBeNull();
    expect(runPackageExportMutationBlockedReason(failure)).toBeNull();
    expect(architecturePackageDocxMutationBlockedReason(failure)).toBeNull();
  });

  it("surfaces sealed-manifest problem detail for pilot collateral GET 409 (868)", () => {
    const failure = sealedManifestConflict(
      "Pilot collateral blocked: sealed manifest hash verification failed.",
    );

    expect(pilotsCollateralMutationBlockedReason(failure)).toBe(
      "Pilot collateral blocked: sealed manifest hash verification failed.",
    );
  });

  it("surfaces sealed-manifest problem detail for sponsor ROI board-pack GET 409 (869)", () => {
    const failure = sealedManifestConflict(
      "Sponsor ROI board pack blocked: authority lifecycle must be Complete.",
    );

    expect(sponsorRoiBoardPackMutationBlockedReason(failure)).toBe(
      "Sponsor ROI board pack blocked: authority lifecycle must be Complete.",
    );
  });

  it("surfaces sealed-manifest problem detail for consulting DOCX POST 409 (870)", () => {
    const failure = sealedManifestConflict(
      "Consulting DOCX export blocked: sealed manifest hash verification failed.",
    );

    expect(consultingDocxMutationBlockedReason(failure)).toBe(
      "Consulting DOCX export blocked: sealed manifest hash verification failed.",
    );
  });

  it("surfaces sealed-manifest problem detail for run summary and package export GET 409 (871)", () => {
    const summaryFailure = sealedManifestConflict(
      "Run summary export blocked: authority lifecycle must be Complete.",
    );
    const packageFailure = sealedManifestConflict(
      "Run package export blocked: sealed manifest hash verification failed.",
    );

    expect(runSummaryExportMutationBlockedReason(summaryFailure)).toBe(
      "Run summary export blocked: authority lifecycle must be Complete.",
    );
    expect(runPackageExportMutationBlockedReason(packageFailure)).toBe(
      "Run package export blocked: sealed manifest hash verification failed.",
    );
  });

  it("surfaces sealed-manifest problem detail for architecture package DOCX GET 409 (872)", () => {
    const failure = sealedManifestConflict(
      "Architecture package DOCX blocked: sealed manifest hash verification failed.",
    );

    expect(architecturePackageDocxMutationBlockedReason(failure)).toBe(
      "Architecture package DOCX blocked: sealed manifest hash verification failed.",
    );
  });
});

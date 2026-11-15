import { describe, expect, it } from "vitest";

import { formatSecureNowPilotDispositionTenantAuditRecordedLine } from "@/lib/product-line/securenow-pilot-disposition-tenant-audit-copy";
import {
  formatSecureNowInvestigationEffortMissingFieldsReason,
  listSecureNowInvestigationEffortMissingFieldLabels,
} from "@/lib/product-line/securenow-investigation-effort-missing-fields";
import { resolveSecureNowInvestigationEffortResultState } from "@/lib/product-line/securenow-investigation-effort-result-state";
import { SECURENOW_POLICY_PACKS_HUB_RANK_HONESTY_LINE } from "@/lib/product-line/securenow-policy-packs-hub-rank-honesty-copy";
import { SECURENOW_EXTRACT_UPLOAD_BASELINE_LOAD_FAILED } from "@/lib/product-line/securenow-extract-upload-baseline-failure-copy";
import { findReportProblemSurfaceById } from "@/lib/report-problem-surfaces";

describe("score-lift round44 batch honesty", () => {
  it("sponsor tenant audit recordedUtc line", () => {
    expect(formatSecureNowPilotDispositionTenantAuditRecordedLine("2026-11-14T12:00:00.000Z")).toContain(
      "Tenant audit recorded",
    );
  });

  it("investigation effort lists missing field labels", () => {
    const missing = listSecureNowInvestigationEffortMissingFieldLabels({
      baselineHours: "1",
      afterHours: "",
      annualInvestigations: "1",
      hourlyRate: "1",
      annualCost: "1",
    });

    expect(missing).toEqual(["After-product hours (A)"]);
    expect(resolveSecureNowInvestigationEffortResultState({
      baselineHours: "1",
      afterHours: "",
      annualInvestigations: "1",
      hourlyRate: "1",
      annualCost: "1",
    }).reason).toBe(formatSecureNowInvestigationEffortMissingFieldsReason(missing));
  });

  it("policy hub rank and extract-upload copy", () => {
    expect(SECURENOW_POLICY_PACKS_HUB_RANK_HONESTY_LINE).toContain("path rank");
    expect(SECURENOW_EXTRACT_UPLOAD_BASELINE_LOAD_FAILED).toContain("baseline");
    expect(findReportProblemSurfaceById("compliance-infrastructure-extract-upload-hard-failure")).toBeDefined();
  });
});
import { describe, expect, it } from "vitest";

import {
  resolveFindingInspectExportClassification,
  resolveFindingInspectExportTreatment,
} from "@/lib/findings/finding-inspect-export-classification";
import {
  FINDING_CLASSIFICATION_CHECKLIST_COVERAGE,
  FINDING_CLASSIFICATION_DECISION_GRADE,
} from "@/lib/findings/review-detail-findings-classification-band";
import type { FindingInspectPayload } from "@/types/finding-inspect";

describe("finding-inspect-export-classification", () => {
  it("prefers API classification over typedPayload", () => {
    const payload = {
      classification: "DecisionGradeFinding",
      typedPayload: { classification: "ChecklistCoverage" },
    } as FindingInspectPayload;

    expect(resolveFindingInspectExportClassification(payload)).toBe(FINDING_CLASSIFICATION_DECISION_GRADE);
  });

  it("falls back to typedPayload classification when API field is absent", () => {
    const payload = {
      typedPayload: { classification: "ChecklistCoverage" },
    } as FindingInspectPayload;

    expect(resolveFindingInspectExportClassification(payload)).toBe(FINDING_CLASSIFICATION_CHECKLIST_COVERAGE);
  });

  it("prefers API treatment over typedPayload", () => {
    const payload = {
      treatment: 1,
      typedPayload: { treatment: 0 },
    } as FindingInspectPayload;

    expect(resolveFindingInspectExportTreatment(payload)).toBe(1);
  });
});

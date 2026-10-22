import { describe, expect, it } from "vitest";

import type { PillarFindingAggregate } from "@/lib/api/governance-stickiness-api";
import {
  pillarExaminationStatusLabel,
  pillarExaminationStatusTagKind,
  pillarFindingCount,
} from "@/lib/governance/posture-presentation";

describe("posture-presentation", () => {
  it("maps examination states to status tag kinds", () => {
    expect(pillarExaminationStatusTagKind("Examined")).toBe("ready");
    expect(pillarExaminationStatusTagKind("PartiallyExamined")).toBe("needs-attention");
    expect(pillarExaminationStatusTagKind("NotExamined")).toBe("needs-attention");
    expect(pillarExaminationStatusTagKind("Unavailable")).toBe("blocked");
  });

  it("maps examination states to readable labels", () => {
    expect(pillarExaminationStatusLabel("PartiallyExamined")).toBe("Partially examined");
    expect(pillarExaminationStatusLabel("NotExamined")).toBe("Not examined");
  });

  it("sums severity buckets for pillar finding count", () => {
    const counts: PillarFindingAggregate = {
      pillarKey: "Security",
      criticalCount: 1,
      errorCount: 2,
      warningCount: 3,
      infoCount: 4,
      dispositionedCount: 5,
      mutedCount: 0,
    };

    expect(pillarFindingCount(counts)).toBe(10);
  });
});

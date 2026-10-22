import { describe, expect, it } from "vitest";

import {
  ARCHITECT_RESTATEMENT_NOT_TRAIL_BACKED_HONESTY_LABEL,
  ARCHITECT_RESTATEMENT_TRAIL_BACKED_HONESTY_LABEL,
  resolveArchitectRestatementExportHonestyLabel,
} from "@/lib/findings/finding-architect-restatement-export-honesty";

describe("finding-architect-restatement-export-honesty (LP-15)", () => {
  it("labels trail-backed restatements as disposition audit trail wording", () => {
    expect(resolveArchitectRestatementExportHonestyLabel({ isTrailBacked: true })).toBe(
      ARCHITECT_RESTATEMENT_TRAIL_BACKED_HONESTY_LABEL,
    );
  });

  it("labels non-trail restatements as operator wording without sealed engine prose", () => {
    expect(resolveArchitectRestatementExportHonestyLabel({ isTrailBacked: false })).toBe(
      ARCHITECT_RESTATEMENT_NOT_TRAIL_BACKED_HONESTY_LABEL,
    );
  });
});

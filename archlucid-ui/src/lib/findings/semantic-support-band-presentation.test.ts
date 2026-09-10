import { describe, expect, it } from "vitest";

import {
  normalizeFindingSemanticSupportBand,
  resolveDecisionGradeSemanticSupportBand,
  semanticSupportBandShortReason,
  semanticSupportBandStatusTagKind,
} from "@/lib/findings/semantic-support-band-presentation";

describe("semantic support band presentation (AS-061)", () => {
  it("normalizes wire enum strings", () => {
    expect(normalizeFindingSemanticSupportBand("Supported")).toBe("Supported");
    expect(normalizeFindingSemanticSupportBand("NotScored")).toBe("NotScored");
    expect(normalizeFindingSemanticSupportBand("invalid")).toBeNull();
  });

  it("defaults decision-grade rows without wire band to NotScored", () => {
    expect(resolveDecisionGradeSemanticSupportBand(null)).toBe("NotScored");
    expect(resolveDecisionGradeSemanticSupportBand(undefined)).toBe("NotScored");
  });

  it("maps bands to non-ready StatusTag kinds", () => {
    expect(semanticSupportBandStatusTagKind("Supported")).toBe("neutral");
    expect(semanticSupportBandStatusTagKind("Unchecked")).toBe("needs-attention");
    expect(semanticSupportBandStatusTagKind("Unsupported")).toBe("blocked");
    expect(semanticSupportBandStatusTagKind("NotScored")).toBe("neutral");
  });

  it("documents short reasons for heuristic overlap, async lag, and not scored", () => {
    expect(semanticSupportBandShortReason("Supported")).toMatch(/heuristic/i);
    expect(semanticSupportBandShortReason("Unchecked")).toMatch(/async|partial/i);
    expect(semanticSupportBandShortReason("NotScored")).toMatch(/not scored|exempt/i);
  });
});

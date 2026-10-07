import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { findingSemanticSupportBandFromTypedPayload } from "@/lib/findings/finding-semantic-support-band-from-typed-payload";

describe("findingSemanticSupportBandFromTypedPayload", () => {
  it("keeps checklist coverage bands nullable when the wire omits a score", () => {
    expect(findingSemanticSupportBandFromTypedPayload({}, "ChecklistCoverage")).toBeNull();
    expect(
      findingSemanticSupportBandFromTypedPayload({ semanticSupportBand: "Supported" }, "ChecklistCoverage"),
    ).toBe("Supported");
  });

  it("defaults decision-grade rows without a wire band to NotScored", () => {
    expect(findingSemanticSupportBandFromTypedPayload(null, "DecisionGradeFinding")).toBe("NotScored");
    expect(findingSemanticSupportBandFromTypedPayload({}, null)).toBe("NotScored");
  });

  it("stays in lib so server components can call it", () => {
    const src = readFileSync(resolve(__dirname, "finding-semantic-support-band-from-typed-payload.ts"), "utf8");

    expect(src.trimStart().startsWith("\"use client\"")).toBe(false);
    expect(src.trimStart().startsWith("'use client'")).toBe(false);
  });
});

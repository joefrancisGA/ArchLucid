import { describe, expect, it } from "vitest";

import { UNIVERSAL_INTAKE_MUST_QUESTION_KEYS } from "@/lib/universal-intake-must-completeness";
import {
  describeSkippedMustMeasurementGap,
  formatUniversalIntakeMustEngineInventoryMarkdown,
  GOLDEN_CORPUS_HARNESS_ENGINE_COUNT,
  resolveUniversalIntakeMustEngineFieldHint,
  UNIVERSAL_INTAKE_MUST_ENGINE_COVERAGE,
} from "@/lib/intake/universal-intake-must-engine-coverage";

describe("universal-intake-must-engine-coverage (PC-02)", () => {
  it("maps every L0 MUST question to at least one harness engine", () => {
    expect(UNIVERSAL_INTAKE_MUST_ENGINE_COVERAGE).toHaveLength(UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.length);

    for (const questionKey of UNIVERSAL_INTAKE_MUST_QUESTION_KEYS) {
      const row = UNIVERSAL_INTAKE_MUST_ENGINE_COVERAGE.find((entry) => entry.questionKey === questionKey);

      expect(row).toBeDefined();
      expect(row?.engineTypeIds.length).toBeGreaterThan(0);
      expect(row?.inGoldenCorpusHarness).toBe(true);
    }
  });

  it("returns actor engine hint for the representative MUST when empty", () => {
    const hint = resolveUniversalIntakeMustEngineFieldHint("l0.actor.additional-kinds");

    expect(hint).toMatch(/trust-boundary/i);
    expect(hint).toMatch(/stay absent on seal/i);
  });

  it("describes skipped security MUST as a measurement gap", () => {
    expect(describeSkippedMustMeasurementGap("l0.pillar.security")).toMatch(/security-baseline/i);
  });

  it("generates inventory markdown with harness engine count", () => {
    const markdown = formatUniversalIntakeMustEngineInventoryMarkdown();

    expect(markdown).toContain(String(GOLDEN_CORPUS_HARNESS_ENGINE_COUNT));
    expect(markdown).toContain("l0.pillar.cloud-target");
    expect(markdown).toContain("trust-boundary");
  });
});

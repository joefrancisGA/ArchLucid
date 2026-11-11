import { describe, expect, it } from "vitest";

import {
  PROCUREMENT_HELP_DILIGENCE_SECONDARY_CTAS,
  PROCUREMENT_HELP_SOURCES,
} from "./procurement-help-evidence-copy";
import {
  PROCUREMENT_AL_EVAL_ANCHOR_HREF,
  PROCUREMENT_SN_EVAL_ANCHOR_HREF,
} from "@/lib/procurement/procurement-evidence-map-anchors";

describe("procurement-help-evidence-copy", () => {
  it("links Sources follow-ups to guarded eval acceptance anchors", () => {
    const alEval = PROCUREMENT_HELP_SOURCES.find((entry) => entry.label === "ArchLucid AL-EVAL acceptance");
    const snEval = PROCUREMENT_HELP_SOURCES.find((entry) => entry.label === "SecureNow SN-EVAL acceptance");

    expect(alEval?.href).toBe(PROCUREMENT_AL_EVAL_ANCHOR_HREF);
    expect(snEval?.href).toBe(PROCUREMENT_SN_EVAL_ANCHOR_HREF);
  });

  it("keeps diligence secondary CTAs aligned with the same eval anchors", () => {
    const alCta = PROCUREMENT_HELP_DILIGENCE_SECONDARY_CTAS.find(
      (entry) => entry.testId === "procurement-help-diligence-al-eval",
    );
    const snCta = PROCUREMENT_HELP_DILIGENCE_SECONDARY_CTAS.find(
      (entry) => entry.testId === "procurement-help-diligence-sn-eval",
    );

    expect(alCta?.href).toBe(PROCUREMENT_AL_EVAL_ANCHOR_HREF);
    expect(snCta?.href).toBe(PROCUREMENT_SN_EVAL_ANCHOR_HREF);
  });
});

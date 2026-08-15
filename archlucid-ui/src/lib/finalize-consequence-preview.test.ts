import { describe, expect, it } from "vitest";

import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  assertFinalizeConsequencePreviewMatrixComplete,
  buildFinalizeConsequencePreview,
  FINALIZE_CONSEQUENCE_PREVIEW_TITLE,
  FINALIZE_REPLAY_COMPARE_NOTE,
  finalizeConsequencePreviewRowById,
} from "@/lib/finalize-consequence-preview";

describe("finalize-consequence-preview (TB-2224)", () => {
  it("covers locks, editable, and exports unlock with buyer nouns", () => {
    assertFinalizeConsequencePreviewMatrixComplete();

    const preview = buildFinalizeConsequencePreview();

    expect(preview.title).toBe(FINALIZE_CONSEQUENCE_PREVIEW_TITLE);
    expect(preview.summary.toLowerCase()).toContain("architecture review");
    expect(preview.summary.toLowerCase()).toContain(
      BUYER_SURFACE_VOCABULARY.sealedReviewRecord.toLowerCase(),
    );
    expect(preview.replayNote).toBe(FINALIZE_REPLAY_COMPARE_NOTE);

    const locks = finalizeConsequencePreviewRowById("locks");
    const editable = finalizeConsequencePreviewRowById("staysEditable");
    const exportsUnlock = finalizeConsequencePreviewRowById("exportsUnlock");

    expect(locks.label).toBe("What locks");
    expect(locks.detail.toLowerCase()).toContain("sealed review record");
    expect(editable.label).toBe("What stays editable");
    expect(editable.detail.toLowerCase()).toMatch(/disposition|comment/);
    expect(exportsUnlock.label).toBe("What exports unlock");
    expect(exportsUnlock.detail.toLowerCase()).toMatch(/export|sponsor|audit/);
  });

  it("avoids engine/agent jargon in the preview", () => {
    const preview = buildFinalizeConsequencePreview();
    const blob = `${preview.summary} ${preview.rows.map((row) => row.detail).join(" ")}`.toLowerCase();

    expect(blob).not.toContain("decision engine");
    expect(blob).not.toContain("agent results");
    expect(blob).not.toContain("api returns a conflict");
  });
});

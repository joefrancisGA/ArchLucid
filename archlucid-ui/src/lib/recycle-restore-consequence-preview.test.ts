import { describe, expect, it } from "vitest";

import {
  assertRecycleRestoreConsequencePreviewMatrixComplete,
  buildRecycleRestoreConsequencePreview,
  RECYCLE_RESTORE_CONSEQUENCE_PREVIEW_TITLE,
  RECYCLE_RESTORE_DISTINCT_OBJECTS_NOTE,
  recycleRestoreConsequencePreviewRowById,
} from "@/lib/recycle-restore-consequence-preview";

describe("recycle-restore-consequence-preview (TB-2278)", () => {
  it("covers returns vs distinct drafts vs distinct packages with buyer nouns", () => {
    assertRecycleRestoreConsequencePreviewMatrixComplete();

    const preview = buildRecycleRestoreConsequencePreview();

    expect(preview.title).toBe(RECYCLE_RESTORE_CONSEQUENCE_PREVIEW_TITLE);
    expect(preview.summary.toLowerCase()).toContain("project");
    expect(preview.summary.toLowerCase()).toContain("architecture package");
    expect(preview.distinctObjectsNote).toBe(RECYCLE_RESTORE_DISTINCT_OBJECTS_NOTE);

    const returns = recycleRestoreConsequencePreviewRowById("returns");
    const drafts = recycleRestoreConsequencePreviewRowById("staysDistinctDrafts");
    const packages = recycleRestoreConsequencePreviewRowById("staysDistinctPackages");

    expect(returns.label).toBe("What returns");
    expect(returns.detail.toLowerCase()).toContain("active projects");
    expect(drafts.label.toLowerCase()).toContain("drafts");
    expect(drafts.detail.toLowerCase()).toContain("architecture drafts");
    expect(packages.label.toLowerCase()).toContain("packages");
    expect(packages.detail.toLowerCase()).toContain("architecture packages");
    expect(packages.detail.toLowerCase()).toContain("finalized review record");
  });

  it("avoids engine/agent jargon in the preview", () => {
    const preview = buildRecycleRestoreConsequencePreview();
    const blob = `${preview.summary} ${preview.rows.map((row) => row.detail).join(" ")}`.toLowerCase();

    expect(blob).not.toContain("decision engine");
    expect(blob).not.toContain("agent results");
    expect(blob).not.toContain("soft delete cascade");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_INSPECT_PREVIEW_DIALOG_HONESTY } from "@/lib/evidence-source-inspect-sealed-honesty";

const REPO_ROOT = join(process.cwd(), "..");

describe("evidence-source-inspect sealed honesty (ESI-07)", () => {
  it("preview dialog copy matches StoredEvidenceFileCells honesty module", () => {
    const cells = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/runs/StoredEvidenceFileCells.tsx"),
      "utf8",
    );

    expect(cells).toContain(EVIDENCE_SOURCE_INSPECT_PREVIEW_DIALOG_HONESTY);
    expect(EVIDENCE_SOURCE_INSPECT_PREVIEW_DIALOG_HONESTY).toMatch(/not the sealed review record/i);
  });
});

import { describe, expect, it } from "vitest";

import {
  ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS,
  SECURENOW_PROCUREMENT_EVIDENCE_ROWS,
} from "./procurement-evidence-map-copy";
import { PROCUREMENT_EVIDENCE_GUARDED_ANCHORS } from "./procurement-evidence-map-anchors";

function rowsForProduct(product: "securenow" | "archlucid") {
  return product === "securenow" ? SECURENOW_PROCUREMENT_EVIDENCE_ROWS : ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS;
}

describe("procurement evidence map href guard", () => {
  for (const anchor of PROCUREMENT_EVIDENCE_GUARDED_ANCHORS) {
    it(`keeps ${anchor.rowId} on ${anchor.href}`, () => {
      const snRow = SECURENOW_PROCUREMENT_EVIDENCE_ROWS.find((row) => row.id === anchor.rowId);
      const alRow = ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS.find((row) => row.id === anchor.rowId);
      const row = snRow ?? alRow;

      expect(row?.href).toBe(anchor.href);
      expect(anchor.href).toBe(`${anchor.path}#${anchor.fragment}`);
    });
  }

  it("keeps fragment and testId paired on guarded anchors", () => {
    for (const anchor of PROCUREMENT_EVIDENCE_GUARDED_ANCHORS) {
      expect(anchor.testId.length).toBeGreaterThan(0);
      expect(anchor.href.endsWith(`#${anchor.fragment}`)).toBe(true);
      expect(anchor.testId).toContain(anchor.fragment.split("-")[0] ?? "");
    }
  });

  it("uses guarded anchors for every available href that includes a fragment", () => {
    const guardedHrefs = new Set(PROCUREMENT_EVIDENCE_GUARDED_ANCHORS.map((entry) => entry.href));

    for (const product of ["securenow", "archlucid"] as const) {
      const rows = rowsForProduct(product);

      for (const row of rows) {
        if (row.status !== "available" || row.href === null || !row.href.includes("#")) {
          continue;
        }

        if (row.id.endsWith("-acceptance")) {
          expect(guardedHrefs.has(row.href)).toBe(true);
        }
      }
    }
  });
});

import { describe, expect, it } from "vitest";

import {
  ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS,
  SECURENOW_PROCUREMENT_EVIDENCE_ROWS,
} from "./procurement-evidence-map-copy";

describe("procurement evidence map", () => {
  it("includes ArchLucid custom pack order acceptance", () => {
    const row = ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS.find((entry) => entry.id === "custom-pack-order");

    expect(row?.status).toBe("available");
    expect(row?.href).toBe("/pricing#pricing-quote-request");
    expect(row?.note).toMatch(/signed quote/i);
  });

  it("includes SecureNow SN-EVAL acceptance anchor", () => {
    const row = SECURENOW_PROCUREMENT_EVIDENCE_ROWS.find((entry) => entry.id === "sn-eval-acceptance");

    expect(row?.status).toBe("available");
    expect(row?.href).toBe("/administration/securenow-quote-packet#sn-eval");
    expect(row?.note).toMatch(/SN-EVAL/i);
  });

  it("marks CPA SOC 2 and pen test as not published for both products", () => {
    for (const rows of [SECURENOW_PROCUREMENT_EVIDENCE_ROWS, ARCHLUCID_PROCUREMENT_EVIDENCE_ROWS]) {
      const soc2 = rows.find((row) => row.id === "soc2-cpa");
      const penTest = rows.find((row) => row.id === "pen-test");

      expect(soc2?.status).toBe("not-published");
      expect(penTest?.status).toBe("not-published");
      expect(soc2?.href).toBeNull();
    }
  });
});

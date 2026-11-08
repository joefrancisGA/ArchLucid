import { describe, expect, it } from "vitest";

import {
  SECURENOW_INTERNAL_DOC_OPERATOR_HREFS,
  securenowInternalDocHref,
} from "@/lib/product-line/securenow-internal-doc-href";
import { SECURENOW_COMPLIANCE_NOTES_LINKS } from "@/lib/product-line/securenow-compliance-notes-copy";
import { SECURENOW_INVESTIGATION_EFFORT_NOTES } from "@/lib/product-line/securenow-investigation-effort-copy";
import { SECURENOW_QUOTE_PACKET_LINKS } from "@/lib/product-line/securenow-quote-packet-copy";
import { SECURENOW_SPONSOR_HOME_ROWS } from "@/lib/product-line/securenow-sponsor-home-copy";

describe("securenowInternalDocHref", () => {
  it("maps known internal docs to unique operator routes", () => {
    const hrefs = Object.values(SECURENOW_INTERNAL_DOC_OPERATOR_HREFS);

    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.every((href) => href !== "/help")).toBe(true);
    expect(securenowInternalDocHref("EXECUTIVE_PACKET_FILL_GUIDE.md")).toBe(
      "/administration/securenow-sponsor-path#executive-packet-fill-guide",
    );
    expect(securenowInternalDocHref("SPONSOR_READOUT_OUTLINE.md")).toBe(
      "/administration/securenow-sponsor-path#sponsor-readout-outline",
    );
  });

  it("keeps consumer row and list href sets unique", () => {
    const groupedHrefs = [
      ...SECURENOW_SPONSOR_HOME_ROWS.map((row) => row.href),
      ...SECURENOW_INVESTIGATION_EFFORT_NOTES.map((note) => note.href),
      ...SECURENOW_COMPLIANCE_NOTES_LINKS.map((link) => link.href),
      ...SECURENOW_QUOTE_PACKET_LINKS.map((link) => link.href),
    ];

    expect(new Set(groupedHrefs).size).toBe(groupedHrefs.length);
    expect(groupedHrefs.every((href) => href !== "/help")).toBe(true);
  });
});

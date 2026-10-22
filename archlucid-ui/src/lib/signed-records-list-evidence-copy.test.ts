import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORDS_LIST_CANONICAL_PATH,
  SIGNED_RECORDS_LIST_CLAIM_DISCIPLINE,
  SIGNED_RECORDS_LIST_FOLLOW_UPS_TITLE,
  SIGNED_RECORDS_LIST_ORIENTATION_SOURCES,
  SIGNED_RECORDS_LIST_SOURCES,
  SIGNED_RECORDS_LIST_SOURCES_INTRO,
} from "@/lib/signed-records-list-evidence-copy";

describe("signed-records-list-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for SI", () => {
    expect(SIGNED_RECORDS_LIST_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(SIGNED_RECORDS_LIST_CLAIM_DISCIPLINE).toContain("finalized");
    expect(SIGNED_RECORDS_LIST_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(SIGNED_RECORDS_LIST_SOURCES.length).toBeGreaterThan(0);
    expect(SIGNED_RECORDS_LIST_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of SIGNED_RECORDS_LIST_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(SIGNED_RECORDS_LIST_CANONICAL_PATH);
    }
  });
});

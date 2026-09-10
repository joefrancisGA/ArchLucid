import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORD_CANONICAL_PATH_PATTERN,
  SIGNED_RECORD_CLAIM_DISCIPLINE,
  SIGNED_RECORD_FOLLOW_UPS_TITLE,
  SIGNED_RECORD_ORIENTATION_SOURCES,
  SIGNED_RECORD_SOURCES,
  SIGNED_RECORD_SOURCES_INTRO,
} from "@/lib/signed-record-evidence-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

describe("signed-record-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for MMX", () => {
    expect(SIGNED_RECORD_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(SIGNED_RECORD_CLAIM_DISCIPLINE).toContain("finalized review record");
    expect(SIGNED_RECORD_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(SIGNED_RECORD_SOURCES.length).toBeGreaterThan(0);
    expect(SIGNED_RECORD_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of SIGNED_RECORD_ORIENTATION_SOURCES) {
      expect(link.href).not.toMatch(
        new RegExp(`^${SIGNED_RECORDS_LIST_PATH.replace("/", "\\/")}/[^/]+$`),
      );
    }

    expect(SIGNED_RECORD_CANONICAL_PATH_PATTERN).toContain("[manifestId]");
  });
});

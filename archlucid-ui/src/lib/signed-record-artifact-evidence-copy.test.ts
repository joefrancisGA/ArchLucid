import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORD_ARTIFACT_CANONICAL_PATH_PATTERN,
  SIGNED_RECORD_ARTIFACT_CLAIM_DISCIPLINE,
  SIGNED_RECORD_ARTIFACT_FOLLOW_UPS_TITLE,
  SIGNED_RECORD_ARTIFACT_ORIENTATION_SOURCES,
  SIGNED_RECORD_ARTIFACT_SOURCES,
  SIGNED_RECORD_ARTIFACT_SOURCES_INTRO,
} from "@/lib/signed-record-artifact-evidence-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

describe("signed-record-artifact-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GAR", () => {
    expect(SIGNED_RECORD_ARTIFACT_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(SIGNED_RECORD_ARTIFACT_CLAIM_DISCIPLINE).toContain("artifact preview");
    expect(SIGNED_RECORD_ARTIFACT_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(SIGNED_RECORD_ARTIFACT_SOURCES.length).toBeGreaterThan(0);
    expect(SIGNED_RECORD_ARTIFACT_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of SIGNED_RECORD_ARTIFACT_ORIENTATION_SOURCES) {
      expect(link.href).not.toMatch(
        new RegExp(`^${SIGNED_RECORDS_LIST_PATH.replace("/", "\\/")}/[^/]+/artifacts/`),
      );
    }

    expect(SIGNED_RECORD_ARTIFACT_CANONICAL_PATH_PATTERN).toContain("[artifactId]");
  });
});

import { describe, expect, it } from "vitest";

import {
  BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE,
  SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE,
  signedRecordArtifactPageSubtitle,
} from "@/lib/signed-record-artifact-page-copy";

describe("signed-record-artifact-page-copy", () => {
  it("uses shorter buyer artifact preview subtitle", () => {
    expect(signedRecordArtifactPageSubtitle(true)).toBe(BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE);
    expect(signedRecordArtifactPageSubtitle(false)).toBe(SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE);
    expect(BUYER_SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE.length).toBeLessThan(
      SIGNED_RECORD_ARTIFACT_PAGE_SUBTITLE.length,
    );
  });
});

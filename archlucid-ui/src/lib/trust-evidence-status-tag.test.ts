import { describe, expect, it } from "vitest";

import {
  TRUST_EVIDENCE_STATUS_NOT_STORED_LABEL,
  trustEvidenceStatusTag,
} from "@/lib/trust-evidence-status-tag";

describe("trustEvidenceStatusTag", () => {
  it("uses not-stored label for null, undefined, and blank status", () => {
    expect(trustEvidenceStatusTag(null).label).toBe(TRUST_EVIDENCE_STATUS_NOT_STORED_LABEL);
    expect(trustEvidenceStatusTag(undefined).label).toBe(TRUST_EVIDENCE_STATUS_NOT_STORED_LABEL);
    expect(trustEvidenceStatusTag("   ").label).toBe(TRUST_EVIDENCE_STATUS_NOT_STORED_LABEL);
  });

  it("maps known statuses without guessing", () => {
    expect(trustEvidenceStatusTag("Available").label).toBe("Ready");
    expect(trustEvidenceStatusTag("Recorded").label).toBe("Recorded");
  });
});

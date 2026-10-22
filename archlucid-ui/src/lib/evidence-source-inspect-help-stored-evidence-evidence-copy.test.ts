import { describe, expect, it } from "vitest";

import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTEXTUAL_REFERENCE,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SECURENOW_CONTEXTUAL_REFERENCE,
  resolveEvidenceSourceInspectHelpStoredEvidenceContextualReference,
} from "@/lib/evidence-source-inspect-help-stored-evidence-evidence-copy";

describe("evidence-source-inspect-help-stored-evidence-evidence-copy", () => {
  it("routes SecureNow contextual references to security-evidence-paths", () => {
    expect(resolveEvidenceSourceInspectHelpStoredEvidenceContextualReference("security")).toEqual(
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SECURENOW_CONTEXTUAL_REFERENCE,
    );
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SECURENOW_CONTEXTUAL_REFERENCE.href).toBe(
      "/help/security-evidence-paths",
    );
  });

  it("keeps architecture contextual references on inspect-stored-evidence", () => {
    expect(resolveEvidenceSourceInspectHelpStoredEvidenceContextualReference("architecture")).toEqual(
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTEXTUAL_REFERENCE,
    );
    expect(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CONTEXTUAL_REFERENCE.href).toBe(
      "/help/inspect-stored-evidence",
    );
  });
});

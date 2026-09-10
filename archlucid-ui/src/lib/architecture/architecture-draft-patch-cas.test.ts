import { describe, expect, it } from "vitest";

import {
  architectureDraftCasConflictMessage,
  DRAFT_CAS_STALE_CODE,
  DRAFT_CAS_TOKEN_MISSING_CODE,
  draftPatchBodyHasCas,
  withDraftPatchCas,
} from "@/lib/architecture/architecture-draft-patch-cas";

describe("architecture-draft-patch-cas (LW-014 / LW-038)", () => {
  it("adds expectedUpdatedUtc without mutating field payload keys", () => {
    const payload = { businessOutcome: "Faster audit prep" };
    const wrapped = withDraftPatchCas(payload, { expectedUpdatedUtc: "2026-09-10T12:00:00.000Z" });

    expect(wrapped.expectedUpdatedUtc).toBe("2026-09-10T12:00:00.000Z");
    expect(wrapped.businessOutcome).toBe("Faster audit prep");
    expect("expectedUpdatedUtc" in payload).toBe(false);
  });

  it("allows forceOverwrite without a token and rejects omit-both", () => {
    expect(withDraftPatchCas({ systemName: "ArchLucid" }, { forceOverwrite: true }).forceOverwrite).toBe(true);
    expect(() => withDraftPatchCas({ systemName: "ArchLucid" }, {})).toThrow(/expectedUpdatedUtc/);
    expect(draftPatchBodyHasCas({})).toBe(false);
    expect(draftPatchBodyHasCas({ expectedUpdatedUtc: "2026-09-10T12:00:00.000Z" })).toBe(true);
  });

  it("does not claim another session for omit-token 409 copy", () => {
    const omitCopy = architectureDraftCasConflictMessage(DRAFT_CAS_TOKEN_MISSING_CODE);
    const staleCopy = architectureDraftCasConflictMessage(DRAFT_CAS_STALE_CODE);

    expect(omitCopy.toLowerCase()).not.toMatch(/another session/);
    expect(staleCopy.toLowerCase()).toMatch(/another session|offline replay/);
  });
});

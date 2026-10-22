import { describe, expect, it } from "vitest";

import {
  architectureDraftCasConflictMessage,
  DRAFT_CAS_STALE_CODE,
  DRAFT_CAS_TOKEN_MISSING_CODE,
  draftPatchBodyHasCas,
  withDraftPatchCas,
} from "@/lib/architecture/architecture-draft-patch-cas";
import {
  applyOnlineDraftPatchCas,
  resolveOnlineDraftPatchCas,
} from "@/lib/architecture/architecture-draft-patch-cas-online";

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

  it("does not claim another session overwrote the tab for omit-token 409 copy", () => {
    const omitCopy = architectureDraftCasConflictMessage(DRAFT_CAS_TOKEN_MISSING_CODE);
    const staleCopy = architectureDraftCasConflictMessage(DRAFT_CAS_STALE_CODE);

    expect(omitCopy.toLowerCase()).not.toMatch(/updated in another session/);
    expect(omitCopy.toLowerCase()).toMatch(/not another session/);
    expect(staleCopy.toLowerCase()).toMatch(/another session/);
    expect(staleCopy.toLowerCase()).toMatch(/offline replay/);
  });

  it("adopts GET updatedUtc after deferred create instead of treating it as another session", () => {
    const decision = resolveOnlineDraftPatchCas({
      forceOverwrite: false,
      createdThisPersist: true,
      knownUpdatedUtc: "2026-08-11T11:00:00.000Z",
      latestServerUpdatedUtc: "2026-08-11T12:00:00.000Z",
    });

    expect(decision).toEqual({
      kind: "token",
      expectedUpdatedUtc: "2026-08-11T12:00:00.000Z",
    });
    expect(applyOnlineDraftPatchCas({ systemName: "ArchLucid" }, decision).expectedUpdatedUtc).toBe(
      "2026-08-11T12:00:00.000Z",
    );
  });

  it("conflicts when GET updatedUtc differs from a prior persist token", () => {
    expect(
      resolveOnlineDraftPatchCas({
        forceOverwrite: false,
        createdThisPersist: false,
        knownUpdatedUtc: "2026-08-11T11:00:00.000Z",
        latestServerUpdatedUtc: "2026-08-11T12:00:00.000Z",
      }),
    ).toEqual({ kind: "conflict" });
  });
});

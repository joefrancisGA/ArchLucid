/** SN-035 — OpenAPI contract inventory for clone/envelope spawn (SN-008 / SN-015 / ADR 0092). */

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_DOC_ANCHOR =
  "docs/library/API_CONTRACTS.md" as const;

export const SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_OWNER = "SN-035" as const;

export const SYSTEM_NOT_JOB_OPENAPI_SNAPSHOT_RELATIVE_PATH =
  "ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json" as const;

/** SN-008 spawn-locked clone — WA-10 path; no request body on wire. */
export const SYSTEM_NOT_JOB_CLONE_SNAPSHOT_OPENAPI_PATH =
  "/v1/architecture/draft/{draftId}/clone-snapshot" as const;

/** SN-015 / R12 ceteris-paribus envelope branch — invariant override on wire. */
export const SYSTEM_NOT_JOB_BRANCH_ENVELOPE_OPENAPI_PATH =
  "/v1/architecture/draft/{draftId}/branch" as const;

export const SYSTEM_NOT_JOB_CLONE_ENVELOPE_OPENAPI_SCHEMAS = {
  cloneSnapshotResponse: "CloneSnapshotDraftResponse",
  branchRequest: "BranchDraftRequest",
  branchResponse: "BranchDraftResponse",
  branchOverrideKind: "DraftBranchOverrideKind",
} as const;

/**
 * SN-035 PR acceptance: SN wave did not add clone/envelope spawn wire fields.
 * Door stamp stays client-side (CG-011 / confirm chrome); invariant override uses existing BranchDraftRequest.
 */
export const SYSTEM_NOT_JOB_OPENAPI_CLONE_AND_ENVELOPE_NO_WIRE_CHANGE_LINE =
  "No OpenAPI snapshot regeneration: clone-snapshot has no request body; door stamp is client-side; envelope invariant override uses existing BranchDraftRequest (overrideKind/overrideKey/overrideValue)." as const;

/** Fields the SN wave must not add to clone-snapshot POST without a new ADR + snapshot regen. */
export const SYSTEM_NOT_JOB_FORBIDDEN_CLONE_SNAPSHOT_REQUEST_BODY_FIELDS = [
  "workingCareerRehearsalDoor",
  "invariantOverride",
  "overrideKind",
  "leftDraftId",
  "rightDraftId",
] as const;

> **Scope:** Contributor-reference — wave 21 (FP-01–FP-24) close-audit evidence for ADR 0076 current-pointer CAS on every client write that can move `dbo.FindingCurrentDispositions`. Not buyer-facing copy.

# Finding-pointer CAS wave close audit (FP-24)

> **Date:** 2026-09-08 (wave 21 — FP-01–FP-24)  
> **Owner decision:** Close the inspect/bulk CAS hole. Do **not** implement LP-19, live presence, or a new ADR.  
> **Spine:** [ADR 0076](adrs/0076-finding-disposition-conflict-409.md) · [FINDING_POINTER_CAS_COMPOSER_PROMPTS.md](FINDING_POINTER_CAS_COMPOSER_PROMPTS.md) · [`FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`](../library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md)

## Verdict

**Shipped** for Working production seats on this branch, subject to the residuals below. Inspect submit and mark-remediated send `expectedCurrentDispositionRowVersionBase64` when a pointer exists; 409 mounts `FindingDispositionConflictPanel` and the next confirm adopts the winner. Keyboard undo, restore, bulk SQL, bulk UI, and the cluster strip do the same. The call-site ratchet fails new writes that omit the field. First disposition (no pointer) still omits the token.

This audit does **not** claim LP-19 (401 resume / idempotency replay), live presence, or insight density closed.

## Evidence table

| Prompt | Shipped? | Evidence | Residual |
|--------|----------|----------|----------|
| FP-01 inventory | Yes | `finding-pointer-cas-inventory.ts`; `finding-pointer-cas-inventory.test.ts` | None |
| FP-02 helper | Yes | `resolveExpectedCurrentDispositionRowVersion`; `finding-expected-current-disposition-row-version.test.ts` | None |
| FP-03 inspect seed | Yes | `FindingInspectView` passes `latestDispositionRowVersionBase64` into the stickiness panel | None |
| FP-04 inspect submit | Yes | `submitDisposition` object literal includes `expectedCurrentDispositionRowVersionBase64` | None |
| FP-05 mark remediated | Yes | `submitExplicitRemediation` same field; panel test `sends the same token on mark as remediated` | None |
| FP-06 409 panel | Yes | `FindingDispositionConflictPanel` on inspect; `shows the conflict panel on 409…` | None |
| FP-07 retry adopts winner | Yes | Same test: second POST uses `WIN=` | None |
| FP-08 inspect Vitest | Yes | `FindingInspectGovernanceStickinessPanel.test.tsx` pointer CAS describe | None |
| FP-09 first write | Yes | `omits expectedCurrentDispositionRowVersionBase64 on first disposition`; `RecordAsync` first write still null-expected | None |
| FP-10 keyboard undo | Yes | `FindingKeyboardTriageHost.test.tsx` apply `AAA=` / undo `BBB=` | None |
| FP-11 restore | Yes | `FindingDispositionRestoreButton.test.tsx`; 409 does not clear snapshot | None |
| FP-12 ratchet | Yes | `finding-pointer-cas-call-site-guard.test.ts` | None |
| FP-13 bulk DTO | Yes | `RecordBulkFindingDispositionRequest.ExpectedCurrentDispositionRowVersionBase64ByFindingId`; facade test copies client map and ignores extra keys | None |
| FP-14 SQL bulk | Yes | `SqlFindingDispositionConcurrencyRepository.RecordBulkAsync` passes per-event expected versions | None |
| FP-15 service bulk | Yes | `FindingDispositionService.RecordBulkAsync` `TryDecodeRowVersion` per request | None |
| FP-16 OpenAPI | Yes | `openapi-v1.contract.snapshot.json` / buyer snapshot / `schemas.generated.ts` | Regen if generator property-order differs |
| FP-17 bulk UI | Yes | `GovernanceFindingsBulkActions.test.tsx` map `f1`/`f2` | None |
| FP-18 bulk 409 | Yes | Bulk catch uses `readFindingDispositionConflictFromError` + `formatFindingDispositionBulkConflictMessage` | None |
| FP-19 cluster strip | Yes | `RootCauseClusterDispositionStrip.test.tsx` map `a`/`b` | None |
| FP-20 bulk C# | Yes | `RecordBulkAsync_null_expected_after_pointer_exists_throws_conflict`; matching/stale tests | None |
| FP-21 single-record omit | Yes | `RecordAsync_null_expected_after_pointer_exists_throws_conflict`; `RecordAsync_matching_expected_version_records_amend` | None |
| FP-22 contract honesty | Yes | `FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md` PA answer is CAS 409 | None |
| FP-23 NoOp honesty | Yes | Comment on `NoOpFindingDispositionConcurrencyRepository`; SQL registrar comment | NoOp still last-write-wins on demo host by design |
| FP-24 close | Yes | This file; `finding-pointer-cas-prompt-inventory.test.ts` | Residuals below |

## Residuals (out of wave)

| Item | Tracking | Notes |
|------|----------|-------|
| 401 resume / idempotency replay | LP-19 | Replay reuses the stored body (including the token). Do not treat this wave as LP-19 closed. |
| Stale findings-queue refetch | leftover | Queue still N+1 `listFindingDispositions` when list DTOs lack row versions. |
| Stop-analysis one-click cancel | leftover | Not a disposition write. |
| Live presence / finding-comment chat | out of product | ADR 0037. |
| Simulator → Real default | G-REAL-06 | Do not flip. |

## Do not claim

- CPA SOC 2 or third-party pen test (**TB-135** / **TB-136** tech Done; GTM owner work remains).
- GTM cohorts **M-90 / M-44 / M-91 / M-92**.

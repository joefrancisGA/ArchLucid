# SN-FQ-01 — SecureNow findings must not inhabit an architecture

**Wave:** SecureNow findings queue (**SN-FQ**). **Depends on:** none. **Branch:** `cursor/sn-fq-stop-inhabit`

## Goal

On the Security product line, `/compliance/findings` stays a findings queue. Working mode and `?architectureId=customer-intake` must not turn on the IH-016 architecture document, must not call seal-delta, and must not offer **Open architecture desk**.

## Why

`SecureNowFindingsPage` renders `GovernanceFindingsQueueClient`. In Working mode, `useGovernanceFindingsFilter` copies `readCachedLastOpenArchitectureId()` onto the query string. `customer-intake` is the ArchLucid sample slug. `resolveIsInhabitedFindingsDocument` treats any non-empty architecture id as the nested findings document. `InhabitedFindingsDocumentChrome` then mounts `ArchitectureSealDeltaPanel`, which calls `GET /v1/architectures/customer-intake/seal-delta`. The API route is `{architectureId:guid}`, so the slug 404s. Recovery links to `/architecture/architectures/customer-intake`.

## Read first

- `docs/architecture/SECURENOW_FINDINGS_QUEUE_COMPOSER_PROMPTS.md`
- `archlucid-ui/src/app/(operator)/compliance/findings/page.tsx`
- `archlucid-ui/src/lib/inhabit/inhabit-findings-document-presentation.ts`
- `archlucid-ui/src/components/governance/findings/use-governance-findings-filter.ts`
- `archlucid-ui/src/lib/inhabit/inhabit-live-recovery-contract.ts`
- `archlucid-ui/src/components/governance/InhabitedFindingsDocumentChrome.tsx`

## What to build

1. Security product line never resolves an inhabited findings document. Thread `productLineId` into `resolveIsInhabitedFindingsDocument`, `resolveInhabitedFindingsDocumentPresentation`, `resolveInhabitedFindingsEmptyStateCopy`, and `resolveInhabitedFindingsInspectHrefOptions`. When `isSecureNowProductLine`, return false / null. Callers that already have `useProductLine` pass it. Architecture callers keep today's result.
2. On Security, `useGovernanceFindingsFilter` does not read `readCachedLastOpenArchitectureId()` and does not `router.replace` an `architectureId` onto `/compliance/findings`. A stale `architectureId` already on that URL is ignored for inhabit, seal-delta, and desk links. Do not rewrite Architecture `/governance/findings` desk continuity.
3. Do not mount `InhabitedFindingsDocumentChrome` or `ArchitectureSealDeltaPanel` on Security. `resolveInhabitFindingsLiveRecoveryActions` returns no **Open architecture desk** link when the product line is Security (pass the product line in; do not key off the slug).
4. Vitest: Security + Working + pathname `/compliance/findings` + `architectureId=customer-intake` → presentation null, no seal-delta query, no architecture-desk href. Architecture pathname `/architecture/architectures/{guid}/findings` in Working mode still returns the inhabited presentation.

## Do not

- Change the seal-delta GUID route or teach it to accept `customer-intake`.
- Remove IH-016 from the Architecture nested findings document.
- Rewrite SecureNow findings subtitle copy (that is **SN-FQ-02**).
- Change the empty-register fallback (that is **SN-FQ-03**).

## Done when

The four behaviors above hold, the named tests pass, and Architecture nested findings still inhabit.

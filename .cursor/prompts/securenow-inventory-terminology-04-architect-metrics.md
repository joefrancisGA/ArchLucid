# SN-IT-04 — Architect metrics + honesty verify hints

**Wave:** SecureNow Azure inventory terminology (**SN-IT**). **Depends on:** SN-IT-01.

## Goal

SecureNow architect outcome metrics (SA-11) compare **inventory captures**, not **snapshots**. Honesty copy should say **next Azure inventory capture** for verify hints where it today says snapshot.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-architect-metrics-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-architect-honesty-copy.ts` (+ tests)
- `docs/library/SECURENOW_ARCHITECT_METRICS.md` (operator-facing doc strings if duplicated in UI)

## What to build

1. Replace **From snapshot** / **To snapshot** / **Compare snapshots** with capture labels from SN-IT-01.
2. Empty state: **At least two Azure inventory captures are required…**
3. Update `securenow-architect-metrics-copy` tests and any component tests that assert old strings.

## Do not

- Rename `useInfraEvidenceSnapshotsQuery` or API fields.
- Change backend metric calculator identifiers.

## Done when

Metrics panel buyer copy uses capture terminology; tests updated.

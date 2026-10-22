# SN-IT-02 — Drift workbench + navigation labels

**Wave:** SecureNow Azure inventory terminology (**SN-IT**). **Depends on:** SN-IT-01 helper constants.

## Goal

Replace buyer-visible **snapshot** wording on `/governance/infrastructure/drift` and related nav with **Azure inventory capture** terminology. Remove **Snapshot A/B** framing from labels (keep `snapshotAId` / `snapshotBId` internal).

## Read first

- `archlucid-ui/src/lib/product-line/securenow-inventory-terminology-copy.ts`
- `archlucid-ui/src/lib/i18n.ts` (`infrastructureDrift`)
- `archlucid-ui/src/lib/governance/governance-infrastructure-drift-help-guide-content.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx` (labels only)
- `archlucid-ui/src/lib/product-documentation-registry-entries-operator-governance.ts`

## What to build

1. Nav + doc registry: **Drift & Azure inventory** (sentence case).
2. Drift workbench: baseline/compare capture pickers; captures table section title; empty states reference **Azure inventory capture**.
3. Update drift help guide + evidence copy modules to match (not audit-assessment snapshot language).
4. Fix Vitest/e2e string expectations (`DriftWorkbenchClient.test.tsx`, `HelpTopicGovernanceInfrastructureDrift.test.tsx`, `infra-drift-table-layout.mock.spec.ts` comments only if needed).

## Do not

- Change `DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM` name.
- Rename component/file names `DriftSnapshotsTable` in this prompt (identifier hold).

## Done when

Security-shell drift golden strings use inventory capture terminology; tests green; Architecture `:3000` drift strings unchanged if shared modules require product-line branch.

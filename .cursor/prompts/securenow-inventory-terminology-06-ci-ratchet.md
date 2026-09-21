# SN-IT-06 — Security-shell inventory terminology ratchet

**Wave:** SecureNow Azure inventory terminology (**SN-IT**). **Depends on:** SN-IT-02–05 preferred.

## Goal

Prevent regressions: bare **snapshot** must not return on SecureNow infrastructure-evidence copy modules guarded by CI.

## Read first

- `archlucid-ui/scripts/securenow-archlucid-leak-drift-guard.test.ts` (pattern)
- `scripts/ci/check_securenow_archlucid_leak_guard_wiring.py`
- SN-IT copy modules from prior prompts

## What to build

1. Add `archlucid-ui/scripts/securenow-inventory-terminology-guard.test.ts` (or extend an existing terminology scanner) that scans listed `securenow-*` + `governance-infrastructure-drift-*` copy files for forbidden patterns: `\bsnapshot\b` (case-insensitive) except allowlisted phrases: **assessment snapshot**, test fixture IDs, and comments.
2. Wire into `npm run lint:terminology` or an existing guard script invoked from CI (match repo convention).
3. Document allowlist entries with `SN-IT` reason in the test file.

## Do not

- Fail on `snapshotId` in code identifiers or API path strings inside non-copy files.
- Block Architecture shell files.

## Done when

CI fails if a guarded copy module reintroduces bare snapshot; wiring script updated if required.

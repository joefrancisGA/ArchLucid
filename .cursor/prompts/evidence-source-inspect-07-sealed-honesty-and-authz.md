# ESI-07 — Authz, audit, and sealed-record honesty for source inspect

**Depends on ESI-02.** **Do not unseal.** **Do not** call submitted files the sealed review record.

## Goal

Inspect/download of stored evidence is:

1. **Scoped** — same tenant catalog + run membership as review detail (ADR 0037). IDOR tests required.
2. **Readable when the review is readable** — match review GET policy (typically `ReadAuthority`), not upload (`ExecuteAuthority` on POST bulk).
3. **Audited** — successful open/download appends the ESI-02 event (actor, run, file id/name).
4. **Honest after finalize** — files that were stored remain downloadable; empty-state already says sources cannot be **added** after finalization (`RunDetailEvidenceInventorySection` `hasManifest`). Do not add an upload control on sealed reviews. Copy near Download: this is **submitted evidence**, not the committed package / ZIP / sealed record.
5. **Demo / showcase** — if seeded reviews have no real blobs, do not show working Download controls (citation/brief only). No fake files.

## Why

A download that looks like “the official record” creates false confidence (career-artifact class). A download that leaks across tenants is a security defect. Upload-only `ExecuteAuthority` on GET would block reviewers who can already see the review.

## Context

- `RunDetailEvidenceInventorySection` sealed empty-state copy
- `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md` / TB-645
- `AuditEventTypes.EvidenceBulkAttached` vs new read event from ESI-02
- ADR 0039 sealed immutability
- Sponsor / read-only shells that embed review evidence — if they mount the same table, they get the same rules; do not add a second download stack

## What to build

1. Confirm GET file policy + 404 IDOR matrix (own run 200; other tenant 404; forged id 404).
2. Finalize: GET file still 200 for catalogued items; POST bulk still rejected/blocked as today on sealed runs (do not reopen upload).
3. UI copy: Download tooltip/helper one sentence; never “Download sealed review record” on a source file. ZIP bundle CTA stays the package export.
4. Tests: sealed run download allowed; sealed run upload still not; copy assertion that sealed-record vocabulary is absent from the per-file button label.
5. If RequiredAuditEventTypes must include the new read event, add it with a test.

## Acceptance criteria

- GRC reviewer with read can download a PNG; cannot attach new files after finalize.
- Button label is **Download** (plus file name in accessible name), not Export / Seal / Record.

## Constraints

- No SQL RLS.
- No public blob URLs.
- Do not implement GTM cohorts or pen-test programs.
- Do not change manifest hash / sealed bytes.

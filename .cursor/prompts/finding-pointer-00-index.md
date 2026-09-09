<!-- Finding-pointer CAS Composer prompts — paste one prompt per session.
     Origin: 2026-09-08 owner diagnosis — ArchLucid is a working-architect tool
     (all-day use; livelihoods may depend on the sealed record). Wave 21 after
     livelihood-proof-00-index.md (LP-01–LP-20). Owns ADR 0076 current-pointer
     CAS on every client write that can change current finding disposition.
     Do not implement from this index. -->

# Finding-pointer CAS mitigations — Composer prompt set (FP-01–FP-24)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**This set is wave 21. It owns only:** attaching `expectedCurrentDispositionRowVersionBase64` on every production write that can move `dbo.FindingCurrentDispositions`, plus 409 recovery on inspect and bulk. ADR **0076** already specifies the server rule. Keyboard triage already sends the token. Inspect, keyboard undo, restore, and bulk do not.

**Owner authorization (this wave):** Close the inspect/bulk CAS hole completely. **Do not** implement LP-19 (401 resume). **Do not** add live presence. **Do not** add a new ADR.

**Do not implement from this index.** Paste one numbered file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Inspect save** | Omits expected row version | Sends pointer token; 409 conflict panel; retry adopts winner | FP-03–09 |
| **Other single writes** | Keyboard undo + restore omit token | Same CAS as keyboard apply | FP-10–11 |
| **Ratchet** | Grep-nothing | CI fails new `recordFindingDisposition` call sites that omit the field | FP-12 |
| **Bulk** | SQL `expectedCurrentRowVersion: null`; HTTP has no map | Per-finding expected versions, fail-closed 409 | FP-13–20 |
| **Honesty** | Stale “both HTTP calls succeed” PA table; NoOp looks like CAS | Contract + tests + demo honesty | FP-01, FP-21–23 |
| **Close** | No audit | Acceptance file | FP-24 |

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039); ADR 0068 two kernels; ADR 0076 **server** CAS (do not rewrite the body); disposition 409 payload shape; `MUTATION_UNDO_WINDOW_SECONDS = 300`; desktop review **tabs** as a full strip; Guided / demo / trial as eval sessions; Simulator **default** Mode; ITSM inbound pointer (LP-17).

Do **not** collapse desktop review workspace tabs behind **More**. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** invent live presence, finding-comment chat, or per-architecture ACL. Do **not** lengthen 300s undo. Do **not** unseal. Do **not** implement LP-19 401 replay.

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **LP-01–20** | Wave 20 persist gates | **Do not re-run.** ITSM inbound already sends the pointer (LP-17) |
| **DR-08 / RS-11** | 409 contract + keyboard conflict panel | Leftover: inspect still omits the token |
| **WS-01–24** | Working seat | Do not re-run |
| **ADR 0076** | Current-pointer CAS | **Do not rewrite the ADR body** — wire the clients |

If a row lists an LP/DR/RS owner, **do not re-implement that file**. Implement only the leftover in *What to build*.

## Run order

**Inventory → helper → inspect → other singles → ratchet → bulk contract → bulk UI → close.**

Prefer **01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09**. Then **10–11**. Then **12**. Then **13 → 14 → 15 → 16 → 17 → 18 → 19 → 20**. Then **21–23**. **24** last.

**01** must not change behavior. **02** must not wire call sites (03–11 do). **04/05** must not invent a second conflict panel (06 mounts the existing one). **13** must not change SQL until **14**. **17** must not ship before OpenAPI **16**. **24** must not claim LP-19 closed.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `finding-pointer-01-write-path-inventory.md` | Write paths that omit the token are not listed; contract PA table is stale |
| 02 | `finding-pointer-02-expected-version-helper.md` | Inspect/keyboard/restore each invent version extraction |
| 03 | `finding-pointer-03-inspect-seed-row-version.md` | Inspect payload has `latestDispositionRowVersionBase64`; hook never holds it |
| 04 | `finding-pointer-04-inspect-submit-disposition.md` | `submitDisposition` omits `expectedCurrentDispositionRowVersionBase64` |
| 05 | `finding-pointer-05-inspect-mark-remediated.md` | `submitExplicitRemediation` omits the token |
| 06 | `finding-pointer-06-inspect-409-conflict-panel.md` | Inspect 409 is a generic inline error; keyboard already has `FindingDispositionConflictPanel` |
| 07 | `finding-pointer-07-inspect-retry-adopts-winner.md` | After 409, retry still sends the stale (or missing) version |
| 08 | `finding-pointer-08-inspect-save-vitest.md` | No Vitest that inspect save includes the token when a pointer exists |
| 09 | `finding-pointer-09-first-disposition-null-version.md` | Requiring a token on empty history would block first disposition |
| 10 | `finding-pointer-10-keyboard-undo-row-version.md` | Keyboard apply sends the token; undo `Deferred` write does not |
| 11 | `finding-pointer-11-restore-button-row-version.md` | 24-hour restore POST omits the token |
| 12 | `finding-pointer-12-call-site-ci-ratchet.md` | New `recordFindingDisposition` call sites can omit the field |
| 13 | `finding-pointer-13-bulk-request-expected-versions.md` | `RecordBulkFindingDispositionRequest` has no per-finding expected versions |
| 14 | `finding-pointer-14-sql-bulk-uses-expected.md` | `SqlFindingDispositionConcurrencyRepository.RecordBulkAsync` always passes `null` |
| 15 | `finding-pointer-15-service-bulk-forwards-expected.md` | `FindingDispositionService.RecordBulkAsync` drops `ExpectedCurrentDispositionRowVersionBase64` |
| 16 | `finding-pointer-16-openapi-bulk-snapshot.md` | OpenAPI / generated TS types lag the bulk body |
| 17 | `finding-pointer-17-bulk-ui-sends-versions.md` | `GovernanceFindingsBulkActions` POSTs finding ids only |
| 18 | `finding-pointer-18-bulk-409-conflict-panel.md` | Bulk 409 has no reload-current recovery |
| 19 | `finding-pointer-19-cluster-strip-bulk-versions.md` | `RootCauseClusterDispositionStrip` same bulk hole |
| 20 | `finding-pointer-20-csharp-bulk-409-tests.md` | No C# test that bulk with existing pointer + null expected 409s |
| 21 | `finding-pointer-21-csharp-single-record-missing-version.md` | Single-record missing-version 409 must stay fail-closed |
| 22 | `finding-pointer-22-contract-docs-honesty.md` | `FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md` PA answer still says both HTTP calls succeed |
| 23 | `finding-pointer-23-noop-demo-cas-honesty.md` | `NoOpFindingDispositionConcurrencyRepository` appends without CAS |
| 24 | `finding-pointer-24-wave-close-audit.md` | Without audit, inspect save can drop the token again |

## Global constraints (every prompt)

See each file’s **Constraints**. In short: no desktop **More** menu; no merge of `DraftRequests`/`Runs`; no new ADR; no LP-19; no live presence; no Simulator→Real default flip; no GTM **M-90 / M-44 / M-91 / M-92**; no reopen **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#.

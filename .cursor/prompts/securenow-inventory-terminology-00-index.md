<!-- SecureNow Azure inventory terminology — Composer prompts.
     Origin: 2026-09-20 owner ask: backlog items to change snapshot terminology
     (including Snapshot A/B compare labels) to Azure inventory terminology on
     SecureNow infrastructure-evidence surfaces.
     Do not implement from this index. -->

# SecureNow Azure inventory terminology — Composer prompt set (SN-IT-01–SN-IT-06 + hold)

SecureNow sells **repeat professional judgment over proven Azure inventory**. Buyer copy should say **Azure inventory capture** / **inventory capture**, not bare **snapshot**, **Snapshot A**, or **Snapshot B**. Internal types stay `AzureInventorySnapshot` and `snapshotId`.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/securenow-inventory-terminology-0N-*.md` file per Composer / Cloud Agent session.

Wave doc: [`docs/architecture/SECURENOW_INVENTORY_TERMINOLOGY_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_INVENTORY_TERMINOLOGY_COMPOSER_PROMPTS.md). Hold: [`docs/library/SECURENOW_INVENTORY_TERMINOLOGY_HOLD.md`](../../docs/library/SECURENOW_INVENTORY_TERMINOLOGY_HOLD.md).

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | No locked glossary or helper | **SN-IT-01** | `UI_GLOSSARY` row + `securenow-inventory-terminology-copy.ts` |
| 2 | Drift nav/pickers say snapshot | **SN-IT-02** | `i18n.infrastructureDrift`, drift workbench labels, drift help guide |
| 3 | Infrastructure hub still “inventory snapshots” | **SN-IT-03** | `securenow-infrastructure-*`, nav reshape, product doc registry title |
| 4 | Architect metrics From/To snapshot | **SN-IT-04** | `securenow-architect-metrics-copy.ts`, honesty verify hint |
| 5 | Help teaches snapshot compare | **SN-IT-05** | `governance-infrastructure-drift-*`, SH-10–SH-16 infra help rows |
| 6 | No CI ratchet | **SN-IT-06** | Vitest guard for Security-shell infra copy modules |
| 7 | Temptation to rename APIs/types | **SN-IT-HOLD** | Written hold — not implementation |

## Run order

**SN-IT-01** first (glossary + helper). **SN-IT-02** and **SN-IT-03** in parallel after 01. **SN-IT-04** after 01. **SN-IT-05** after 01 (parallel with 02–04). **SN-IT-06** after 02–05 preferred. **SN-IT-HOLD** is not implementation.

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SN-IT-01** | First | TB-645 |
| **SN-IT-02** | After 01 | Drift workbench shipped |
| **SN-IT-03** | After 01 | Infrastructure spine copy modules |
| **SN-IT-04** | After 01 | SA-11 metrics panel |
| **SN-IT-05** | After 01 | SH resolver if Category-1 rows change |
| **SN-IT-06** | After 02–05 | SN-07 pattern optional |
| **SN-IT-HOLD** | Hold | — |

## Product vs company (every prompt)

- **SecureNow** = Security product shell (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`).
- **ArchLucid** = Architecture product + legal company.
- Code identifiers stay `ArchLucid`. Env stays `ARCHLUCID_*`.

## Global constraints (every prompt)

- Read [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) §3 name map first.
- **Do not** rename `/v1/infra-evidence/snapshots`, `snapshotId`, `AzureInventorySnapshot`, or `snapshotAId` / `snapshotBId`.
- **Do not** change Architecture-shell golden manifest / review snapshot copy in SN-IT sessions.
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files.
- UI: Carbon, sentence case, **TB-2005**, **TB-645**. One component per file. No `ConfigureAwait(false)` in tests.
- Stage only files the prompt names. **No `git add -A`.**

## After each prompt

Summarize: files changed, tests run, which buyer strings moved, residual bare **snapshot** on Security infra surfaces, Architecture shell unchanged, and whether **SN-IT-HOLD** still holds.

## Follow-on (not this set)

- **SH-01–SH-26** job-match is orthogonal; **SN-IT-05** only fixes inventory-capture wording inside help that already matches the page job.
- **SN-08** platform identifier hold still applies to repo-wide renames.

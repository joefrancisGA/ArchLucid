<!-- SecureNow data architecture / data flow diagrams — Composer prompts.
     Paste one numbered file per session. Origin: 2026-09-16 owner
     commentary (SAP → ADF → ADLS/SQL → Databricks → Power BI).
     Do not implement from this index. -->

# SecureNow data flow — Composer prompt set (SN-DF-01–SN-DF-08 + hold)

ArchLucid already draws **infrastructure**. Most Azure data diagrams are terrible because they stop there. SecureNow must generate **data architecture** (repositories) and **data flow** (movement) from the same inventory snapshot.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/securenow-data-flow-0N-*.md` file per Composer / Cloud Agent session.

Canonical design: [`docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](../../docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md). Wave doc: [`docs/architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

## Diagnosis (already closed — do not re-diagnose)

Owner commentary (2026-09-16): inventory Data mode is an ARM category filter, not a data-flow diagram. CISO questions are origin / transform / store / consume. Favorite pipeline:

```text
Source systems → Ingestion → Raw storage → Transformation → Curated storage → Analytics → Consumers
```

Causal chain (locked):

1. `DiagramMode.Data` filters `GraphTopologyCategories.Data` + `Storage` and packs by resource group. That is **not** Diagram 3.
2. SQL/Cosmos often stamp **compute** (`Contains("/sql")` misses `Microsoft.Sql/servers`) — **IE-DD-01**, a **dependency**, not this set.
3. ADF Prompt 7 already emits `adfReadsFrom` / `adfWritesTo` when companions exist. Unresolved linked services (**SAP, Oracle, files**) never become nodes, so the left column of every owner example is missing.
4. Databricks / Fabric / Power BI are not in `ExecutiveAlwaysShowTiers`. Empty Transform/Consumer stages must stay **empty** — do not mint fake consumers.
5. Classification (Confidential), TLS version, and classic Level-1 process DFDs are **not** in the extractor. Stamping them as ObservedFact is a hold.

**This is not** IE-DD (Data mode Failed). Do **not** re-run IE-DD-01–04 as greenfield from these chats.

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Sources** | Unresolved ADF linked services drop off the graph | Stable external source nodes (type + host) | **SN-DF-01** |
| **Stages** | RG swimlanes | Source / Ingestion / Storage / Transform / Consumer catalog | **SN-DF-02** |
| **Data Flow compile** | No `DiagramMode.DataFlow` | Stage-ordered compile; hide NIC/VNet/PE; ADF arrows are the spine | **SN-DF-03** |
| **Honesty** | Implied “data flowed” | Legend: declared wiring, not observed traffic | **SN-DF-04** |
| **Workbench** | Mode list has Data only | `dataFlow` (and later `dataArchitecture`) in URL + parser + Ask allowlist | **SN-DF-05** |
| **Data Architecture** | Repositories mixed into Data/Executive | Repositories-only compile; few or no arrows; no network boxes | **SN-DF-06** |
| **Contract** | No Data Flow mermaid assertion | Snapshot compile Succeeded with expected stages/labels | **SN-DF-07** |
| **Empty honesty** | Blank canvas / silent missing companions | Empty-stage caption + completeness codes | **SN-DF-08** |

## What this set does *not* change

Keep: Network / Executive / Identity / existing **Data** mode as the ARM category filter. `flowchart TD` on those modes. IE-17 thresholds. One Azure collector. Reader-only.

Do **not** switch Executive/Network/Data emission to `flowchart LR`. Data Flow **may** use left-to-right stage columns; that change is **SN-DF-03 only**.

Do **not** add App → MI → SQL edges (connection-point P1 — later wave). Do **not** invent Power BI / Fabric / Databricks nodes. Do **not** stamp TLS 1.3 or Confidential. Do **not** generate classic `Order Processing` process DFDs. Do **not** hide desktop review workspace tabs behind **More**.

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **IE-DD-01–04** | Data mode category + Failed ratchet | **Prerequisite** for SQL in Storage — do not re-implement |
| ADF linked service + Prompt 7 pipeline flows | Declared factory→store arrows | **Consume** — do not re-collect ADF in these chats |
| **IE-RF** | Network associations | Stay on Diagram 1; hide on Data Flow |
| **SA-07** capability-to-flow | Path engines, not this canvas | Do not claim packet flow |
| **IDA** aesthetics | Forest cards | Optional later; not required for SN-DF |

## Run order

**01 → 02 → 03.** **04** after 03. **05** after 03 (UI can start after parser exists). **06** after 02 (may parallel 05 if 03 compile helper is shared). **07** after 03 and 05. **08** after 05. **09** is a written hold — not implementation.

Suggested Cloud Agent branch per prompt: `cursor/sn-df-<short-name>-588d`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/securenow-data-diagrams-588d`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `securenow-data-flow-01-external-source-nodes.md` | SAP/Oracle/files never appear |
| 02 | `securenow-data-flow-02-stage-catalog.md` | No stage vocabulary |
| 03 | `securenow-data-flow-03-data-flow-compile.md` | Data mode ≠ data movement |
| 04 | `securenow-data-flow-04-honesty-legend.md` | Diagram reads as observed traffic |
| 05 | `securenow-data-flow-05-workbench-mode.md` | Operator cannot open Data Flow |
| 06 | `securenow-data-flow-06-data-architecture-compile.md` | No repository-only view |
| 07 | `securenow-data-flow-07-mermaid-contract.md` | Compile can drift with no failing test |
| 08 | `securenow-data-flow-08-empty-stages-honesty.md` | Missing companions look like “no data estate” |
| 09 | `securenow-data-flow-09-hold.md` | Written hold — not implementation |

## After each prompt

Summarize: files changed, tests run, whether an ADF Copy into SQL with an unresolved SAP linked service compiles to **Source → Data Factory → Store**, whether Network mode is unchanged, residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Plane wins. One Azure collector. No `terraform apply` / ARM writes.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Implement only *What to build*.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.

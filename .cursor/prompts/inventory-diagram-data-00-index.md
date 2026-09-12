<!-- Inventory diagrams Data mode — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-12 owner screenshot on SecureNow
     Inventory diagrams (Data mode): server mermaid Failed (38 nodes / 70
     edges / 38 subgraphs). Do not implement from this index. -->

# Inventory-diagram Data — Composer prompt set (IE-DD-01–IE-DD-04)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. Data mode must compile and paint when the snapshot has storage / SQL / Cosmos data-plane resources, not a red Failed chip with exports disabled.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-data-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

## Diagnosis (already closed — do not re-diagnose)

Owner screenshot (2026-09-12): Inventory diagrams, mode **Data**, snapshot `bebca1ae-…` (889 resources, captured 2026-09-10). **Render failed · 38 nodes · 70 edges · 38 subgraphs**. Yellow **Diagram render failed for the selected mode.** Export PNG and Export Mermaid disabled. No diagram canvas, no Nodes/Edges outline, no mermaid.js error, no Partitioned cards, no “too large” banner.

Causal chain (locked):

1. Data filter is `DiagramMode.Data` → `GraphTopologyCategories.Data` **and** `Storage`. Storage accounts match because `Contains("/storage")` hits `/storageAccounts`. **38 nodes are real topology nodes** (almost certainly `Microsoft.Storage/*`, including nested blob/queue/table children).
2. `Microsoft.Sql/servers`, `Microsoft.DocumentDB/databaseAccounts`, and `Microsoft.DBfor*` resolve to **compute**. `Contains("/sql")` does not match `Microsoft.Sql/servers` (slash is after `Sql`). Same class as IE-ND-01. Data audit evidence already includes SQL/DocumentDB. Diagrams do not. Cosmos `.../sqlDatabases` is accidentally **data** via `/sqlDatabases`.
3. `DiagramSubgraphPlanner` wraps each node in Subscription → `RG {name}`. 38 nodes / 38 subgraphs is **one cluster per node** (subscription + RGs). Sparse flatten **already includes Data** (threshold 8). A 12-RG storage fixture on this checkout is 0 subgraphs. Owner metrics still show 38 — ratchet it; do not rewrite flatten from scratch.
4. Server Failed is IE-17 **structural validation**. Counts are under thresholds, so this is not Partitioned. `CreateFailedRenderResponse` (catch) sets `Metrics = null` — owner has metrics, so the pipeline returned Failed. Mermaid is withheld. Outline never parses. That is a different bug class than Identity (Succeeded + blank canvas).
5. Unflattened 37-node / 70-edge / 38-subgraph mermaid **Succeeded** on this checkout with `CONNECTS_TO` labels. Nested RG mermaid is not automatically invalid. Owner Failed is a **live-specific emitted line** and/or `~~~` + repairer dropping `IsLayoutOnly`. `ValidationErrors` never reach HTTP or the UI.
6. There is **no** `InfraEvidenceSnapshotMermaidServiceTests` Data-mode contract (Network and Identity exist).

**This is not** an empty Data query (38 nodes), not IE-17 oversized, not `#3013` missing `mermaidSource`, not Identity overlay collapse.

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Category** | SQL/Cosmos accounts/DBfor* stamp compute | Provider-prefix Data/Storage like Network | **IE-DD-01** |
| **Contract** | No Data mermaid snapshot assertion | GET `mode=data` includes storage+SQL labels; sparse compile has no `subgraph`; status not Failed | **IE-DD-02** |
| **Failed ratchet** | Owner 38/70/38 Failed with no test; `~~~` / `IsLayoutOnly` mismatch | Owner-shaped Data is Succeeded + mermaid; validator accepts emitted syntax | **IE-DD-03** |
| **Honesty** | Failed StatusTag only | First validation error on the render response and the workbench | **IE-DD-04** |

## What this set does *not* change

Keep: `#3013` client mermaid compile. `#2951` / **IE-ND-03** / **IE-ID-01** flatten for Executive / Data / Network / Identity. **IDV** / **IDC** / **IDL** camera and layout. `flowchart TD`. Outline tables. Server PNG export. Partitioned fallback. URL `diagZoom` / `diagFullscreen`.

Do **not** switch emission to `flowchart LR`. Do **not** restore `min-h-[18rem]`. Do **not** flatten Full Subscription. Do **not** re-run IE-ND-01 as greenfield (network prefix stays). Do **not** add Key Vault / Redis / Synapse to Data unless the diagnosis table is extended by the owner. Do **not** collapse desktop review workspace tabs behind **More**.

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **IE-ND-01** | `Microsoft.Network/` provider prefix | **Copy the pattern** for Sql / DocumentDB / DBfor / Storage |
| **IE-ND-03** / **IE-ID-01** | Sparse RG flatten includes Data already | **Ratchet only** — do not re-implement |
| **IE-ND-02** / **IE-ID-02** | Snapshot mermaid contracts | **Do** the Data equivalent |
| **IE-ND-05** | mermaid.js throw is not “too large” | Keep; Failed stays Failed with a reason |
| **IDL-01** | Layout `~~~` + `IsLayoutOnly` | Repairer/validator leftover is **IE-DD-03** |

## Run order

**01 → 02.** **03** after 01 (may parallel 02). **04** after 03.

- **01** must not change the viewer or IE-17 thresholds.
- **02** must not flatten (already on trunk) except to assert “no subgraph” on a 12-RG fixture.
- **03** must not change Failed copy (04). Must not rewrite flatten from scratch.
- **04** must not auto-paint Failed mermaid.

Suggested Cloud Agent branch per prompt: `cursor/data-diagram-<short-name>-ed1e`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/inventory-diagram-data-prompts-ed1e`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-data-01-canonical-category.md` | SQL/Cosmos/DBfor* classified compute; Data is storage-only |
| 02 | `inventory-diagram-data-02-snapshot-mermaid-contract.md` | Data mermaid can be empty or Failed with no failing test |
| 03 | `inventory-diagram-data-03-owner-failed-ratchet.md` | Owner Failed 38/70/38; `~~~` / `IsLayoutOnly`; flatten regression |
| 04 | `inventory-diagram-data-04-failed-honesty.md` | Failed UI has no validation reason |

## After each prompt

Summarize: files changed, tests run, whether a SQL-server Data compile has those labels, whether a 12-RG storage Data compile is a flat `flowchart TD`, whether owner-shaped Data is Succeeded with mermaid, whether Failed shows a validation reason, residual risk.

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

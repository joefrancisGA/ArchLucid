> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that add SecureNow **Data flow** and **Data architecture** inventory diagram modes (movement vs repositories). Internal engineering only. **Prompts only** in this PR — do not implement from the tables.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Design:** [`../securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`](../securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md). **Contract:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md). **Hold:** [`.cursor/prompts/securenow-data-flow-09-hold.md`](../../.cursor/prompts/securenow-data-flow-09-hold.md).
> **Paste files:** [`.cursor/prompts/securenow-data-flow-00-index.md`](../../.cursor/prompts/securenow-data-flow-00-index.md) (one numbered file per session).
>
> **Do not** re-implement **IE-DD-01–04** (Data mode category/Failed), **IE-ND**, **IE-RF**, **SA-07** as greenfield. Do not claim observed traffic. Do not mint Fabric/Power BI/Confidential.
> **Follow-on (not this set):** evidence-based probable families on Data Flow — [`SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md`](SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md) (**SN-PE-01–07**). Runtime declared / observed connections (Container Apps env, logs, SQL principals, upload+confirm, inference questionnaire) — [`SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md`](SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md) (**SN-RT-01–10**, **12–13**).

# SN-DF-01–SN-DF-08 — Data architecture vs data flow diagrams

**Observed:** Inventory **Data** mode is an ARM category filter (storage + whatever stamps `data`). Owner commentary (2026-09-16): that does not answer where data originates, who transforms it, where it is stored, or who consumes it. Favorite missing picture: Source → Ingestion → Raw storage → Transformation → Curated storage → Analytics → Consumers.

**Product framing (locked):** three diagrams from one snapshot. Diagram 1 (infrastructure) is shipped. This set adds Diagram 3 (**Data flow**) then Diagram 2 (**Data architecture**). Existing **Data** mode stays the category filter.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Unresolved ADF linked services (SAP/Oracle/files) never become nodes | **SN-DF-01** | Every owner example missing the left column |
| No Source/Ingestion/Storage/Transform/Consumer vocabulary | **SN-DF-02** | Compiler copies of `Contains("sql")` |
| No `DiagramMode.DataFlow`; Data mode ≠ movement | **SN-DF-03** | CISO still gets a forest of ARM boxes |
| Diagram reads as observed traffic | **SN-DF-04** | Dangerous narrator |
| Workbench cannot select Data flow | **SN-DF-05** | Compile is dead code |
| No repository-only view | **SN-DF-06** | Stores mixed with ETL arrows or VNets |
| No snapshot mermaid contract | **SN-DF-07** | Mode filter can drift |
| Missing `adf-pipeline-flows.json` looks like “no data estate” | **SN-DF-08** | Operators do not re-collect |
| Traffic/classification/classic DFD/fake PBI | **SN-DF-HOLD** | Written hold |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|----------|------------|
| **SN-DF-01** External source nodes | **First** | ADF Prompt 7 on trunk |
| **SN-DF-02** Stage catalog | After 01 (catalog can land if 01 helper is stubbed) | Prefer 01 merged |
| **SN-DF-03** Data Flow compile | After 01+02 | IE-DD-01 optional for SQL-in-Data-mode; Data Flow uses ARM stage map |
| **SN-DF-04** Honesty legend | After 03 | |
| **SN-DF-05** Workbench `dataFlow` | After 03 | Parser line may be in 03 |
| **SN-DF-06** Data Architecture mode | After 02; after 05 pattern | May parallel 07 if 03 stable |
| **SN-DF-07** Mermaid contract | After 03+05 | |
| **SN-DF-08** Empty / missing companions | After 05 | |
| **SN-DF-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/sn-df-<short-name>-588d`). Name the branch in any commit/push request.

**Prerequisite (separate chats):** **IE-DD-01** so Inventory **Data** mode also shows SQL. Not required to *start* SN-DF-03 (stage catalog keys off `Microsoft.Sql/`).

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported (`mermaid-import-policy`).
- Data Flow **may** use `flowchart LR` for that mode only. Do **not** change Executive/Network/Identity/Data to LR.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- ADF `adfReadsFrom` / `adfWritesTo` are **declared** pipeline wiring (`DerivedFact`), not runtime.
- Unresolved linked services must become **external** nodes (SN-DF-01), not disappear.
- Empty Transform/Consumer is correct until Databricks/Fabric/Power BI exist in the snapshot.
- Classification, TLS version, and classic process DFDs are out of scope (hold).
- Do not hide PE/VNet on Network mode. Hide them on Data Flow / Data Architecture only.
- New Azure collection (Synapse pipelines, Event Grid, remaining ADF connectors, MI+RBAC) is **AX-DE**, not this set.

---

# SN-DF-01 — External ADF linked-service source nodes

**Depends on:** ADF Prompt 7 · **Branch:** `cursor/sn-df-external-sources-588d`

**Paste file:** [`.cursor/prompts/securenow-data-flow-01-external-source-nodes.md`](../../.cursor/prompts/securenow-data-flow-01-external-source-nodes.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: unresolved ADF linked services (SAP, Oracle, files, HTTPS hosts) must become stable external source nodes at Data Flow compile time — not dropped.

This is NOT IE-DD, IE-RF, or a new collector. Do not persist fake ARM resource rows. Do not claim ObservedFact for synthetic node identity. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md
- docs/architecture/SECURENOW_DATA_FLOW_DIAGRAM_COMPOSER_PROMPTS.md
- .cursor/prompts/securenow-data-flow-00-index.md
- .cursor/prompts/securenow-data-flow-01-external-source-nodes.md

Working-tree: pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>' (exit 2 → skip).

Implement only What to build in the paste file. Tests must fail on current master, pass after.

Do not git add -A. Heartbeat every 8s if compile/test >15s.
```

---

# SN-DF-02 — Data-flow stage catalog

**Depends on:** SN-DF-01 · **Branch:** `cursor/sn-df-stage-catalog-588d`

**Paste file:** [`.cursor/prompts/securenow-data-flow-02-stage-catalog.md`](../../.cursor/prompts/securenow-data-flow-02-stage-catalog.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: one AzureInventoryDataFlowStageResolver maps ARM types and external source flags to Source / Ingestion / Storage / Transform / Consumer. No Contains("/sql") copies.

Read first: .cursor/prompts/securenow-data-flow-02-stage-catalog.md and docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md §1.

Do not add DiagramMode or workbench UI. Do not implement IE-DD-01. Working-tree script before tracked edits. No git add -A.
```

---

# SN-DF-03 — Data Flow compile mode

**Depends on:** SN-DF-01, SN-DF-02 · **Branch:** `cursor/sn-df-compile-mode-588d`

**Paste file:** [`.cursor/prompts/securenow-data-flow-03-data-flow-compile.md`](../../.cursor/prompts/securenow-data-flow-03-data-flow-compile.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DiagramMode.DataFlow compiles Source → Ingestion → Storage from ADF declared wiring. Hide NIC/VNet/PE. MVP: unresolved SAP + Data Factory → SQL/ADLS with Reads from / Writes to.

Do not change Executive/Network/Data to flowchart LR (Data Flow may use LR). Do not mint Power BI. Do not implement the React dropdown (SN-DF-05) except a parser key if needed.

Read first: .cursor/prompts/securenow-data-flow-03-data-flow-compile.md

Working-tree script. No git add -A. Heartbeat every 8s if >15s.
```

---

# SN-DF-04 — Data Flow honesty legend

**Depends on:** SN-DF-03 · **Branch:** `cursor/sn-df-honesty-legend-588d`

**Paste file:** [`.cursor/prompts/securenow-data-flow-04-honesty-legend.md`](../../.cursor/prompts/securenow-data-flow-04-honesty-legend.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Data Flow shows locked copy: "Declared pipeline wiring, not observed traffic. External systems appear when a linked service names them, even if they are not in the subscription."

No TLS or Confidential badges. Network mermaid must not gain this sentence.

Read first: .cursor/prompts/securenow-data-flow-04-honesty-legend.md
Working-tree script. No git add -A.
```

---

# SN-DF-05 — Workbench Data Flow mode

**Depends on:** SN-DF-03 · **Branch:** `cursor/sn-df-workbench-dataflow-588d`

**Paste file:** [`.cursor/prompts/securenow-data-flow-05-workbench-mode.md`](../../.cursor/prompts/securenow-data-flow-05-workbench-mode.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: mermaidMode=dataFlow on /governance/infrastructure/diagrams compiles DiagramMode.DataFlow. Label: Data flow. Keep existing Data mode.

Wire INFRA_DIAGRAMS_MODE_OPTIONS, InfraEvidenceMermaidModeParser, DiagramViewPlanValidator, Ask allowlist.

Read first: .cursor/prompts/securenow-data-flow-05-workbench-mode.md
Do not add dataArchitecture (SN-DF-06). No git add -A.
```

---

# SN-DF-06 — Data Architecture compile mode

**Depends on:** SN-DF-02, SN-DF-05 pattern · **Branch:** `cursor/sn-df-data-architecture-588d`

**Paste file:** [`.cursor/prompts/securenow-data-flow-06-data-architecture-compile.md`](../../.cursor/prompts/securenow-data-flow-06-data-architecture-compile.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DiagramMode.DataArchitecture / mermaidMode=dataArchitecture is a repository catalog (SQL, Cosmos, ADLS, ADF). Few or no arrows. No VNet. No ADF reads/writes on this canvas.

Read first: .cursor/prompts/securenow-data-flow-06-data-architecture-compile.md
Working-tree script. No git add -A.
```

---

# SN-DF-07 — Data Flow mermaid contract

**Depends on:** SN-DF-03, SN-DF-05 · **Branch:** `cursor/sn-df-mermaid-contract-588d`

**Paste file:** [`.cursor/prompts/securenow-data-flow-07-mermaid-contract.md`](../../.cursor/prompts/securenow-data-flow-07-mermaid-contract.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: InfraEvidenceSnapshotMermaidServiceTests (or equivalent) lock mode=dataFlow Succeeded with factory+store labels and no VNet on the MVP fixture.

Copy IE-DD-02 test shape. Do not re-run IE-DD. Read .cursor/prompts/securenow-data-flow-07-mermaid-contract.md
Working-tree script. No git add -A.
```

---

# SN-DF-08 — Empty stages and missing companions

**Depends on:** SN-DF-03, SN-DF-05 · **Branch:** `cursor/sn-df-empty-honesty-588d`

**Paste file:** [`.cursor/prompts/securenow-data-flow-08-empty-stages-honesty.md`](../../.cursor/prompts/securenow-data-flow-08-empty-stages-honesty.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: when adf-pipeline-flows.json is missing, Data Flow shows a re-collect caption. Do not mint Power BI boxes for empty Consumer.

Read first: .cursor/prompts/securenow-data-flow-08-empty-stages-honesty.md
Working-tree script. No git add -A.
```

---

# SN-DF-HOLD — not implementation

**Paste file:** [`.cursor/prompts/securenow-data-flow-09-hold.md`](../../.cursor/prompts/securenow-data-flow-09-hold.md)

Paste only when a session starts observed-traffic claims, Confidential/TLS badges, classic process DFDs, a second collector, or fake Fabric/Power BI nodes.

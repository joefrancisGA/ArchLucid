> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that add **evidence-based probable** families to SecureNow **Data flow** (declared vs authorized vs DNS-joined PE path vs inferred). Internal engineering only. **Prompts only** in this PR — do not implement from the tables.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Design:** [`../securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md`](../securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md). **Hold:** [`../library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md`](../library/SECURENOW_PROBABLE_EVIDENCE_HOLD.md).
> **Paste files:** [`.cursor/prompts/securenow-probable-evidence-00-index.md`](../../.cursor/prompts/securenow-probable-evidence-00-index.md) (one numbered file per session).
>
> **Do not** re-run **AX-DE-01–18**, **AX-DC-01–08**, or **SN-DF-01–08** as greenfield. Do not store numeric confidence. Do not compose PE hops without a DNS join.
> **Follow-on (not this set):** runtime declared / observed connections — [`SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md`](SECURENOW_RUNTIME_CONNECTION_COMPOSER_PROMPTS.md) (**SN-RT-01–10**). Observed traffic is **SN-RT-06/07** (`ObservedRuntime`), never SN-PE **May access**.

# SN-PE-01–SN-PE-07 — Evidence-based probable Data Flow families

**Observed:** Owner advice (2026-09-18) to stop asking “can Azure prove this data flow?” and instead discover **evidence-based probable** flows with confidence. That framing is correct. The relationship engine, Event Grid destinations, and **May access** joins are already collected (**AX-DE**). Executive consumption is **AX-DC**. `DiagramDataFlowEdgeFilter` still allow-lists **only** ADF/Synapse, so Diagram 3 cannot show the second family. Naive “VNet integration + PE = 95% Web App → SQL” is still unjoined and unsafe.

**Product framing (locked):** Data Flow asks “what evidence exists that data could or does move?” Families stay distinct. Bands are ordinal. PE hops require DNS.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Percents / mixed arrow semantics | **SN-PE-01** | `"confidence": 80`; Reads from used for RBAC |
| Apps/messaging have no stage | **SN-PE-02** | Filter opens; nodes still drop |
| ADF-only Data Flow filter | **SN-PE-03** | May access never paints on Diagram 3 |
| PE hop without DNS | **SN-PE-04** | Hub-spoke false positives |
| SB/EH treated as ARM destinations | **SN-PE-05** | Invented producers |
| Legend still ADF-only | **SN-PE-06** | Operators read May access as traffic |
| No contract | **SN-PE-07** | Families regress silently |
| Percents / Kudu / traffic / naive PE | **SN-PE-HOLD** | Written hold |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **SN-PE-01** Family catalog | **First** | AX-DE catalog on trunk |
| **SN-PE-02** Stages | After 01 | SN-DF-02 |
| **SN-PE-03** Filter + endpoints | After 01+02 | `DiagramDataFlowEdgeFilter` |
| **SN-PE-04** PE DNS join | After 01; prefer 03 | IE-RF associations |
| **SN-PE-05** Messaging RBAC | After 03 | Role map |
| **SN-PE-06** Honesty bands | After 03 | SN-DF-04 |
| **SN-PE-07** Contract | After 03+04 | SN-DF-07 shape |
| **SN-PE-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/sn-pe-<short-name>-3bd9`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- Question is evidence, not proven traffic.
- No integer confidence property.
- Event Grid ARM destination is declared; Service Bus/Event Hub producers are not.
- `peReachableTarget` is DerivedFact after DNS join; never 95% Observed.
- Diagnostics stay off Data Flow.
- Do not mint Customer / Power BI.

---

# SN-PE-01 — Evidence family catalog

**Depends on:** AX-DE-01 on trunk · **Branch:** `cursor/sn-pe-family-catalog-3bd9`

**Paste file:** [`.cursor/prompts/securenow-probable-evidence-01-evidence-family-catalog.md`](../../.cursor/prompts/securenow-probable-evidence-01-evidence-family-catalog.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: code-owned Data Flow evidence catalog maps association types to family, PathConfidenceBand, direction, and label. No integer percent. Add peReachableTarget as a DerivedFact catalog string. Do not collect Azure. Do not open DiagramDataFlowEdgeFilter yet.

This is NOT AX-DE, AX-DC, or SN-DF greenfield. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md
- docs/architecture/SECURENOW_PROBABLE_EVIDENCE_DATA_FLOW_COMPOSER_PROMPTS.md
- .cursor/prompts/securenow-probable-evidence-00-index.md
- .cursor/prompts/securenow-probable-evidence-01-evidence-family-catalog.md

Working-tree: pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>' (exit 2 → skip).

Implement only What to build in the paste file. Tests must fail on current master, pass after.

Do not git add -A. Heartbeat every 8s if compile/test >15s.
```

---

# SN-PE-02 — Application and messaging stages

**Depends on:** SN-PE-01 · **Branch:** `cursor/sn-pe-application-stages-3bd9`

**Paste file:** [`.cursor/prompts/securenow-probable-evidence-02-application-and-messaging-stages.md`](../../.cursor/prompts/securenow-probable-evidence-02-application-and-messaging-stages.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: AzureInventoryDataFlowStageResolver adds Application (Web/Function/Container App) and maps Event Grid to Ingestion, Service Bus/Event Hub/Key Vault to Storage. Network and VMs stay omitted. Ordered stages: Source, Application, Ingestion, Storage, Transform, Consumer.

Read first: .cursor/prompts/securenow-probable-evidence-02-application-and-messaging-stages.md and docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md §6.

Do not change DiagramDataFlowEdgeFilter (SN-PE-03). Working-tree script before tracked edits. No git add -A.
```

---

# SN-PE-03 — Data Flow family filter + endpoints

**Depends on:** SN-PE-01, SN-PE-02 · **Branch:** `cursor/sn-pe-data-flow-families-3bd9`

**Paste file:** [`.cursor/prompts/securenow-probable-evidence-03-data-flow-evidence-families.md`](../../.cursor/prompts/securenow-probable-evidence-03-data-flow-evidence-families.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DiagramDataFlowEdgeFilter uses SN-PE-01 IncludeOnDataFlow. Include Application endpoints for May access and Event Grid. Hide diagnostics, VNet, PE. Keep ADF Reads from / Writes to as declared spine.

MVP fixture: SAP + Data Factory → SQL plus Web App May access SQL, no VNet on Data Flow.

Read first: .cursor/prompts/securenow-probable-evidence-03-data-flow-evidence-families.md

Do not implement the DNS join (SN-PE-04). Working-tree script. No git add -A. Heartbeat every 8s if >15s.
```

---

# SN-PE-04 — PE reachable DNS join

**Depends on:** SN-PE-01 · prefer SN-PE-03 · **Branch:** `cursor/sn-pe-pe-reachable-dns-3bd9`

**Paste file:** [`.cursor/prompts/securenow-probable-evidence-04-pe-reachable-dns-join.md`](../../.cursor/prompts/securenow-probable-evidence-04-pe-reachable-dns-join.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: derive peReachableTarget compute→store only when peDnsZoneGroup and privateDnsVnetLink hit the app's VNet. Hub-spoke negative: second VNet-integrated app without the DNS link gets no edge. DerivedFact, never ObservedFact, never 95%.

Read first: .cursor/prompts/securenow-probable-evidence-04-pe-reachable-dns-join.md and docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md §7.

No new ZIP companion. Working-tree script. No git add -A.
```

---

# SN-PE-05 — Messaging RBAC direction

**Depends on:** SN-PE-03 · **Branch:** `cursor/sn-pe-messaging-rbac-3bd9`

**Paste file:** [`.cursor/prompts/securenow-probable-evidence-05-messaging-rbac-direction.md`](../../.cursor/prompts/securenow-probable-evidence-05-messaging-rbac-direction.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: map Azure Service Bus / Event Hubs Data Sender and Data Receiver in AzureInventoryRbacDataPlaneRoleMap. Data Flow shows May write / May read. Do not invent producers from a namespace. Do not add serviceBusToDestination collection.

Read first: .cursor/prompts/securenow-probable-evidence-05-messaging-rbac-direction.md
Working-tree script. No git add -A.
```

---

# SN-PE-06 — Honesty legend and ordinal bands

**Depends on:** SN-PE-03 · **Branch:** `cursor/sn-pe-honesty-bands-3bd9`

**Paste file:** [`.cursor/prompts/securenow-probable-evidence-06-honesty-bands.md`](../../.cursor/prompts/securenow-probable-evidence-06-honesty-bands.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Data Flow legend distinguishes declared pipeline wiring, May access (authorization), and Private network path (DNS-joined PE). Ordinal bands only. No % characters. Network mermaid must not gain this copy.

Read first: .cursor/prompts/securenow-probable-evidence-06-honesty-bands.md
Working-tree script. No git add -A.
```

---

# SN-PE-07 — Mermaid/AST contract

**Depends on:** SN-PE-03, SN-PE-04 · **Branch:** `cursor/sn-pe-mermaid-contract-3bd9`

**Paste file:** [`.cursor/prompts/securenow-probable-evidence-07-mermaid-contract.md`](../../.cursor/prompts/securenow-probable-evidence-07-mermaid-contract.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Data Flow compile contract — ADF spine + May access + Event Grid family; unlinked spoke does not get Private network path; no VNet on Data Flow; Network mode still has the VNet.

Copy SN-DF-07 test shape. Read .cursor/prompts/securenow-probable-evidence-07-mermaid-contract.md
Working-tree script. No git add -A.
```

---

# SN-PE-HOLD — not implementation

**Paste file:** [`.cursor/prompts/securenow-probable-evidence-08-hold.md`](../../.cursor/prompts/securenow-probable-evidence-08-hold.md)

Paste only when a session starts percents, PE hops without DNS, Kudu/secrets, observed-traffic labels, Service Bus-as-Event-Grid, or a second collector.

> **Scope:** Copy-paste prompts **IE-16–IE-22**. Index: [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). Contract: [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md).

# IE-16–IE-22 — Mermaid, diagrams, hub, Ask

Mermaid compiles from `GraphSnapshot` / `DiagramAst`, **never** from raw Terraform. Branding (BR-05) wraps exports; it must not rewrite node semantics.

---

# IE-16 — Mermaid from inventory graph via DiagramAst

**Depends on:** IE-03 · **Branch:** `cursor/snapshot-mermaid-from-diagram-ast-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: compile AzureInventorySnapshot graph into DiagramAst then Mermaid, with modes. Do not scan .tf files. Do not statically import mermaid on UI hot paths.

Read: plane §10; DiagramAst/Node/Edge; MermaidDiagramRenderer; DiagramAstGenerator; WellKnownGraph; mermaid-import-policy.test.ts.

Work:
1. Additive DiagramAst: Subgraphs, Node.SubgraphId, OrderKey. Keep existing quote-escape tests.
2. IDiagramAstFromGraphCompiler.Compile(graph, DiagramMode): Executive, Architecture, Network, Security, Identity, Data, FullSubscription, ResourceGroup, SelectedResources, DependencyNeighborhood. Drop Weight below documented threshold; no fully-connected noise.
3. Subgraphs: Subscription → RG → VNet → Subnet; buckets from GraphTopologyCategories. Deterministic sort by ARM id.
4. Renderer: subgraphs, Mermaid-safe ids, escaped labels.
5. Tests: identical graph → identical text; ResourceGroup filter; executive << full on a 50-resource fixture.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'
Done when: mode-specific Mermaid comes from DiagramAst; Terraform is not an input.
```

---

# IE-17 — Mermaid render pipeline

**Depends on:** IE-16 · **Branch:** `cursor/mermaid-render-pipeline-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: validate → complexity → render → deterministic repair → optional AI repair → revalidate. Never mark an unreadable 8k-node picture Succeeded. AI repair cannot skip parse; cannot drop required CloudResourceIds without CollapseReport. AI explains; it is not the graph.

Work:
1. Metrics: nodes, edges, subgraphs, max degree, cross-subgraph edges, text size, layout estimate.
2. Configurable readable thresholds → Partitioned not Succeeded.
3. Deterministic repair: ids, labels, duplicate edges, partition by RG/mode.
4. Optional LLM repair behind execution mode; must re-parse; semantic integrity check.
5. Fallback set: full machine Mermaid + Executive + per-RG + Network + Identity + Data + cross-boundary + index markdown.
6. Tests: duplicate collapse; AI mock removing a required node rejected; over-threshold Partitioned.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'
Done when: unreadable full graphs cannot be Succeeded.
```

---

# IE-18 — Structured diagram ingest

**Depends on:** IE-04 · **Branch:** `cursor/structured-diagram-ingest-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: ingest Mermaid, SVG, draw.io XML, existing ArchLucid diagram JSON into ArchitectureDiagramModel. ExtractionMethod=StructuredParse. Vision is IE-20.

Do not: PNG/JPEG/PDF/vsdx vision; present boxes as Azure ObservedFact; second CanonicalObject family.

Read: CONTEXT_INGESTION.md; architecture-diagram-types.ts; EVIDENCE_INTAKE_OPERATOR_GUIDE.md.

Work: persist server model (not localStorage-only); fail-soft parsers; POST ingest; service-type dictionary as DeterministicInference confidence < 1 when label-only. Tests: Mermaid fixture; garbage does not throw.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
Done when: structured parse yields components+edges.
```

---

# IE-19 — Diagram-to-infrastructure reconciliation

**Depends on:** IE-03, IE-18 · **Branch:** `cursor/diagram-infra-reconciliation-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: match diagram components to snapshot resources (and Terraform addresses if IE-05 exists). MatchKind Exact/Probable/Possible/DiagramOnly/InfrastructureOnly/Conflict/Unknown. ConfidenceBand Confirmed|Likely|Possible|InsufficientEvidence. AI cannot flip InsufficientEvidence to Confirmed.

Work: name+type+RG exact; public IP vs diagram “private” → at least Likely security discrepancy; optional AI rationale on Possible/Unknown citing correspondence rows.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: correspondence is deterministic and honest.
```

---

# IE-20 — Vision diagram ingest (gated)

**Depends on:** IE-18 · **Branch:** `cursor/diagram-vision-ingest-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: optional vision into ArchitectureDiagramModel. Default ArchLucid:DiagramVision:Enabled=false. ExtractionMethod=VisionAi. Native vsdx not required (export PNG/PDF). Do not merge into AzureInventoryResources as ObservedFact. UI: “AI interpretation (not observed Azure state).” Flag off → 404/409. Simulator canned low-confidence. Invalid schema fail-closed. Update honesty docs you touch — not a buyer OCR guarantee.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj'
Done when: vision cannot be confused with ARM inventory.
```

---

# IE-21 — Resource evidence hub

**Depends on:** IE-05, IE-06, IE-09, IE-16, IE-19, AE-10 (degrade if AE-10 missing) · **Branch:** `cursor/cloud-resource-evidence-hub-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: GET CloudResourceId hub — current config, history, Terraform mapping, diagram correspondence, operational findings, remediation, RBAC, network, evidence pointers, drift, and audit lineage link (AE-10) when present. Join existing tables. Do not build a CMDB write API. Do not mix unlabeled finding streams. Honor evidence-graph pagination (413 / page).

Tests: tenant isolation; 404 unknown; architecture vs operational findings labeled.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: one id opens current config, last diff, findings, and a lineage link without mixing stream types.
```

---

# IE-22 — Ask grounding

**Depends on:** IE-21 · **Branch:** `cursor/ask-infra-evidence-grounding-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Ask answers subscription-change, drift, diagram-gap, pattern-coverage, “architecture as of date”, and (if AE landed) “why is this control evidenced” questions from structured rows with citations. No snapshot in range → insufficient evidence, no hallucinated ARM ids. AI explains cited rows; it does not invent resources. Use IPromptRedactor. Simulator honesty.

Map: since-date → IE-06; security changes → classification filter; Azure not in diagram → IE-19 InfrastructureOnly; drift → IE-07; ExactMatch patterns → IE-11; Recurred status; nearest snapshot CapturedUtc; remediations + diffs; audit lineage ids if AE-10 exists.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: answers cite structured evidence or explicitly say it is missing.
```

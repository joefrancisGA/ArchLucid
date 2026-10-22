> **Scope:** Copy-paste Composer/Cloud Agent prompts that make **shipped** Azure extractor connection evidence visible and honest on inventory diagrams. Internal engineering only. **Prompts only** in this PR — do not implement from the tables.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). **Collection (closed):** [`AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md). **Feasibility:** [`AZURE_CONNECTION_POINT_DISCOVERY.md`](AZURE_CONNECTION_POINT_DISCOVERY.md). **Hold:** [`../library/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md`](../library/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md).
> **Paste files:** [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](../../.cursor/prompts/azure-extractor-diagram-consumption-00-index.md) (one numbered file per session).

# AX-DC-01–AX-DC-08 — Azure extractor diagram consumption

**Observed (2026-09-17):** **AX-DE-01–18** shipped collection — MI+RBAC **May access**, diagnostics, Event Grid, Logic Apps, Synapse, messaging, PaaS children, Service Connector, Tier 1 app-setting hosts. Relationships and `CompletenessWarnings` land on the snapshot. Diagrams and the workbench **still drop** authorization endpoints on Executive, paint Probable/Inferred edges solid, and hide warning strings.

**Product framing (locked):** consume existing ZIP facts on the snapshot → graph → `DiagramAst` → workbench spine. **No new collectors.** **No Azure HTTP at render.** Do not promote authorization or hostname inference to ObservedFact.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Indexes say AX-DE “ready to run” | **AX-DC-01** | Agents re-collect instead of consume |
| Web App→SQL invisible on Executive | **AX-DC-02** | AX-DE-03 edges filtered out |
| **May access** looks like PE | **AX-DC-03** | Honesty regression vs discovery §5 |
| `rbac-scope-too-broad` silent | **AX-DC-04** | Operators trust incomplete graphs |
| Identity mode no auth overlay | **AX-DC-05** | Wrong mode for “what can access?” |
| Outline cannot explain MI edges | **AX-DC-06** | Auditor friction |
| No Executive e2e guard | **AX-DC-07** | Regressions ship unnoticed |
| Hosted vs Tier 1 invisible | **AX-DC-08** | False completeness on hostname inference |
| New collection / promote Inferred | **AX-DC-HOLD** | Written hold |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **AX-DC-01** | First | AX-DE shipped |
| **AX-DC-02** | After 01 | Peering includer pattern |
| **AX-DC-03** | After 01; after IDP-01–02 | `DiagramEdgeVisualKindResolver` |
| **AX-DC-04** | After 01; parallel 02 | Materializer warnings |
| **AX-DC-05** | After 02 | Identity mode filter |
| **AX-DC-06** | After 03; after 04 preferred | Outline components |
| **AX-DC-07** | After 02; prefer 03 | Golden ZIP |
| **AX-DC-08** | After 04 | Warning codes |
| **AX-DC-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/ax-dc-<short-name>-99df`). Name the branch in any commit/push request.

## Shared constraints (every prompt)

- Plane wins. **No new Azure collection.** No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- **AX-DE-01–18** collection is **shipped** — do not re-implement.
- `appAuthorizedAccess` = **May access** (`DerivedFact`) — authorization, not traffic.
- `hostnameInferredTarget` = **Likely connected to** (`DeterministicInference`).
- `ExecutiveVnetPeeringEndpointIncluder` is the pattern for AX-DC-02.
- Stock **IDP-04** maps `DerivedFact` to solid Observed — **AX-DC-03** amends that for inventory connection bands.
- Do not re-run **IE-RF**, ADF Prompt 7, or **SN-DF** as greenfield collection.

---

# Copy-paste wrappers

Paste **one** block per session. The numbered `.cursor/prompts/azure-extractor-dc-NN-*.md` file is the source of *What to build*.

## AX-DC-01 — Docs close-out

**Branch:** `cursor/ax-dc-docs-closeout-99df` · **Paste:** [`.cursor/prompts/azure-extractor-dc-01-docs-closeout.md`](../../.cursor/prompts/azure-extractor-dc-01-docs-closeout.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: mark AX-DE-01–18 shipped (do not re-run); index AX-DC-01–08; update AZURE_CONNECTION_POINT_DISCOVERY.md §10 to Shipped (AX-DE) + consumption gaps → AX-DC. Docs-only preferred.

Read first:
- docs/architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md
- .cursor/prompts/azure-extractor-diagram-consumption-00-index.md
- .cursor/prompts/azure-extractor-dc-01-docs-closeout.md

Working-tree script. No git add -A.
```

## AX-DC-02 — Authorization endpoint inclusion

**Depends on:** 01 · **Branch:** `cursor/ax-dc-authorization-inclusion-99df` · **Paste:** [`.cursor/prompts/azure-extractor-dc-02-authorization-endpoint-inclusion.md`](../../.cursor/prompts/azure-extractor-dc-02-authorization-endpoint-inclusion.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: ExecutiveConnectionEndpointIncluder (peering pattern) keeps appAuthorizedAccess / diagnostic / hostname / linker endpoints on Executive, Identity, Data modes. No collectors.

Read first: .cursor/prompts/azure-extractor-dc-02-authorization-endpoint-inclusion.md
Working-tree script. Tests must fail on master before fix. No git add -A. Heartbeat if >15s.
```

## AX-DC-03 — Connection confidence strokes

**Depends on:** 01 · **Branch:** `cursor/ax-dc-confidence-strokes-99df` · **Paste:** [`.cursor/prompts/azure-extractor-dc-03-connection-confidence-strokes.md`](../../.cursor/prompts/azure-extractor-dc-03-connection-confidence-strokes.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: extend DiagramEdgeVisualKind for Probable (DerivedFact) and Inferred (DeterministicInference). Paint forest/Mermaid/Graphviz + legend. Do not change HumanAssertion declared styling. Do not promote to ObservedFact.

Read first: .cursor/prompts/azure-extractor-dc-03-connection-confidence-strokes.md
Working-tree script. No git add -A. Heartbeat if >15s.
```

## AX-DC-04 — Completeness warnings UI

**Depends on:** 01 · **Branch:** `cursor/ax-dc-completeness-warnings-99df` · **Paste:** [`.cursor/prompts/azure-extractor-dc-04-completeness-warnings-ui.md`](../../.cursor/prompts/azure-extractor-dc-04-completeness-warnings-ui.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: expose completenessWarnings string[] on diagram/snapshot API + DiagramsWorkbenchClient banner. Map rbac-scope-too-broad and app-settings-not-collected-hosted-get-only. No collectors.

Read first: .cursor/prompts/azure-extractor-dc-04-completeness-warnings-ui.md
Working-tree script. No git add -A. Heartbeat if >15s.
```

## AX-DC-05 — Identity authorization overlay

**Depends on:** 02 · **Branch:** `cursor/ax-dc-identity-overlay-99df` · **Paste:** [`.cursor/prompts/azure-extractor-dc-05-identity-authorization-overlay.md`](../../.cursor/prompts/azure-extractor-dc-05-identity-authorization-overlay.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Identity mode shows appAuthorizedAccess / appToKeyVaultRef / hostnameInferredTarget with identity nodes. No full network spine. Reuse AX-DC-02 includer where possible.

Read first: .cursor/prompts/azure-extractor-dc-05-identity-authorization-overlay.md
Working-tree script. No git add -A.
```

## AX-DC-06 — Edge inspector confidence

**Depends on:** 03, 04 preferred · **Branch:** `cursor/ax-dc-edge-inspector-99df` · **Paste:** [`.cursor/prompts/azure-extractor-dc-06-edge-inspector-confidence.md`](../../.cursor/prompts/azure-extractor-dc-06-edge-inspector-confidence.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: InfraEvidenceDiagramOutline edge panel shows provenance, band, inference source, authorization≠traffic hint for May access. Extend API/outline model additively.

Read first: .cursor/prompts/azure-extractor-dc-06-edge-inspector-confidence.md
Working-tree script. No git add -A.
```

## AX-DC-07 — Executive May access e2e

**Depends on:** 02 · **Branch:** `cursor/ax-dc-executive-e2e-99df` · **Paste:** [`.cursor/prompts/azure-extractor-dc-07-executive-may-access-e2e.md`](../../.cursor/prompts/azure-extractor-dc-07-executive-may-access-e2e.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: golden ZIP + Application test + Playwright — Executive shows May access WebApp→SQL. No live Azure.

Read first: .cursor/prompts/azure-extractor-dc-07-executive-may-access-e2e.md
Working-tree script. No git add -A. Heartbeat if >15s.
```

## AX-DC-08 — Hosted vs Tier 1 honesty

**Depends on:** 04 · **Branch:** `cursor/ax-dc-hosted-tier1-honesty-99df` · **Paste:** [`.cursor/prompts/azure-extractor-dc-08-hosted-tier1-honesty.md`](../../.cursor/prompts/azure-extractor-dc-08-hosted-tier1-honesty.md)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: workbench callouts for app-settings-not-collected-hosted-get-only and Tier 1 -IncludeAppSettingsHosts. Legend footnote. No hosted POST.

Read first: .cursor/prompts/azure-extractor-dc-08-hosted-tier1-honesty.md
Working-tree script. No git add -A.
```

## AX-DC-HOLD — not implementation

**Paste:** [`.cursor/prompts/azure-extractor-dc-09-hold.md`](../../.cursor/prompts/azure-extractor-dc-09-hold.md)

Paste only when a session starts new collection, promotes Inferred to ObservedFact, or claims traffic from RBAC/hostname edges.

---

## Suggested compile scopes

| IDs | Tests |
|-----|--------|
| **AX-DC-01** | None (docs) |
| **AX-DC-02** | ArtifactSynthesis `DiagramAstFromGraphCompiler` |
| **AX-DC-03** | ArtifactSynthesis visual kind + UI legend Vitest |
| **AX-DC-04** | Application.Tests + DiagramsWorkbenchClient Vitest |
| **AX-DC-05** | ArtifactSynthesis + Mermaid mode parser |
| **AX-DC-06** | InfraEvidenceDiagramOutline Vitest |
| **AX-DC-07** | Application.Tests + Playwright |
| **AX-DC-08** | DiagramsWorkbenchClient Vitest + Integrations.AzureExtractor |
| **AX-DC-HOLD** | None |

## Related

| Document | Role |
|----------|------|
| [`AZURE_CONNECTION_POINT_DISCOVERY.md`](AZURE_CONNECTION_POINT_DISCOVERY.md) | Proven/Probable/Inferred bands |
| [`AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md) | Collection shipped — do not re-run |
| [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_PROVENANCE_COMPOSER_PROMPTS.md) | Declared vs observed; coordinate IDP-04 with AX-DC-03 |
| [`../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](../library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) | Item 8 Done (AX-DE); item 9 AX-DC |

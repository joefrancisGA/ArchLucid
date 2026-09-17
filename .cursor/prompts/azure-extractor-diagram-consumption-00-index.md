<!-- Azure extractor diagram-consumption Composer prompts.
     Origin: 2026-09-17 after AX-DE-01–18 collection shipped on master.
     Collection is done; diagrams still drop authorization hops, hide completeness warnings,
     and paint Probable/Inferred edges as solid Observed.
     Do not implement from this index. -->

# Azure extractor diagram consumption — Composer prompt set (AX-DC-01–AX-DC-08 + hold)

**AX-DE-01–18** shipped collection: MI+RBAC **May access**, diagnostics, Event Grid, Logic Apps, Synapse, messaging, PaaS children, Service Connector, Tier 1 app-setting hosts. The ZIP and materializers now carry rich `associationType` rows and `CompletenessWarnings`.

Diagrams and the workbench **do not yet consume** that evidence honestly:

1. **Executive / Identity / Data** mode filters drop compute endpoints — Web App→SQL **May access** edges never paint because both endpoints are not in the always-show tier.
2. **IDP-04** maps `DerivedFact` and `DeterministicInference` to solid **Observed** — conflicts with [`AZURE_CONNECTION_POINT_DISCOVERY.md`](../../docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md) Proven / Probable / Inferred bands for authorization vs hostname inference.
3. **`CompletenessWarnings`** persist as `WarningCount` but the UI shows no `rbac-scope-too-broad`, `app-settings-not-collected-hosted-get-only`, ADF gap strings.
4. **Identity mode** may not surface authorization overlay (app→data **May access**).

These prompts extend the **existing** snapshot → graph → `DiagramAst` → workbench spine. They do **not** add collectors, Azure HTTP at render time, or promote Probable/Inferred to ObservedFact.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/azure-extractor-dc-NN-*.md` file per Composer / Cloud Agent session.

Copy-paste docs index: [`docs/architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md`](../../docs/architecture/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_COMPOSER_PROMPTS.md).

Hold: [`docs/library/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md`](../../docs/library/AZURE_EXTRACTOR_DIAGRAM_CONSUMPTION_HOLD.md) (**AX-DC-HOLD**).

Collection (closed): [`docs/architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md`](../../docs/architecture/AZURE_EXTRACTOR_DIAGRAM_ENRICHMENT_COMPOSER_PROMPTS.md) (**AX-DE-01–18**).

Feasibility: [`docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md`](../../docs/architecture/AZURE_CONNECTION_POINT_DISCOVERY.md).

Contracts: [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) (plane wins) · [`docs/library/AZURE_EXTRACTOR.md`](../../docs/library/AZURE_EXTRACTOR.md).

**Do not** re-run **AX-DE-01–18**, **IE-RF**, ADF Prompt 7, or **SN-DF** as greenfield collection. Do **not** treat this set as a V1 assessment scorecard. No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Diagnosis (already closed — do not re-diagnose)

1. `AzureInventoryAppAuthorizedAccessEdgeMapper` emits `appAuthorizedAccess` / **May access** (`DerivedFact`). `hostnameInferredTarget` is `DeterministicInference`. Both land on the graph.
2. `DiagramAstFromGraphCompiler` includes an edge only when **both** endpoints pass the mode node filter. Executive uses `DiagramExecutiveAlwaysShowSelector` (VMs, DBs, storage, factories) — compute apps are often excluded.
3. `ExecutiveVnetPeeringEndpointIncluder` already keeps peering VNets when endpoints would be filtered — **authorization endpoints need the same pattern**.
4. `DiagramEdgeVisualKindResolver` returns **Observed** for everything except HumanAssertion and AiInference — **Probable** and **Inferred** collection edges look like proven wiring.
5. `AzureInventorySecurityEdgeMaterializer.CompletenessWarnings` → snapshot `WarningCount`; no string list on API DTO or `DiagramsWorkbenchClient` banner.
6. Hosted path warns `app-settings-not-collected-hosted-get-only`; Tier 1 `-IncludeAppSettingsHosts` is opt-in — workbench must say so.

## Diagnosis → prompt

| # | Concern | Prompt | What moves |
|---|---------|--------|------------|
| 1 | Indexes still say AX-DE “ready to run”; discovery §10 says Recommended | **AX-DC-01** | Docs close-out: AX-DE shipped; AX-DC indexed; discovery decision record |
| 2 | App→SQL **May access** dropped when Web App not in Executive tier | **AX-DC-02** | Authorization/connection endpoint includer (peering pattern) |
| 3 | RBAC **May access** and hostname **Likely connected** paint solid | **AX-DC-03** | Connection confidence strokes — amend IDP-04 for inventory bands |
| 4 | `rbac-scope-too-broad` invisible to operators | **AX-DC-04** | Expose completeness warning strings via API + workbench banner |
| 5 | Identity mode hides authorization overlay | **AX-DC-05** | Identity mode authorization overlay |
| 6 | Outline cannot answer “why does this line exist?” for MI edges | **AX-DC-06** | Edge inspector: confidence band, inference source, authorization ≠ traffic |
| 7 | No regression guard for Executive **May access** | **AX-DC-07** | Golden fixture + Playwright: WebApp→SQL on Executive |
| 8 | Hosted vs Tier 1 app-settings honesty missing in UI | **AX-DC-08** | Hosted vs Tier 1 callouts (`-IncludeAppSettingsHosts`, warnings) |
| 9 | Temptation to collect more ARM / promote Inferred | **AX-DC-HOLD** | Written hold — not implementation |

## Run order

**AX-DC-01** first (docs only — unblocks honest indexing). **02** before **07** (includer before e2e). **03** after IDP-01–02 landed (coordinate with **IDP-04** — do not blindly run stock IDP-04). **04** may parallel **02** after **01**. **05** after **02**. **06** after **03** and **04** preferred. **07** after **02** (+ **03** preferred). **08** after **04**. **HOLD** is not implementation.

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **AX-DC-01** | First | AX-DE shipped on master |
| **AX-DC-02** | After 01 | `ExecutiveVnetPeeringEndpointIncluder` pattern |
| **AX-DC-03** | After 01; after IDP-01–02 | `DiagramEdgeVisualKindResolver`; discovery §5 bands |
| **AX-DC-04** | After 01; parallel 02 | Materializer warnings already exist |
| **AX-DC-05** | After 02 | Identity mode filter |
| **AX-DC-06** | After 03; after 04 preferred | Outline + inspector components |
| **AX-DC-07** | After 02; prefer 03 | Golden ZIP fixture |
| **AX-DC-08** | After 04 | Warning codes + extractor README |
| **AX-DC-HOLD** | Hold | — |

Suggested Cloud Agent branch per prompt: `cursor/ax-dc-<short-name>-99df`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 00 | `azure-extractor-diagram-consumption-00-index.md` | This index |
| 01 | `azure-extractor-dc-01-docs-closeout.md` | Stale AX-DE / discovery indexes |
| 02 | `azure-extractor-dc-02-authorization-endpoint-inclusion.md` | Filtered-out compute/data endpoints |
| 03 | `azure-extractor-dc-03-connection-confidence-strokes.md` | Solid Probable/Inferred lines |
| 04 | `azure-extractor-dc-04-completeness-warnings-ui.md` | Silent warning count |
| 05 | `azure-extractor-dc-05-identity-authorization-overlay.md` | Identity mode blind to **May access** |
| 06 | `azure-extractor-dc-06-edge-inspector-confidence.md` | Outline lacks band + rationale |
| 07 | `azure-extractor-dc-07-executive-may-access-e2e.md` | No regression guard |
| 08 | `azure-extractor-dc-08-hosted-tier1-honesty.md` | Hosted GET-only invisible |
| 09 | `azure-extractor-dc-09-hold.md` | Written hold |

## Product vs company (every prompt)

- **SecureNow** = Security product in the Security shell.
- **ArchLucid** = Architecture product + legal/company.
- UI copy for infrastructure diagrams lives in **ArchLucid** governance/infrastructure paths unless the prompt names SecureNow Data Flow modes.

## Global constraints (every prompt)

- Read [`docs/library/INFRA_EVIDENCE_PLANE.md`](../../docs/library/INFRA_EVIDENCE_PLANE.md) first. **No new collectors.**
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing tracked files (Linux Cloud: `pwsh` from `$HOME/.local/bin`). Exit 2 → skip and report.
- No Azure HTTP from `DiagramAstFromGraphCompiler` / mermaid routes.
- Do **not** promote `DeterministicInference` or RBAC-only edges to ObservedFact. Authorization = **May access**, not traffic.
- Do **not** re-implement **AX-DE-01–18** collection.
- Do **not** hide desktop review workspace tabs behind **More**.
- Prefer LINQ, concrete types, null checks, blank line before `if` / `foreach` unless first in method. Each new class in its own file. **No `ConfigureAwait(false)` in tests.**
- Stage only files the prompt names. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Implement only *What to build*.

## After each prompt

Summarize: files changed, tests run, modes affected (Executive / Identity / Data / Network), completeness warnings surfaced, visual band changes, residual InsufficientEvidence, AX-DC-HOLD still holds, AX-DE collection not re-touched.

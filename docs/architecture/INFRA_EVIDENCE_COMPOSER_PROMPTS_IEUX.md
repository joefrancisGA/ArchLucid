> **Scope:** Copy-paste prompts **IE-UX-00–IE-UX-05**. Index: [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md). Contract: [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md). Nav contract: [`../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md`](../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md).
>
> **Prerequisite:** IE-01–IE-22, AE-01–AE-10, BR-01–BR-09 landed on trunk. These prompts **surface** existing backend capabilities in operator shell nav (sidebar, mobile drawer, command palette) — they do not add a second Azure collector, `terraform apply`, or ARM writes.

# IE-UX-00–IE-UX-05 — Infrastructure evidence operator surfaces + nav spine

Backend services exist for snapshot diff, advisory Terraform, Mermaid compile/render, diagram reconciliation, resource hub, Ask, and remediation instances — but most are **API-only** or reached via placeholder exports. These batches wire **buyer-visible workbenches** and register them in **operator navigation** (sidebar, mobile drawer, command palette).

**Nav placement (canonical):** new group **`operate-infrastructure`** · label **Infrastructure** · `surface: review-workflow` · Operate layer · prefix **`/governance/infrastructure/*`** (TB-405 governance namespace). Do **not** hide these links behind desktop tab collapse or a More overflow on the primary strip.

**Global constraints (every prompt):**

- Read [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md) first. **One Azure collector.** AI explains evidence; AI is not the evidence.
- Nav: follow [`NAV_CONFIG_CONTRACT.md`](../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md) and [`PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md) §3 contributor drift guard (API policy → nav config → route-tier matrix → nav authority parity → Vitest guards).
- After adding nav hrefs: `python scripts/ci/assert_route_tier_policy_nav.py --sync`; `python scripts/ci/check_nav_authority_controller_parity.py --sync`; update `docs/architecture/ui_route_traffic_estimates.template.md` via sync script if required.
- UI: Carbon, `EnterpriseTable`, Operate disclosure, **no desktop review-workspace tab collapse**, mermaid dynamic import policy (`mermaid-import-policy.test.ts`).
- Do not claim original Terraform, auditor sign-off, or `terraform apply`. Advisory exports must keep reconstruction honesty copy.
- Working-tree check before editing tracked files. Stage only this prompt’s paths. No `git add -A`.
- One scoped compile per batch; one retry on exit 1.

---

# IE-UX-00 — Infrastructure nav spine + route stubs

**Depends on:** IE-01–IE-22 on trunk · **Branch:** `cursor/infra-evidence-nav-spine-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: register Infrastructure evidence destinations in operator shell navigation and add thin Next.js route stubs so later IE-UX batches have stable hrefs.

Read: archlucid-ui/docs/NAV_CONFIG_CONTRACT.md; operate-governance-nav-group-builder.ts; nav-config.ts; nav-shell-visibility.ts; CommandPalette.tsx; MobileNavDrawer.tsx; scripts/ci/data/route_tier_policy_nav_registry.json.

Work — navigation (required):
1. Add NavGroupBuilder `operate-infrastructure-nav-group-builder.ts` (or extend operate-governance ONLY if product direction forbids an 8th group — prefer dedicated group). Group id: `operate-infrastructure`. Label: Infrastructure (i18n OPERATOR_NAV_GROUP_LABELS).
2. Register these hrefs (extended tier, ReadAuthority unless noted):
   - /governance/infrastructure — Infrastructure overview (hub stub)
   - /governance/infrastructure/drift — Drift & snapshots (stub; IE-UX-01)
   - /governance/infrastructure/diagrams — Inventory diagrams (stub; IE-UX-02)
   - /governance/infrastructure/diagram-reconcile — Diagram reconciliation (stub; IE-UX-03)
   - /governance/infrastructure/resources — Resource explorer (stub; IE-UX-04)
   - /governance/infrastructure/ask — Infrastructure Ask (stub; IE-UX-04)
   - /governance/infrastructure/remediation — Remediation factory (stub; IE-UX-05)
3. Wire group into nav-config.ts build pipeline. Ensure SidebarNav, MobileNavDrawer, and CommandPalette expose the same href set (nav-committed-review-gate-drift-guard patterns).
4. Add nav-route-title-parity + nav-authority-controller-parity rows for each new page’s primary GET controller (stub pages may map to a single InfraEvidence hub controller later — document in parity exemptions if nav is stricter than API until IE-UX-04).
5. Sync route_tier_policy_nav_registry + ROUTE_TIER_POLICY_NAV_MATRIX.md; ui_route_traffic_estimates.template.md.

Work — route stubs (required):
1. Under archlucid-ui/src/app/(operator)/governance/infrastructure/ create page.tsx per href above. Each stub: LayerHeader, one-sentence buyer copy (“Shipped in IE-UX-0N”), link to INFRA_EVIDENCE_PLANE.md internal doc — no mutations.
2. Hub page /governance/infrastructure lists the six workbenches as EnterpriseTable deep links (status: Coming soon / Available when sibling batch merges).

Tests:
- operate-infrastructure-nav-group-builder.test.ts — all hrefs present, /governance/infrastructure prefix policy.
- nav-config.structure.test.ts / SidebarNav test — Infrastructure group visible for ExecuteAuthority fixture.
- nav-route-namespace.test.ts — no unregistered cross-namespace hrefs.

Compile: cd archlucid-ui && npm run typecheck
Done when: an operator sees “Infrastructure” in the sidebar with seven links; mobile drawer and Ctrl+K palette match; CI nav guards sync cleanly.
```

---

# IE-UX-01 — Terraform advisory + drift workbench

**Depends on:** IE-UX-00, IE-05, IE-06, IE-07, IE-08 · **Branch:** `cursor/infra-evidence-drift-workbench-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: replace placeholder terraform export with real IE-05 advisory output and ship a Drift workbench at /governance/infrastructure/drift reachable from nav.

Read: AdvisoryTerraformRepresentationService; AzureInventoryDiffService; AzureInventoryDriftClassificationService; InfraEvidenceInventoryController; ArtifactExportController terraform-advisory-export (placeholder); ExportTerraformAdvisoryButton.tsx; plane § Terraform honesty.

Work — API (additive):
1. GET /v1/infra-evidence/snapshots — list snapshots for scope (paged; CapturedUtc desc).
2. GET /v1/infra-evidence/snapshots/{snapshotId}/diffs — list diff summaries for snapshot pairs involving this snapshot.
3. GET /v1/infra-evidence/diffs/{diffId}/changes — paged semantic change rows (resource, classification, property path, old/new).
4. GET /v1/infra-evidence/snapshots/{snapshotId}/terraform-advisory — stream ZIP from IAdvisoryTerraformRepresentationService (mapping.csv + reconstruction.tf stubs + README honesty). Not placeholder.
5. Wire GET …/artifacts/.../terraform-advisory-export to snapshot-bound advisory when run has inventory snapshot; keep placeholder only when no snapshot (explicit degraded banner in UI).

Work — UI (/governance/infrastructure/drift):
1. Snapshot picker (current vs prior vs baseline). Baseline pin action calls existing baseline API.
2. Drift table: classification filters, approval state, link to diff narrative (IE-08) in disclosure panel.
3. Property-level change drawer with citations — no LLM summary without linked rows.
4. Export advisory TF button uses real endpoint; show generation method + uncertainty notes from IE-05.
5. Cross-link: CloudResourceId → /governance/infrastructure/resources/{id} (IE-UX-04 route; graceful “not shipped” if stub).

Do not: terraform apply; fabricate azurerm arguments; hide reconstruction-only labeling.

Tests:
- Application.Tests: diff list + change paging; advisory export includes disclaimer.
- Api.Tests: new routes authorized + OpenAPI snapshot.
- archlucid-ui Vitest: drift page renders snapshot table; export button calls advisory route when snapshot selected.
- Architecture/grep: export path cannot call BuildTerraformAdvisoryPlaceholderExport when snapshot id present.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: nav “Drift & snapshots” opens a working workbench; terraform ZIP is IE-05-backed; placeholder export path is fail-closed when snapshot exists.
```

---

# IE-UX-02 — Large Mermaid production + diagram viewer

**Depends on:** IE-UX-00, IE-16, IE-17, BR-05 · **Branch:** `cursor/infra-evidence-mermaid-workbench-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: operator UI for IE-16/17 Mermaid at scale — view picker, partitioned fallbacks, drill-down, server-side export — at /governance/infrastructure/diagrams (nav link from IE-UX-00).

Read: DiagramAstFromGraphCompiler; MermaidDiagramRenderPipeline; MermaidDiagramReadabilityThresholds; MermaidDiagramFallbackSetBuilder; mermaid-import-policy.test.ts; BrandedDiagramExportService; ArchitectureDiagramViewer / MermaidDiagram.tsx patterns.

Work — API (additive):
1. GET /v1/infra-evidence/snapshots/{snapshotId}/mermaid/preview — returns complexity metrics + status (Succeeded|Partitioned|Failed) per DiagramMode without full text when over threshold.
2. GET /v1/infra-evidence/snapshots/{snapshotId}/mermaid — query mode=executive|network|identity|data|resourceGroup:{name}|full; returns mermaid text + fallback index when Partitioned.
3. GET /v1/infra-evidence/snapshots/{snapshotId}/mermaid/export.png — server-rendered PNG (reuse artifact synthesis path); BR-05 wrapper only on container metadata, never graph nodes.
4. Cache keyed by snapshot content hash + mode (+ branding profile version for export).

Work — UI (/governance/infrastructure/diagrams):
1. Snapshot + mode picker. When Partitioned, show fallback cards (Executive, per-RG, Network, …) with node/edge counts — default Executive.
2. URL sync: ?snapshotId=&mermaidMode=&mermaidView= (reuse wave-43 filter URL patterns).
3. Client render via dynamic import only (policy test). Show “graph too large for browser” with download PNG when over client guard.
4. Drill-down: click subgraph/node → DependencyNeighborhood mode for selected CloudResourceIds.
5. Export menu: PNG (server), Mermaid .mmd, branded PNG when tenant brand active.

Do not: static import mermaid on hot paths; mark 8k-node graphs Succeeded; inject logos as Mermaid nodes.

Tests:
- ArtifactSynthesis.Tests: over-threshold → Partitioned; preview metrics.
- archlucid-ui: view picker renders fallback cards; URL helpers round-trip.
- Ship gate fixture: 5k-node synthetic snapshot returns Partitioned in < budget.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'
Done when: nav “Inventory diagrams” renders mode-specific diagrams with honest partitioned UX and server PNG export.
```

---

# IE-UX-03 — Diagram reconciliation workbench

**Depends on:** IE-UX-00, IE-18, IE-19 · **Branch:** `cursor/infra-evidence-diagram-reconcile-ui-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: diagram ↔ inventory reconciliation workbench at /governance/infrastructure/diagram-reconcile with explainable correspondence rows and conflict → finding handoff.

Read: DiagramInfrastructureReconciliationService; DiagramInfrastructureMatcher; DiagramInfrastructureMatchGuard; ArchitectureDiagramIngestController; ArchitectureDiagramReconciliationController; StructuredDiagramIngestService; sealed-manifest guards.

Work — UI (/governance/infrastructure/diagram-reconcile):
1. Wizard: (a) upload/paste diagram or pick existing ingested diagram (b) select inventory snapshot (c) run reconcile against sealed run when required.
2. Results EnterpriseTable: MatchKind, ConfidenceBand, diagram label, ARM id, explanation column (deterministic reason codes; AI rationale only on Possible/Unknown).
3. Filters: Conflict, DiagramOnly, InfrastructureOnly, Exact, Probable.
4. Row actions: open resource hub (IE-UX-04), copy ARM id, “Create operational finding” (calls existing ingest API with fingerprint from reconciliation row).
5. URL sync for filters + selected diagram/snapshot ids.

Work — API (small additive if needed):
1. GET /v1/infra-evidence/diagrams — list ingested diagrams for scope (if not already exposed).
2. Ensure POST reconcile + GET reconciliation responses are OpenAPI-documented for UI client.

Do not: let AI promote InsufficientEvidence → Confirmed; vision ingest default-on.

Tests:
- Application.Tests: matcher guard unchanged; UI mapper unit tests for explanation strings.
- archlucid-ui Vitest: table filters; conflict row shows both sides.
- Playwright optional: upload sample mermaid → reconcile → Conflict row visible (@release-gate tag if added).

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: nav link opens full reconcile loop; Conflicts are actionable without leaving the page.
```

---

# IE-UX-04 — Cloud resource hub + Infrastructure Ask

**Depends on:** IE-UX-00, IE-21, IE-22, AE-10 · **Branch:** `cursor/infra-evidence-hub-ask-ui-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: resource evidence hub UI and Infrastructure Ask at /governance/infrastructure/resources and /governance/infrastructure/ask — nav entries from IE-UX-00.

Read: CloudResourceEvidenceHubService; InfraEvidenceAskGroundingService; InfraEvidenceAskController; AuditEvidenceLineageService; hub performance note (tenant-wide finding load — fix as part of this batch).

Work — API (performance + discoverability):
1. Add repository methods: GetOperationalFindingsByCloudResourceId, GetRemediationInstancesByCloudResourceId (paged) — stop loading all tenant rows in hub service.
2. GET /v1/infra-evidence/cloud-resources — search/list by name prefix, resource type, RG (paged) for resource explorer landing.
3. Hub: accept assessmentId + auditEvidenceSnapshotId + controlId query params for AE-10 lineage link (document in UI when absent).

Work — UI (/governance/infrastructure/resources):
1. Explorer: search box + filters; table → open /governance/infrastructure/resources/[cloudResourceId].
2. Hub detail tabs: Overview | Drift | Diagram | Terraform | Findings | Remediation | Audit lineage (degraded copy when params missing).
3. Each tab deep-links to IE-UX-01/02/03 workbenches with context prefilled via query string.

Work — UI (/governance/infrastructure/ask):
1. Chat-style or structured prompt form with canned questions (“What changed since baseline?”, “Why is this PIP public?”, “Which control evidences this resource?”).
2. Render citations as links to hub resource rows or diff change ids. InsufficientEvidence state is primary UX, not an error toast.
3. Simulator honesty banner when execution mode simulator.

Tests:
- CloudResourceEvidenceHubServiceTests updated for filtered queries (no full-tenant scan).
- archlucid-ui: hub tabs render; ask shows citations + insufficient evidence state.
- nav-route-title-parity for new list route.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
Done when: nav “Resource explorer” and “Infrastructure Ask” are fully functional; hub loads in O(resources-on-page) not O(tenant findings).
```

---

# IE-UX-05 — Remediation factory operator UI

**Depends on:** IE-UX-00, IE-09–IE-15, IE-UX-04 · **Branch:** `cursor/infra-evidence-remediation-ui-9cc3`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: operator UI for remediation instances and waves at /governance/infrastructure/remediation — exposed in Infrastructure nav group.

Read: RemediationInstanceService; RemediationWaveService; RemediationPrioritizationController; RemediationPatternsController; RemediationFactoryMetricsService; plane § no apply.

Work — API (additive REST surface):
1. POST /v1/infra-evidence/operational-findings/{findingId}/match — expose IE-11 pattern match results.
2. CRUD/list endpoints for remediation instances: create from finding, preflight, approve, execute (advisory emit only), verify, close — thin controllers delegating to existing service (no new business logic).
3. GET metrics summary for dashboard cards (wave progress, open instances by state).

Work — UI (/governance/infrastructure/remediation):
1. Kanban or state-grouped table: Draft → Preflight → Approved → Executed → Verified → Closed.
2. Instance detail: linked finding, matched pattern, advisory TF artifact preview (IE-05), execute disclaimer (“emitted, not applied”), link to resource hub.
3. Wave planner read-only view using IE-15 metrics + prioritization API.
4. Row action: jump to diagram reconcile when finding originated from Conflict row (query param handoff).

Do not: terraform apply; ARM mutations; treat emit-200 as verified without verify step.

Tests:
- RemediationInstanceServiceTests remain green; new Api.Tests for HTTP surface.
- grep/architecture test: no terraform apply in remediation UI code paths.
- archlucid-ui: instance state transitions disabled when preflight fails.

Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
Done when: nav “Remediation factory” shows instance lifecycle end-to-end with honest advisory-only execute copy.
```

---

## Sequencing

| Order | ID | Title | Nav hrefs touched |
|------:|-----|-------|-------------------|
| 1 | **IE-UX-00** | Nav spine + stubs | All seven Infrastructure links |
| 2 | **IE-UX-01** | TF + drift workbench | `/governance/infrastructure/drift` |
| 3 | **IE-UX-02** | Mermaid at scale | `/governance/infrastructure/diagrams` |
| 4 | **IE-UX-03** | Diagram reconcile | `/governance/infrastructure/diagram-reconcile` |
| 5 | **IE-UX-04** | Hub + Ask | `/governance/infrastructure/resources`, `/ask` |
| 6 | **IE-UX-05** | Remediation UI | `/governance/infrastructure/remediation` |

Run **IE-UX-00 first** (or in parallel with IE-UX-01 only if stubs already exist). Each subsequent batch replaces its stub page with the real workbench and marks the hub overview row **Available**.

**Run one prompt per chat.** Branch per prompt: `cursor/<short-name>-9cc3`.

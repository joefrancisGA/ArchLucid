> **Scope:** Copy-paste Composer/Cursor prompts that raise **v10 assessment** weighted qualities at the best credit ROI per token. Internal engineering only — not buyer-facing copy.
> **Scores:** [`../assessments/LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) (v10, 2026-09-09) §2 / §8 / §17 · **Index:** [`.cursor/prompts/v10-quality-roi-00-index.md`](../../.cursor/prompts/v10-quality-roi-00-index.md)
> **Predecessor:** [`V9_QUALITY_ROI_COMPOSER_PROMPTS.md`](V9_QUALITY_ROI_COMPOSER_PROMPTS.md) (**QR-06–QR-15 shipped** on `master`)
> **Do not re-run:** QR-01–QR-15 · DX-01–DX-76 · WK-01–WK-22 · AS-019 / AS-035 / AS-045 / AS-046–AS-049

# v10 quality-ROI Composer prompts (QR-16–QR-25)

**Created:** 2026-09-09 · **Status:** ready to run (one prompt per chat). **DX-77 is not authorized.**

v10 scored **(A) 78.97%**. QR-06–QR-15 closed orchestrator emission, 65-band collectors, diagram citations, Azure-soft TTV, pack-toggle, HIPAA P1, prior-graph, and TF/ARM diagram evidence. AS-049 made inventory **attachable**. The cheapest remaining score movement is **Correctness (78, deficiency 264)** on a new OpenAPI fail-fast red, then **Insight Density (72, deficiency 364)** by merging the bound snapshot and putting ARM/ARN on goldens the gate already knows how to accept — **not** another engine pack.

**Run one prompt per chat.** Feature branch per prompt. Suggested Cloud Agent branch: `cursor/qr-<short-name>-97a4`. Name the branch in any commit/push request. **Do not push to `master`.**

## Why this set, not DX-77

| Quality | v10 score | Deficiency | What credits buy here |
|---------|---------:|----------:|-----------------------|
| Decision-Changing Insight Density | 72 | **364** | QR-17 ObservedFact merge (new information source); QR-18/QR-19 ARM/ARN on existing goldens — **not** a new engine |
| Correctness & Evidence Integrity | 78 | **264** | QR-16 OpenAPI snapshot first; QR-23 bind IDOR/audit |
| AI / Agent Readiness | 76 | 240 | QR-16 generated clients; TB-883 remains owner |
| Time-to-Value | 77 | 230 | QR-17 makes attach change execute; QR-21 stops green-field fiction |
| Proof-of-ROI / GRI / Diff | 76 / 87 / 85 | — | QR-20 ISO slice (Diff). **Owner:** Gate 1 then G-REAL-06. |
| Runtime | 74 | 182 | QR-16 green fail-fast; full `ci.yml` still owner-dispatch |

QR-16 is token-cheap (regen script). QR-17 is the only remaining **generation** lever that is not a new `EngineType`. QR-18/QR-19 stamp properties collectors already read. DX-01–DX-76 already bought the engine program.

## Do not re-run / do not start from this document

| Item | Why |
|------|-----|
| QR-01–QR-15 | Shipped on `master` (`#2619` through `#2679`). |
| AS-049 | Shipped `#2668` — Working desk attach. Do not re-author. |
| AS-019 / AS-035 / AS-045 | Unlabeled NotVerifiable + vsdx case-71 + R5 tests shipped. |
| DX-01–DX-76 | Shipped. Do not add `EngineType`. Do not start DX-77. |
| G-REAL-06 / G-REAL-07 / M-39 / Gate 1 | Owner + staging. Composer cannot fake a real-mode run. |
| Prefix-family `IsThemeEnabled` | PP-01 **rejected**. Exact-id only. |
| TB-883 Graph-RAG ablation | Budget cap TBD. |
| GTM **M-90 / M-44 / M-91 / M-92** | V1.1 human cohorts. |
| SOC 2 CPA (**G-REAL-05**) / third-party pen test (**G-ASSURANCE-02**) | Owner assurance; not `(A)`. |
| `DemotionThreshold` / `InsightDensityDemotionPredicate` | Stay at 65 / DX-01. |
| Desktop review **More** menu | Rejected. |
| AS-076+ Career/Rehearsal | Not this pack. |

## Sequencing

| Prompt | Title | Parallel? | Depends on | Qualities |
|--------|-------|-----------|------------|-----------|
| **QR-16** | Restore OpenAPI v1 snapshot + generated TS types | **First. Nothing else until green.** | none | Correctness, Runtime, AI |
| **QR-17** | Execute merges bound snapshot as ObservedFact (AS-050) | After QR-16 | AS-048/AS-049 shipped | Density, TTV, Correctness |
| **QR-18** | 65-band goldens: product-shaped ARM/ARN/`diagram:` | After QR-16 | QR-08 collectors shipped | Density honesty |
| **QR-19** | `identity-blast-radius` ARM/ARN on golden graphs | After QR-16 | QR-18 optional parallel | Density |
| **QR-20** | `ga-starter` ISO 27001 P1 slice | After QR-16 | QR-12 HIPAA shipped | Differentiability |
| **QR-21** | Unbound architecture labeled estate gap (AS-051) | After QR-16 | AS-046 shipped | TTV, Comprehension |
| **QR-22** | Bound snapshot freshness on the desk (AS-052) | After AS-049 green | AS-049 | TTV, Adoption |
| **QR-23** | Bind/unbind authz + audit + IDOR (AS-055) | After QR-16 | AS-048 | Correctness, GRI |
| **QR-24** | Re-record distribution after 16–19 | After QR-18/QR-19 | QR-18 (prefer QR-19 too) | Density honesty |
| **QR-25** | Remaining path-engine citations | After QR-19 | QR-09 shipped | Density |

**Stop after QR-16 until the OpenAPI fail-fast job is green.** Do not commission DX-77.

---

## Global constraints (paste into every prompt if context drops)

- Each class in its own file. Prefer LINQ. Prefer concrete types over `var`. One blank line before `if` / `foreach` unless first line of a method. Always check nulls. Comment anything a two-year developer would not follow. **No `ConfigureAwait(false)` in tests**.
- Tenant isolation stays database-per-tenant catalogs (ADR 0037).
- **No new finding engine.** Do not add a 5th `AgentType`. Do not add a coverage engine.
- **No new NuGet packages** unless already in `Directory.Packages.props`.
- Do **not** regenerate OpenAPI unless a DTO actually changed — **except QR-16**, whose job is exactly that regen.
- SQL: this set should not need SQL except QR-17 if a merge pointer is missing. If it does, numbered migration **and** the same DDL in `ArchLucid.Persistence/Scripts/ArchLucid.sql`.
- Stage only files this prompt changed. **No `git add -A`.** **Do not push `master`.**
- One scoped compile per prompt; one retry on exit code 1: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath '…'`.
- Do not change `InsightDensityDemotionPredicate`. `DemotionThreshold` stays **65**.
- Do not restore `typed-engine-protected` as a Promote short-circuit (ADR 0070).
- Do not collapse desktop review workspace tabs behind **More**.
- Do not enable prefix-family theme matching on `DeclarationSignalPolicyKeyMap.IsThemeEnabled`.
- Do not fork a second Azure collector. Consume IE snapshot types.

---

# QR-16 — Restore OpenAPI v1 contract snapshot after AS-048 / QR-15

**Closes:** v10 §8 weakness 1 / §17 item 1. Newest completed push [34407627784](https://github.com/joefrancisGA/ArchLucid/actions/runs/34407627784): `.NET: OpenAPI v1 contract snapshot (fail-fast)` **FAIL**; push corset **SUCCESS**. AS-048 attach/detach DTO landed; QR-15 may have added `SourceEvidenceItemId` on diagram bind models.
**Depends on:** none — **run first**
**Branch suggestion:** `cursor/qr-16-openapi-snapshot`

### Design intent

Mechanical regen. Do not redesign attach/detach. Do not weaken backward-compat assertions. Use the repo script so `openapi-v1.contract.snapshot.json` and generated TS types stay in lockstep.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: restore a green OpenAPI v1 contract snapshot after AS-048 inventory attach/detach and any QR-15 diagram bind DTO drift. Do not change attach semantics. Do not add EngineType. Do not push master.

Why: v10 Correctness is 78 because run 34407627784 failed OpenApi_v1_json_is_backward_compatible_with_committed_snapshot while Decisioning Suite=Core was green. Generated clients and the fail-fast job are the cheapest remaining correctness/runtime lever.

Read first:
- docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md (ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh)
- docs/library/API_CONTRACTS.md
- ArchLucid.Api.Tests/OpenApiContractSnapshotTests.cs
- ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json
- Architecture inventory bind controllers / DTOs from AS-048
- StructuredDiagramCanonicalBinding SourceEvidenceItemId if it is on the wire after QR-15

Work:

1. Confirm the failing assertion locally:
   dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj --filter FullyQualifiedName~OpenApi_v1_json_is_backward_compatible_with_committed_snapshot

2. From repo root, regenerate:
   ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh
   If the environment is Windows-first, use the equivalent documented in PRIVATE_BETA_TRUNK_SMOKE.md / API_CONTRACTS.md. Do not hand-edit snapshot JSON.

3. Re-run the snapshot test and any generated-types drift tests. Commit only snapshot + generated api-types + any script-touched buyer snapshot the script already updates.

4. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'

Do not: redesign bind API; add routes; weaken snapshot assertions; push master; batch this with AS-050.

Done when: OpenApiContractSnapshotTests pass locally; generated TS matches the snapshot; git status shows only contract/types files this script produced.
```

**Done when:** OpenAPI fail-fast would be green on this SHA. Attach/detach behavior unchanged.

---

# QR-17 — Execute merges bound snapshot nodes as ObservedFact (AS-050)

**Closes:** v10 §8 weakness 2 / §17 item 2. `ArchitectureInventoryBindingService` attach/detach + AS-049 desk control exist. Execute does not overlay snapshot resources onto `GraphSnapshot`.
**Depends on:** QR-16 green (any wire change will need a snapshot). AS-048/AS-049 already on `master`.
**Branch suggestion:** `cursor/qr-17-observedfact-merge`

### Design intent

If a binding exists and snapshot rows are readable, merge into the derived graph as `ObservedFact` before typed engines run. Document order: inventory overlay, then diagram bind (AS-018). If IE snapshot storage is unreadable, skip merge and keep AS-051 gap — do not fake CloudResourceId nodes. Do not merge operational security findings into `FindingsSnapshot`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: AS-050 — when an architecture has a bound inventory snapshot and the snapshot is readable, merge those resources into GraphSnapshot as ObservedFact on review execute. Unbound architectures must not mint inventory nodes. Do not fork a second Azure collector. Do not add EngineType. Do not flip AgentExecution:Mode. Do not push master.

Why: v10 Insight Density is 72. Attach is visible (AS-049) and execute still pretends the estate was never there. This is the remaining information source, not another engine.

Read first:
- docs/library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md (AS-050 row)
- docs/architecture/adrs/0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md
- .cursor/prompts/architecture-spine-050-graph-merge-observedfact-from-snapshot.md
- ArchLucid.Application/Architecture/ArchitectureInventoryBindingService.cs
- Execute / graph-build path that already compiles structured diagrams (AS-016)
- ArchLucid.Application/InfraEvidence/AzureInventorySnapshotMaterializer.cs (consume; do not fork)
- StructuredDiagramCompiledGraphBinder (AS-018 bind after overlay)

Work:

1. Find the execute path that builds GraphSnapshot for Working reviews. Insert a merge stage when TryGetBindingAsync returns a binding and snapshot rows exist. ProvenanceKind = ObservedFact. Do not treat diagram label-only nodes as ObservedFact.

2. Order: inventory ObservedFact overlay, then diagram→canonical bind (AS-018) so diagram labels can cite snapshot ARM ids. Document that order in a short comment and in ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md if the table is still "not shipped".

3. Tests (new file per class):
   - Bound fixture snapshot → GraphSnapshot contains ObservedFact nodes with CloudResourceId from the snapshot.
   - Unbound → zero inventory ObservedFact nodes from this merge.
   - Do not copy operational IE findings into FindingsSnapshot.
   No ConfigureAwait(false).

4. If IE snapshot storage cannot be read, skip merge (no fake nodes). Pair with AS-051 honesty only if you must touch copy; prefer leaving QR-21 for the gap banner.

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj' (or Decisioning.Tests if the merge lives there). Then focused tests for the new merge.

6. Regenerate OpenAPI only if a DTO actually changed; if so, use the QR-16 script.

Do not: second collector; mint ARM from LLM prose; AS-076+ Career chrome; push master.

Done when: bound execute graphs carry ObservedFact snapshot nodes; unbound does not; tests fail if merge is removed.
```

**Done when:** Bound execute can cite snapshot `CloudResourceId`. Unbound stays empty of inventory ObservedFact.

---

# QR-18 — 65-band goldens: product-shaped citations the gate already accepts

**Closes:** v10 §8 weakness 4 / §17 item 5. Distribution: `security-baseline` 10 findings at 65, **No evidence = 10**; `declaration-security-baseline` and `topology-security-drift` also 65 / no evidence. QR-08 already added collectors.
**Depends on:** QR-16 not required for graph fixtures; do not batch with OpenAPI. Prefer after QR-16 so CI is green.
**Branch suggestion:** `cursor/qr-18-65-band-arm-goldens`

### Design intent

Do **not** add another collector. QR-08 already calls `FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback`. `HasConcreteEvidenceCitation` accepts ARM (`/subscriptions/…/resourceGroups/…`), `aws:arn:`, GCP `projects/`, resolvable `diagram:`, line-anchored `doc:`, `policy-rule:`, and `graph-node:` only when the remainder is product-shaped. The recorded corpus nodes still lack those ids, so the table stays `No evidence = 10`. Stamp real-shaped ids on the golden graphs those engines already traverse.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: make 65-band golden-corpus findings pass GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation by putting product-shaped ARM/ARN/diagram: (or line-anchored doc:) on the graph nodes those engines already walk. Do not add EngineType. Do not weaken HasConcreteEvidenceCitation. Do not change DemotionThreshold (65). Do not invent a new collector.

Why: v10 density is 72. QR-08 collectors exist. The distribution table still reports security-baseline No evidence = 10 because corpus nodes are label-only. Token-cheap fix is fixture data, not more C# branching.

Read first:
- docs/quality/insight-density-engine-distribution.md (security-baseline, declaration-security-baseline, topology-security-drift)
- ArchLucid.Core/Findings/GenericArchitectureAdvicePatterns.cs HasConcreteEvidenceCitation / IsResolvableEvidenceRef
- ArchLucid.Core/Findings/FindingEvidenceRefs.cs
- ArchLucid.Decisioning/Findings/FindingGraphEvidenceRefs.cs
- ArchLucid.Decisioning/Services/SecurityBaselineFindingEngine.cs
- Golden cases that emit those three engines (grep RegisteredEngineTypeIds / case READMEs)
- ArchLucid.Decisioning.Tests/SecurityBaselineFindingEngineTests.cs (already asserts both false and true citation paths)

Work:

1. Identify which golden graphs produce the ten security-baseline rows (and the two sibling 65-band engines). Do not hand-edit insight-density-engine-distribution.md.

2. Add product-shaped CloudResourceId / ARM / aws:arn: / projects/ properties (or package-resolvable diagram: ids if the case already has a mermaid/vsdx package) on the nodes the engines already include in RelatedNodeIds. Follow existing golden fixture conventions.

3. Unit tests: existing engine tests that expect HasConcreteEvidenceCitation true on a product-shaped node must still pass; add one golden-path test per engine if missing. No ConfigureAwait(false).

4. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
   Then focused engine tests.

Do not: change the gate predicate; restore typed-engine-protected; fake frontier transcripts; re-record the distribution markdown (that is QR-24); push master.

Done when: at least the security-baseline golden path used in Suite=Core shows HasConcreteEvidenceCitation true without loosening the resolver.
```

**Done when:** 65-band engines can cite ARM/ARN/`diagram:` on goldens. Distribution re-record is QR-24.

---

# QR-19 — `identity-blast-radius` ARM/ARN on golden graphs

**Closes:** v10 §8 weakness 5 / §17 item 6. Distribution: `identity-blast-radius` **5 findings, No evidence = 5**, median 72.
**Depends on:** QR-16 green preferred. Can parallel QR-18.
**Branch suggestion:** `cursor/qr-19-blast-radius-arm-goldens`

### Design intent

Same pattern as QR-18 for the 72-band path engine with the worst citation miss. QR-09 already added `diagram:` collection; case-70 gives `data-flow-trust-boundary` a max 100. Blast-radius still has zero concrete citations. Stamp ARM/ARN (or resolvable `diagram:`) on the identity-adjacent nodes the engine already walks. No new engine.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: give identity-blast-radius golden findings at least one citation that HasConcreteEvidenceCitation accepts (ARM, aws:arn:, GCP projects/, or package-resolvable diagram:). Do not add EngineType. Do not weaken the gate. Do not change DemotionThreshold.

Why: v10 density table shows identity-blast-radius 5/5 No evidence at 72. QR-09 diagram collectors exist; this engine's goldens still lack product-shaped ids.

Read first:
- docs/quality/insight-density-engine-distribution.md identity-blast-radius row
- Identity blast-radius finding engine + tests
- FindingGraphEvidenceRefs / FindingDiagramEvidenceRefs
- Golden cases that emit this engine (case READMEs / harness)

Work:

1. Find the five golden findings. Put product-shaped resource ids on the identity/principal/target nodes already in RelatedNodeIds, or attach diagram: citations when a packaged mermaid/vsdx shape is the actor.

2. Tests: HasConcreteEvidenceCitation true on the updated fixture; false path remains for label-only nodes. No ConfigureAwait(false).

3. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
   Then the blast-radius tests.

Do not: new EngineType; prefix-family themes; re-record distribution (QR-24); push master.

Done when: at least one (prefer all five) blast-radius golden finding carries a concrete citation without loosening the resolver.
```

**Done when:** Blast-radius goldens are citable. Do not hand-edit the distribution table.

---

# QR-20 — Next `ga-starter` ISO 27001 P1 slice

**Closes:** v10 §17 item 7. QR-12 shipped HIPAA P1. `iso27001-architecture` bundled keys `iso27001-001`..`iso27001-010` plus scoping remainder (`iso27001-025` and P1 ids) still thin vs HIPAA.
**Depends on:** QR-16 not required unless tests change wire. After QR-12 pattern.
**Branch suggestion:** `cursor/qr-20-ga-starter-iso-slice`

### Design intent

PP-01 Option B, ISO 27001 only. ~15–25 real `ga-starter-compliance.rules.json` rows. Exact-id `DeclarationSignalPolicyKeyMap`. No prefix-family. No `pack.curatedRules.v1` embed.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: PP-01 Option B — extend ga-starter-compliance.rules.json with an ISO 27001 P1 slice, mirroring QR-12 HIPAA. Real appliesToCategory / requiredNodeType / requiredEdgeType. Golden tests. Do not enable prefix-family IsThemeEnabled. Do not embed pack.curatedRules.v1. Do not add EngineType. Do not redo HIPAA.

Why: v10 Differentiability is 85. HIPAA P1 shipped. iso27001-architecture still advertises keys that stay silent at useful floors.

Read first:
- docs/quality/pp01-ga-starter-catalog-extension-scoping.md
- QR-12 HIPAA slice (ga-starter rows + hipaa-architecture.json wiring) as the pattern to copy
- ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/iso27001-architecture.json
- ArchLucid.Decisioning/Findings/DeclarationSignalPolicyKeyMap.cs
- BundledPolicyPackDeclarationThemeTests
- PolicyFilteredDeclarationGoldenCorpusTests

Work:

1. List 15–25 mapped ISO ids you will back (start from bundled iso27001-001..010 plus documented remainder such as iso27001-025). Skip ids that would attach a false PolicyRuleId (see scoping "Deliberately not fixed").

2. Author rules only in ga-starter-compliance.rules.json. Priorities must survive the pack priorityFloor.

3. Exact-id map entries only if needed. No prefix matching.

4. Tests: bundled ISO pack emits at least one declaration theme at a documented floor; golden fails if those ids are removed. No ConfigureAwait(false).

5. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'
   Then Suite=Core bundled-pack tests.

Do not: Option A 144-rule dump; stub rules; prefix-family; push master.

Done when: iso27001-architecture is no longer fully silent at the documented P1 floor.
```

**Done when:** ISO pack emits real declaration rows. Exact-id only.

---

# QR-21 — Unbound architecture: labeled estate gap (AS-051)

**Closes:** v10 §8 weakness 9 / §17 item 8. Zero inventory currently reads like a green field.
**Depends on:** AS-046 shipped. After QR-16 if copy-only (no OpenAPI).
**Branch suggestion:** `cursor/qr-21-estate-gap-honesty`

### Design intent

Working desk + career export: “No inventory snapshot bound — estate not in this review.” Not “0 resources, architecture is fine.” Sponsor PDF must not drop the gap.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: AS-051 — unbound architectures show a labeled estate gap, not an all-clear empty cloud. Do not fake ObservedFact nodes. Do not add EngineType. Do not implement AS-050 in this chat.

Why: v10 TTV/comprehension: after AS-049, operators can see attach, but unbound reviews still look like greenfield success.

Read first:
- .cursor/prompts/architecture-spine-051-honesty-no-snapshot-estate-gap.md
- docs/library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md
- Working desk attach control from AS-049 (reuse; do not restyle)
- Career/sponsor export surfaces that list resource counts

Work:

1. Shared copy helper + tests: unbound ≠ all-clear. Sentence case. TB-645 vocabulary.

2. Working desk shows the gap when TryGetBindingAsync is null. Sponsor/career export must not omit it.

3. Vitest + C# as needed. No ConfigureAwait(false). Visible-boundary Button only.

4. Compile only if C# changed: .\scripts\ci\agent-compile-check.ps1 with the touched project.

Do not: mint inventory; collapse review tabs; push master; AS-050 merge.

Done when: unbound UI/export cannot be screenshotted as “0 resources, fine.”
```

**Done when:** Unbound ≠ all-clear on desk and export.

---

# QR-22 — Bound snapshot freshness on the architecture desk (AS-052)

**Closes:** v10 §17 item 9. AS-049 attach control has no captured-at / age.
**Depends on:** AS-049 merged (`#2668`). Prefer after that typecheck run is green.
**Branch suggestion:** `cursor/qr-22-snapshot-freshness`

### Design intent

Show snapshot captured-at / age next to the bind control. Document a stale-threshold constant. Warn; do not auto-collect (no collector fork).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: AS-052 — show bound snapshot captured-at and age next to the Working attach control. Warn when older than a documented constant. Do not auto-extract. Do not fork a collector. Do not add EngineType.

Why: v10 TTV: yesterday’s snapshot is not today’s estate. Attach without freshness is false confidence.

Read first:
- .cursor/prompts/architecture-spine-052-freshness-architecture-desk.md
- AS-049 Working desk attach control
- IE snapshot captured-at field if already on the bind DTO (consume it)

Work:

1. Age display + warn band beside the existing attach control. Document the stale threshold constant.

2. Vitest for fresh vs stale. No ghost/link Button. Sentence case.

3. OpenAPI regen only if the DTO gained a field the snapshot lacks — then use the QR-16 script.

Do not: auto-collect; second collector; push master.

Done when: freshness is visible without opening IE workbenches.
```

**Done when:** Age is visible next to bind. No collector fork.

---

# QR-23 — Bind/unbind authz, Required audit, IDOR (AS-055)

**Closes:** v10 §17 item 10. Bind is a livelihood write without the ADR 0083 / IDOR ratchet.
**Depends on:** QR-16 green if audit DTOs change. AS-048 shipped.
**Branch suggestion:** `cursor/qr-23-bind-idor-audit`

### Design intent

Required durable audit on attach/detach. Cross-tenant snapshot id fails closed (catalog isolation, no RLS). Same-tenant unauthorized role 403. Do not swallow audit failure.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: AS-055 — attach/detach inventory bindings emit Required durable audit, reject cross-tenant snapshot ids, and 403 unauthorized same-tenant roles. Do not add SQL RLS. Do not weaken ADR 0037. Do not add EngineType.

Why: v10 Correctness/GRI: estate binding is a production-adjacent write. API exists without the IDOR/audit ratchet.

Read first:
- .cursor/prompts/architecture-spine-055-bind-authz-audit-idor.md
- ADR 0083 / TB-956 audit pattern
- docs/library/AUDIT_COVERAGE_MATRIX.md
- ArchitectureInventoryBindingService + controller
- Existing IDOR tests for architecture-scoped writes

Work:

1. Audit event on attach and detach. Failure must not be swallowed.

2. IDOR tests: architecture A cannot bind a snapshot id from another tenant catalog. Same-tenant missing role → 403.

3. Update AUDIT_COVERAGE_MATRIX.md if you add an event type.

4. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
   OpenAPI regen only if the wire changed (QR-16 script).

Do not: RLS; push master; Career/Rehearsal chrome.

Done when: silent bind is impossible and cross-tenant snapshot ids fail closed.
```

**Done when:** No silent bind. Cross-tenant snapshot id fails closed.

---

# QR-24 — Re-record insight-density distribution after QR-18/QR-19

**Closes:** v10 §17 item 11. Table is already case-01..case-72; it will be stale relative to ARM goldens until regenerated.
**Depends on:** QR-18 (prefer QR-19 too). Decisioning.Tests green.
**Branch suggestion:** `cursor/qr-24-distribution-rerecord`

### Design intent

Honesty only. Pass `PriorGraphFixture`. Do not hand-edit cells. Do not add `EngineType`.

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: re-record docs/quality/insight-density-engine-distribution.md from the current golden corpus through LatestGoldenCorpusCaseNumber. Pass PriorGraphFixture so topology-security-drift is not dropped. Do not add EngineType. Do not invent EvidenceRefs. Do not change DemotionThreshold. Do not hand-edit score numbers.

Why: v10 density table still shows 65-band No evidence = 10. After QR-18/QR-19 fixture ids land, the table must be regenerated or it lies.

Read first:
- ArchLucid.Decisioning/Findings/GoldenCorpusHarnessEngineRegistration.cs
- ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs
- InsightDensityEngineDistributionReportTests Record_distribution_markdown_when_env_flag_set
- docs/quality/insight-density-engine-distribution.md

Work:

1. Confirm QR-18 (and QR-19 if merged) is on this branch or master. If 65-band goldens still lack ARM, say so and stop.

2. Record:
   ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1
   dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~Record_distribution_markdown_when_env_flag_set
   Pass PriorGraphFixture the same way DX-73 / QR-07 did.

3. Header must match LatestGoldenCorpusCaseNumber. One sentence: whether No-evidence counts moved.

4. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'

Do not: add EngineType; fake frontier transcripts; push master.

Done when: markdown is generated; header matches the harness constant; tests that parse the header still pass.
```

**Done when:** Table is generated, not typed. No-evidence counts reflect QR-18/QR-19.

---

# QR-25 — Remaining path-engine citations (`segmentation-semantics`, leftover data-flow)

**Closes:** v10 §8 weakness 5 remainder / §17 item 12. `segmentation-semantics` 3/3 no evidence; `data-flow-trust-boundary` still 3/4 no evidence after QR-09.
**Depends on:** QR-19 pattern. After QR-16.
**Branch suggestion:** `cursor/qr-25-path-engine-citations`

### Design intent

Same fixture-property work as QR-18/QR-19. No new engine. Prefer ARM/ARN on segmentation nodes; leftover data-flow rows should use existing `diagram:` when a packaged shape exists (case-70/case-72).

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: remaining path-engine No evidence rows — segmentation-semantics (3/3) and data-flow-trust-boundary leftovers (3/4) — get citations HasConcreteEvidenceCitation accepts. Do not add EngineType. Do not weaken the gate. Do not redo identity-blast-radius (QR-19).

Why: v10 density 72-band path engines are still mostly uncited after QR-09 diagram collectors.

Read first:
- docs/quality/insight-density-engine-distribution.md those two rows
- Segmentation and data-flow finding engines + tests
- FindingDiagramEvidenceRefs / case-70 mermaid package

Work:

1. Stamp product-shaped ids or package-resolvable diagram: on nodes those engines already traverse.

2. Tests: concrete citation true on updated fixtures; label-only remains false. No ConfigureAwait(false).

3. Compile: .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj'

Do not: new engine; re-record distribution (QR-24); push master.

Done when: at least one additional finding per engine would clear No evidence on a later QR-24 record.
```

**Done when:** Remaining 72-band path engines have at least one concrete citation path on goldens.

---

## Owner, not Composer

| Item | Why Composer cannot close it |
|------|-------------------------------|
| Enable merge queue on `master` | GitHub ruleset apply |
| Gate 1 staging first review | Live credentials + ship-gate |
| G-REAL-06 two-pack real-mode | Human sampling |
| TB-883 AOAI budget | Budget |
| G-COMMERCE-01 | Commercial |

**No DX-77.**

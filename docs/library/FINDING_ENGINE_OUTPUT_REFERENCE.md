> **Scope:** Contributor-reference — Reference for **built-in finding engines** — identifiers, owning assemblies, and representative output patterns.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Finding engine output reference

**Last reviewed:** 2026-08-17

**Formal spec:** [`../architecture/architecture_handbook/75-architecture-and-review-engines.md`](../architecture/architecture_handbook/75-architecture-and-review-engines.md) §3.3.

**Source of truth for plugin skip ids:** `ArchLucid.Decisioning.Plugins.BuiltInFindingEngineTypeCatalog.EngineTypeIds`, exposed as `FindingEnginePluginDiscovery.BuiltInEngineTypeIds`. Plugins must use **distinct** `EngineType` values or they are skipped at discovery time.

**Source of truth for what actually runs:** DI registration in `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.Decisioning.cs`. The skip set **equals** the registered `EngineType` set (graph-pure `IFindingEngine` plus effectful `IEffectfulFindingEngine`) — handbook chapter 75 §3.3.2; prompt EK-02.

Decisioning and Cost engines implement **`IFindingEngine`** (graph-pure). Application inventory/cost engines implement **`IEffectfulFindingEngine`** (may query extractors, SQL, or options).

---

## Decisioning (graph-pure)

| Engine id | Implementation | Category | What it analyzes |
|-----------|----------------|----------|------------------|
| `requirement` | `RequirementFindingEngine` | Requirement | Requirement nodes vs graph evidence. |
| `requirement-expectation` | `RequirementExpectationFindingEngine` | Requirement | Expected requirement coverage. |
| `requirement-gap` | `RequirementGapFindingEngine` | Requirement | Missing requirements. |
| `requirement-coverage` | `RequirementCoverageFindingEngine` | Requirement | Requirement coverage scoring. |
| `requirement-cross-run-diff` | `RequirementCrossRunDiffFindingEngine` | Requirement | Name-level delta vs prior context encoded on the current graph. |
| `dr-rpo-topology` | `DrRpoTopologyFindingEngine` | Requirement | Parsed RPO/RTO on linked requirements without replica, failover group, or geo-redundant properties on the scoped SQL/storage/cluster node. Skips when no objective is parsed or the datastore link is missing. |
| `topology-coverage` | `TopologyCoverageFindingEngine` | Topology | Component/service coverage vs topology expectations. |
| `topology-structure` | `TopologyStructureFindingEngine` | Topology | Structural topology properties. |
| `topology-cross-run-diff` | `TopologyCrossRunDiffFindingEngine` | Topology | Topology delta vs prior snapshot metadata on the graph. |
| `topology-anti-pattern` | `TopologyAntiPatternFindingEngine` | Topology | Anti-pattern matches. |
| `security-baseline` | `SecurityBaselineFindingEngine` | Security | Baseline security controls and gaps. |
| `security-baseline-expectation` | `SecurityBaselineExpectationFindingEngine` | Security | Expected baseline controls. |
| `security-baseline-completeness` | `SecurityBaselineCompletenessFindingEngine` | Security | Completeness of baseline nodes. |
| `security-gap` | `SecurityGapFindingEngine` | Security | Security gaps. |
| `security-coverage` | `SecurityCoverageFindingEngine` | Security | Security-relevant coverage across the graph. |
| `policy-applicability` | `PolicyApplicabilityFindingEngine` | Policy | Which policies apply to the snapshot. |
| `policy-coverage` | `PolicyCoverageFindingEngine` | Policy | Policy rule coverage results. |
| `compliance` | `ComplianceFindingEngine` | Compliance | Rule-pack violations → `ComplianceFinding` payloads. |
| `external-exposure` | `ExternalExposureFindingEngine` | Security | External or anonymous **`Actor`** nodes without a matching **`TrustBoundary`** (`actorNodeId`). |
| `segmentation-semantics` | `SegmentationSemanticsFindingEngine` | Security | Parses declared NSG / security group / NetworkPolicy rules for internet-exposed admin inbound ports (22, 3389, 1433, 3306, 5432) when the control is within 3 hops of a datastore or jump box. Does not fire on control presence alone. |
| `insight-generator` | `InsightGeneratorFindingEngine` (+ `PremiumInsightFindingGenerator`) | Security | No-op catalog engine; Real-mode Premium LLM pass proposes up to 8 package-grounded findings after typed engines. Output merged by orchestrator stage, then gated like agent findings. |
| `trust-boundary` | `TrustBoundaryFindingEngine` | Security | Mixed internal/external actor origins with no **`TrustBoundary`** nodes on the graph. |
| `privileged-access` | `PrivilegedAccessFindingEngine` | Security | Internal human **`Actor`** nodes (guided intake or declaration-seeded). |
| `identity-blast-radius` | `IdentityBlastRadiusFindingEngine` | Security | Machine **`Actor`** paths to regulated datastores through allow-listed write/admin role assignments (Contributor, Owner, Key Vault Secrets Officer, AmazonS3FullAccess, `roles/secretmanager.admin`). Graph-pure; unknown roles skipped. |

## Cost (graph-pure)

| Engine id | Implementation | Category | What it analyzes |
|-----------|----------------|----------|------------------|
| `cost-constraint` | `CostConstraintFindingEngine` | Cost | `CostConstraint` graph nodes → cost/architecture findings. When `policyCostRequireBudgetCap=true` is stamped on the context snapshot, emits a warning if topology is present without a parseable `maxMonthlyCost`. |
| `cost-breach` | `CostBreachFindingEngine` | Cost | Constraint breaches. Honors stamped `policyCostBreachSeverity` (minimum Warning) when a breach would already emit. |

## Application (effectful — `IEffectfulFindingEngine`)

These close over extractors, freshness options, or SQL. They do **not** implement `IFindingEngine` (chapter 75, boundary B13; prompt EK-05).

| Engine id | Implementation | What it analyzes |
|-----------|----------------|------------------|
| `orphaned-azure-resource` | `OrphanedAzureResourceFindingEngine` | Azure inventory orphans. |
| `orphaned-aws-resource` | `OrphanedAwsResourceFindingEngine` | AWS inventory orphans. |
| `orphaned-gcp-resource` | `OrphanedGcpResourceFindingEngine` | GCP inventory orphans. |
| `azure-inventory-reconciliation` | `GraphAzureInventoryReconciliationFindingEngine` | Graph vs Azure inventory. |
| `aws-inventory-reconciliation` | `GraphAwsInventoryReconciliationFindingEngine` | Graph vs AWS inventory. |
| `gcp-inventory-reconciliation` | `GraphGcpInventoryReconciliationFindingEngine` | Graph vs GCP inventory. |
| `declaration-inventory-contradiction` | `DeclarationInventoryContradictionFindingEngine` | One finding per resource where a security-relevant declaration property disagrees with scoped live inventory (requires customer-run extractor package; IaC-only reviews stay silent). |
| `azure-inventory-security-baseline` | `AzureInventorySecurityBaselineFindingEngine` | Azure inventory vs security baseline. |
| `declaration-security-baseline` | `DeclarationSecurityBaselineFindingEngine` | Unsafe **`tf.*`**, ARM aliases, and **`k8s.*`** declaration properties on ingested topology rows. Honors tenant **`complianceRuleKeys`** via **`DeclarationSignalPolicyKeyMap`** (CIS Azure/AWS/GCP, SOC 2, GDPR, HIPAA, ISO 27001, PCI-DSS, Zero Trust, sec-base, AKS/EKS/GKE) when mapped keys survive filtering; fail-open for unmapped prefixes (cost-opt, ai-gov, dora, otel, sust-base, …). |
| `declaration-premise-conflict` | `DeclarationPremiseConflictFindingEngine` | Declaration properties that contradict linked **`SecurityBaseline`** / **`PolicyControl`** intent. Uses the same **`DeclarationSignalPolicyKeyMap`** gate as declaration-security-baseline. |
| `aws-inventory-security-baseline` | `AwsInventorySecurityBaselineFindingEngine` | AWS inventory vs security baseline. |
| `gcp-inventory-security-baseline` | `GcpInventorySecurityBaselineFindingEngine` | GCP inventory vs security baseline. |
| `advisor-cost-recommendation` | `AdvisorCostRecommendationFindingEngine` | Cloud advisor cost recommendations. |
| `aws-cost-recommendation` | `AwsCostRecommendationFindingEngine` | AWS cost recommendations from scoped inventory. |
| `gcp-cost-recommendation` | `GcpCostRecommendationFindingEngine` | GCP cost recommendations from scoped inventory. |
| `open-commitment` | `OpenCommitmentFindingEngine` | Overdue deferrals, unanswered evidence requests, expiring/expired waivers, and overdue remediations from governance trail. Joins source-finding text to current-graph topology nodes (`TopologyMatch`, `MatchedTopologyNodeId`); when a deferred public-network or HTTPS theme is still unsafe on the matched node, sets `StillOpenOnCurrentGraph` with `evidence:graph-node:` trace notes. |
| `secrets-lifecycle` | `SecretsLifecycleFindingEngine` | Security | Stale Key Vault / Secrets Manager inventory rows (90+ days since update or expiry within 14 days) when the graph references that vault or secret by name. Requires scoped extractor package; does not call live vault APIs. |
| `portfolio-recurrence` | `PortfolioRecurrenceFindingEngine` | Cross-system recurrence of the same finding identity (ADR 0063 merge key) across the tenant portfolio (same tenant catalog only — ADR 0037). **Default on** — disable per tenant when cross-review reads are undesirable. |

`TechnologyConsistencyFindingEngine` implements **`ITechnologyConsistencyFindingEngine`**, not `IFindingEngine` or `IEffectfulFindingEngine`. It is not in the findings fold.

---

## Output shape (conceptual)

Emit **`Finding`** records (`ArchLucid.Contracts/Findings/Finding.cs`) with:

- **`EngineType`** — stable id from the tables above (or plugin id).
- **`Category`** — must match the engine category after orchestrator fill; mismatch throws.
- **Structured payload** — engine-specific DTOs under **`ArchLucid.Decisioning.Findings.Payloads`**.
- **Severity**, optional **`PolicyRuleId`**, envelope fields (confidence, mute, treatment, model alias, …).

**Orchestrator merge:** parallel invoke of `IFindingEngine` and `IEffectfulFindingEngine`; results are sorted by `EngineType` (ordinal) before join; total failure → `AggregateException`; partial failure → snapshot + `FindingEngineFailure` rows.

**Insight-density gate (production, ADR 0070, DX-01):** `DeterministicInsightDensityGate` scores agent and typed-engine findings. Rows remain on the package; classification follows the demotion predicate when score is below `DemotionThreshold` or the message is generic advice **and** resolvable package evidence is absent (`doc:`, ARM subscription paths, `aws:arn:`, GCP `projects/`, `policy-rule:`, product-shaped `graph-node:` — not bare `RelatedNodeIds` or `request`). Architecture-specific anchors affect score penalties but do not alone prevent demotion. All categories including Security may demote without resolvable evidence. Penalty reason `typed-engine-scored` marks engine origin — telemetry only, not a Promote short-circuit. Per-engine distribution in `docs/quality/insight-density-engine-distribution.md` is golden-corpus **advisory** measurement only.

**Join key (ADR 0063, `FindingSnapshotMergeKey`):** SHA-256 hex (lower) of `NormalizeToken(category)|NormalizeToken(title)` (`Finding.Title` plays the role of `ArchitectureFinding.Message`). When `PolicyRuleId` is present: `{trimmedPolicyRuleId}:{fingerprint}`; otherwise the fuzzy `category|title` token key. Payload-equal partitions (FindingType, Title, Severity, Rationale, Category — ordinal) keep the lowest `EngineType`. Payload-unequal partitions keep that primary **and** append a `FindingEngineFailure` listing EngineType ids and FindingIds — they are not silently dropped.

**UI / exports:** Findings roll into review surfaces, manifest snapshots, and **[PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md)** Pilot vs Operate narratives — the manifest remains the buyer-facing aggregate artifact.

---

## Plugins

External **`IFindingEngine`** implementations can be dropped into **`ArchLucid:FindingEngines:PluginDirectory`**. Assemblies named **`ArchLucid.*`** are ignored in the plugin scan. Parameterless public constructor required. Plugins remain graph-pure; they do not implement `IEffectfulFindingEngine`.

---

## Related

- **[ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md)** — review / authority pipeline context.
- **[V1_SCOPE.md](V1_SCOPE.md)** — which engines and integrations are in headline scope vs deferred.
- **[HOWTO_FINDING_ENGINE_PLUGINS.md](HOWTO_FINDING_ENGINE_PLUGINS.md)** — plugin contract.
- **[ENGINE_KERNEL_REMEDIATION_PROMPTS.md](../architecture/ENGINE_KERNEL_REMEDIATION_PROMPTS.md)** — EK-02, EK-04, EK-05.

## Operator measurement (internal)

| Signal | API | Notes |
|--------|-----|-------|
| Insight desk signal (`DidNotThinkOfThat`, `Expected`, `DismissAsChecklist`) | `POST /v1/runs/{runId}/findings/{findingId}/insight-signal` | Append-only `dbo.FindingInsightSignals`; does **not** change finding classification or replace mute. Internal insight-density numerator — **not** buyer proof or cohort evidence. |

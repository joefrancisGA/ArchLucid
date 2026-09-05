> **Scope:** Contributor-reference â€” curated `/al-bug` hunt zones. Not a buyer or operator document. Agents must not invent extra zones in the same invocation; update this file after each hunt.

# `/al-bug` hunt ledger

Curated zones covering the full product surface (API, persistence, UI, CLI, orchestration, billing, governance, auth, exports, background jobs, analyzers, pipeline engines, core libraries). The picker is `scripts/agent/al-bug-pick-zone.ps1` (explore/exploit + **impact** weight, not LLM ranking). Do **not** invent extra zones mid-hunt. Use `.\scripts\agent\al-bug-pick-zone.ps1 -Nominate` to find gaps.

**Updated:** 2026-08-17 (hypothesis quality bar: unseeded / candidate / hunt-ready / proven / invalid / valid-no-repro).

## How to use

1. Run `.\scripts\agent\al-bug-pick-zone.ps1 -Preview` (add `-Hint 'â€¦'` when the user named an area; add `-Refresh` to recompute git churn).
2. Hunt **only** the returned zone's `paths`. After the picker, announce **seed hunt** or **thorough defect hunt** from `seedHunt` before reading files. Treat `huntReadyHypotheses` as claims; treat `candidateHypotheses` as search lenses until a seed hunt. When `seedHunt` is true because all stored rows are closed, read the source again and generate fresh mechanism-backed hypotheses; an empty list is not a dry-run result. Queued `/al-bug` messages do not shorten a thorough hunt.
3. After the hunt, edit this file (the script does **not** write it):
   - **Hit:** increment `hunts` and `bugs-found`; set `consecutive-dry-hunts` to `0`; set `last-hunt` and `last-bug` to today (`YYYY-MM-DD`); tick the hypothesis as `(proven)`.
   - **Dry:** increment `hunts` and `consecutive-dry-hunts`; set `last-hunt` to today; tick attempted hunt-ready rows as `(valid-no-repro)` or `(invalid)`. Do not invent another bug in the same files.
   - **Seed-only:** increment `hunts`; set `last-hunt`; set `status` to `open`; do **not** increment `consecutive-dry-hunts`. Promote or retire candidates. Do not refill with three harm-class templates.
   - **Reopened:** when JSON `reopened` is `true`, set `status` back to `open`.
4. Record the outcome and print rolling 24h yield: `.\scripts\agent\al-bug-rolling-stats.ps1 -RecordHunt -HuntZoneId '<id>' -HuntOutcome hit|dry|seed-only -Rolling24h`. Commit `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` with the ledger update.

### Zone status

| Status | Meaning |
| --- | --- |
| `unseeded` | Never read for hypotheses. Listed `[ ]` rows are **candidates**. First hunt is a seed hunt. |
| `open` | Seeded or previously hunted. Eligible for normal hunts. |
| `cooling` | Yield dropped; picker waits while any `open` or `unseeded` zone remains. |
| `exhausted` | All three exhaustion conditions hold. Reopens only on git churn. |

New zones start **`unseeded`** with zero hunt-ready rows. Do not template-seed three cross-tenant / stale-cache / fail-open one-liners.

### Hypothesis tags

Open rows:

- `[ ] (candidate) â€¦` â€” harm-class or unverified template. Not hunt-ready. No picker tie-break.
- `[ ] (hunt-ready) â€¦` â€” locus + input + wrong outcome + mechanism filled from **these** files.

Closed rows (never tick a miss as bare `[x]` â€” that counts as proven):

- `[x] (proven) â€¦` â€” failing repro (this hunt or earlier).
- `[x] (invalid) â€¦` â€” claim does not describe this code (missing path, wrong shape).
- `[x] (valid-no-repro) â€¦` â€” claim matches this code; current behavior is correct (cite the test).

Untagged `[ ]` on `unseeded` or `hunts: 0` is treated as **candidate**. Untagged `[ ]` after the zone has been hunted is treated as **hunt-ready**. Untagged `[x]` is treated as **proven**.

A hunt-ready row must name a locus, a concrete input, an observable wrong outcome, and a mechanism. Harm-class-only rows stay `(candidate)` until the files show the prerequisite (join, cache, fail-open catch). After a miss, replacement rows must cite a **different mechanism**.

## Scoring (picker)

Time unit is **hunts**, not wall-clock minutes. Exploit zones with a short mean hunts-per-bug; explore untried / under-sampled zones so the catalog can learn.

```text
mean_hunts_per_bug = hunts / bugs when bugs > 0, else hunts + 2 (prior)
speed              = 1 / mean_hunts_per_bug
explore            = 1 / sqrt(hunts + 1)
precision          = proven / (proven + invalid) when that sum >= 2, else omitted
                     (valid-no-repro is not in the denominator)

base_score =
  6 Ã— speed
+ 3 Ã— explore
+ 2 Ã— recent_churn              (min(3, commitCount since last-hunt))
+ 1 Ã— related_PD_or_TB          (min(2, id count))
+ 0.25 Ã— min(3, hunt-ready open hypotheses)
+ 0.5 Ã— precision               (0 when omitted)
âˆ’ 2 Ã— consecutive_dry_hunts

score = base_score Ã— impact_multiplier   (high Ã—1.40, medium Ã—1.00, low Ã—0.65)
```

Hunt-ready count is a small tie-break only. Candidate/template rows must not inflate score or lock the catalog. Precision rewards zones whose hypotheses matched the code; it does not punish valid-no-repro exhaustion.

Eligibility: `open` and `unseeded` always; `cooling` only when no `open` or `unseeded` zone remains; `exhausted` only when git shows commits on `paths` since `last-hunt`.

## Nominate mode

`.\scripts\agent\al-bug-pick-zone.ps1 -Nominate -Preview` returns the same ranked pick with `nominate: true` in JSON â€” use it to preview which catalog row the picker would surface next when widening coverage.

## Exhaustion (all must hold)

1. Every listed hypothesis has a passing regression test, or was retired as `(invalid)` or `(valid-no-repro)`.
2. **3 consecutive dry hunts**.
3. **No production-path commits** in that zone since `last-hunt`.

Set `status` to `cooling` when yield has dropped (for example two dry hunts) but exhaustion is not complete. Set `exhausted` only when all three conditions hold.

---
## Zone: topology-proposal-merge

- **id:** topology-proposal-merge
- **status:** open
- **impact:** medium
- **aliases:** topology merge; merge gate; graph merge
- **paths:** ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalMergeGate.cs; ArchLucid.Application/Runs/Orchestration/AgentTopologyProposalGraphMerge.cs
- **test-filter:** FullyQualifiedName~AgentTopologyProposalMergeGateTests|FullyQualifiedName~AgentTopologyProposalGraphMergeTests
- **hunts:** 15
- **bugs-found:** 10
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-23 — hunt #50: greenfield compliance declared endpoints but graph merge dropped dangling edges
- **related-pd-tb:** none
- **code-changed-since:** unknown

High historical yield. **Not exhausted** Î“Ã‡Ã¶ remaining hypotheses are type-family and post-processor disagreements, not the parameterized alias cases already covered.

### Hypotheses

- [x] Renamed manifest labels not aliased to inventoried graph node ids
- [x] Synthetic `svc-` / `ds-` keys vs graph SourceId
- [x] Terraform SourceId vs graph SourceId
- [x] ARM resource id with whitespace
- [x] Storage vs data category for datastore synthetic ids
- [x] Cost/compliance relationship-only edges with a rename overlay
- [x] Classic `azurerm_cdn_profile` / `cdn_endpoint` Data-category nodes omit `svc-` synthetic (only `cdn_frontdoor` was recognized)
- [x] (proven) Merge gate keeps a relationship but graph merge drops the edge for a type family not in parameterized tests — **hit 2026-08-23 hunt #50:** greenfield compliance-only proposals materialized endpoint aliases but not nodes, so `DropDanglingEdges` removed relationships the gate kept; fixed by materializing declared services/datastores on empty graphs.
- [x] (valid-no-repro) Duplicate node-id collision when overlay and inventoried node share SourceId but different labels — `TryClaimService` blocks materialization when terraform id already indexed
- [x] (valid-no-repro) Gate vs merge disagreement after structural post-processor strips a relationship — post-processor defers undeclared endpoints to gate; strip branch unreachable when both declared
- [x] (valid-no-repro) Relationship-only follow-up when rename overlay is in a different agent result filtered out by inventory — cross-result follow-up passes when rename `ServiceId` matches inventoried node; correctly rejects undeclared rename labels
- [ ] (hunt-ready) `AgentTopologyProposalMergeGate.FilterValidatedProposals` with a Cost/Compliance agent whose `SanitizeProposal` strips every service/datastore/relationship but leaves `RequiredControls` — agent row vanishes from `validatedResults` when `ProposalIsEmpty` is false for controls-only yet the result id was never stored because an earlier empty-sanitize `continue` dropped the whole `AgentResult` (findings/claims lost at commit).
- [ ] (hunt-ready) `AgentTopologyProposalGraphMerge.MergeEndpointAliasesInto` (`TryAdd` first-wins) with two agents mapping the same relationship endpoint key to different node ids in one batch — second agent's `MapRelationships` resolves to the first alias while `DropDanglingEdges` drops edges whose resolved ids are absent from `graph.Nodes` union `added`.
- [ ] (hunt-ready) `AgentTopologyProposalGraphMerge` topology pass with `materializeNodes == true` and claimed services skip `AddDeclaredManifestServiceEndpointAliases` — a relationship referencing only a pre-registered merge-gate key not mirrored in node `Label`/`NodeId`/`svc-{name}` produces zero edges after `TopologyProposalRelationshipEdgeMapper.MapRelationships`.

---

## Zone: arm-terraform-source-ids

- **id:** arm-terraform-source-ids
- **status:** open
- **impact:** medium
- **aliases:** ARM resource ids; terraform source id; endpoint index
- **paths:** ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEdgeMapper.cs; ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEndpointIndex.cs
- **test-filter:** FullyQualifiedName~TopologyProposalRelationshipEdgeMapperTests|FullyQualifiedName~AgentTopologyProposalGraphMergeTests
- **hunts:** 52
- **bugs-found:** 53
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-26
- **last-bug:** 2026-08-26 — `azurerm_purview_account` Terraform id omitted from `LooksLikeTerraformServiceSourceId` (`purview` was only listed for datastore aliases)
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] ARM resource id indexed in the endpoint index but not resolved by the edge mapper â€” retired (invalid on current code): tf.id / tf.resource_id already indexed and resolved; rename via ARM ServiceId already matches
- [x] Terraform SourceId claimed in merge but missing from alias resolution â€” fixed: NodeMatchesService/Datastore now compare ServiceId/DatastoreId to Label (tf show JSON address-on-label shape)
- [x] Endpoint keyed by a property bag value that is not a SourceId
- [x] (proven) New Terraform resource type missing from `LooksLikeTerraformDatastoreSourceId` / `LooksLikeTerraformServiceSourceId` drops synthetic endpoint keys on category-mismatched nodes — **hit 2026-08-24:** `azurerm_storage_share` (plus queue/table) omitted from datastore list; regression in gate + merge tests
- [x] (proven) `azurerm_active_directory` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** only `azuread` substring was listed; `azurerm_active_directory.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_cognitive_services_account` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** only `cognitive_account` / `cognitive_deployment` substrings were listed; `azurerm_cognitive_services_account.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_monitor_data_collection_rule` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** only `data_collection_endpoint` was listed; `azurerm_monitor_data_collection_rule.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_cognitive_account` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** only `cognitive_services` / `cognitive_deployment` were listed; `azurerm_cognitive_account.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_log_analytics_workspace` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `log_analytics` was only in the datastore list; `azurerm_log_analytics_workspace.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_application_insights` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `application_insights` was only in the datastore list; `azurerm_application_insights.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_key_vault` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `key_vault` was only in the datastore list; `azurerm_key_vault.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_search_service` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `search_service` was only in the datastore list; `azurerm_search_service.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_eventhub_namespace` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `eventhub_namespace` was only in the datastore list; `azurerm_eventhub_namespace.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_synapse_workspace` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `synapse_workspace` was only in the datastore list; `azurerm_synapse_workspace.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_data_factory` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `data_factory` was only in the datastore list; `azurerm_data_factory.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_redis_cache` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `redis_cache` was only in the datastore list; `azurerm_redis_cache.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_cosmosdb_account` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `cosmosdb` was only in the datastore list; `azurerm_cosmosdb_account.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_mssql_server` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `mssql` was only in the datastore list; `azurerm_mssql_server.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_storage_account` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `storage_account` was only in the datastore list; `azurerm_storage_account.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_postgresql_flexible_server` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `postgresql` was only in the datastore list; `azurerm_postgresql_flexible_server.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_mysql_flexible_server` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `mysql` was only in the datastore list; `azurerm_mysql_flexible_server.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_sql_server` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `sql_server` was only in the datastore list; `azurerm_sql_server.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_sql_managed_instance` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `sql_managed_instance` was only in the datastore list; `azurerm_sql_managed_instance.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_mariadb_server` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `mariadb` was only in the datastore list; `azurerm_mariadb_server.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_sql_database` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `sql_database` was only in the datastore list and `mssql` does not match legacy `azurerm_sql_database.main`; Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_private_endpoint` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `private_endpoint` was only in the datastore list; `azurerm_private_endpoint.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_redis_enterprise_cache` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `redis_enterprise` was only in the datastore list; `azurerm_redis_enterprise_cache.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_machine_learning_workspace` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `machine_learning` was only in the datastore list; `azurerm_machine_learning_workspace.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_databricks_workspace` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `databricks` was only in the datastore list; `azurerm_databricks_workspace.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_kusto_cluster` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `kusto_cluster` was only in the datastore list; `azurerm_kusto_cluster.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_app_configuration` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `app_configuration` was only in the datastore list; `azurerm_app_configuration.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_stream_analytics_job` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `stream_analytics` was only in the datastore list; `azurerm_stream_analytics_job.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_iothub` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `iothub` was only in the datastore list; `azurerm_iothub.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_eventgrid_topic` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `eventgrid` was only in the datastore list; `azurerm_eventgrid_topic.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_netapp_volume` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `netapp` was only in the datastore list; `azurerm_netapp_volume.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_recovery_services_vault` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `recovery_services` was only in the datastore list; `azurerm_recovery_services_vault.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_managed_disk` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `managed_disk` was only in the datastore list; `azurerm_managed_disk.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_powerbi_embedded` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `powerbi` was only in the datastore list; `azurerm_powerbi_embedded.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_maps_account` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `maps_account` was only in the datastore list; `azurerm_maps_account.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_digital_twins_instance` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `digital_twins` was only in the datastore list; `azurerm_digital_twins_instance.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_media_services_account` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `media_services` was only in the datastore list; `azurerm_media_services_account.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_data_share` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `data_share` was only in the datastore list; `azurerm_data_share.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_elastic_san` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `elastic_san` was only in the datastore list; `azurerm_elastic_san.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_healthcare_workspace` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `healthcare_workspace` was only in the datastore list; `azurerm_healthcare_workspace.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_backup_vault` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `backup_vault` was only in the datastore list; `azurerm_backup_vault.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (proven) `azurerm_storage_share` Terraform address omitted from `LooksLikeTerraformServiceSourceId` — **hit 2026-08-24:** `storage_share` was only in the datastore list; `azurerm_storage_share.main` on Data-category nodes dropped `svc-` synthetic aliases; regression in gate + merge tests
- [x] (valid-no-repro) `TopologyProposalRelationshipEndpointIndex.AddManifestServiceEndpointAliases` (overlay path) with `ManifestService.ServiceId` = full ARM resource id and relationship `SourceId` = normalized ARM form only — overlay omits `AddArmResourceIdResolutionAliases` unlike `AddDeclaredManifestServiceEndpointAliases`, but endpoint dictionaries use `OrdinalIgnoreCase` and `TryResolveNodeId` normalizes ARM lookups, so mixed/normalized casing does not drop edges on current code.
- [x] (valid-no-repro) `TopologyProposalRelationshipEdgeMapper.TryResolveNodeId` with relationship endpoint = mixed-case ARM id — `FilterRelationshipOnlyProposals` uses raw `Contains`, but `declaredBatchEndpointKeys` is case-insensitive and `AddArmResourceIdEndpointKeys` registers normalized ARM aliases during batch declaration, so batch-local relationships are not dropped.
- [x] (proven) `TopologyProposalRelationshipEndpointIndex.AddGraphNodeSyntheticLabelEndpointKeys` on inventoried node `Category = Data/Storage` and `SourceId` not matching `LooksLikeTerraformServiceSourceId` — **hit 2026-08-26:** `azurerm_purview_account` omitted from service heuristic list; Data-category nodes indexed only `ds-{label}` so `svc-catalog` relationships were filtered and edges dropped; regression in gate + merge tests

---

## Zone: tenant-settings-sql

- **id:** tenant-settings-sql
- **status:** open
- **impact:** high
- **aliases:** tenant settings; DefaultTenant FK
- **paths:** ArchLucid.Persistence/Tenancy/SqlTenantSettingsRepository.cs; ArchLucid.Persistence/Tenancy/CachingTenantSettingsRepository.cs
- **test-filter:** FullyQualifiedName~SqlTenantSettingsRepository
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — upsert during in-flight cached read could pin stale miss after write completed
- **related-pd-tb:** PD-003
- **code-changed-since:** unknown

**PD-003** (DefaultTenant FK + TenantSettings tenant-plane SQL) was Fixed on RC11/RC12 and is **not merged**. Do not treat PD-002 / TB-867 (ServiceNow wrong SQL catalog, Done) as open work in this zone.

### Hypotheses

- [x] Tenant-plane SQL still uses the host catalog or a hardcoded tenant id (retired Î“Ã‡Ã¶ `SqlTenantSettingsRepositoryConnectionFactoryContractTests` + PD-003 fix on master)
- [x] Cache wrapper returns stale miss after upsert when setting-key casing differs (`TenantSettings_TryGetAsync_refreshes_after_upsert_when_setting_key_casing_differs`)
- [x] DefaultTenant FK insert/update disagrees with the cached read path (retired Î“Ã‡Ã¶ PD-003 disposition merged on master: `ArchLucidPersistenceStartup` ApiKey DefaultTenant bootstrap + scoped `ISqlConnectionFactory`; repository uses same `tenantId` on read/write/cache keys)
- [x] (proven) Upsert during an in-flight cached read pins a stale miss after the write completes — **hit 2026-08-24:** `CachingTenantSettingsRepository` only removed the hybrid-cache key on upsert; a slow `TryGetAsync` loader could still publish a miss after the upsert; fixed by generation-stamped cache keys bumped on write/delete; regression in `TenantSettings_TryGetAsync_reflects_upsert_when_read_started_before_write_completed`
- [ ] (hunt-ready) `CachingTenantSettingsRepository.TryGetAsync` with hybrid-cache loader started before `UpsertAsync` completes — without generation-stamped keys, a slow loader can publish a miss after upsert (regression guard exists; verify delete/upsert bumps generation on all code paths including `DeleteAsync` and bulk invalidation).
- [ ] (hunt-ready) `SqlTenantSettingsRepository.UpsertAsync` with concurrent readers on the same tenant id — read path uses snapshot isolation while upsert uses row lock; verify no path returns pre-upsert defaults when upsert commits between read start and materialization.

---

## Zone: ui-form-validation

- **id:** ui-form-validation
- **status:** open
- **impact:** low
- **aliases:** form validation; signup form; TB-2005
- **paths:** archlucid-ui/src/components/marketing/SignupForm.tsx
- **test-filter:** SignupForm
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-16
- **last-bug:** never
- **related-pd-tb:** TB-2005
- **code-changed-since:** unknown

TB-2005 program is **Done** (2026-07-29). Hunt remaining form gaps against `docs/library/UI_DESIGN_SYSTEM.md` and `.cursor/rules/UI-Form-Validation-Affordances.mdc` (disable primary until hard client validation passes; field errors on the form; `showError` toasts only for system/async failures).

2026-08-16 dry hunt: listed hypotheses do not hold on `SignupForm`. Submit stays disabled for empty/invalid required fields; invalid keyboard submit shows inline `role="alert"` messages and does not call `showError` or fetch.

### Hypotheses

- [x] Primary submit stays enabled while required fields are empty or invalid
- [x] Validation errors appear only in a toast, not on the form
- [x] Hard client checks are skipped when the form is submitted with the keyboard

---

## Zone: commit-output-integrity

- **id:** commit-output-integrity
- **status:** open
- **impact:** medium
- **aliases:** output integrity; commit integrity
- **paths:** ArchLucid.Application/Runs/Orchestration/CommitOutputIntegrityService.cs; ArchLucid.Application/Runs/Orchestration/RealCommitAgentOutputQualityGateEvaluator.cs; ArchLucid.Core/AgentEvaluation/AgentExecutionTraceLatestPerTaskSelector.cs
- **test-filter:** FullyQualifiedName~AuthorityDrivenArchitectureRunCommitOrchestratorIntegrityTests|FullyQualifiedName~RealCommitAgentOutputQualityGateEvaluatorTests|FullyQualifiedName~AgentExecutionTraceLatestPerTaskSelectorTests
- **hunts:** 8
- **bugs-found:** 7
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — TaskId casing-only variants bypassed in-memory upsert supersession, leaving duplicate same-attempt rows that blocked commit via latest-per-task selector
- **related-pd-tb:** TB-2226
- **code-changed-since:** yes

### Hypotheses

- [x] Integrity check accepts a payload whose declared artifact hashes do not match committed bytes Î“Ã‡Ã¶ fixed as quality-gate mismatch: `QualityRejected` ignored when `RecordedQualityGateOutcome` was Accepted/Warned
- [x] Missing optional artifact is treated as a hash match Î“Ã‡Ã¶ retired: not applicable to commit quality-gate paths; superseded-retry trace selection was the real gap
- [x] Integrity failure is logged but commit still proceeds Î“Ã‡Ã¶ retired: inverse bug found; superseded rejected traces incorrectly blocked commit after successful auto-retry
- [x] Latest-per-task selector breaks on equal `CreatedUtc` and picks a superseded rejected schema-remediation attempt over a later accepted attempt Î“Ã‡Ã¶ fixed: tie-break on `AttemptIndex` then `TraceId` in `AgentExecutionTraceLatestPerTaskSelector`
- [x] (proven) `AgentExecutionTraceLatestPerTaskSelector` sorts `CreatedUtc` before `AttemptIndex`, so a superseded rejected attempt with a newer timestamp blocks commit after a higher `AttemptIndex` accepted retry — **hit 2026-08-23 hunt #37:** order by `AttemptIndex` then `CreatedUtc` then `TraceId`
- [x] (valid-no-repro) `RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons` with `StructuralExecutionMode.Real`, `PilotStrict`, and empty `traces` — TB-2226 fail-closed scope is recorded rejections on persisted traces, not trace-count presence; empty list yields no rejection to block (lifecycle Complete remains a separate commit guard).
- [x] (valid-no-repro) `RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons` with `StructuralExecutionMode` not equal to `Real` — simulator/non-real bypass is intentional (`GetBlockingReasons_when_simulator_mode_returns_empty`).
- [x] (valid-no-repro) `RealCommitAgentOutputQualityGateEvaluator` with `RecordedQualityGateOutcome != Rejected` but `QualityRejected == true` — dual-flag defense is intentional (`GetBlockingReasons_when_quality_rejected_flag_set_with_non_rejected_recorded_outcome_still_blocks`).
- [x] (proven) `AgentExecutionTraceLatestPerTaskSelector` — empty `TaskId` collapsed unrelated agent traces into one retry chain — **hit 2026-09-02 (#507):** two PilotStrict traces with `TaskId=""` kept only the lexicographically greatest `TraceId`, hiding a rejected topology trace behind an accepted cost trace; fixed by grouping missing task ids per `TraceId` (`Select_when_task_id_missing_keeps_each_trace_distinct`, `GetBlockingReasons_when_task_id_missing_groups_by_agent_type_not_single_empty_task`).
- [x] (proven) `AgentExecutionTraceLatestPerTaskSelector` — empty `TaskId` keyed by `TraceId` left superseded same-agent retries blocking commit — **hit 2026-09-03 (#578):** #507 over-correction kept rejected attempt 0 and accepted attempt 2 as separate groups for the same `AgentType`; fixed by grouping missing task ids per `agent:{AgentType}`; regression in `Select_when_task_id_missing_chains_same_agent_retries_by_attempt_index` and `GetBlockingReasons_empty_task_id_same_agent_retry_ignores_superseded_rejected_trace`
- [x] (proven) `AgentExecutionTraceLatestPerTaskSelector` case-insensitive `TaskId` grouping vs persistence `SharesRunTaskAgent` ordinal match — **hit 2026-09-04 (#710):** casing-only TaskId variants skipped in-memory upsert supersession, leaving duplicate same-attempt rows; fixed `SharesRunTaskAgent` to use `OrdinalIgnoreCase` for `TaskId` (`ShouldRemoveExisting_removes_same_attempt_when_task_id_differs_only_by_casing`, `CreateAsync_upserts_same_attempt_when_task_id_differs_only_by_casing`, `Select_when_task_id_differs_only_by_casing_chains_retries`, `GetBlockingReasons_when_task_id_differs_only_by_casing_chains_retries`)
- [x] (invalid) `CommitOutputIntegrityService.EnsureCreateTimePinsUnchangedOrThrowAsync` returns when `header` is null — `EnsurePassOrThrowAsync` calls `EnsureArchitectureVersionPinnedOrThrowAsync` first, which throws when the run header is missing before pin verification runs

2026-09-04 thorough hunt #710: proved TaskId casing upsert mismatch; cheap-disproof on null-header pin skip (architecture-version guard runs first).

---

## Zone: content-safety-admission

- **id:** content-safety-admission
- **status:** cooling
- **impact:** medium
- **aliases:** content safety; admission gate; prompt injection
- **paths:** ArchLucid.Application/Runs/Orchestration/CompositeRequestContentSafetyPrecheck.cs; ArchLucid.Application/Runs/Orchestration/LlmSemanticAdmissionGate.cs; ArchLucid.Application/Runs/Orchestration/DefaultRequestContentSafetyPrecheck.cs
- **test-filter:** FullyQualifiedName~DefaultRequestContentSafetyPrecheckTests|FullyQualifiedName~LlmSemanticAdmissionGateTests
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — hunt #45: Default precheck omitted Environment and list fields from injection scan
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Composite short-circuits to allow when one inner precheck throws — exceptions propagate; composite does not catch and allow.
- [x] (invalid) Semantic admission gate skips deterministic precheck failures — `CompositeRequestContentSafetyPrecheck` accumulates failures from every inner precheck (Default then Semantic).
- [x] (valid-no-repro) Default precheck allows an executable injection pattern covered by AgentRuntime regression tests — `PromptInjectionExecutableRegressionTests.Precheck_blocks_expected_prompts` already exercises `expectedBlockedAt=precheck` fixtures.
- [x] (proven) Default precheck omitted `Environment`, `Constraints`, and other list/snapshot fields from `PromptInjectionPatternSignals` scan, allowing injection to pass create-time admission and reach agent objectives (`TechnologyLedgerObjectiveComposer`).
- [ ] (hunt-ready) `DefaultRequestContentSafetyPrecheck.EvaluateAsync` scans each document's `Name` and `Content` but not `SourceDocumentUrl`; a URL string containing a known injection instruction can pass admission even though sibling request fields use `PromptInjectionPatternSignals.AccumulateForField`.

2026-08-23 dry hunt #46: no open hypotheses remain after hunt #45 fix; composite/semantic paths already retired or proven.

---

## Zone: storage-vs-data-category

- **id:** storage-vs-data-category
- **status:** open
- **impact:** medium
- **aliases:** storage vs data; structural post-processor; consistency gate
- **paths:** ArchLucid.Application/Runs/Orchestration/AgentProposalStructuralPostProcessor.cs; ArchLucid.Application/Runs/Orchestration/CrossAgentProposalConsistencyGate.cs
- **test-filter:** FullyQualifiedName~AgentProposalStructuralPostProcessorTests|FullyQualifiedName~CrossAgentProposalConsistencyGateTests
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-16
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

2026-08-16 dry hunt: listed hypotheses do not hold on `AgentProposalStructuralPostProcessor` / `CrossAgentProposalConsistencyGate`. Neither file rewrites datastore category (`storage` vs `data`); synthetic `ds-` aliases are unchanged. Existing keep-path tests (26) pass; the gate does not drop a relationship the post-processor retained under current claim/validation key unions.

### Hypotheses

- [x] Post-processor rewrites a datastore to `storage` while the consistency gate still keys it as `data`
- [x] Consistency gate drops a relationship the post-processor just added
- [x] Category rewrite does not update synthetic `ds-` aliases
- [ ] (hunt-ready) `AgentProposalStructuralPostProcessor.ShouldRetainDeclaredProposalRelationship` with proposal declaring a datastore plus relationship using `svc-{datastoreName}` — `CollectKnownEndpointKeys` indexes `ds-{name}` but not `svc-{name}` for manifest datastores; both endpoints appear declared under raw `Contains`, yet `RelationshipEndpointsAreKnown` drops the edge when both source/target match declared keys.
- [ ] (hunt-ready) `CrossAgentProposalConsistencyGate.FilterRelationshipOnlyProposals` with relationship endpoints present only as normalized ARM ids — `declaredBatchEndpointKeys` may hold raw plus normalized keys from `AddArmResourceIdEndpointKeys`, but `Contains(relationship.SourceId)` on an unnormalized relationship id marks `sourceDeclaredInBatch` false and retains the row for later gates while `validationEndpointKeys` still fail `RelationshipEndpointsAreKnown`, silently stripping edges before merge.
- [ ] (hunt-ready) `CrossAgentProposalConsistencyGate.TryAcceptRenameAliasService` accepting a rename — adds manifest endpoint keys to `claimedServiceEndpointKeys` after an earlier agent already claimed the stable id, but `declaredBatchEndpointKeys` was collected pre-claim without the renamed label, so downstream relationship-only proposals referencing only the new name miss batch declaration checks.

---

## Zone: authority-pipeline-payload

- **id:** authority-pipeline-payload
- **status:** open
- **impact:** medium
- **aliases:** authority payload; pipeline work payload
- **paths:** ArchLucid.Application/Runs/Orchestration/AuthorityPipelineWorkPayload.cs
- **test-filter:** FullyQualifiedName~AuthorityPipelineWorkPayloadJsonTests|FullyQualifiedName~AuthorityPipelineWorkPayloadDocumentsNullElementTests
- **hunts:** 8
- **bugs-found:** 10
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-03
- **last-bug:** 2026-09-03 — empty `{}` infrastructure declaration objects survived payload materialization
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (proven) JSON round-trip drops a required work field and the processor still dequeues — **hit 2026-08-24:** blank/missing `projectId` passed worker gate until `IngestAsync` threw; `IsValidForProcessing` + processor validation; regression in `IsValidForProcessing_rejects_blank_project_id`
- [x] (invalid) Unknown payload version is treated as the current contract — no `payloadVersion` field in contract; not applicable until versioned envelope ships
- [x] (proven) Tenant id in the payload is not the tenant used for SQL — **hit 2026-08-24:** stale `contextIngestionRequest.projectId` slug drove `GetLatestAsync` instead of persisted `dbo.Runs.ProjectId`; worker now overwrites from run row; regression in `ProcessPendingBatchAsync_overwrites_stale_payload_project_id_from_persisted_run`
- [x] (proven) Malformed outbox JSON retried until dead-letter instead of invalid-payload discard — **hit 2026-08-24:** `Deserialize` threw `JsonException`; `TryDeserialize` swallows and marks processed; regression in `Deserialize_returns_null_for_malformed_json` / `ProcessPendingBatchAsync_when_payload_malformed_json_marks_processed_without_dead_letter`
- [x] (proven) Explicit `null` list properties in JSON cause connector NRE — **hit 2026-08-24:** `inlineRequirements: null` etc. left null after STJ; `EnsureMutableCollections` materializes empty lists; regression in `Deserialize_materializes_null_list_properties`
- [x] (proven) Explicit `null` document elements in JSON arrays cause connector NRE — **hit 2026-08-24:** `documents: [null]` survived STJ; `DocumentConnectorPayloadNormalizer` dereferenced null entries; `MaterializeDocumentList` filters null reference elements; regression in `Deserialize_removes_null_document_elements`
- [x] (proven) Zero-width-only `EvidenceBundleId` passes `IsValidForProcessing` and dead-letters instead of invalid-payload discard — **hit 2026-08-24:** U+200B is not `IsNullOrWhiteSpace`; `HasSubstantiveText` rejects format/control-only ids; regression in `IsValidForProcessing_rejects_zero_width_only_evidence_bundle_id` / `IsValidForProcessing_rejects_blank_evidence_bundle_id`
- [x] (proven) Explicit `null` string elements inside JSON list arrays cause connector NRE — **hit 2026-08-24:** `inlineRequirements: [null, "keep-me"]` kept null entries after STJ; `InlineRequirementsPayloadNormalizer` NRE on `requirement.Length`; `MaterializeStringList` filters null entries; regression in `Deserialize_filters_null_string_list_entries`

2026-08-24 dry hunt #6: no open hypotheses; re-tested null-document / gate paths — `MaterializeDocumentList` already filters `[null]` before `IsValidForProcessing`; aligned stale repro test with filter semantics (`Deserialize_filters_null_document_elements_before_worker_gate`).
- [x] (proven) `IsValidForProcessing` rejects blank payload `projectId` before worker can overwrite from `dbo.Runs` — **hit 2026-08-24:** gate ran before `GetByIdAsync`; whitespace-only `projectId` marked processed instead of resuming; fixed by dropping non-authoritative `ProjectId` from `IsValidForProcessing`; regression in `IsValidForProcessing_allows_blank_project_id_because_worker_overwrites_from_persisted_run` / `ProcessPendingBatchAsync_recovers_blank_payload_project_id_from_persisted_run`
- [x] (proven) `HasSubstantiveText` allowed embedded format/control characters in `EvidenceBundleId` — **hit 2026-08-26:** `\u200Bbundle-1` passed `IsValidForProcessing` but `EvidenceBundleId.Trim()` left zero-width chars, so post-pipeline bundle lookup failed and retried instead of invalid-payload discard; fixed by rejecting any format/control character in the id; regression in `IsValidForProcessing_rejects_embedded_zero_width_in_evidence_bundle_id`.
- [x] (proven) `MaterializeInfrastructureDeclarationList` filtered null references only — **hit 2026-09-03:** STJ `infrastructureDeclarations: [{}]` deserialized to default `format=json` with null `name`/`content`; empty objects reached `JsonInfrastructureDeclarationParser` instead of being stripped at materialization; fixed by requiring substantive `name` and `content` (`Deserialize_filters_empty_infrastructure_declaration_objects`).

2026-09-03 thorough hunt #582 (hit): proved empty infrastructure declaration objects survived payload materialization.

2026-08-26 seed hunt #7: proved embedded zero-width evidence bundle ids; reseeded empty infrastructure declaration object candidate.

2026-08-24 dry hunt #6: no open hypotheses; re-tested null-document / gate paths — `MaterializeDocumentList` already filters `[null]` before `IsValidForProcessing`; aligned stale repro test with filter semantics (`Deserialize_filters_null_document_elements_before_worker_gate`).

## Zone: technology-ledger-merge

- **id:** technology-ledger-merge
- **status:** open
- **impact:** medium
- **aliases:** technology ledger; ledger merge policy
- **paths:** ArchLucid.Application/Runs/Orchestration/TechnologyLedgerAgentProposalMergePolicy.cs
- **test-filter:** FullyQualifiedName~TechnologyLedger
- **hunts:** 5
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-26
- **last-bug:** 2026-08-26 — technology name internal whitespace allowed duplicate assumed rows when evidence ref absent
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Duplicate technology names from two agents both survive merge — **hit 2026-08-24:** merge only consulted `Chosen` rows; repeated Assumed proposals with same role/provider/name all inserted; regressions in `Resolve_skips_duplicate_assumed_when_no_chosen_exists` / `Resolve_skips_duplicate_assumed_when_chosen_provider_differs`
- [x] (proven) Merge policy ignores a seeded ledger row when the proposal uses a different casing — **hit 2026-08-24:** `TechnologyName` compared with ordinal case; `postgresql` vs `PostgreSQL` duplicated; regression in `Resolve_treats_technology_name_case_insensitively`
- [x] (proven) Topology re-seed with same `EvidenceRef` duplicated agent rows — **hit 2026-08-24:** merge ignored stable `agentTopologyProposal:*` refs; regression in `Resolve_skips_when_evidence_ref_already_present`
- [x] (proven) Same `EvidenceRef` duplicated when provider family differed — **hit 2026-08-24:** dedupe required matching `ProviderFamily` before evidence-ref check; regression in `Resolve_skips_when_evidence_ref_matches_across_provider_families`
- [x] (invalid) Ledger merge keeps an agent-proposed technology that the inventory already replaced — inventory/evidence rows are `Chosen`; same `ProviderFamily` proposals are already skipped via chosen-family gate; name-level dedupe now also matches authoritative `Chosen` rows
- [x] (proven) Same provider family and technology name dropped a second agent proposal with a distinct non-empty `EvidenceRef` — **hit 2026-08-24:** `HasMatchingProposal` treated matching names as duplicates before comparing evidence refs; fixed by skipping name dedupe when both refs are non-empty and differ; regression in `Resolve_keeps_distinct_evidence_ref_when_family_and_technology_name_match`
- [x] (invalid) Inventory `Chosen` row with `CloudProvider.None` suppresses every proposal family — **2026-08-24:** `chosen.ProviderFamily == candidate.ProviderFamily` uses enum equality; `None` only blocks other `None` proposals, not Aws/Azure/Gcp candidates (`Resolve_inserts_assumed_on_provider_conflict`).
- [x] (proven) Duplicate agent rows when `EvidenceRef` differed only by casing — **hit 2026-08-25:** `EvidenceRefsMatch` used ordinal case-sensitive compare; topology re-seed with case-variant proposal ids duplicated rows; fixed with `OrdinalIgnoreCase`; regression in `Resolve_skips_when_evidence_ref_matches_case_insensitively`
- [x] (proven) `TechnologyNamesMatch` ignored internal whitespace — **hit 2026-08-26:** `"Amazon ECS"` vs `"Amazon  ECS"` with empty candidate `EvidenceRef` inserted a duplicate assumed row; fixed by collapsing internal whitespace before case-insensitive compare (`Resolve_skips_when_technology_name_differs_only_by_internal_whitespace`)
- [ ] (candidate) Padded `EvidenceRef` values may still duplicate rows when trimming alone is insufficient — cheap-disproof: `EvidenceRefsMatch` already trims both sides; verify with padded-ref delta test before promoting.
- [ ] (candidate) Whitespace-only `EvidenceRef` on an existing row may block name dedupe for a grounded candidate — existing row with `"   "` ref and matching technology name may incorrectly skip or admit depending on `HasDistinctEvidenceRefs` empty-ref branch.

---

## Zone: orchestrator-transient-retry

- **id:** orchestrator-transient-retry
- **status:** open
- **impact:** medium
- **aliases:** transient retry; commit retry
- **paths:** ArchLucid.Application/Runs/Orchestration/OrchestratorTransientDbRetry.cs; ArchLucid.Application/Runs/Orchestration/CommitRunTransientRetryPolicy.cs
- **test-filter:** FullyQualifiedName~OrchestratorTransientDbRetryTests|FullyQualifiedName~CommitRunTransientRetryPolicyTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Retry policy retries a non-transient SQL error (constraint / timeout misclassified) Î“Ã‡Ã¶ fixed: `SqlTransientDetector` treated outer `TimeoutException` before inner non-transient `SqlException`
- [x] Commit retry exhausts attempts but still returns success to the caller Î“Ã‡Ã¶ retired: `IsExhausted` and orchestrator loop throw `ConflictException` on budget/attempt exhaustion; idempotent reconcile success is intentional
- [x] Transient retry does not include the same isolation / tenant scope on the replay Î“Ã‡Ã¶ retired: `OrchestratorTransientDbRetry` re-invokes caller lambda; scope is captured by caller closure
- [x] (proven) `AggregateException` with a non-transient `SqlException` listed before a deadlock (`1205`) skips orchestrator retry — fixed: `IsRetriableOrchestratorDbFailure` flattens aggregate inners before `SqlTransientDetector` (`ExecuteAsync_retries_deadlock_when_aggregate_exception_lists_it_after_non_transient_sql`)
- [ ] (hunt-ready) `OrchestratorTransientDbRetry.IsRetriableOrchestratorDbFailure` with `AggregateException` containing one transient and one permanent inner — returns true and retries the whole action, so permanent failures wrapped with transient SQL errors cause repeated full orchestration persists instead of immediate fail-fast.
- [ ] (hunt-ready) `CommitRunTransientRetryPolicy.IsExhausted` with `elapsed >= RetryBudget` (20s) before `attempt >= MaxAttempts` (12) — commit retry loop stops while `OrchestratorTransientDbRetry` may still perform up to three 2s/4s/8s backoff retries per inner operation, producing asymmetric give-up between outer commit reconciliation and inner DB retry layers.
- [ ] (hunt-ready) `CommitRunTransientRetryPolicy.RetryDelay` linear `150ms * attempt` with `ManifestReconcilePollDelay` using the same multiplier — under manifest contention, eight reconcile polls plus twelve commit attempts can exceed the 20s `RetryBudget` mid-poll, returning exhausted while a concurrent commit is still within reconcile window.

---

## Zone: email-otp-auth

- **id:** email-otp-auth
- **status:** open
- **impact:** high
- **aliases:** email otp; otp auth; email challenge
- **paths:** ArchLucid.Api/Controllers/Auth/EmailOtpAuthController.cs; ArchLucid.Application/Identity/EmailOtpAuthService.cs
- **test-filter:** FullyQualifiedName~EmailOtpAuthServiceTests|FullyQualifiedName~EmailOtpChallengeRepositoryConcurrencyTests
- **hunts:** 5
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-26
- **last-bug:** 2026-08-26 — HTTP challenge logged duplicate `EmailOtpCodeRequested` alongside service
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] A consumed or expired OTP still issues a session Î“Ã‡Ã¶ retired: `VerifyCodeAsync_rejects_expired_code`, `VerifyCodeAsync_rejects_reused_code`, and `TryCompleteAsync` completion paths reject expired/already-completed challenges
- [x] Challenge lookup is not tenant-scoped and can verify another tenant's code Î“Ã‡Ã¶ retired (invalid): OTP challenges are pre-tenant and keyed by normalized email; verification requires challenge id + code hash bound to that row
- [x] Concurrent verify requests both succeed on the same one-time challenge Î“Ã‡Ã¶ retired: `EmailOtpChallengeRepositoryConcurrencyTests.TryCompleteAsync_allows_only_one_successful_completion`
- [x] (proven) Mixed-case invitation email on the row blocks acceptance after OTP verify — **hit 2026-08-24:** `TryAcceptInvitationAsync` compared `invitation.Email` to normalized sign-in email with ordinal equality and `FindInvitationByIdAsync` filtered via `ListPendingByNormalizedEmailAsync`; legacy/display-case rows never accepted; fixed with `InvitationEmailMatchesVerifiedEmail` + `GetPendingByIdAsync`
- [x] (proven) Post-verify next step returns wrong workspace after invitation accept — **hit 2026-08-24:** `ResolveNextStepAsync` merged `acceptedInvitationId ?? challenge.InvitationId` and picked `activeMemberships[^1]`; re-invites to an older workspace returned the newest membership, and multi-workspace users with an expired linked invitation got `Complete` instead of `SelectWorkspace`; fixed by returning `AcceptedEmailOtpInvitation` tenant/workspace only when accept succeeds and separating challenge-linked pending invitation routing
- [x] (proven) `EmailOtpAuthController.VerifyAsync` JWT/response tenant-workspace desync — **hit 2026-08-25:** response echoed null `result.TenantId`/`WorkspaceId` while JWT fell back to `TrialLocalJwtScopeDefaults`; fixed by returning resolved scope in `EmailOtpVerifyResponse`; regression `VerifyAsync_response_scope_matches_jwt_when_service_returns_null_tenant_workspace`
- [x] (proven) `EmailOtpAuthController.VerifyAsync` wrong verify audit event — **hit 2026-08-25:** HTTP verify logged `EmailOtpCodeRequested` with `email_otp_verify_http`, conflating challenge and verify telemetry; removed controller audit (service emits `EmailOtpVerificationSucceeded`/`Failed`); `[MutatingAuditExcluded]` + regression `VerifyAsync_does_not_log_email_otp_code_requested_audit`
- [x] (proven) `EmailOtpAuthService.VerifyCodeAsync` SSO-blocked verify missing audit — **hit 2026-08-25:** `RequireEnterpriseSso` path passed `emailCorrelation: null` to `FailWithAuditAsync`, skipping `EmailOtpVerificationFailed`; fixed by correlating from challenge email before SSO gate; regression `VerifyCodeAsync_audits_sso_required_failure_for_stale_challenge_when_domain_now_requires_sso`
- [x] (proven) `EmailOtpAuthController.RequestChallengeAsync` duplicate `EmailOtpCodeRequested` audit — **hit 2026-08-26:** HTTP challenge logged `EmailOtpCodeRequested` with `email_otp_challenge_http` before service also logged `EmailOtpCodeRequested`, doubling telemetry for valid emails; removed controller audit, added `[MutatingAuditExcluded]`, and preserved invalid-email audit in `EmailOtpRequestFlow`; regression `RequestChallengeAsync_logs_email_otp_code_requested_once_for_valid_email` + `RequestCodeAsync_returns_neutral_message_for_invalid_email_and_audits_once`

2026-08-26 seed hunt #5: reseeded challenge HTTP audit path; proved duplicate `EmailOtpCodeRequested` on valid challenge requests.

---

## Zone: auth-return-path

- **id:** auth-return-path
- **status:** open
- **impact:** high
- **aliases:** return path; sign-in redirect; open redirect
- **paths:** ArchLucid.Application/Identity/AuthSignInReturnPathGuard.cs
- **test-filter:** FullyQualifiedName~AuthSignInReturnPathGuardTests
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] A protocol-relative or encoded external URL is accepted as an in-app return path â€” fixed earlier (`/%2f%2fevil.example`); regression in `TryNormalize_rejects_open_redirect_shapes`
- [x] Backslash or `@` host smuggling bypasses the leading-slash check â€” retired: existing `TryNormalize_rejects_open_redirect_shapes` cases cover `/\\evil`, `/path@evil`, `/%40` decode
- [x] Control characters in the return path still survive normalization â€” fixed: reject control chars after each percent-decode pass (`/%09//evil.example`, `/%00//evil.example`)
- [x] Deeply nested percent-encoded slashes survive the three-pass decode cap (`/%2525252f%2525252fevil.example` accepted as in-app path) — fixed: eight-pass decode cap plus reject residual `%2f`/`%5c`/`%2e`; regression in `TryNormalize_rejects_open_redirect_shapes`
- [x] (proven) Embedded protocol-relative segments survive return-path normalization — fixed: `ContainsProtocolRelativeTraversal` rejects leading and embedded `//`/`/\`; regression in `TryNormalize_rejects_open_redirect_shapes` and `TryNormalize_rejects_deeply_encoded_embedded_protocol_relative_segment`
- [x] (proven) Residual double-encoded slashes survive the eight-pass decode cap — **hit 2026-08-21:** `%252F%252F` residue evaded single-level `%2f` detection after the decode loop; regression in `TryNormalize_rejects_residual_double_encoded_slashes_after_decode_cap`
- [x] (proven) Unicode slash homoglyphs bypass ASCII-only protocol-relative checks — **hit 2026-08-22:** fullwidth solidus (`／`, `%EF%BC%8F`) and fullwidth reverse solidus (`＼`) evaded `ContainsProtocolRelativeTraversal`; regression in `TryNormalize_rejects_unicode_slash_homoglyph_protocol_relative_paths`
- [x] (proven) Additional Unicode slash homoglyphs bypass `IsSlashHomoglyph` — **hit 2026-08-23:** light diagonal (`╱`, `%E2%95%B1`), big solidus (`⧸`, `%E2%A7%B8`), and solidus overlay (`⧶`) evaded slash-homoglyph checks; regression in `TryNormalize_rejects_additional_unicode_slash_homoglyph_protocol_relative_paths` and `TryNormalize_rejects_deeply_encoded_additional_unicode_slash_homoglyph_segment`
- [ ] (hunt-ready) `AuthSignInReturnPathGuard.TryNormalize` with return path `/app/foo/../bar` or `/signin/../../other` — passes `TryNormalizeRelativePath` (no `..` segment rejection/canonicalization) but browsers normalize to `/bar` or `/other`, yielding an unintended post-login destination outside the intended subtree.
- [ ] (hunt-ready) `AuthSignInReturnPathGuard.TryNormalizeAfterPercentDecoding` with path that decodes across multiple passes to introduce `//` or `\` only after the eighth `%` decode — loop capped at `MaxPercentDecodePasses = 8` may return a normalized relative path while a ninth decode would expose protocol-relative traversal blocked in `ContainsResidualEncodedTraversal`.
- [ ] (hunt-ready) `AuthSignInReturnPathGuard.TryNormalize` with path containing percent-encoded slash homoglyphs (e.g. fullwidth solidus) not present before decoding — initial `ContainsSlashHomoglyph` misses the literal; partially decoded `working` strings that still encode the homoglyph may return null inconsistently depending on pass count.

---

## Zone: tenant-erasure

- **id:** tenant-erasure
- **status:** open
- **impact:** high
- **aliases:** tenant delete; erasure; quarantine middleware
- **paths:** ArchLucid.Application/Tenancy/TenantErasureCommandService.cs; ArchLucid.Api/Middleware/TenantErasureQuarantineMiddleware.cs
- **test-filter:** FullyQualifiedName~TenantErasure
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Erasure proceeds while a legal hold is still active — `IsEligibleForScheduledHardPurge` and SQL list queries exclude rows with future `LegalHoldUntilUtc`; orphan cleanup skips active holds in `OrphanedTenantCatalogCleanupBackgroundWork`
- [x] (proven) Quarantine middleware lets mutating requests through after erasure has started — **hit 2026-08-23:** `TrialSeatReservationMiddleware` ran before `TenantErasureQuarantineMiddleware`, so offboarded active-trial tenants still incremented `TrialSeatsUsed` before the 403; fixed by running erasure quarantine first in `PipelineExtensions`
- [x] (proven) Restore quarantine leaves stale `TenantErasureApprovedUtc` on in-memory tenants — **hit 2026-08-23:** `InMemoryTenantRepository` `CopyTenant(clearErasureQuarantine: true)` kept prior approval, so a restored tenant could be hard-purged after re-offboard without a fresh admin approval; aligned with Dapper restore SQL that nulls approval columns
- [x] (invalid) Erasure command deletes another tenant's rows when ids collide in cache — `TenantGetByIdRequestCache` keys by `Guid` tenant id; no cross-tenant alias path in this zone
- [x] (proven) Quarantine middleware blocked tenant erasure lifecycle APIs — **hit 2026-08-24:** offboarded tenants received 403 on `POST /v1/tenant/erasure/approve` and `/legal-hold`, so `TenantErasureApprovedUtc` could never be set and hard purge stalled; fixed by allowlisting `/v1/tenant/erasure` in `TenantErasureQuarantineMiddleware.Skip`
- [ ] (hunt-ready) `TenantErasureQuarantineMiddleware.InvokeAsync` with authenticated tenant scope but `ITenantGetByIdRequestCache.GetByIdAsync` returning null — `tenant is null` bypasses quarantine and calls `next`, allowing API access for a tenant id that should be blocked when the record is missing or evicted.
- [ ] (hunt-ready) `TenantErasureQuarantineMiddleware.InvokeAsync` with `context.User.Identity?.IsAuthenticated != true` — unauthenticated requests always pass through, so tenant-scoped anonymous routes that resolve `scope.TenantId` without auth are not quarantine-gated.
- [ ] (hunt-ready) `TenantErasureCommandService.TryRestoreQuarantineAsync` after `TryOffboardTenantAsync` (which calls `SuspendTenantAsync`) — restore clears offboard/eligible timestamps via repository only and never reverses suspend, leaving a restored tenant still suspended while middleware stops blocking login/API quarantine.

---

## Zone: tenant-scoped-analyzer

- **id:** tenant-scoped-analyzer
- **status:** open
- **impact:** high
- **aliases:** ARCH006; tenant scoped query analyzer
- **paths:** ArchLucid.Analyzers/TenantScopedQueryScopeBindingAnalyzer.cs
- **test-filter:** FullyQualifiedName~TenantScopedQueryScopeBindingAnalyzerTests
- **hunts:** 5
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-03
- **last-bug:** 2026-09-03 — hash-line SQL comments bypassed `StripSqlComments`, false-binding tenant predicates
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Analyzer missed Dapper `QueryAsync` on tenant tables — **hit 2026-08-24:** `TryGetSqlArgument` always used `Arguments[0]` (connection) instead of the `sql`/`command` parameter; regression in `ARCH006_reports_unscoped_static_sql_on_scoped_table`
- [x] (proven) Interpolated SQL treated as scoped when tenant predicate only appeared in a comment — **hit 2026-08-24:** predicate regex matched `/* TenantId = @TenantId ... */`; regression in `Tenant_id_predicate_in_sql_comment_does_not_bind_runs`
- [x] (invalid) Empty exemption justification does not fire — `ARCH006b_reports_empty_exemption_justification` already covers class-level blank justification
- [x] (proven) `tenant_scoped_tables.v1.json` with `tenantIdOnRow` before `scopeTripleOnRow` loaded empty registry — **hit 2026-08-24:** single regex required fixed property order; regression in `LoadFromAdditionalFile_supports_tenant_array_before_triple_array`
- [x] (proven) `CommandDefinition` with reordered named arguments analyzed `cancellationToken` instead of SQL — **hit 2026-08-24:** only read first positional argument; regression in `ARCH006_reports_unscoped_sql_for_command_definition_named_command_argument`
- [x] (proven) Bracketed `[dbo].[Runs]` references in dynamic SQL skipped ARCH006a — **hit 2026-08-24:** guess-table regex lacked bracket form; regression in `ARCH006a_reports_unanalyzable_sql_for_bracketed_table_reference`
- [x] (proven) `QueryMultiple`/`QueryMultipleAsync` with string SQL bypassed ARCH006 — **hit 2026-08-24:** methods missing from `DapperQueryMethodNames`; regression in `ARCH006_reports_unscoped_static_sql_for_query_multiple_async`
- [x] (proven) Non-const local / static readonly SQL variable references bypassed ARCH006 — **hit 2026-08-24:** resolver only folded `const` symbols, not declarator initializers; regressions in `ARCH006_reports_unscoped_sql_for_non_const_local_variable` and `ARCH006_reports_unscoped_sql_for_static_readonly_field`
- [x] (proven) Property SQL initializers bypassed ARCH006 static resolution — **hit 2026-08-25:** `TenantScopedSqlExpressionResolver` resolved locals/fields from declarators but ignored `PropertyDeclarationSyntax` initializers, so `private string Sql { get; } = "SELECT … dbo.Runs …"` passed through unanalyzed; fixed by folding property initializers; regression in `ARCH006_reports_unscoped_sql_for_property_with_initializer`
- [x] (proven) Hash-line SQL comments (`# …`) treated as tenant scope predicates — **hit 2026-09-03:** `StripSqlComments` stripped `--` and `/* */` but not full-line `#` comments, so `# TenantId = @TenantId …` false-bound `dbo.Runs`; fixed with `HashLineCommentRegex`; regression in `Tenant_id_predicate_in_hash_sql_comment_does_not_bind_runs`
- [ ] (candidate) `Execute`/`ExecuteAsync` with `CommandType.StoredProcedure` may still be analyzed as raw SQL when procedure name is a string literal — needs hunt-ready locus in `TenantScopedQueryScopeBindingAnalyzer.TryGetSqlArgument`
- [ ] (candidate) `string.Format` / `nameof` / non-literal verbatim concatenation in SQL expressions may bypass static resolution — resolver returns non-static for unrecognized expression shapes
- [x] (valid-no-repro) `const` field SQL initializers already fold via `IFieldSymbol.IsConst` in `ResolveFromSymbol` — same path as proven local/readonly fixes; no separate property-vs-field gap

---

## Zone: sql-run-repository

- **id:** sql-run-repository
- **status:** open
- **impact:** high
- **aliases:** run repository; sql run scope
- **paths:** ArchLucid.Persistence/Repositories/SqlRunRepository.cs
- **test-filter:** FullyQualifiedName~SqlRunRepositoryScopeIsolationSqlIntegrationTests|FullyQualifiedName~RunRepositoryWorkspaceSystemNameSqlTests|FullyQualifiedName~RunRepositoryArchitectureRequestSqlTests
- **hunts:** 5
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-03
- **last-bug:** 2026-09-03 — `CountActiveRunsForArchitectureRequest` / `ExistsRunForArchitectureRequestInScope` compared raw `ArchitectureRequestId` while project-slug paths trim and ignore case
- **related-pd-tb:** none
- **code-changed-since:** yes

2026-08-16 dry hunt: listed hypotheses do not hold on `SqlRunRepository`. `SelectByScopedId` and `Update` already require `TenantId` + `WorkspaceId` + `ScopeProjectId`; `GetById_wrong_scope_returns_null_when_run_saved_under_other_tenant` covers cross-tenant get. List shapes use `RunListWarningFlagSql.ScopeWhereTail` with `r.TenantId = @TenantId` always; `WorkspaceId` is a non-nullable `Guid` (empty workspace is not a security boundary). Cross-tenant update matches 0 rows and throws. Admin/archive paths are `[TenantScopeExempt]` by catalog routing, not Layer D bleed.

### Hypotheses

- [x] (valid-no-repro) Get-by-id returns a run that belongs to a different tenant — `GetById_wrong_scope_returns_null_when_run_saved_under_other_tenant`
- [x] (valid-no-repro) List query omits tenant predicate when workspace filter is empty — `RunListWarningFlagSql.ScopeWhereTail` always binds `r.TenantId`
- [x] (valid-no-repro) Update succeeds against a run id from another tenant in the same database — scoped `WHERE` matches 0 rows
- [x] (valid-no-repro) Workspace system-name collision returns true for another tenant's active run — InMemory cross-tenant guard test
- [x] (proven) `ExistsActiveRunWithSystemNameInWorkspace` compares `UPPER(ProjectId)` without trimming so padded slugs bypass the workspace collision guard — **hit 2026-08-23 hunt #38:** `LTRIM(RTRIM(ProjectId))` before `UPPER`
- [x] (proven) `GetLatestWithGraphAtOrBefore` / `GetLatestCommittedRunIdByManifestCreatedUtc` / `GetPriorCommittedRunIdBeforeCurrent` compare raw `ProjectId` while collision guard trims and ignores case — **hit 2026-08-24:** padded or differently-cased stored slugs missed committed/graph lookups (advisory eligibility, temporal graph); SQL uses `UPPER(LTRIM(RTRIM(ProjectId)))`; InMemory uses trim + ordinal-ignore-case; regressions in `RunRepositoryWorkspaceSystemNameSqlTests` / `InMemoryRunRepositoryGetLatestWithGraphAtOrBeforeTests`
- [x] (proven) `ListByProjectAsync` / `ListByProjectKeysetAsync` compared raw `ProjectId` while workspace collision and committed-run lookups trim and ignore case — **hit 2026-08-24:** padded or differently-cased stored slugs omitted from dashboard project lists; SQL uses `UPPER(LTRIM(RTRIM(r.ProjectId))) = @NormalizedProjectSlug`; InMemory uses `MatchesProjectListFilter`; regressions in `InMemory_matches_padded_project_id_for_list_by_project` and `Project_list_queries_trim_project_id_before_upper_compare`
- [x] (proven) `CountActiveRunsForArchitectureRequestAsync` / `ExistsRunForArchitectureRequestInScopeAsync` compared raw `ArchitectureRequestId` while project-slug paths trim stored values — **hit 2026-09-03 hunt #603 (seed→hit):** padded stored request ids missed active-run concurrency and scope-existence checks (`RequestReleased` latch, idempotency guard); SQL uses `UPPER(LTRIM(RTRIM(ArchitectureRequestId))) = @NormalizedArchitectureRequestId`; InMemory uses `ArchitectureRequestIdMatches`; regressions in `RunRepositoryArchitectureRequestSqlTests`

---

## Zone: finding-inspect-sql

- **id:** finding-inspect-sql
- **status:** open
- **impact:** high
- **aliases:** finding inspect; dapper inspect read
- **paths:** ArchLucid.Persistence/Findings/DapperFindingInspectReadRepository.cs; ArchLucid.Persistence/Findings/FindingInspectReadModelMapper.cs; ArchLucid.Persistence/Sql/FindingInspectReadSql.cs
- **test-filter:** FullyQualifiedName~FindingInspectReadModelMapperTests|FullyQualifiedName~FindingInspectReadSqlTests|FullyQualifiedName~FindingInspectReadRepositoryCoreTests|FullyQualifiedName~FindingInspectEndpointTests
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-03
- **last-bug:** 2026-09-03 — `ResolveRuleFields` threw `NullReferenceException` when `AppliedRuleIdsJson` deserialized a null first element instead of falling back to trace rule text
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Inspect read returns a finding whose tenant does not match the request scope Î“Ã‡Ã¶ fixed: main inspect + FindingRecords joins in FollowUpBatch require `fr.TenantId`/`WorkspaceId`/`ProjectId` (run-only predicates were insufficient when row tenant diverges)
- [x] Mapper drops evidence fields so inspect shows success with empty trail Î“Ã‡Ã¶ retired (invalid): mapper only parses enums; evidence is built in the repository from related nodes
- [x] Inspect query joins without tenant on the child table and leaks sibling-tenant rows — fixed: FollowUpBatch now scopes FindingRelatedNodes / rules / actions / AuditEvents / FindingReviewEvents / RiskExceptions to TenantId+WorkspaceId+ProjectId
- [x] (proven) `ResolveRuleFields` pairs `DecisionRuleId` from `AppliedRuleIdsJson` with unrelated `FindingTraceRulesApplied` SortOrder=0 text — fixed: keep `DecisionRuleName` aligned with the first applied rule id when JSON ids exist
- [x] (proven) FollowUpBatch merged related nodes / rule text / recommended actions across reruns sharing the same scoped `FindingId` — **hit 2026-08-24:** `@RunId` from the primary inspect row was unused on child-table sub-queries; main inspect `TOP 1` was non-deterministic; fixed with `r.RunId = @RunId`, `ORDER BY r.CreatedUtc DESC, r.RunId DESC`, and `aet.RunId = r.RunId`; regressions in `FollowUpBatch_scopes_related_nodes_to_main_inspect_run` and related shape tests
- [x] (invalid) `ResolveRuleFields` with non-empty `AppliedRuleIdsJson` ignores `firstRuleText` for `DecisionRuleName` — intentional after 2026-08-24 proven fix; mis-pairing trace SortOrder=0 text with decisioning rule ids was worse than showing the rule id
- [x] (valid-no-repro) `ParseFindingSeverity` unknown `Severity` column defaults to `Info` — documented contract in `FindingInspectReadModelMapperTests`; invalid DB values cannot be recovered without a separate mapping table
- [x] (valid-no-repro) `BuildMetadataTypedPayload` duplicates `rationale` into `whyThisMatters` for metadata-only inspect — intentional slim first-paint payload; UI `findingWhyThisMattersText` already falls back to rationale
- [x] (proven) `ResolveRuleFields` with `AppliedRuleIdsJson` containing a null first element — **hit 2026-09-03:** `ids[0].Trim()` threw `NullReferenceException` on `[null]` instead of falling back to `firstRuleText`; fixed with null/whitespace guard; consolidated regressions in `FindingInspectReadRepositoryCoreTests` (removed stale reflection tests on moved helper)

---

## Zone: llm-wallet

- **id:** llm-wallet
- **status:** open
- **impact:** high
- **aliases:** llm wallet; tenant wallet; billing wallet
- **paths:** ArchLucid.Api/Controllers/Billing/WalletController.cs; ArchLucid.Application/Budgeting/LlmTenantWalletService.cs; ArchLucid.Persistence/Data/Repositories/SqlLlmTenantWalletRepository.cs
- **test-filter:** FullyQualifiedName~LlmTenantWalletServiceTests
- **hunts:** 5
- **bugs-found:** 7
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-03
- **last-bug:** 2026-09-03 — wallet GET surfaced prior-month auto-refill count after UTC month rollover
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Debit applies to a different tenant's wallet when the header tenant differs from the route — wallet paths scope by ambient `ScopeContext.TenantId`; no cross-tenant debit/read in listed controllers/services
- [x] (proven) Concurrent debits both succeed past the remaining balance — **hit 2026-08-24:** `TryAuthorizeOverageSpendAsync` was read-only; parallel authorizes overspent before async settlement; fixed with atomic `TryConsumeAsync` reserve + settlement reconcile; regression in `TryAuthorizeOverageSpendAsync_parallel_estimates_only_one_succeeds_when_balance_covers_single_estimate`
- [x] (invalid) Wallet read returns another tenant's remaining credits — `GetWalletAsync` / `WalletController.GetAsync` use scoped tenant id only
- [x] (proven) `CanAutoRefill` monthly cap ignored UTC month rollover — **hit 2026-08-24:** stale `AutoRefillsThisUtcMonthCount` blocked refills after month change; regression in `TryAutoRefillAsync_allows_refill_after_utc_month_rollover_when_prior_month_at_cap`
- [x] (proven) Malformed wallet `RowVersionBase64` bypassed optimistic concurrency — **hit 2026-08-24:** `WalletController.DecodeRowVersion` returned empty bytes on `FormatException`; regression in `PutAsync_returns_400_when_row_version_base64_is_malformed`
- [x] (proven) Settlement consume silently dropped after optimistic retries exhausted — **hit 2026-08-24:** `ConsumeInternalAsync` abandoned debit without re-queue; regression in `ConsumeInternalAsync_requeues_settlement_when_optimistic_retries_exhausted`
- [x] (proven) Overage reconciliation credit dropped when optimistic retries exhausted — **hit 2026-08-24:** `ReconcileOverageInternalAsync` called `CreditAdjustmentInternalAsync` without re-queue on failure; regression in `ReconcileOverageInternalAsync_requeues_settlement_when_credit_retries_exhausted`
- [x] (valid-no-repro) `LlmTenantWalletService.ConsumeInternalAsync` when optimistic retries exhaust — re-queue on exhaustion already shipped; regression in `ConsumeInternalAsync_requeues_settlement_when_optimistic_retries_exhausted`
- [x] (invalid) `WalletController` balance read after concurrent consume — `GetAsync` calls `GetWalletAsync` → repository directly; no app-level cache; controller exposes GET/PUT only (no POST consume endpoint)
- [x] (proven) Overage reconciliation delta consume dropped when remaining balance insufficient — **hit 2026-08-24:** `ReconcileOverageInternalAsync` called `ConsumeInternalAsync` for positive delta; `InsufficientFunds` returned silently without re-queue; fixed via `TryConsumeWithRetryAsync` + full reconcile re-queue; regression in `ReconcileOverageInternalAsync_requeues_settlement_when_delta_consume_insufficient_funds`
- [x] (invalid) `ConsumeInternalAsync` plain settlement re-queue on insufficient funds — **dry 2026-08-25:** `TryConsumeWithRetryAsync` returns false on `InsufficientFunds`; `ConsumeInternalAsync` re-queues via shared `!consumed` path (same as concurrency exhaustion); regression in `ConsumeInternalAsync_requeues_settlement_when_consume_hits_insufficient_funds`
- [x] (proven) `GetWalletAsync` returned stale `AutoRefillsThisUtcMonthCount` after UTC month rollover — **hit 2026-09-03 (#584):** `MapView` echoed persisted count while `CanAutoRefill` already treated a new month as zero refills; operators saw prior-month cap usage in billing UI; fixed by normalizing count on read; regression in `GetWalletAsync_returns_zero_auto_refill_count_after_utc_month_rollover_when_prior_month_at_cap`.
- [ ] (candidate) `UpdateWalletAsync` allows enabling auto-replenish without Stripe payment method on file — refill path no-ops when customer/payment method missing; operator may think auto-replenish is armed when it cannot charge.

2026-09-03 seed hunt #584: reseeded llm-wallet; proved wallet read month-rollover display gap vs `CanAutoRefill` parity; seeded auto-replenish-without-payment-method UX candidate.

---

## Zone: finding-disposition

- **id:** finding-disposition
- **status:** open
- **impact:** medium
- **aliases:** disposition; finding decision
- **paths:** ArchLucid.Application/Governance/FindingDisposition/FindingDispositionService.cs; ArchLucid.Application/Governance/FindingDisposition/FindingDispositionValidation.cs
- **test-filter:** FullyQualifiedName~FindingDispositionValidationTests
- **hunts:** 4
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — undefined disposition enum bypassed application validation
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Disposition writes succeed for a finding that belongs to another tenant — trail append uses `scope.TenantId`; no cross-tenant leak path in zone files.
- [x] (valid-no-repro) Validation accepts a closed finding as still actionable — disposition is append-only by design (`FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`); no finding-state gate in validation.
- [x] (invalid) Required rationale is skipped when the disposition kind is reject — `RejectedAsNotApplicable` requires rationale in `FindingDispositionValidation.Validate`.
- [x] (proven) Deferred disposition rejects empty rationale while operator UI gates (TB-2305) require rationale only for Accepted and RejectedAsNotApplicable — fixed by removing Deferred from `requiresRationale`.
- [x] (proven) Non-Accepted dispositions persist trade-off acknowledgment and cross-kind fields (`RevisitDueUtc`, `EvidenceRequestText`) on unrelated disposition kinds — fixed in `FindingDispositionService` note builder and record normalization.
- [x] (invalid) `FindingDispositionValidation.Validate` for `NeedsEvidence` — `EvidenceRequestText` shorter than `MinimumRationaleLength` bypasses audit bar — only non-empty text is required; UI gates match; regression in `Validate_needs_evidence_accepts_single_character_evidence_request_text`.
- [x] (valid-no-repro) `FindingDispositionService.ListHistoryAsync` with same-tenant finding id reused across projects — workspace/project equality filter hides foreign-project events; regression in `ListHistoryAsync_excludes_disposition_events_from_other_project`.
- [x] (invalid) `FindingDispositionValidation.Validate` for `RejectedAsNotApplicable` — whitespace-padded rationale below 10 characters after trim — `Trim().Length` gate enforced; regression in `Validate_rejected_as_not_applicable_rejects_short_rationale`.
- [x] (proven) `FindingDispositionValidation.Validate` — undefined `FindingDisposition` numeric cast (e.g. `(FindingDisposition)999`) passes validation — **hit 2026-09-04 (#750):** HTTP mapper already used `Enum.IsDefined`; application `Validate` skipped enum guard so non-HTTP callers could persist invalid disposition; fixed with `Enum.IsDefined` parity to `RunOperatorGovernanceDispositionValidation`; regression in `Validate_rejects_undefined_disposition_enum_value`.
- [ ] (candidate) `FindingDispositionService.RecordAsync` — negative numeric disposition cast `(FindingDisposition)(-1)` — same `Enum.IsDefined` gate as undefined positive ordinals; cheap-disproof after #750 fix.
- [ ] (candidate) `FindingDispositionValidation.Validate` for `Deferred` — `RevisitDueUtc` exactly at `DateTimeOffset.MaxValue` — upper-bound not validated; unlikely harm but worth one probe.

2026-09-04 seed hunt #750: reseeded after closed hypothesis set; proved undefined disposition enum bypass; seeded negative-ordinal and max-revisit candidates.

---

## Zone: review-recurrence

- **id:** review-recurrence
- **status:** open
- **impact:** low
- **aliases:** recurrence; next run calculator
- **paths:** ArchLucid.Application/Governance/ArchitectureReviewRecurrenceNextRunCalculator.cs
- **test-filter:** FullyQualifiedName~ArchitectureReviewRecurrenceNextRunCalculatorTests
- **hunts:** 4
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-08-24 — preview path skipped single-run normalization (reference-equality / Unspecified kind)
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (proven) Disabled recurrence still computes a next run — **hit 2026-08-24:** paused schedules persisted `NextRunUtc` anyway; `ComputeNextRunUtc(..., isScheduleEnabled: false)` returns null; controller only requires next when enabled; regression in `ComputeNextRunUtc_returns_null_when_schedule_disabled` / `CreateRecurrenceSchedule_persists_inactive_schedule`
- [x] (proven) Time-zone conversion shifts the cadence by a day around DST — **hit 2026-08-24:** `DateTimeKind.Unspecified` / `Local` references passed to Cronos without UTC normalization; regressions in `ComputeNextRunUtc_normalizes_unspecified_reference_kind_to_utc` / `ComputeNextRunUtc_returns_utc_kind_even_when_reference_is_local`
- [x] (proven) Next-run lands in the past so the scheduler fires immediately in a loop — **hit 2026-08-24:** wrapper returned `next <= fromUtc` without recomputing; `NormalizeNextRunUtc` advances once and stamps UTC; regression in `ComputeNextRunUtc_recomputes_when_first_occurrence_is_not_strictly_after_reference`
- [x] (invalid) Preview path already delegates to normalized `ComputeNextRunsUtc` after reference normalization fix — **disproven 2026-08-24:** only the reference instant was normalized; batch preview bypassed `NormalizeNextRunUtc`
- [x] (proven) Preview path skipped single-run normalization so the first preview instant could equal the reference or omit UTC kind — **hit 2026-08-24:** `ComputeNextRunsUtc` delegated to underlying batch expansion; route preview through the `ComputeNextRunUtc` loop; regressions in `ComputeNextRunsUtc_advances_first_preview_when_underlying_returns_reference_instant` / `ComputeNextRunsUtc_stamps_utc_kind_when_underlying_returns_unspecified_kind`
- [x] (valid-no-repro) Batch preview from an exact weekly cron occurrence repeats the reference Monday — `NormalizeNextRunUtc` advances when `candidate <= fromUtc`; regression in `ComputeNextRunsUtc_from_exact_weekly_occurrence_returns_following_mondays`
- [x] (valid-no-repro) `ComputeNextRunsUtc` with `count <= 0` still invoked the underlying calculator — early return `Array.Empty<DateTime>()`; regression in `ComputeNextRunsUtc_returns_empty_when_count_is_zero`
- [x] (invalid) `SpecifyUtc` mishandles `DateTimeKind.Local` from the underlying calculator on production paths — `SimpleScanScheduleCalculator` always receives UTC-normalized references; Local-kind results are not produced in this wrapper's live path
- [x] (valid-no-repro) `NormalizeNextRunUtc` returns null when the single retry still lands on `fromUtc` — stub `PastThenExactScanScheduleCalculator` reproduces null; `SimpleScanScheduleCalculator` never returns a past first occurrence so production paths do not hit this branch; regression in `ComputeNextRunUtc_returns_null_when_underlying_retry_still_not_after_reference`
- [x] (valid-no-repro) `ComputeNextRunsUtc` with negative `count` still invoked the underlying calculator — early return `Array.Empty<DateTime>()` for `count <= 0`; regression in `ComputeNextRunsUtc_returns_empty_when_count_is_negative`
- [x] (valid-no-repro) Whitespace-only cron slips through `IsSupportedCronExpression` / `ComputeNextRunUtc` — wrapper delegates to `SimpleScanScheduleCalculator`, which rejects whitespace-only input; regressions in `IsSupportedCronExpression_rejects_whitespace_only_cron` / `ComputeNextRunUtc_returns_null_for_whitespace_only_cron`
- [x] (valid-no-repro) Single-run `ComputeNextRunUtc` from an exact weekly cron occurrence repeats the reference Monday — Cronos `inclusive: false` plus `NormalizeNextRunUtc` advance to the following Monday; regression in `ComputeNextRunUtc_from_exact_weekly_occurrence_returns_next_monday`

2026-09-04 seed hunt #740: reseeded four recurrence-normalization candidates; cheap-disproved all with scoped regressions. No hunt-ready rows; seed-only.

---

## Zone: alert-simulation

- **id:** alert-simulation
- **status:** open
- **impact:** high
- **aliases:** alert sim; simulation context
- **paths:** ArchLucid.Api/Controllers/Alerts/AlertSimulationController.cs; ArchLucid.Persistence/Alerts/Simulation/AlertSimulationContextProvider.cs
- **test-filter:** FullyQualifiedName~AlertSimulationContextProviderTests
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — empty FindingsSnapshot.RunId bypassed run binding guard
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Simulation context loads findings from a tenant other than the caller — fixed: reject run detail / findings whose scope or RunId does not match the caller
- [x] Dry-run simulation persists a real alert delivery — retired (invalid): `RuleSimulationService` evaluates in-memory and only reads suppression state
- [x] Missing workspace still returns 200 with another workspace's rules — (valid-no-repro): `RunMatchesCallerScope` rejects foreign-workspace run detail; `StampSimulationScope` overwrites embedded rule scope before `SimulateAsync`; covered by `GetContextsAsync_when_authority_returns_foreign_workspace_run_returns_empty`
- [x] (proven) Findings snapshot with empty `RunId` bypasses run binding and simulates unscoped findings — **hit 2026-08-24:** guard only rejected mismatched ids when `findings.RunId != Guid.Empty`; empty id skipped check; fixed by requiring `findings.RunId == runId` and matching golden-manifest run ids before compare

---

## Zone: weekly-digest-email

- **id:** weekly-digest-email
- **status:** open
- **impact:** low
- **aliases:** weekly digest; executive summary email
- **paths:** ArchLucid.Application/Notifications/Email/WeeklyExecutiveSummaryEmailDispatcher.cs
- **test-filter:** FullyQualifiedName~WeeklyExecutiveSummaryJobTests
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-25
- **last-bug:** 2026-08-25 — case-differing duplicate mailboxes bypassed per-recipient ledger keys in multi-recipient weekly dispatch
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (invalid) Digest email includes findings from a tenant the recipient cannot access — dispatcher only renders pre-built `summaryMarkdown`; tenant scoping lives in the delivery scanner and export service.
- [x] (valid-no-repro) Dispatcher treats a send failure as success and skips retry — send failures throw; ledger reservation before send is intentional TB-089 idempotency (duplicate ACA retries blocked).
- [x] (invalid) Unsubscribed address still receives the weekly summary — unsubscribe filtering is not in the dispatcher; sponsor report path has no unsubscribe URL parameter (unlike exec digest).
- [x] (proven) Whitespace-only recipient lists reserve the weekly ledger and return success without sending any email — fixed by normalizing mailboxes before ledger reservation.
- [x] (proven) Template render failures after ledger reservation block weekly retry for the ISO week — fixed by rendering templates before `TryRecordSentAsync` while keeping ledger-before-send for outbound idempotency.
- [x] (valid-no-repro) Partial multi-recipient send failure on weekly sponsor report permanently suppresses remaining recipients — shared `MultiRecipientEmailDispatch` skips ledger-recorded mailboxes on retry (`WeeklySponsorReportEmailDispatcher_partial_multi_recipient_send_failure_delivers_remaining_recipients_on_retry`).
- [x] (proven) Case-differing duplicate mailboxes in multi-recipient weekly dispatch bypass per-recipient ledger keys and send duplicate emails — fixed by case-insensitive dedupe and lowercase mailbox suffixes in `MultiRecipientEmailDispatch`.

---

## Zone: outbound-webhook-dry-run

- **id:** outbound-webhook-dry-run
- **status:** open
- **impact:** high
- **aliases:** webhook dry run; outbound webhook
- **paths:** ArchLucid.Api/Controllers/Webhooks/OutboundWebhookDryRunController.cs; ArchLucid.Host.Composition/Services/OutboundWebhookDryRunService.cs
- **test-filter:** FullyQualifiedName~OutboundWebhookDryRunServiceTests|FullyQualifiedName~OutboundWebhookDryRunControllerTests
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — dry-run/simulate webhook probes omitted HTTPS/private-network SSRF guard before outbound POST
- **related-pd-tb:** none
- **code-changed-since:** 3

### Hypotheses

- [x] (invalid) Dry-run posts to the live customer endpoint — retired: operator supplies `TargetUrl`; POST is the feature (no stored webhook config in zone paths)
- [x] (invalid) Dry-run payload includes secrets from another tenant's webhook config — retired: controller uses request `SharedSecret` only; no tenant webhook lookup in zone paths
- [x] (invalid) Controller returns success when the dry-run service throws — retired: `ProbeWithBodyAsync` catches transport errors and returns `TransportSucceeded=false`; controller intentionally returns 200 with probe outcome in body
- [x] (proven) Operator webhook dry-run POSTs to loopback/private targets without SSRF guard — **hit 2026-08-24:** `AllowedOutboundWebhookProbeUrlPolicy` blocks unsafe `TargetUrl` before probe in dry-run and simulate controllers
- [ ] (hunt-ready) `OutboundWebhookDryRunController.DryRunAsync` when `OutboundWebhookDryRunService` returns `TransportSucceeded = false` — still responds `200 OK` with `StatusCode = 0`, so API clients treating HTTP success as delivery success mark dead URLs as healthy unless they inspect `TransportSucceeded`.
- [ ] (hunt-ready) `OutboundWebhookDryRunService.ProbeWithBodyAsync` with `sharedSecret` of whitespace — `trimmedSecret` becomes empty, skips `WebhookSignature` header, but controller audit records `hasSharedSecret` from raw `body.SharedSecret is { Length: > 0 }`, logging that a secret was provided when the probe was unsigned.
- [ ] (hunt-ready) `OutboundWebhookDryRunService.ProbeWithBodyAsync` on large subscriber responses — reads the full body via `ReadAsStringAsync` before applying `PreviewMaxChars` truncation, so a probe to a URL returning a multi-megabyte body allocates the entire payload server-side even though only 8192 chars are returned.

---

## Zone: architecture-recommendation

- **id:** architecture-recommendation
- **status:** open
- **impact:** medium
- **aliases:** recommendation engine; alternatives
- **paths:** ArchLucid.Application/ArchitectureIntelligence/ArchitectureRecommendationEngine.cs
- **test-filter:** FullyQualifiedName~ArchitectureRecommendationAlternativesTests|FullyQualifiedName~ArchitectureRecommendationProposedChangeTests
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] Recommended change targets an element that is not in the current package (retired: engine has no package element targeting)
- [x] Alternative list duplicates the primary recommendation as if it were distinct
- [x] Engine emits a must-change when evidence only supports a suggestion (proven)
- [x] (proven) Unverified/indeterminate findings still emit production-control alternatives — **hit 2026-08-23:** `ArchitectureRecommendationAlternatives.Build` ignored `ProvenancePresentationMapper` and returned private-network/API-gateway paths while `ProposedChange` asked to collect evidence first

---

## Zone: extraction-router

- **id:** extraction-router
- **status:** open
- **impact:** medium
- **aliases:** extraction router; difficulty router
- **paths:** ArchLucid.Application/ArchitectureIntelligence/DifficultyBasedExtractionRouter.cs
- **test-filter:** FullyQualifiedName~DifficultyBasedExtractionRouterTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Hard extraction is routed to the cheap path and still treated as high fidelity
- [x] Router swallows a failed extraction and returns an empty graph as success (retired: no failure/empty-success path; placeholder Assumption on miss)
- [x] Difficulty score is computed from a different document than the one extracted (retired: Classify and Extract share the same sourceText)
- [x] (proven) `InferLifecycleScopeForIndex` tags elements TargetState when any target marker appears before matchIndex, ignoring a later current-state section (`Extract_tags_component_after_current_state_section_even_when_target_state_appears_first`, `Extract_tags_component_after_as_is_section_even_when_to_be_appears_first`)

---

## Zone: cli-tenant-isolation

- **id:** cli-tenant-isolation
- **status:** open
- **impact:** high
- **aliases:** tenant isolation cli; negative isolation test
- **paths:** ArchLucid.Cli/Commands/TenantIsolationNegativeTestCommand.cs; ArchLucid.Cli/Commands/TenantIsolationNegativeTestRunner.cs
- **test-filter:** FullyQualifiedName~TenantIsolationNegativeTestRunnerTests
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-25
- **last-bug:** 2026-08-25 — cross-tenant run-list probe used `limit` on `/v1/runs`, which only honors `take`, so leaks beyond the default page could false-pass
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (proven) Offline replay trusted manifest `verdict: pass` even when `observedStatusCode` was 200 on deny-status probes — fixed by deriving deny verdicts from observed status unless manifest marks skip.
- [x] (invalid) Probe uses the victim tenant's token instead of the attacker token — live mode applies alternate scope headers on a second client; same credential probes cross-tenant scope by design.
- [x] (proven) Live ship-gate reported overall PASS when cross-tenant probes were SKIP (primary sanity Pass + infra 5xx skips) — fixed by downgrading live overall to SKIP and non-zero exit when isolation was not verified.

- [x] (proven) exclude-run-id probes reported PASS on HTTP 5xx when the foreign runId was absent — fixed by skipping list-exclusion probes on server errors like deny-status probes.
- [x] (proven) Run-list probe missed foreign run ids when the API returned compact `N` guids but the CLI `--run-id` used dashed formatting — **hit 2026-08-24:** `TryFindRunIdInRunList` compared raw strings, so a leaked compact id was treated as absent and the cross-tenant list probe falsely passed; fixed by normalizing both sides to canonical `N` before comparison.
- [x] (proven) Cross-tenant artifacts probe targeted a non-canonical route — **hit 2026-08-24:** live probes called `GET /v1/artifacts/runs/{runId}` (export-only prefix) instead of `GET /v1/architecture/runs/{runId}/artifacts`, so a 404 on the wrong path reported PASS without exercising artifact isolation; fixed probe path to the product route.
- [x] (proven) Cross-tenant run-list probe used `limit=200` on canonical `GET /v1/runs`, which ignores `limit` and defaults `take` to 25 — a leaked foreign run beyond the first page could false-pass; fixed probe to `take=200` (`RunLiveAsync_FailsRunListProbeWhenForeignRunIdOnlyVisibleWithFullTakePage`).

---

## Zone: cli-draft-new

- **id:** cli-draft-new
- **status:** open
- **impact:** low
- **aliases:** draft new; cli draft
- **paths:** ArchLucid.Cli/Commands/DraftNewCommand.cs
- **test-filter:** FullyQualifiedName~DraftNewCommandCoreTests
- **hunts:** 6
- **bugs-found:** 9
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — MUST-question skip/answer scope validation parity
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Draft is created under a tenant other than the signed-in CLI tenant — **hit 2026-08-24:** misconfigured scope headers could create a draft in another tenant while the CLI continued; `CliScopeResponseValidator` fails closed after create/patch when configured scope disagrees with API body; regressions in `RunCoreAsync_draft_scope_mismatch_after_create_returns_operation_failed` / `RunCoreAsync_draft_scope_mismatch_after_patch_returns_operation_failed`
- [x] (proven) Command reports success when the API returned a hollow success — **hit 2026-08-24:** submit returned HTTP 200 with empty `runId` and the command still printed success; now fails with `OperationFailed`; regression in `RunCoreAsync_submit_without_run_id_returns_operation_failed`
- [x] (proven) MUST-question and late-step API failures omitted operator hints — **hit 2026-08-24:** `ResolveMustQuestionsAsync` and execute/admit failure paths did not call `CliOperatorHints`; regression in `RunCoreAsync_questions_load_failure_writes_operator_hint`
- [x] (proven) `AdmitDraftAsync` can return `admitted: true` with a draft under another tenant and the CLI continues — **hit 2026-08-24:** `DraftNewCommand` now validates `admission.Value.Draft` before MUST-question resolution (`RunCoreAsync_draft_scope_mismatch_after_admit_returns_operation_failed`).
- [x] (invalid) Existing draft id is overwritten without confirmation — command always POSTs a new draft; no overwrite path
- [x] (invalid) `RunCoreAsync` line 85 uses `!created.Success || created.Value is null`; Stryker's surviving `&&` mutant — **2026-08-24:** `DraftApiResult.Fail` always sets `Value` to `default(T?)`; `Success=false` with non-null body is unreachable via `ArchLucidApiClient` factories.
- [x] (invalid) `RunCoreAsync` line 145 uses `!patched.Success || patched.Value is null`; Stryker's surviving `&&` mutant — **2026-08-24:** same `DraftApiResult.Fail` shape; no production path returns failed patch with a body.
- [x] (invalid) `RunCoreAsync` line 164 uses `!admission.Success || admission.Value is null`; Stryker's surviving `&&` mutant — **2026-08-24:** same `DraftApiResult.Fail` shape; no production path returns failed admit with a body.
- [x] (invalid) `RunCoreAsync` line 206 uses `!submit.Success || submit.Value is null`; Stryker's surviving `&&` mutant — **2026-08-24:** same `DraftApiResult.Fail` shape; hollow submit is already covered by `RunCoreAsync_submit_without_run_id_returns_operation_failed`.
- [x] (proven) `RunCoreAsync` writes JSON `ok: true` before `ExecuteRunAsync` when `--json` and auto-execute are enabled — **hit 2026-08-24:** submit success emitted success JSON then execute failure still returned `OperationFailed`, leaving `"ok":true` on stdout; fixed by deferring success JSON until execute succeeds and emitting `WriteFailureLine` on execute failure; regressions in `RunCoreAsync_json_output_does_not_emit_ok_true_when_execute_fails` / `RunCoreAsync_json_output_emits_ok_true_after_execute_succeeds`.
- [x] (proven) `--json draft new` still writes human progress lines to stdout — **hit 2026-08-25:** after create/admit the command printed `DraftId:` and `Draft admitted. Resolving MUST questions…` alongside JSON; guarded with `!CliExecutionContext.JsonOutput`; regression in `RunCoreAsync_json_output_suppresses_human_progress_lines`.
- [x] (proven) `--json draft new` still prompts for `--system-name` / `--business-outcome` / `--text` when omitted — **hit 2026-09-03 (#592):** `PromptRequiredAsync` wrote interactive labels to stdout in JSON mode; fixed by requiring all three flags before intake (`RunCoreAsync_json_output_missing_system_name_returns_usage_error_without_prompting`).
- [x] (proven) `ResolveMustQuestionsAsync` skip/answer paths omit `CliScopeResponseValidator` after `SkipDraftQuestionAsync` / `AnswerDraftQuestionAsync` return a draft body — **hit 2026-09-04 (#772):** create/patch/admit validated scope but MUST-question skip/answer continued with cross-tenant drift; fixed by validating returned draft bodies in `DraftNewCommandMustQuestionLoop`; regression in `RunCoreAsync_draft_scope_mismatch_after_skip_must_question_returns_operation_failed`.

2026-09-04 thorough hunt #772: proved MUST-question skip/answer scope-validation parity gap.

---

## Zone: cli-terraform-evidence

- **id:** cli-terraform-evidence
- **status:** open
- **impact:** medium
- **aliases:** terraform evidence; deployment evidence terraform
- **paths:** ArchLucid.Cli/Commands/DeploymentEvidenceTerraformReference.cs
- **test-filter:** FullyQualifiedName~DeploymentEvidenceTerraformReferenceTests
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (proven) Deployment evidence listed `terraform-pilot` before composition roots — fixed by reordering to hosted validate/apply sequence (composition, leaves, orchestrator legacy, pilot default profile).
- [x] (proven) Deployment evidence omitted `infra/terraform-pilot` while listing other metadata-only composition roots — fixed by adding pilot as the first expected apply-order entry.
- [x] (invalid) ARM resource id is stored in the wrong Terraform attribute (name vs id) — zone file is static apply-order text only; no ARM id parsing.
- [x] (invalid) Module-wrapped resource is skipped so evidence omits a live ARM id — no Terraform module parsing in this zone.
- [x] (invalid) Parser treats a comment containing `resource_id` as a real binding — no HCL parser in this zone.
- [x] (valid-no-repro) `DefaultApplyOrderRoots` leaf order drifts from `infra/apply-saas.ps1` `$multiRootSequence` — CI guard covers pilot/apply only; regression in `DefaultApplyOrderRoots_leaf_sequence_matches_apply_saas_ps1_multiRootSequence` (2026-09-04).
- [x] (valid-no-repro) Composition roots in evidence diverge from `$hostedCompositionRoots` — same apply-saas source; `DefaultApplyOrderRoots_composition_roots_match_apply_saas_ps1_hostedCompositionRoots` (2026-09-04).
- [x] (invalid) `DocumentationRelativePath` cites missing stack-order doc — `DocumentationRelativePath_points_to_existing_reference_doc` confirms `docs/library/REFERENCE_SAAS_STACK_ORDER.md` on disk (2026-09-04).
- [x] (invalid) Optional infra roots (`terraform-otel-collector`, `terraform-customer-onboarding`, etc.) must appear in deployment evidence — evidence lists canonical hosted SaaS apply order per `REFERENCE_SAAS_STACK_ORDER.md`, not every `infra/terraform*` directory.

2026-09-04 seed hunt #734: seeded four drift/doc-scope candidates; cheap-disproved all; added apply-saas.ps1 sync regression tests. No hunt-ready rows; seed-only.

---

## Zone: ui-runs-list

- **id:** ui-runs-list
- **status:** open
- **impact:** low
- **aliases:** reviews list; runs list client
- **paths:** archlucid-ui/src/app/(operator)/architecture/reviews/RunsListClient.tsx
- **test-filter:** RunsListClient
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) List renders reviews from a workspace the operator is not scoped to — hub scope intentionally lists cross-project rows; no workspace field on `RunSummary`.
- [x] (invalid) Failed load still shows a previous tenant's cached rows — props-only client; loader clears runs upstream when hub load fails.
- [x] (invalid) Empty state is skipped so a spinner never ends after a 403 — no spinner in `RunsListClient`; 403 surfaces via `OperatorApiProblem` upstream.
- [x] (proven) Space on a compare checkbox bubbled to the row keyboard handler and opened the inspector — fixed by ignoring checkbox targets in `activateRowKeyboard` (matching click behavior).

---

## Zone: ui-auth-callback

- **id:** ui-auth-callback
- **status:** open
- **impact:** low
- **aliases:** auth callback; access panel
- **paths:** archlucid-ui/src/app/(operator)/auth/callback/AuthCallbackAccessPanel.tsx
- **test-filter:** AuthCallbackAccessPanel
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-17
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

2026-08-17 dry hunt: listed hypotheses do not hold on `AuthCallbackAccessPanel`. Denial keeps `AUTH_CALLBACK_ACCESS_HEADING` + `technicalDetail` (success title only after 2xx access-request submit as Î“Ã‡Â£Access request sentÎ“Ã‡Â¥). Recovery links are only `/auth/signin` (no operator-shell href). Panel is props-only (no `useSearchParams` / react-query / email-otp session); error strings are fixed copy and do not interpolate emails. Existing `AuthCallbackAccessPanel` + `CallbackClient` tests (6) pass.

### Hypotheses

- [x] Access-denied technical detail is shown as a successful sign-in (retired: denial heading + detail until access-request 2xx; success copy is request-sent, not signed-in)
- [x] Callback continues into the operator shell when the grant is missing (retired: panel only links to `/auth/signin`; no `window.location` / operator routes)
- [x] Error copy includes another userÎ“Ã‡Ã–s email from a leftover query cache (retired: no query/session read; duplicate/submit errors are fixed strings)

---

## Zone: ui-help-docs

- **id:** ui-help-docs
- **status:** open
- **impact:** low
- **aliases:** help docs; help client
- **paths:** archlucid-ui/src/app/(operator)/help/HelpDocsClient.tsx
- **test-filter:** HelpDocsClient
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — doc-index entries outside CATEGORY_ORDER silently omitted from help hub
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Topic markdown fetch follows an external URL instead of the in-app help route (retired: fetchHelpTopicMarkdown uses `/api/help/{slug}`)
- [x] Missing topic is rendered as a GitHub blob link (retired: not-found → `/help`; doc-index has no github blob URLs)
- [x] Index lists topics the current role is not allowed to open (fixed: generate_doc_index no longer bleeds internal-runbook titles onto public slugs)
- [x] (proven) Fetched doc-index rows duplicate static quick links when the same URL appears under a different category or title — **hit 2026-08-23:** `mergeDocIndex` deduped only on `category|title|url`, so `/help/choose-your-next-step` rendered twice (Getting Started static + Go-to-Market fetched) and `/help/admin-diagnostics` showed both static and fetched titles.
- [x] (proven) `HelpDocsClient` renders only `CATEGORY_ORDER` sections — fetched doc-index rows with a category outside that list merge into `grouped` but never render — **hit 2026-09-04 (#670):** append unknown categories after the fixed order via `helpDocCategoriesForDisplay`; regression in `HelpDocsClient.test.tsx`.
- [ ] (candidate) Help hub search filter matches only `title` and `summary`, not `category` — operators filtering by section name (e.g. "Security") may see "No results" when no row text contains the token.
- [ ] (candidate) Debounced `router.replace` for `?q=` can leave the search input and URL briefly out of sync when the operator clears the box and immediately navigates away.

2026-09-04 seed hunt #670: proved unknown-category doc-index omission; seeded category-name search and debounced URL sync candidates.

## Zone: ui-webhooks-settings

- **id:** ui-webhooks-settings
- **status:** open
- **impact:** medium
- **aliases:** webhooks settings; outbound webhook ui
- **paths:** archlucid-ui/src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx; archlucid-ui/src/app/(operator)/integrations/webhooks/use-webhooks-settings.ts
- **test-filter:** WebhooksSettings
- **hunts:** 5
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — Wave 30 URL-sync effect closed enable/disable dialogs before router.replace updated search params
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Signing secret from a previous workspace remains visible after scope switch
- [x] Save succeeds in the UI when the API returned 403 (retired: create throws on !ok; success callout only after await)
- [x] Dry-run control posts to the live endpoint from the settings form (retired: no dry-run on create form; Send test uses /test)
- [x] (proven) In-flight webhook test or save state survives operator scope switch — **hit 2026-08-21:** scope `useEffect` cleared form rows but not `testingId`/`isSaving`; stale async completions could disable tests or show save success in the new workspace.
- [x] (proven) Stale subscription list from a previous workspace overwrites rows after scope switch — **hit 2026-08-23:** `load()` in `use-webhooks-settings.ts` lacked `scopeGenerationRef` guards; an in-flight `listAlertRoutingSubscriptions` completion could call `setItems` with the prior workspace's subscriptions after the operator switched scope.
- [x] (proven) `confirmEnableSubscription` / `confirmDisableSubscription` lacked `scopeGenerationRef` guards on toggle completion — **hit 2026-08-26:** in-flight `toggleAlertRoutingSubscription` could call `setFailure` in the new workspace after scope switch; fixed by threading generation through `executeToggle` and guarding enable/disable busy and error state (`page.test.tsx` `does not show toggle failure in a new workspace when enable completes after scope switch`).
- [x] (proven) Wave 30 URL-sync effect cleared pending enable/disable dialogs whenever search params were empty — **hit 2026-09-05:** `use-webhooks-settings-mutations` closed dialogs on empty URL before `router.replace` applied `webhookEnableId`/`webhookDisableId`, so confirmation never opened from row actions; fixed by clearing pending state only when URL params transition from set to cleared (`page.test.tsx` enable/disable confirm tests).
- [x] (proven) `executeToggle` duplicated toggle failures as page-level `failure` and dialog error — **hit 2026-09-05:** enable/disable confirm already sets dialog-specific errors; `executeToggle` also called `setFailure`, surfacing twin alerts; fixed by removing page-level failure from toggle catch (`page.test.tsx` `shows enable toggle failure only in the confirmation dialog, not the page alert`).

2026-09-05 seed hunt #807 (hit): proved Wave 30 URL-sync dialog race and duplicate toggle failure surfaces.

---

## Zone: ui-host-gate

- **id:** ui-host-gate
- **status:** cooling
- **impact:** medium
- **aliases:** host gate; split site host
- **paths:** archlucid-ui/src/lib/host-gate.ts
- **test-filter:** host-gate
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (proven) Operator path is treated as marketing on the public host (or the reverse) — **hit 2026-08-23:** `/dashboard`, `/portfolio`, `/admin/*`, and other legacy bookmarks were absent from `LEGACY_OPERATOR_PATH_PREFIXES`, so split-host marketing requests stayed `next` instead of redirecting to the app origin.
- [x] (proven) Retired bookmark is not redirected and 404s instead of the shim — **hit 2026-08-23:** `/alert-routing` and hard-retired executive-dashboard bookmarks were not classified as operator paths; marketing host served its own 404 chrome instead of forwarding to the app 404 shim.
- [x] Split-site origin check allows the operator app origin as a public page Î“Ã‡Ã¶ fixed: `normalizeRequestHost` no longer strips ports; request Host must match `URL.host` from configured origins (localhost:3000 vs :3001)

2026-08-23 dry hunt #48: no open hypotheses; `host-gate.test.ts` (10) passes on split-host redirect matrix.

---

## Zone: ui-architecture-intelligence

- **id:** ui-architecture-intelligence
- **status:** open
- **impact:** medium
- **aliases:** architecture intelligence page; ai page client
- **paths:** archlucid-ui/src/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligencePageClient.tsx
- **test-filter:** ArchitectureIntelligencePageClient
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-02
- **last-bug:** 2026-09-02 — deep-linked source-context query reused prior workspace cache after operator scope switch
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] Page shows recommendations for a package outside the current workspace Î“Ã‡Ã¶ fixed: clear `runState` when inbound `runId` changes
- [x] Stale query data from the previous tenant remains after scope switch Î“Ã‡Ã¶ fixed: reset intake + reasoning on operator scope key change
- [x] Error state is omitted so a failed load looks like an empty architecture â€” (valid-no-repro): `ArchitectureIntelligenceProductContextLoadFailure` renders on HTTP failure; covered by `shows intake load failure with retry when deep-linked product context fails` in `ArchitectureIntelligencePageClient.buyer-polished.test.tsx`
- [x] (proven) Deep-linked run with empty `sourceTexts` and no `from` param shows "Scoped to run" without empty-intake notice — **hit 2026-08-24:** `inboundContextLine` branches on `productContextStatus === "empty"` / `"error"` before scoped fallback
- [x] (proven) `loadGoldenFixture` left `productContextStatus` at `idle` on deep-linked reviews — **hit 2026-08-25:** inbound context fell back to "Scoped to run" and Analyze stayed hidden after fixture hydration (`shows loaded intake context after golden fixture on deep-linked review`)
- [x] (proven) Deep-linked product source-context query key omitted operator scope — **hit 2026-09-02:** React Query reused prior workspace intake after scope switch; fixed scoped query key plus intake reset on scope change (`reloads hydrated intake when operator scope switches on a deep-linked review`)
- [x] (invalid) Successful product-context retry leaves stale inline error alert — `productContextReloadNonce` bump clears `error` before refetch; regression in `clears stale error alert after successful product context retry`

2026-09-02 seed hunt #420 (hit): scoped architecture-intelligence source-context query to operator scope; cleared deep-linked intake on workspace switch; cheap-disproved stale retry error row.

---

2026-09-03 seed hunt #639 (hit): PUT/PATCH `externalId` conflict check ignored directory-removed rows; tombstoned `externalId` could be reassigned to another active user (SQL unique constraint / silent duplicate); fixed `EnsureExternalIdNotUsedByAnotherUserAsync`; regressions `ReplaceAsync_tombstoned_external_id_throws_conflict` and `PatchAsync_tombstoned_external_id_throws_conflict`.

---

## Zone: scim-users

- **id:** scim-users
- **status:** open
- **impact:** high
- **aliases:** scim; entra provisioning users
- **paths:** ArchLucid.Api/Controllers/Scim/ScimUsersController.cs
- **test-filter:** FullyQualifiedName~ScimUsers
- **hunts:** 5
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-03
- **last-bug:** 2026-09-03 — PUT/PATCH assigned `externalId` still held by directory-removed user
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) PATCH/DELETE affects a user in another tenant when externalId collides — repository and service scope by `tenantId` + user `id`; externalId collisions are per-tenant only
- [x] (invalid) Filter query returns users outside the provisioning tenant — `ListAsync` always passes `scope.TenantId` to repository; SQL and in-memory repos filter `TenantId`
- [x] (invalid) Create succeeds without mapping the user into the caller's tenant — `CreateAsync` inserts with controller-provided `scope.TenantId`
- [x] (proven) Whitespace-padded `externalId` bypassed duplicate detection — **hit 2026-08-24:** parser did not trim optional externalId; regression in `CreateAsync_trimmed_external_id_conflicts_with_existing_user`
- [x] (proven) PUT/PATCH changing `externalId` to another user's value threw SQL uniqueness fault instead of SCIM 409 — **hit 2026-08-24:** pre-check via `EnsureExternalIdNotUsedByAnotherUserAsync`; controller maps `ScimConflictException`; regression in `ReplaceAsync_duplicate_external_id_throws_conflict`
- [x] (proven) Active create reserved enterprise seat then leaked it when insert failed — **hit 2026-08-24:** compensating decrement on failure; regression in `CreateAsync_releases_reserved_seat_when_insert_fails`
- [x] (proven) PUT re-activation reserved seat then leaked it when replace failed — **hit 2026-08-24:** `CompensateSeatTransitionAsync` on persistence failure; regression in `ReplaceAsync_compensates_seat_when_persistence_fails_after_activation`
- [x] (proven) DELETE decremented enterprise seat then leaked it when repository deactivate failed — **hit 2026-08-24:** `DeactivateAsync` had no compensating increment; regression in `DeactivateAsync_restores_seat_when_persistence_fails`
- [x] (proven) Repeat DELETE on directory-removed user returned success instead of notFound — **hit 2026-08-25:** `DeactivateAsync` omitted `DirectoryRemovedUtc` guard used by GET/PUT/PATCH; second DELETE returned HTTP 204 while GET returned 404; regression in `DeactivateAsync_throws_not_found_when_user_already_directory_removed`
- [x] (proven) POST create after directory DELETE returned 409 on tombstoned `externalId` instead of reactivating — **hit 2026-08-25:** `CreateAsync` treated directory-removed rows as active duplicates; `UQ_ScimUsers_TenantId_ExternalId` blocks insert; `ReactivateAsync` clears `DirectoryRemovedUtc` and restores profile; regression in `CreateAsync_after_directory_remove_reactivates_same_external_id`
- [x] (proven) PUT/PATCH changing `externalId` to a directory-removed user's value bypassed conflict check — **hit 2026-09-03:** `EnsureExternalIdNotUsedByAnotherUserAsync` skipped rows with `DirectoryRemovedUtc`; active user could claim tombstoned `externalId` (SQL `UQ_ScimUsers_TenantId_ExternalId` fault or silent in-memory duplicate); regressions in `ReplaceAsync_tombstoned_external_id_throws_conflict` and `PatchAsync_tombstoned_external_id_throws_conflict`
- [ ] (candidate) PATCH `active:false` on already-inactive user decrements enterprise seat twice — `TransitionSeatAsync` only runs when `wasActive != willBeActive`; cheap-disproof pending
- [ ] (candidate) SCIM filter `externalId eq` matches directory-removed users in list results — `ListAsync` excludes `DirectoryRemovedUtc`; cheap-disproof pending

---

## Zone: identity-provider-config

- **id:** identity-provider-config
- **status:** open
- **impact:** high
- **aliases:** identity provider; idp activation
- **paths:** ArchLucid.Api/Controllers/Admin/IdentityProviderConfigurationController.cs; ArchLucid.Api/Services/Admin/IdentityProviderActivationService.cs
- **test-filter:** FullyQualifiedName~IdentityProviderActivationServiceTests
- **hunts:** 4
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-25
- **last-bug:** 2026-08-24 — activation accepted non-HTTP(S) issuer URIs that discovery rejects
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Activation writes IdP settings onto a tenant the admin does not own — `ActivateAsync` uses `scope.TenantId` from `ScopeContextProvider`; no tenant override in request body
- [x] (invalid) Disable still leaves the previous client secret usable — no deactivate/disable endpoint; wizard only exposes `activate` which sets `IsActive = true`
- [x] (invalid) Config GET returns another tenant's client id — `GetConfigurationAsync` loads by `scope.TenantId` only
- [x] (proven) SAML metadata discovery HttpClient timeout surfaced as unhandled `OperationCanceledException` — **hit 2026-08-24:** `DiscoverSamlAsync` rethrew timeout; now returns failed response like OIDC; regression in `DiscoverAsync_saml_timeout_returns_failed_response_instead_of_throwing`
- [x] (proven) Re-activate cleared stored `KeyVaultSecretName` and `MetadataXml` when omitted — **hit 2026-08-24:** upsert always nulled whitespace fields; now null preserves existing; regression in `ActivateAsync_reactivate_preserves_key_vault_secret_when_omitted` and `ActivateAsync_reactivate_preserves_metadata_xml_when_omitted`
- [x] (proven) Discover accepted non-HTTP(S) absolute metadata URLs — **hit 2026-08-24:** `Uri.TryCreate` alone allowed `file://`; regression in `DiscoverAsync_rejects_non_http_scheme_metadata_url`
- [x] (proven) Empty SAML metadata HTTP body threw `ArgumentException` to callers — **hit 2026-08-24:** parser throw was uncaught; regression in `DiscoverAsync_saml_empty_body_returns_failed_response_instead_of_throwing`
- [x] (proven) Protocol switch preserved prior protocol `MetadataXml` / `KeyVaultSecretName` when omitted — **hit 2026-08-24:** `ResolveOptionalPersistedField` inherited existing values across SAML↔OIDC; now only preserves within same protocol; regression in `ActivateAsync_protocol_switch_clears_saml_metadata_xml_when_omitted` and `ActivateAsync_protocol_switch_clears_oidc_key_vault_secret_when_omitted`
- [x] (proven) Activation accepted non-HTTP(S) issuer URIs that discovery rejects — **hit 2026-08-24:** `ActivateAsync` validated only non-whitespace and persisted `file:` / `javascript:` issuers; shared absolute HTTP(S) validation now covers discovery and activation; regression in `ActivateAsync_rejects_non_http_scheme_issuer_uri`
- [x] (invalid) Null `ClaimMapping.Mappings` crashes activation with HTTP 500 — **seed 2026-08-25:** LINQ `.Where` throws `ArgumentNullException` (derives from `ArgumentException`); controller maps to 400; regression in `ActivateAsync_null_claim_mapping_entries_throw_argument_null_exception`
- [x] (valid-no-repro) Activation accepts issuer URI without host (`https://`) — **seed 2026-08-25:** `IdentityProviderUriValidator.TryCreateAbsoluteHttpOrHttps` rejects; regression in `ActivateAsync_rejects_issuer_without_host`
- [x] (valid-no-repro) Empty `RoleClaimName` persists broken mapping — **seed 2026-08-25:** `IdentityClaimRoleMappingValidator.ValidateOrThrow` fails before upsert; regression in `ActivateAsync_rejects_empty_role_claim_name`

---

## Zone: worker-host

- **id:** worker-host
- **status:** open
- **impact:** low
- **aliases:** worker program; worker host startup
- **paths:** ArchLucid.Worker/Program.cs
- **test-filter:** FullyQualifiedName~WorkerHostStartupTests|FullyQualifiedName~WorkerCompositionTests
- **hunts:** 4
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-25
- **last-bug:** 2026-08-25 — Simulator mode skipped `MaxCompletionTokens` range check in `ValidateOrThrow`, deferring failure to `AzureOpenAiOptions` `ValidateOnStart` at `Build()`
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Worker host starts without a tenant-scope constraint on background jobs — **valid-no-repro:** background loops push `AmbientScopeContext` per job; `HttpScopeContextProvider` is stateless (not a Program.cs gap)
- [x] (invalid) Composition registers a singleton that caches the first request's tenant — `HttpScopeContextProvider` reads ambient/HTTP per call; no cached tenant state
- [x] (proven) Startup succeeds when a required hosted service failed to resolve — **hit 2026-08-24:** `DevelopmentCatalogResetService` required `ISchemaBootstrapper` while InMemory worker dev hosts skipped SQL registration; stub `InMemoryDevelopmentCatalogResetService` for non-SQL storage
- [x] (proven) Missing `Hosting:Role=Worker` let production validation use Combined — **hit 2026-08-24:** `ContainerJobsOffloadRules` skipped when role unset; `WorkerProcessHostingRoleConfiguration` defaults/rejects
- [x] (proven) Invalid configuration built full DI before fail-fast — **hit 2026-08-24:** `ValidateOrThrow` runs before `Build()` in Worker `Program.cs`
- [x] (proven) Real mode with `AzureOpenAI:AuthenticationMode=ManagedIdentity` fails worker startup — **hit 2026-08-24:** `AgentExecutionRules` required ApiKey despite MI; `AzureOpenAiOptionsValidator` rejected partial credentials without ApiKey; fixed via `AzureOpenAiConfigurationProbe.IsCompletionStackConfigured` and MI-aware options validation; regression in `Worker_host_starts_when_real_mode_uses_managed_identity_without_api_key`
- [x] (valid-no-repro) Real mode startup with `AZURE_OPENAI_*` shell env aliases — `AzureOpenAiEnvironmentConfigurationBridge.Apply` runs before `ValidateOrThrow`; regression in `Worker_host_starts_when_real_mode_uses_azure_openai_environment_aliases`
- [x] (valid-no-repro) Production InMemory storage and Prometheus without scrape credentials — `ValidateOrThrow` rejects via `CollectEphemeralStorageDisallowedInProductionLike` and `ObservabilityRules.CollectPrometheus`; regressions in `Worker_host_fails_fast_when_production_uses_in_memory_storage` and `Worker_host_fails_fast_when_prometheus_enabled_without_scrape_credentials`
- [x] (proven) Simulator mode `MaxCompletionTokens` bypassed pre-Build validation — **hit 2026-08-25:** `AgentExecutionRules.Collect` only range-checked `AzureOpenAI:MaxCompletionTokens` in Real mode, so Simulator with `-1` passed `ValidateOrThrow` but failed `AzureOpenAiOptionsValidator` at `Build()`; moved token cap validation before the Real-mode early return; regressions `CollectErrors_rejects_negative_max_completion_tokens_in_simulator_mode`, `Worker_host_fails_fast_when_simulator_has_negative_max_completion_tokens`
- [x] (invalid) `ConfigurationValidationHostedService` can fail after `ValidateOrThrow` passed — `CriticalConfigurationValidator` checks connection string, Real-mode Azure OpenAI, and production demo flags only; all three are also enforced by `ArchLucidConfigurationRules.CollectErrors`, so a passing pre-Build validation cannot fail the narrower hosted validator on the same configuration snapshot

---

## Zone: billing-webhooks

- **id:** billing-webhooks
- **status:** open
- **impact:** high
- **aliases:** stripe webhook; marketplace webhook; billing webhook replay
- **paths:** ArchLucid.Api/Controllers/Billing/BillingStripeWebhookController.cs; ArchLucid.Api/Controllers/Billing/BillingMarketplaceWebhookController.cs; ArchLucid.Application/Budgeting/LlmTenantWalletStripeWebhookProcessor.cs; ArchLucid.Persistence/Billing/MemoryCacheBillingWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~BillingStripeWebhook|FullyQualifiedName~BillingMarketplaceWebhook|FullyQualifiedName~LlmTenantWalletStripeWebhook|FullyQualifiedName~MemoryCacheBillingWebhookReplayGuard
- **hunts:** 4
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — duplicate Stripe-Signature / Authorization headers comma-joined and rejected
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (proven) Replay guard treated event-id case variants as distinct keys — fixed by normalizing event ids to lowercase in cache keys.
- [x] (proven) `TryRegisterEventAsync` allowed duplicate concurrent registrations — fixed with atomic `ConcurrentDictionary` claims like ITSM replay guard.
- [x] (invalid) Tenant resolution lives in `AzureMarketplaceBillingProvider`; verified JWT claim precedence is intentional when `TenantIdClaimType` is configured.
- [x] (invalid) Stripe and Marketplace controllers return 400 BadRequest when provider rejects invalid signatures.
- [x] (proven) Ledger duplicate deliveries replayed while row still `Received` — **hit 2026-08-24:** `StripeBillingProvider` and `AzureMarketplaceBillingProvider` only rejected duplicates when prior status was `Processed`, so concurrent retries double-applied mutations during in-flight handling; fixed via `BillingWebhookLedgerReplayPolicy`.
- [x] (proven) Wallet `payment_intent.succeeded` acked without crediting on bad metadata — **hit 2026-08-24:** missing/invalid `tenant_id` on `llm_wallet_refill` intents was ignored and the event was marked `Processed`; fixed by validating metadata and throwing so the ledger records `Failed` and Stripe can retry.
- [x] (proven) Marketplace dedupe key used 32-bit `GetHashCode` — **hit 2026-08-24:** distinct `ChangeQuantity` payloads could collide and be falsely rejected; fixed with SHA-256 payload fingerprints in `BillingMarketplaceWebhookDedupeKey`.
- [x] (proven) `BillingStripeWebhookController` / `BillingMarketplaceWebhookController` — duplicate `Stripe-Signature` or `Authorization` headers were comma-joined via `StringValues.ToString()`, breaking signature/JWT verification when a blank first value preceded a valid one — **hit 2026-09-04 (#671):** `InboundWebhookHeaderReader` extracts first non-empty header; regression in `InboundWebhookHeaderReaderTests` and `BillingStripeWebhookReplayHttpTests`.
- [ ] (candidate) Stripe/Marketplace providers call `HasSeenAsync` before ledger insert instead of `TryRegisterEventAsync` — ledger `Received` status + `BillingWebhookLedgerReplayPolicy` already reject in-flight duplicates; wire `TryRegisterEventAsync` only if a repro shows double-mutation without ledger row.
- [ ] (candidate) Wallet-route `payment_intent.*` events without `purpose=llm_wallet_refill` return handled without crediting — intentional filter so Stripe does not retry forever on subscription-route events posted to wallet URL.

2026-09-04 seed hunt #671: proved duplicate billing webhook signature/bearer header comma-join; seeded replay-guard TryRegister wiring and wallet-purpose filter candidates.

---

## Zone: api-key-auth

- **id:** api-key-auth
- **status:** open
- **impact:** high
- **aliases:** API key auth; admin API key settings
- **paths:** ArchLucid.Api/Authentication/ApiKeyAuthenticationHandler.cs; ArchLucid.Api/Services/Admin/AdminApiKeySettingsService.cs; ArchLucid.Api/Controllers/Admin/AdminApiKeySettingsController.cs
- **test-filter:** FullyQualifiedName~ApiKeyAuthentication|FullyQualifiedName~AdminApiKeySettings
- **hunts:** 5
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-26
- **last-bug:** 2026-08-26 — padded Admin/ReadOnly slot strings rejected rotation
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Revoked API key still authenticates until process restart — handler reads `IOptionsMonitor<ApiKeyAuthenticationOptions>.CurrentValue`; rotation via config reload is covered by `When_api_key_options_monitor_advances_old_material_fails_and_new_succeeds`
- [x] (invalid) Admin can read or rotate another tenant's API key settings — host-level `AdminAuthority` settings; keys are not tenant-partitioned configuration
- [x] (invalid) Missing or malformed key header is treated as an authenticated principal — missing/blank/invalid headers return `AuthenticateResult.Fail`; no anonymous success when `Enabled=true`
- [x] (proven) `X-Api-Key` surrounding whitespace broke authentication — **hit 2026-08-24:** provided material was not trimmed before compare; regression in `When_enabled_true_and_admin_key_has_surrounding_whitespace_in_header_still_authenticates`
- [x] (proven) Blank `X-Api-Key` header returned invalid-key failure — **hit 2026-08-24:** whitespace-only header now fails as missing; regression in `When_enabled_true_and_header_is_blank_returns_missing_failure`
- [x] (proven) Shared material in admin and reader slots blocked when admin expiry lapsed but reader expiry valid — **hit 2026-08-24:** admin branch failed before reader branch; regression in `When_shared_key_admin_expired_but_reader_slot_still_valid_authenticates_as_reader`
- [x] (proven) Expired keys still authenticated at exact `ExpiresAt` timestamp — **hit 2026-08-24:** `IsKeyExpired` used `>` instead of `>=`; regression in `When_admin_key_expiry_is_exactly_now_returns_failure`
- [x] (proven) Duplicate `X-Api-Key` headers broke authentication — **hit 2026-08-24:** `StringValues.ToString()` comma-joined multiple header values; now uses first non-empty value; regression in `When_enabled_true_and_duplicate_api_key_headers_use_first_value`
- [x] (proven) Duplicate `X-ArchLucid-Test-Actor-Name` headers broke governance actor override — **hit 2026-08-25:** `ApplyTestActorHeaderOverrides` used `StringValues.ToString()` comma-join; now reuses `ExtractProvidedApiKey` for first non-empty segment; regression in `When_allow_test_actor_headers_and_duplicate_actor_name_headers_use_first_value`
- [x] (proven) `DevelopmentBypassAll` ignored `X-ArchLucid-Test-Actor-Name` governance override — **hit 2026-08-25:** bypass branch returned `BuildSyntheticAdminClaims` directly instead of `BuildSuccessTicket`/`ApplyTestActorHeaderOverrides`; segregation E2E saw `DevUser` instead of peer actor; regression in `When_development_bypass_and_allow_test_actor_headers_overrides_display_name`
- [x] (proven) `AdminApiKeySettingsService.ParseSlot` rejected padded slot strings — **hit 2026-08-26:** `" Admin "` / `" ReadOnly "` threw validation errors instead of rotating; fixed by trimming before case-insensitive compare (`AdminApiKeySettingsServiceTests.Rotate_with_padded_slot_string_succeeds`)
- [ ] (candidate) Duplicate `X-Api-Key` headers where the first value is whitespace-only may still fail when the second value is valid — cheap-disproof: `ExtractProvidedApiKey` already skips blank segments; add handler regression test before promoting.
- [ ] (candidate) Whitespace-only `X-ArchLucid-Test-Actor-Name` with `AllowTestActorHeaders` may override display name — cheap-disproof: `ExtractProvidedApiKey` returns empty and override is skipped.

---

## Zone: scope-binding-middleware

- **id:** scope-binding-middleware
- **status:** open
- **impact:** high
- **aliases:** scope binding; tenant scope middleware; route tenant filter
- **paths:** ArchLucid.Api/Middleware/ScopeIdentityBindingMiddleware.cs; ArchLucid.Api/Middleware/ScopeResolutionGuardMiddleware.cs; ArchLucid.Api/Security/RouteTenantScopeBindingFilter.cs
- **test-filter:** FullyQualifiedName~ScopeIdentityBinding|FullyQualifiedName~ScopeResolutionGuard|FullyQualifiedName~RouteTenantScopeBinding
- **hunts:** 4
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — production-like guard trusted Guid.Empty claim-bound scope
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Route filter binds scope from the body while the URL names a different tenant — `RouteTenantScopeBindingFilter` compares route `tenantId` to ambient scope only; body tenant steering is not in this filter's contract
- [x] (invalid) Middleware lets a mutating request through when scope resolution fails open — `ScopeResolutionGuardMiddleware` returns 403 when `RequiresTrustedScopeRejection` is true; no fail-open path on untrusted resolution
- [x] (invalid) Workspace id from the route is not propagated to the scope context provider — tenant workspace mutations validate workspace membership via repository; route workspace is not meant to override ambient scope for tenant-wide admin flows
- [x] (proven) Production-like guard trusted development-default GUIDs from JWT claims — **hit 2026-08-24:** `ScopeResolutionGuard` only rejected Header/Default/Ambient defaults; regression in `RequiresTrustedScopeRejection_true_when_claim_uses_development_default_guid`
- [x] (proven) `x-workspace-id` header steered scope without a bound claim — **hit 2026-08-24:** middleware only blocked tenant header escalation; regression in `ValidateHeaderOnlyScopeEscalation_rejects_workspace_header_without_claim_for_bearer`
- [x] (proven) `x-project-id` header steered scope without a bound claim — **hit 2026-08-24:** SCIM bearer omitted from header-only escalation guard; regression in `ValidateHeaderOnlyScopeEscalation_rejects_project_header_without_claim_for_scim_bearer`
- [x] (proven) Duplicate `x-*-id` headers bypassed header-only scope escalation guard — **hit 2026-08-24:** `StringValues.ToString()` comma-joined duplicate headers so `Guid.TryParse` failed and steering was ignored; now first non-empty segment is parsed; regressions in `ValidateHeaderOnlyScopeEscalation_rejects_duplicate_tenant_headers_without_claim_for_bearer` and `InvokeAsync_bearer_without_tenant_claim_rejects_duplicate_x_tenant_id_headers`
- [x] (valid-no-repro) Saml2 bearer omitted from workspace header-only escalation guard — `RequiresBoundScopeClaimsForHeaders` includes `Saml2`; regression in `ValidateHeaderOnlyScopeEscalation_rejects_workspace_header_without_claim_for_saml2`
- [x] (valid-no-repro) Duplicate `x-workspace-id` headers bypass workspace header-only escalation — `TryParseHeaderGuid` iterates header segments for all dimensions; regression in `ValidateHeaderOnlyScopeEscalation_rejects_duplicate_workspace_headers_without_claim_for_saml2`
- [x] (valid-no-repro) Production-like guard accepts workspace/project scope resolved from `x-*-id` headers — `ScopeResolutionGuard.IsUntrusted` rejects any `ScopeSource.Header` dimension; regressions in `RequiresTrustedScopeRejection_true_when_workspace_from_header` and `RequiresTrustedScopeRejection_true_when_project_from_header`
- [x] (valid-no-repro) ApiKey-authenticated principal with bound `tenant_id` claim still accepts hostile `x-workspace-id` — generic `ValidateHeaderOnlyDimensionEscalation` branch rejects any unbound dimension; regression in `InvokeAsync_api_key_with_tenant_claim_rejects_x_workspace_id_header`
- [x] (proven) Production-like guard trusted `Guid.Empty` claim-bound scope — **hit 2026-09-04:** `ScopeResolutionGuard.IsUntrusted` only rejected Header/Default/development-default claims; `tenant_id=00000000-0000-0000-0000-000000000000` passed staging guard; fixed by rejecting `Guid.Empty` for any source; regressions in `RequiresTrustedScopeRejection_true_when_tenant_claim_is_empty_guid` and `InvokeAsync_staging_host_rejects_empty_guid_tenant_claim`
- [x] (invalid) Whitespace-padded route `tenantId` bypasses `RouteTenantScopeBindingFilter` — admin/value-report routes bind `{tenantId:guid}`; non-parseable segments never reach the filter
- [ ] (candidate) `DevelopmentBypass` authentication type omitted from `RequiresBoundScopeClaimsForHeaders` — handler materializes scope claims from headers at authenticate time; `Validate` still rejects claim/header disagreement for authenticated principals
- [ ] (candidate) Unauthenticated mutating requests receive 403 from `ScopeResolutionGuardMiddleware` before authorization — fail-closed scope semantics; not cross-tenant IDOR in this zone's contract

---

## Zone: saml-jwt-bearer

- **id:** saml-jwt-bearer
- **status:** open
- **impact:** high
- **aliases:** SAML; trial JWT; SCIM bearer; OIDC auth stack
- **paths:** ArchLucid.Api/Auth/; ArchLucid.Core/Auth/Saml/
- **test-filter:** FullyQualifiedName~Saml|FullyQualifiedName~LocalTrialJwt|FullyQualifiedName~ScimBearer
- **hunts:** 7
- **bugs-found:** 11
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — SAML ambiguous multi-valued scope attributes promoted first value; custom-role permissions resolved via `sub` instead of `oid`; unparseable `auth_time` fell through to fresh `iat` for step-up
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (invalid) SAML metadata parser accepts an entity id that does not match the configured IdP — no separate configured IdP entity id; host SAML binds `AllowedIssuer` from fetched metadata `entityID` (`ArchLucidSaml2IdpMetadataBinder.ApplyResolvedEntity`)
- [x] (valid-no-repro) Trial JWT is accepted after the trial window has expired — trial expiry enforced by `TrialLimitGate` on mutating policies; JWT `exp` is access-token lifetime by design (`LocalTrialJwtIssuer`, `TrialLimitAuthorizationHandler`)
- [x] (invalid) SCIM bearer token for tenant A authorizes provisioning writes for tenant B — Argon hash is tenant-salted (`ScimArgonSecretHasherTests.VerifySecret_wrong_tenant_salt_returns_false`); scope uses `tenant_id` claim over headers (`HttpScopeContextProviderTests.GetCurrentScope_prefers_jwt_claim_over_header`)
- [x] Future `auth_time` / `iat` passes step-up as recent authentication (`RecentAuthenticationEvaluator.HasRecentAuthentication`) — fixed: reject negative age; regression in `HasRecentAuthentication_returns_false_for_future_auth_time`
- [x] (proven) SAML inbound scope claims (`tenant_id`, `workspace_id`, `project_id`, `oid`) not promoted when configured source claim type casing differs from assertion — **hit 2026-08-23:** `PromoteSingleValueIfMissing` used case-sensitive `FindFirst` while role promotion was case-insensitive; aligned lookup in `ArchLucidSamlInboundClaimsNormalizer`.
- [x] (proven) `PlatformUserAuthVersionValidator` skips auth-version stamp when trial `JwtIssuer` is empty but PEM `JwtLocalIssuer` matches — **hit 2026-08-24:** revoked platform-user GUID tokens without `archlucid_auth_ver` passed when `Auth:Trial:LocalIdentity:JwtIssuer` was unset; fixed by also matching `ArchLucidAuth:JwtLocalIssuer` (`PlatformUserAuthVersionValidatorTests`).
- [x] (proven) JwtBearer principals without a bound `tenant_id` claim could steer tenant via `x-tenant-id` — **hit 2026-08-24:** header-only escalation guard applied only to ApiKey; extended to Bearer and SAML2 in `ScopeIdentityBindingMiddleware` (`ScopeIdentityBindingMiddlewareTests`).
- [x] (proven) SAML inbound normalizer promoted non-GUID tenant/workspace/project values onto canonical scope claims — **hit 2026-08-24:** non-GUID `tenant_id` claims failed `Guid.TryParse` in scope resolution and fell back to headers; fixed by skipping non-GUID promotion (`ArchLucidSamlInboundClaimsNormalizerTests`).
- [x] (proven) SAML IdP metadata binder picked first SSO endpoint regardless of HTTPS or Redirect binding — **hit 2026-08-24:** `SingleSignOnServices.First()` could select cleartext HTTP-POST before HTTPS Redirect; fixed with ordered selection (`ArchLucidSaml2IdpMetadataBinderTests`).
- [x] (proven) SAML IdP metadata binder picked first SingleLogoutService regardless of HTTPS or Redirect binding — **hit 2026-08-25:** `SingleLogoutServices.First()` could select cleartext HTTP-POST before HTTPS Redirect; fixed with ordered selection mirroring SSO (`ApplyResolvedEntity_prefers_https_single_logout_endpoint_over_http_post_listed_first`).
- [x] (proven) `ArchLucidSamlInboundClaimsNormalizer.PromoteSingleValueIfMissing` appended duplicate scope claims when a conflicting canonical value already existed — **hit 2026-08-26:** pre-existing `tenant_id`/`workspace_id` with wrong GUID plus configured IdP attribute produced two claims and `FindFirst` kept the wrong scope; fixed by removing conflicting canonical claims before promoting mapped source values (`ArchLucidSamlInboundClaimsNormalizerTests.Apply_replaces_conflicting_scope_claim_with_configured_source_value`).
- [x] (proven) `ArchLucidSamlInboundClaimsNormalizer.PromoteSingleValueIfMissing` promoted the first of multiple distinct inbound scope source values — **hit 2026-09-05 (#812):** duplicate IdP tenant attributes with different GUIDs bound scope order-dependently via `FirstOrDefault`; fixed by skipping promotion when more than one distinct non-empty source value exists (`ArchLucidSamlInboundClaimsNormalizerTests.Apply_skips_ambiguous_multi_valued_scope_source_claims`).
- [x] (proven) `CustomRoleClaimsTransformation.TryResolveScimUserIdAsync` preferred `sub` over `oid` — **hit 2026-09-05 (#812):** Entra-style principals with mismatched `oid`/`sub` grafted another user's custom-role permissions while `RoleSyncService` bound roles via `oid`; fixed by preferring `RoleSyncService.TryDirectoryObjectKey` (`CustomRoleClaimsTransformationTests.TransformAsync_prefers_oid_over_sub_when_resolving_scim_user`).
- [x] (proven) `RecentAuthenticationEvaluator.TryGetAuthenticationInstant` fell back to `iat` when `auth_time` was present but unparseable — **hit 2026-09-05 (#812):** step-up accepted fresh token issue time despite garbage `auth_time`; fixed by failing closed when `auth_time` claim exists but does not parse (`RecentAuthenticationEvaluatorTests.HasRecentAuthentication_returns_false_when_auth_time_is_present_but_unparseable`).
- [x] (invalid) `PlatformUserAuthVersionValidator.MatchesLocalIssuer` — issuer string must match configured value exactly; cheap-disproof suggests JwtBearer rejects issuer mismatch before validator runs (no bypass reachable) — **cheap-disproof 2026-09-05 (#828):** ordinal `MatchesLocalIssuer` skips stamp in isolation but `ArchLucidJwtBearerConfiguration` sets `ValidIssuer` with ordinal match so case-variant tokens fail at JwtBearer before `OnTokenValidated`; regressions in `ValidateAsync_skips_auth_version_when_local_issuer_differs_only_by_casing` and `AddArchLucidAuth_local_pem_rejects_token_when_issuer_differs_only_by_casing`.
- [x] (invalid) `TrialExternalIdJwtBearerSupport.TryAllowConsumerIdentityIssuers` — forged CIAM issuer acceptance; cheap-disproof suggests signature validation still applies — **cheap-disproof 2026-09-05 (#828):** wrapper only short-circuits `IssuerValidator` for `ExternalIdIssuerPatterns` matches; `ValidateIssuerSigningKey` / signing key material unchanged; regression in `TryAllowConsumerIdentityIssuers_does_not_disable_signature_validation_parameters`.

2026-09-05 thorough hunt #828 (dry): cheap-disproved both open JWT/SAML bearer candidates; no new hunt-ready repro.

2026-09-05 seed hunt #812 (hit): reseeded SAML scope ambiguity, custom-role oid/sub alignment, and step-up `auth_time` parse fail-closed gaps.

---

## Zone: tenant-data-export

- **id:** tenant-data-export
- **status:** open
- **impact:** high
- **aliases:** tenant export; run export; export SSRF
- **paths:** ArchLucid.Application/Exports/; ArchLucid.Api/Controllers/Authority/ExportsController.cs; ArchLucid.Api/Controllers/Authority/ArchitectureExportController.cs; ArchLucid.Api/Controllers/Authority/RunsExportController.cs; ArchLucid.Core/Security/AllowedRunExportBlobDestinationUrlPolicy.cs
- **test-filter:** FullyQualifiedName~ArchitectureReviewExport|FullyQualifiedName~ExportsController|FullyQualifiedName~AllowedRunExportBlobDestinationUrlPolicy
- **hunts:** 13
- **bugs-found:** 20
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — blob push accepted lifecycle-incomplete runs
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Export includes runs or findings from a workspace outside the caller scope — fixed: `ExportsController` binds export records to scoped `GetRunDetailAsync` before read/compare/replay
- [x] (proven) Sponsor review packet export succeeds for in-progress or broken-manifest runs — **hit 2026-08-19:** `SponsorReviewPacketBuilder` omitted `IsCommitted` / `HasBrokenManifestReference` guards used by other export services.
- [x] (proven) Sponsor review packet deterministic report undercounts high-severity findings — **hit 2026-08-23:** `BuildDeterministicSponsorReport` compared `Severity.ToString()` to `"High"` but `FindingSeverity` uses `Error` for the high band; aligned with `RunSummaryOnePagerDocumentFactory` mapping.
- [x] (invalid) Blob destination URL policy allows an internal/metadata endpoint (SSRF) — retired: decimal/link-local literals rejected; Azure blob host + DNS resolve guard
- [x] (invalid) Export succeeds when the run is still in progress and returns partial or stale bytes — retired for DOCX/PDF/HTML/summary paths; sponsor packet gap fixed above.
- [x] (proven) Run summary one-pager capped top findings at three after selecting five — **hit 2026-08-24:** `RunSummaryOnePagerDocumentFactory.Create` applied `.Take(3)` while export selected five High/Critical findings; removed cap (`RunSummaryOnePagerDocumentFactoryTests`).
- [x] (proven) Run summary export misreported broken-manifest runs as not finalized — **hit 2026-08-24:** `RunSummaryOnePagerExportService` skipped `HasBrokenManifestReference` guard; aligned message with other export paths (`RunSummaryOnePagerExportServiceTests`).
- [x] (proven) HTML architecture review export omitted demo-tenant safety labeling — **hit 2026-08-24:** `BuildMinimalHtml` ignored `IsDemoTenant`; added demo notice (`ArchitectureReviewExportServiceTests`).
- [x] (proven) Sponsor review packet evidence badges ignored demo-run context — **hit 2026-08-24:** `SponsorReviewPacketComposer` resolved badges with empty `PilotRunDeltas`; passes demo provenance from run detail (`SponsorReviewPacketComposerTests`).
- [x] (proven) `ArtifactExportController.DownloadTerraformAdvisoryExport` and `CreateTerraformPr` load run detail but omit the committed-manifest guard used by `PushRunExportToBlob` — **hit 2026-08-25:** in-progress runs with `GoldenManifest == null` returned ZIP bytes or opened a PR; aligned with blob-push guard (`ArtifactExportControllerRunExportTests`).
- [x] (proven) `RunQueryController.ExportRunFindingsCsv` checks run existence and manifest pointer consistency but not `IsCommitted` — **hit 2026-08-25:** ReadyForCommit runs exported findings CSV while sibling buyer exports reject; added `IsCommitted` guard and 409 mapping (`RunFindingsQueryServiceExportTests`, `RunQueryControllerTests`).
- [x] (proven) HTML architecture review export omits active-trial notice — **hit 2026-08-25:** `BuildMinimalHtml` ignored `activeTrialExportNotice` while PDF/DOCX passed `ActiveTrialExportNoticeFormatter` output; aligned HTML with sibling formats (`GenerateReportAsync_html_includes_active_trial_notice_when_tenant_on_active_trial`).
- [x] (proven) `RunSummaryOnePagerExportService.GenerateMarkdownAsync` omitted demo-tenant and active-trial safety labeling — **hit 2026-08-26:** one-pager markdown ignored `IsDemoTenant` and `ActiveTrialExportNoticeFormatter` while board PDF/DOCX/HTML embed them; fixed model/template plus tenant-scoped notice resolution (`RunSummaryOnePagerExportServiceTests.GenerateMarkdownAsync_includes_demo_and_active_trial_notices`, `RunSummaryOnePagerMarkdownRendererTests.Render_includes_demo_and_active_trial_notices`).
- [x] (proven) `SponsorReviewPacketBuilder` / `SponsorReviewPacketComposer.ComposeMarkdown` omitted active-trial export notice — **hit 2026-08-26:** executive sponsor packet lacked trial watermark present on board PDF/DOCX paths; fixed with shared `ActiveTrialExportNoticeResolver` and `ExportSafetyNoticeMarkdown` (`SponsorReviewPacketBuilderTests.BuildMarkdownAsync_includes_active_trial_notice_when_tenant_on_trial`, `SponsorReviewPacketComposerTests.ComposeMarkdown_includes_active_trial_notice_when_provided`).
- [x] (proven) `SponsorReviewPacketBuilder.BuildTopDecisionsAsync` — `GetRegisterAsync` is project-scoped with no `runId` filter; per-run executive packet listed decisions from other runs — **hit 2026-08-27:** filter register rows by `entry.RunId` before composing top decisions (`SponsorReviewPacketBuilderTests.BuildMarkdownAsync_includes_only_decisions_for_the_requested_run`).
- [x] (proven) `DecisionReceiptService.BuildForRunAsync` — used `GetRunSummaryAsync` + manifest summary only; omitted `HasBrokenManifestReference` / `IsCommitted` guards used by sibling export services — **hit 2026-08-27:** in-progress or broken-manifest runs with a golden-manifest pointer could export decision receipts; aligned with `SponsorReviewPacketBuilder` via `IRunDetailQueryService` (`DecisionReceiptServiceTests.BuildForRunAsync_UncommittedRunWithManifestPointer_ReturnsNull`, `BuildForRunAsync_BrokenManifestReference_ReturnsNull`).
- [x] (proven) `TenantReviewBoardCoverLogoStore.TryGetBytesAsync` — returned raw blob bytes without `ArchitectureReviewBoardCoverLogoValidator` re-check at export embed time — **hit 2026-08-27:** validate on read and return null for tampered payloads (`TenantReviewBoardCoverLogoStoreTests`).

- [x] (proven) `SponsorReviewPacketComposer.ComposeMarkdown` — hardcoded `isDemoTenant: false` in `ExportSafetyNoticeMarkdown.Append` — **hit 2026-09-02 (#497):** demo runs showed evidence-badge demo labeling only inside nested review summary while board PDF/DOCX/HTML place demo notice at document start; fixed by resolving demo tenant from `ContosoRetailDemoIdentifiers` before header append (`ComposeMarkdown_includes_top_level_demo_notice_for_demo_run`).

- [x] (proven) `ArchitectureReviewExportService.GenerateReportAsync` — committed run with manifest but `AuthorityLifecyclePhase != Complete` returned PDF/DOCX/HTML bytes instead of HTTP 409 — **hit 2026-09-03 (#543):** omitted `AuthorityLifecycleCompareExportGuard` present on one-pager/CSV/DOCX sibling paths; regression in `ArchitectureReviewExportServiceTests.GenerateReportAsync_throws_conflict_when_authority_lifecycle_not_complete`.
- [x] (proven) `ArchitectureReviewExportService` / `ArchitectureReviewBoardExportDocumentFactory` — simulator-mode runs omit `SimulatorModeExportRehearsalMarkdown` notice on board PDF/DOCX/HTML while one-pager markdown embeds it — **hit 2026-09-04 (#665):** factory omitted simulator rehearsal fields; DOCX/PDF cover and HTML export lacked notice; fixed with model hydration + cover-page rendering aligned to one-pager; regressions in `ArchitectureReviewBoardSimulatorModeExportTests`.
- [x] (proven) `ArchitectureReviewExportService.GenerateReportAsync` — uncommitted runs (`Manifest == null`) reached analysis/build instead of 409 finalized-review conflict — **hit 2026-09-04 (#665):** omitted `IsCommitted` guard present on `RunSummaryOnePagerExportService`; regression in `ArchitectureReviewExportServiceTests.GenerateReportAsync_throws_conflict_when_not_finalized`.

2026-09-04 thorough hunt #665: proved board export simulator rehearsal notice parity and uncommitted-manifest export guard gap.

- [x] (proven) `ArtifactExportController.PushRunExportToBlob` — accepted lifecycle-incomplete runs with a golden manifest and returned 202 while sibling export paths reject via `AuthorityLifecycleCompareExportGuard` — **hit 2026-09-05 (#799):** added `EnsureAuthorityLifecycleCompleteOrConflict` preflight before outbox enqueue; regression in `PushRunExportToBlob_returns_409_when_authority_lifecycle_not_complete`.
- [ ] (candidate) `ArtifactExportController.PushRunExportToBlob` — omits sealed-manifest hash preflight at accept time while `CreateTerraformPr` / download paths call `EnsureSealedManifestHashOrConflict`; bad hash may enqueue then dead-letter in worker.
- [ ] (candidate) `ArchitectureReviewBoardExportDocumentFactory` — sets simulator rehearsal notice only when `StructuralExecutionMode == Simulator`; Fallback/Mixed modes and `RealModeFellBackToSimulator` lack sponsor-packet execution-mode honesty sections.
- [ ] (candidate) `ExportReplayService.ReplayAsync` — rebuilds analysis DOCX after sealed-hash guard but without `AuthorityLifecycleCompareExportGuard`; lifecycle-incomplete runs may replay export bytes while board/one-pager paths 409.

2026-09-05 seed hunt #799: reseeded blob-push sealed-hash preflight, board Fallback/Mixed execution-mode notice, and export-replay lifecycle candidates; proved blob push lifecycle-incomplete accept gap promoted from seed read.

2026-09-03 seed hunt #543: proved board export authority lifecycle Complete guard gap; cheap-disproved blob URL policy; seeded simulator-notice parity candidate.

2026-09-02 seed hunt #497: reseeded from tenant export surfaces; proved sponsor packet top-level demo notice gap after master merge.

---

## Zone: host-core-jobs

- **id:** host-core-jobs
- **status:** open
- **impact:** medium
- **aliases:** background jobs; hosted services; durable job queue
- **paths:** ArchLucid.Host.Core/Jobs/; ArchLucid.Host.Core/Hosted/
- **test-filter:** FullyQualifiedName~ArchLucidJob|FullyQualifiedName~BackgroundJob|FullyQualifiedName~Hosted
- **hunts:** 9
- **bugs-found:** 9
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-03
- **last-bug:** 2026-09-03 — durable background job processor overwrote `Canceled` with `Pending`/`Failed` on executor failure after cancel during run
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (proven) Job dequeue runs work without re-binding tenant scope from the job payload — `BackgroundJobWorkUnitExecutor` resolves scope via `BackgroundJobWorkUnitScopeResolver` and pushes `AmbientScopeContext` before run-scoped reads
- [x] Leader-elected hosted service runs the same outbox drain on every replica â€” retired: intentional when `HostLeaderElection:Enabled` is false; default is enabled
- [x] Stuck-running watchdog marks a healthy job failed and it is retried into duplicate side effects â€” fixed stale threshold to exceed processor visibility (2026-08-17)
- [x] (proven) MarkCanceledAsync on a pending in-memory job still runs after dequeue — `InMemoryBackgroundJobQueue` overwrote `Canceled` with `Running` when the channel item was processed; fixed by skipping canceled and non-runnable states before execution (2026-08-23)
- [x] (proven) Integration event DLQ auto-retry never requeues eligible dead letters when permanently failed rows fill the first list cap — **hit 2026-08-23:** `IntegrationEventDlqRetryBackgroundWork` listed only the first 100 dead-letter rows; 100 newer permanently failed rows hid an eligible older row from `ResetDeadLetterForRetryAsync`
- [x] (proven) `MarkCanceledAsync` on a running in-memory job is overwritten by late executor success — **hit 2026-08-23:** `ExecuteAsync` persisted `Succeeded` without re-checking `BackgroundJobState.Canceled` after `ExecuteAsync` returned
- [x] (proven) Stale-running watchdog never reclaims `MaxRetries=0` export jobs (`RetryCount < MaxRetries` is always false) and leaves reclaimed `Pending` rows without Azure queue notifications — **hit 2026-08-23:** `ResetStaleRunningJobsOlderThanAsync` now allows the zero-retry crash reclaim path, marks exhausted rows `Failed`, and `BackgroundJobStuckRunningWatchdogBackgroundWork` re-sends queue notifications for pending reclaims
- [x] (proven) `IntegrationEventDlqRetryBackgroundWork.RunSinglePassAsync` read `DateTime.UtcNow` directly while `IntegrationEventDlqRetryPolicy` accepts an explicit UTC instant — **hit 2026-08-26:** rows with unexpired backoff were requeued when wall clock advanced past eligibility while tests and policy expected a frozen pass instant; fixed by resolving `TimeProvider` from DI scope (`IntegrationEventDlqRetryBackgroundWorkTests.RunSinglePassAsync_does_not_requeue_before_backoff_when_clock_is_injected`, `RunSinglePassAsync_requeues_after_backoff_when_clock_is_injected`).
- [x] (proven) `BackgroundJobQueueProcessorHostedService` overwrote `Canceled` with `Succeeded` when cancel landed during executor run — **hit 2026-09-02:** durable processor called `MarkSucceededAsync` without re-reading row state after `ExecuteAsync`, unlike the in-memory queue cancel fix; fixed by skipping success/retry when `GetAsync` reports `Canceled` (`ProcessOneMessageAsync_does_not_mark_succeeded_when_job_canceled_during_execution`).
- [x] (proven) `BackgroundJobQueueProcessorHostedService.HandleFailureAsync` overwrote `Canceled` with `Pending` or `Failed` when cancel landed during a failing executor run — **hit 2026-09-03:** failure path called `MarkPendingRetryAsync` / `MarkFailedTerminalAsync` from the pre-execution row snapshot without re-reading cancel state; fixed by checking `GetAsync` before any failure transition (`ProcessOneMessageAsync_does_not_mark_pending_retry_when_job_canceled_during_failed_execution`, `ProcessOneMessageAsync_does_not_mark_failed_terminal_when_job_canceled_during_failed_execution`).

2026-09-02 seed hunt #423 (hit): promoted durable-processor cancel/success race from in-memory parity gap; proved with failing repro.

2026-09-03 seed hunt #579 (hit): promoted cancel-on-failure parity gap from success-path fix #423; proved retry and terminal failure paths both overwrote `Canceled`.

---

## Zone: itsm-inbound-webhooks

- **id:** itsm-inbound-webhooks
- **status:** open
- **impact:** high
- **aliases:** ITSM webhook; ServiceNow inbound; connector secret
- **paths:** ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs; ArchLucid.Application/Integrations/Itsm/; ArchLucid.Persistence/Integrations/MemoryCacheItsmInboundWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~ItsmInboundWebhook
- **hunts:** 11
- **bugs-found:** 14
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — disposition sync infrastructure failure returned HTTP 500 after human-review update; replay released on retry
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Stale ITSM correlation with missing finding row returned HTTP 400 — fixed by acknowledging (`Accepted=true`) while still emitting tenant-scoped rejected audit.
- [x] (candidate) Webhook accepted when the shared secret does not match the connector config - invalid: WebhookSecrets.SecureEquals rejects before parse
- [x] (proven) Replay guard allows duplicate delivery of the same event id — **hit 2026-08-20:** `MemoryCacheItsmInboundWebhookReplayGuard.TryClaimAsync` used `IMemoryCache.GetOrCreate`, whose factory can run twice under concurrency; event ids were also case-sensitive so `delivery-1` and `DELIVERY-1` bypassed dedupe
- [x] (candidate) Inbound payload is applied to a tenant inferred from the body instead of the authenticated connector - fixed: tenant-scoped routes use TryGetByExternalKeyForTenantAsync
- [x] (proven) Authenticated ITSM webhook with malformed JSON body surfaces `JsonException` as HTTP 500 — **hit 2026-08-23:** `ItsmInboundWebhooksController` called `JsonDocument.Parse` after shared-secret verify with no `JsonException` guard; valid token + non-JSON body returned 500 instead of 400
- [x] (proven) `JiraStatusHumanReviewMap` / `ServiceNowStateHumanReviewMap` invalid enum values silently fall through to built-in defaults — **hit 2026-08-24:** `TryConfiguredHumanReview` returned false on parse failure so `Map*ToHumanReview` applied default Done/Closed mappings (`ItsmInboundWebhookSyncServiceTests.Jira_invalid_configured_human_review_map_emits_unknown_status_audit_not_default_mapping`).
- [x] (proven) Tenant-scoped ITSM webhook routes with `Guid.Empty` skipped tenant credential lookup and used deployment-wide secrets — **hit 2026-08-24:** `ResolveInboundSecretAsync` treated `Guid.Empty` like unscoped; controller now returns HTTP 400 (`InboundWebhookPipelineOrderIntegrationTests.Jira_tenant_scoped_route_with_empty_guid_returns_400`).
- [x] (proven) `RouteTenantScopeBindingFilter` forbade anonymous `[AllowUnscopedRoute]` ITSM tenant webhook actions — **hit 2026-08-24:** filter compared route `{tenantId}` to empty ambient scope and returned HTTP 403 before controller dispatch; skip unscoped/anonymous endpoints.
- [x] (proven) ServiceNow inbound webhook ignored `incident_state` when `state` was whitespace — **hit 2026-08-25:** `TryReadServiceNowKeys` only fell back on null `state`, so payloads like `"state":" "` with `"incident_state":"6"` were rejected instead of mapping resolved (`ItsmInboundWebhookSyncServiceTests.ServiceNow_inbound_uses_incident_state_when_state_is_whitespace`).
- [x] (proven) ServiceNow inbound webhook ignored `incident_state` when `state` was JSON null — **hit 2026-08-26:** `TryReadServiceNowKeys` assigned `state` from `GetRawText()` (`"null"`) for `JsonValueKind.Null`, blocking `incident_state` fallback; fixed by treating null tokens as absent (`ServiceNow_inbound_uses_incident_state_when_state_is_json_null`).
- [x] (proven) `ItsmInboundJiraPayloadReader` case-sensitive on `issue` / `fields` / `status` / `name` — **hit 2026-09-02 (#520):** PascalCase `Issue`/`Key`/`Fields`/`Status`/`Name` webhook shapes returned `TryRead=false` and were dropped; fixed with case-insensitive property lookup (`ItsmInboundJiraPayloadReaderTests.TryRead_accepts_PascalCase_issue_fields_status_name`).
- [x] (invalid) `ItsmInboundExternalStatusMapper.TryMapConfiguredDisposition` silently skips invalid disposition enum spellings without audit — invalid config returns null disposition and sync audit records `dispositionSkipReason: disposition_unmapped`; existing regression `TryMapServiceNowStateToDisposition_ignores_invalid_enum_values` documents intentional skip (asymmetric with human-review rejection but not a parse defect).
- [x] (valid-no-repro) `ItsmInboundWebhookReplayEventId.Resolve` delivery-id casing vs replay guard lowercase cache keys — `BuildCacheKey` lowercases event ids for dedupe; preserved casing in audit payloads is cosmetic and duplicate delivery ids with different casing still dedupe correctly.

2026-09-02 thorough hunt #520: cheap-disproof closed disposition-map and replay-id casing candidates; proved Jira PascalCase payload property lookup gap.

- [x] (proven) `ItsmInboundServiceNowPayloadReader` case-sensitive on `sys_id` / `sysId` / `state` / `incident_state` — PascalCase `Sys_Id` / `SysId` / `State` / `Incident_State` webhook shapes returned `TryRead=false` and were dropped as unrecognized payloads — **hit 2026-09-03 (#558):** shared `ItsmInboundJsonElementReader` case-insensitive property lookup for ServiceNow (Jira reader refactored to same helper); regression in `ItsmInboundServiceNowPayloadReaderTests`.

2026-09-03 seed hunt #558: proved ServiceNow inbound PascalCase property lookup gap; refactored Jira reader onto shared JSON helper.

- [x] (proven) ServiceNow inbound webhook ignored mapped `incident_state` when `state` was present but unmapped — **hit 2026-09-04 (#717):** `TryReadServiceNowKeys` only fell back on null/whitespace `state`, so payloads like `"state":"4"` with `"incident_state":"6"` were rejected; fixed with `AlternateStatusValue` fallback in pipeline (`ServiceNow_inbound_uses_incident_state_when_state_is_unmapped_but_incident_state_resolves`).
- [x] (proven) ServiceNow JSON numeric `state` serialized as whole-number float (`6.0`) failed builtin choice-list map — **hit 2026-09-04 (#717):** `ReadStringOrRawText` used `GetRawText()` (`"6.0"`), so `int.TryParse` failed; fixed by normalizing JSON numbers to integer status text (`ServiceNow_inbound_json_whole_number_float_state_parses_as_builtin_choice_list`).
- [x] (valid-no-repro) Jira changelog-only webhook bodies without `issue.fields.status.name` are dropped — reader contract requires `issue → fields → status → name`; changelog-only automation payloads are intentionally unsupported (`ItsmInboundJiraPayloadReaderTests.TryRead_rejects_changelog_only_payload_without_issue_fields_status_name`).
- [x] (proven) `ItsmInboundWebhookProcessPipeline.TryProcessUpdateAsync` returns HTTP 500 after human-review update when disposition sync throws a non-`ArgumentException` — **hit 2026-09-05 (#804):** human-review mutation preceded disposition; pipeline `catch` released replay and rethrew; fixed by catching non-validation disposition failures in `ItsmInboundDispositionSync` and returning `disposition_sync_failed` skip (`ItsmInboundWebhookSyncServiceTests.Jira_when_disposition_sync_fails_after_human_review_still_accepts_without_releasing_replay`).

2026-09-05 thorough hunt #804: proved disposition sync infrastructure failure surfaced as HTTP 500 after human-review update; fixed skip handling and restored sealed-manifest test doubles in sync service tests.

---

## Zone: ui-auth-proxy

- **id:** ui-auth-proxy
- **status:** open
- **impact:** high
- **aliases:** UI auth; API proxy; edge proxy
- **paths:** archlucid-ui/src/lib/auth/; archlucid-ui/src/app/api/proxy/; archlucid-ui/src/proxy.ts
- **test-filter:** lib/auth|proxy-route|proxy.ts
- **hunts:** 10
- **bugs-found:** 9
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-04 — anonymous marketing allowlist omitted why-archlucid-pack.pdf proxy download
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (candidate) Proxy forwards operator cookies or auth headers to a marketing-only upstream path - invalid: server bearer stripped on allowlisted marketing paths; cookies are not copied upstream
- [x] (candidate) Return-destination helper accepts an external URL that bypasses host-gate - invalid: `isSafeReturnPath` rejects external URLs; host-gate runs on next navigation
- [x] (proven) Anonymous marketing proxy path can reach a mutating operator API route via literal `..` segments - fixed: reject `..`/`.` proxy segments before upstream fetch
- [x] (proven) `buildProxyUpstreamPath` — `%2e%2e` proxy segments decode to `..` during URL normalization and reach `architecture/draft/*` while literal `..` segments are rejected
- [x] (proven) Double-encoded `%252e%252e` proxy segments bypass the `%2e` substring guard and still reach operator draft routes from anonymous marketing paths
- [x] (proven) Post-sign-in return URLs accept embedded protocol-relative segments — **hit 2026-08-21:** `isSafeReturnPath` only rejected leading `//` and percent-decoded three passes, so `/x%2F%2Fevil.example` and quadruple-encoded `//` payloads passed through `signInHasReturnDestination`.
- [x] (proven) Nine-level `%2e%2e` proxy segments bypass the eight-pass decode guard and still normalize onto `architecture/draft/*` while `isAnonymousMarketingProxyPath` skips bearer auth — **hit 2026-08-23:** reject proxy segments and return paths that remain percent-encoded after the decode guard.
- [x] (proven) Post-sign-in return URLs accept backslash path separators that normalize to traversal — **hit 2026-08-25:** `isSafeReturnPath` rejected `/\\evil` but not `/welcome\..\..\operator`; browsers normalize `\` to `/` so dot-segment smuggling bypassed the return-url gate; regression in `safe-return-path.test.ts` and `sign-in-return-destination.test.ts`.
- [x] (proven) Post-sign-in return URLs accept dot-segment traversal that browsers normalize outside the auth subtree — **hit 2026-08-26:** `/signin/../../administration` and `/%2e%2e/admin` passed `isSafeReturnPath` while resolving to `/administration` and `/admin`; fixed with `containsDotDotSegment` in `safe-return-path.ts`; regressions in `safe-return-path.test.ts` and `sign-in-return-destination.test.ts`.
- [x] (proven) `isAnonymousMarketingProxyPath` allowlist omits `v1/marketing/early-access` and trust-center ZIP/PDF routes — **hit 2026-09-03 (#593):** UI posts through `/api/proxy/...` but `buildProxyUpstreamHeaders` attached `ARCHLUCID_PROXY_BEARER_TOKEN` unlike quick-scan / quote-request; extended allowlist in `proxy-anonymous-marketing-paths.ts`; regressions in `proxy-route-anonymous-marketing.test.ts`.
- [x] (proven) `isAnonymousMarketingProxyPath` allowlist omits `v1/marketing/why-archlucid-pack.pdf` — **hit 2026-09-04 (#711 seed):** `/why` and `/see-it` link `/api/proxy/v1/marketing/why-archlucid-pack.pdf` but server bearer still attached; extended allowlist (+ proactive `enterprise-comparison.pdf` / `sponsor-brief.pdf`); regression `does not attach server bearer for marketing why-archlucid pack PDF download`.
- [x] (candidate) `resolveShowcasePageRenderPlan` fetches `v1/marketing/showcase/{runKey}` directly against API base — invalid: SSR uses anonymous server `fetch` with no `Authorization` or `X-Api-Key`; `GET /v1/marketing/showcase/{runKey}` is `[AllowAnonymous]` and does not need proxy bearer stripping
- [x] (candidate) Browser-supplied `Authorization` on anonymous marketing proxy paths still forwards upstream — invalid: by design; `buildProxyUpstreamHeaders` strips only the configured server bearer on allowlisted marketing paths while preserving a signed-in visitor's bearer

2026-09-05 thorough hunt #809 (dry): cheap-disproof closed showcase-direct-fetch and client-bearer-forward candidates; regressions in `proxy-route-anonymous-marketing.test.ts` and `showcase-page.test.tsx`.

2026-09-04 seed hunt #711: reseeded from zone files; proved why-archlucid-pack.pdf allowlist gap; seeded showcase-direct-fetch and client-bearer-forward candidates.

2026-09-03 thorough hunt #593: proved marketing allowlist bearer leak for early-access and trust-center ZIP.

---

## Zone: security-analyzers

- **id:** security-analyzers
- **status:** open
- **impact:** high
- **aliases:** require authorization analyzer; tenant identity boundary; mutating controller audit
- **paths:** ArchLucid.Analyzers/RequireAuthorizationAnalyzer.cs; ArchLucid.Analyzers/TenantIdentityBoundaryAnalyzer.cs; ArchLucid.Analyzers/MutatingControllerAuditAnalyzer.cs
- **test-filter:** FullyQualifiedName~RequireAuthorizationAnalyzer|FullyQualifiedName~TenantIdentityBoundaryAnalyzer|FullyQualifiedName~MutatingControllerAuditAnalyzer
- **hunts:** 11
- **bugs-found:** 17
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — AL0003 missed `[MutatingAuditExcluded]` on implemented interface methods
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Controller action mutates state without audit attribute and analyzer stays silent — **hit 2026-08-24:** `TrackedVerbAttribute` omitted `HttpPatchAttribute`; many PATCH endpoints skipped AL0003; regression in `AL0003_reports_when_HttpPatch_action_lacks_IAudit_LogAsync`
- [x] (proven) Cross-tenant repository call with only workspace id in scope passes `TenantIdentityBoundaryAnalyzer` — **hit 2026-08-24:** `typeof(HttpContext)` / `typeof(ClaimsPrincipal)` flagged like real usage; `IsInTypeOf` exemption; regressions in `Does_not_report_typeof_HttpContext` / `Does_not_report_typeof_ClaimsPrincipal`
- [x] (invalid) Mutating controller without `[Authorize]` does not fire `RequireAuthorizationAnalyzer` — analyzer targets missing auth on actions/controllers; not a mutating-without-audit gap
- [x] (proven) ARCH001 analyzed `*.Tests` assemblies — `ShouldAnalyzeAssembly` lacked `.Tests` suffix exclusion (unlike AL0001); regression in `Does_not_report_when_assembly_is_tests`
- [x] (proven) AL0001 reported public `[NonAction]` controller helpers — `RequireAuthorizationAnalyzer` did not skip `NonActionAttribute`; regression in `Does_not_report_public_NonAction_helper`
- [x] (proven) AL0001 reported controller when every public action had `[AllowAnonymous]` — type-level fallback fired after all actions were skipped; regression in `Does_not_report_controller_when_all_public_actions_have_AllowAnonymous`
- [x] (proven) AL0001 ignores `[Authorize]` on implemented interface methods — **hit 2026-08-24:** controller actions implementing interface methods with interface-level or method-level `[Authorize]` were flagged (or controller type reported when all actions were interface-authorized); fixed by walking `AllInterfaces` / `FindImplementationForInterfaceMember`; regressions in `Does_not_report_when_interface_method_has_Authorize` / `Does_not_report_when_implemented_interface_has_Authorize`
- [x] (proven) AL0003 ignores inherited `[MutatingAuditExcluded]` on base controller — **hit 2026-08-25:** `MutatingAuditExcludeApplies` walked only `ContainingType` nesting, not `BaseType` inheritance; derived controller actions false-positive AL0003; fixed by walking base types per nested declaring type; regression in `Mutating_audit_excluded_on_base_controller_suppresses_AL0003_on_derived_action`
- [x] (proven) AL0001 ignores `[NonAction]` on overridden base helper — **hit 2026-09-03:** `RequireAuthorizationAnalyzer` checked `NonActionAttribute` only on the derived `IMethodSymbol`, not `OverriddenMethod` chain; `public override IActionResult Helper()` false-positive AL0001; fixed by walking override chain; regression in `Does_not_report_NonAction_helper_inherited_from_base_method`
- [x] (proven) AL0003 ignores `[MutatingAuditExcluded]` on overridden base mutating action — **hit 2026-09-03:** `MutatingAuditExcludeApplies` skipped method-level exclusion on `OverriddenMethod` when derived action re-declared `[HttpPost]`; false-positive AL0003; fixed by walking override chain; regression in `Mutating_audit_excluded_on_base_method_suppresses_AL0003_on_override`
- [x] (valid-no-repro) `HttpContext? ctx = default` in inner layer — type name in declaration is intentional ARCH001 signal, not a `default` expression false positive
- [x] (proven) ARCH001 emitted duplicate diagnostics when a generic had multiple banned type arguments — **hit 2026-09-03:** `AnalyzeGenericName` reported once per matching `TypeArguments` entry; fixed to emit a single diagnostic per generic; regression in `Reports_single_diagnostic_when_generic_has_multiple_banned_type_arguments`
- [x] (proven) ARCH001 missed nested banned types inside generic type arguments — **hit 2026-09-03:** `IsOrUsesBannedType` did not recurse into `INamedTypeSymbol.TypeArguments`, so `Dictionary<string, List<IHttpContextAccessor>>` slipped through; fixed with recursive type-argument walk; regression in `Reports_nested_generic_type_argument_in_inner_layer_assembly`
- [x] (proven) AL0001 ignored `[AllowAnonymous]` on overridden base helper — **hit 2026-09-03:** `RequireAuthorizationAnalyzer` checked auth attributes only on the derived `IMethodSymbol`, not `OverriddenMethod`; false-positive AL0001 on overrides; fixed by walking override chain; regression in `Does_not_report_AllowAnonymous_helper_inherited_from_base_method`
- [x] (proven) AL0003 missed tracked HTTP verbs on overridden mutating actions — **hit 2026-09-03:** `MethodSpecifiesTrackedVerb` read only derived `IMethodSymbol` attributes, so `[HttpPost]` on a virtual base with an unaudited override skipped AL0003; fixed by walking `OverriddenMethod` and suppressing shadowed virtual bases; regressions in `AL0003_reports_when_overridden_action_inherits_HttpPost_from_base` and `AL0003_reports_when_override_adds_HttpPost_to_base_NonAction_helper`
- [x] (valid-no-repro) `IHttpContextAccessor[]` array parameters — element-type `IdentifierName` already triggers ARCH001; no separate array-type gap
- [x] (valid-no-repro) AL0001 `[Authorize]` on overridden base helper — already covered by `MethodInheritsAuthorizeOrAllowAnonymousFromOverriddenChain`; regression in `Does_not_report_Authorize_helper_inherited_from_base_method`
- [x] (proven) AL0003 inherited base `[MutatingAuditExcluded]` when override declared its own HTTP verb — **hit 2026-09-03:** `MutatingAuditExcludeApplies` walked `OverriddenMethod` without checking whether the derived action re-declared `[HttpPost]`/`[HttpPut]`/etc., so a derived mutating override skipped AL0003; fixed by skipping method-level exclusion inheritance when `MethodHasTrackedVerbAttribute` is true on the override; regression in `AL0003_reports_when_override_adds_HttpPost_despite_base_MutatingAuditExcluded`
- [x] (valid-no-repro) ARCH001 `Action<HttpContext>` delegate parameters — recursive `IsOrUsesBannedType` already flags nested generic arguments; regression in `Reports_delegate_type_argument_with_banned_type_in_inner_layer_assembly`
- [x] (valid-no-repro) AL0003 `LogAsync` inside local functions — `DescendantNodesAndSelf` already finds nested invocations; regression in `AL0003_is_absent_when_LogAsync_is_in_local_function`
- [x] (invalid) AL0003 `[AcceptVerbs("POST")]` mutating actions skip audit — `TrackedVerbAttribute` only matches `HttpPost`/`HttpPut`/`HttpDelete`/`HttpPatch`; intentional escape hatch for non-mutating 405 handlers (`DemoViewerController.PostNotAllowed`); regression in `AcceptVerbs_post_does_not_trigger_AL0003`
- [x] (valid-no-repro) ARCH001 `using` type alias for banned types — alias target and usage both surface ARCH001; cheap-disproof 2026-09-04
- [x] (proven) AL0003 false-positive when `LogAsync` called on concrete `IAuditService` implementation — **hit 2026-09-04:** `InvocationMatchesAuditInterfaceSemantic` required callee `ContainingType` to equal `IAuditService`, so audited actions injecting `SqlAuditService` (or other concrete type) still reported AL0003; fixed by recognizing interface implementation via `FindImplementationForInterfaceMember`; regression in `AL0003_is_absent_when_LogAsync_is_called_on_concrete_audit_service`
- [x] (valid-no-repro) ARCH001 value-tuple parameters with banned element types — `IdentifierName` walk already flags tuple element types; regression in `Reports_value_tuple_element_with_banned_type_in_inner_layer_assembly`

- [x] (proven) AL0003 missed tracked HTTP verbs declared on implemented interface methods — **hit 2026-09-04 (#770):** `MethodSpecifiesTrackedVerb` read only derived and override-chain attributes, so `[HttpPost]` on `IMutatingApi.Post` let controller implementations skip audit enforcement; fixed by walking `ExplicitInterfaceImplementations` and `FindImplementationForInterfaceMember`; regression in `AL0003_reports_when_HttpPost_is_declared_on_implemented_interface`.
- [x] (proven) AL0003 missed `[MutatingAuditExcluded]` on implemented interface methods — **hit 2026-09-05 (#815):** `MutatingAuditExcludeApplies` walked method/base/containing types only, so `[MutatingAuditExcluded]` on interface members let controller implementations false-positive AL0003; fixed by walking `ExplicitInterfaceImplementations` and `FindImplementationForInterfaceMember`; regression in `Mutating_audit_excluded_on_interface_method_suppresses_AL0003`.
- [x] (invalid) AL0001 may miss `[Authorize]` on interface explicit implementation when action name differs — cheap-disproof 2026-09-05: separate public actions with different names are not interface implementations; implicit implementations require matching member names and already inherit via `FindImplementationForInterfaceMember`; regression in `Does_not_report_when_default_interface_implementation_carries_Authorize`.

2026-09-05 hunt #815: proved AL0003 interface audit-exclusion inheritance gap; invalidated AL0001 explicit-impl rename candidate.

---

## Zone: agent-runtime-safety

- **id:** agent-runtime-safety
- **status:** open
- **impact:** high
- **aliases:** content safety guard; prompt injection sanitizer; agent evidence untrusted input
- **paths:** ArchLucid.AgentRuntime/Safety/; ArchLucid.AgentRuntime/PromptInjection/
- **test-filter:** FullyQualifiedName~AzureContentSafetyGuard|FullyQualifiedName~AgentEvidenceUntrustedInputSanitizer|FullyQualifiedName~PromptInjection
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (valid-no-repro) Content safety guard maps a blocked category to allow on SDK failure — intentional fail-open when `FailClosedOnSdkError=false` (`AzureContentSafetyGuardSdkFailureTests`).
- [x] (proven) Untrusted evidence delimiter is stripped so injection payload reaches the model prompt — embedded `</untrusted_input>` / `<untrusted_input>` broke the outer wrapper; fixed with ZWSP tag neutralization in `AzureResourceTagPromptSanitizer`.
- [x] (valid-no-repro) Sanitizer runs after the prompt is assembled instead of before — `ArchitectureRunExecuteOrchestrator.AgentLoop` calls `SanitizeAsync` before `agentExecutor.ExecuteAsync`.
- [x] (proven) `StreamJsonAsync` yielded completion chunks before output content-safety scan — blocked output could reach streaming callers; fixed by buffering until `CheckOutputAsync` passes.
- [x] (proven) Sanitizer wrapped only `evidence.Request` while `AgentUserPromptComposer` reads live `ArchitectureRequest` fields — untrusted-input wrapping bypassed for description/constraints; fixed by sanitizing both objects in `AgentEvidenceUntrustedInputSanitizer`.
- [x] (proven) `SystemName` and `Environment` reached prompts with delimiter escape only — no `<untrusted_input>` wrap unlike description; fixed by extending sanitizer coverage to package scalars and architecture request identity fields.

---

## Zone: application-analysis

- **id:** application-analysis
- **status:** open
- **impact:** medium
- **aliases:** architecture analysis; compare quality delta
- **paths:** ArchLucid.Application/Analysis/
- **test-filter:** FullyQualifiedName~ArchitectureAnalysis|FullyQualifiedName~CompareQuality
- **hunts:** 19
- **bugs-found:** 31
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — E2E export pairing mispaired same-profile exports with different compare-run ids
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Analysis compares runs from different tenants when scope keys collide — rollup/compare loads runs via `IRunDetailQueryService` + `ScopeContext`; manifest reads are tenant-scoped; export records key on globally unique run GUIDs
- [x] (candidate) Quality delta treats a failed run as higher quality than a succeeded run — **fixed 2026-08-18:** missing knowledge model substituted empty model, zeroing uncovered-mandatory "after" counts
- [x] (proven) Compare summary omits manifest datastore/relationship diffs that exist in the source run — **fixed 2026-08-23:** `MarkdownEndToEndReplayComparisonSummaryFormatter` only listed services/controls while `EndToEndReplayComparisonExportService` already surfaced datastores and relationships
- [x] (proven) `CompletionStateDiffers` false when both runs completed at different times — **hit 2026-08-23:** `BuildRunDiff` only set the flag for null-vs-non-null `CompletedUtc`; export showed "Completion State Differs: No" while `ChangedFields` listed `CompletedUtc`
- [x] (proven) Compare quality delta populated on report but omitted from markdown/HTML/DOCX/PDF exports — **hit 2026-08-24:** `AddCompareQualityDeltaAsync` set `CompareQualityDelta` but export formatters never surfaced the stratified counts
- [x] (proven) Manifest diff skipped when `CurrentManifestVersion` asymmetric — **hit 2026-08-24:** `BuildAsync` gated `IManifestDiffService.Compare` on both runs having non-empty version metadata even when both manifest bodies were loaded
- [x] (proven) Detailed comparison exports duplicate Compare Quality Delta section — **hit 2026-08-25:** refactor #21 moved delta into `MarkdownEndToEndReplayComparisonSummaryFormatter` but markdown/HTML/DOCX/PDF detailed formatters still appended `CompareQualityDeltaExportFormatter` again (`CompareQualityDeltaExportTests.GenerateMarkdown_detailed_profile_includes_compare_quality_delta_once_with_default_summary_formatter`)
- [x] (proven) Detailed comparison exports duplicate Interpretation Notes and Warnings — **hit 2026-08-26:** summary formatter already appends notes/warnings but markdown/HTML/DOCX/PDF formatters appended them again; fixed by removing outer duplicate sections (`CompareQualityDeltaExportTests.GenerateMarkdown_detailed_profile_includes_interpretation_notes_once_with_default_summary_formatter`, `CompareQualityDeltaExportTests.GenerateHtml_detailed_profile_includes_interpretation_notes_once_with_default_summary_formatter`).
- [x] (proven) `EndToEndReplayComparisonService.BuildAsync` paired export diffs by `ExportType` only — **hit 2026-09-02:** sponsor vs internal consulting DOCX exports with the same type mispaired when creation order differed; fixed by pairing on `ExportType|TemplateProfile|Format` with occurrence indexing (`EndToEndReplayComparisonServiceRunDiffTests.BuildAsync_pairs_export_records_by_template_profile_not_creation_order`).
- [x] (proven) `ComparisonDriftAnalyzer.CompareElement` compared JSON arrays positionally — **hit 2026-09-02:** reordering `["a","b"]` to `["b","a"]` reported value drift at each index; fixed by sorting array elements canonically before compare (`ComparisonDriftAnalyzerTests.Analyze_ReorderedPrimitiveArray_DoesNotReportDrift`).
- [x] (proven) `EndToEndReplayComparisonService.AddInterpretationNotes` skipped agent/manifest synergy notes when `ManifestDiff` was null — **hit 2026-09-02:** material `AgentResultDiff` with unavailable manifest bodies produced no interpretation note; fixed with agent-only and manifest-only branches (`EndToEndReplayComparisonServiceRunDiffTests.BuildAsync_when_manifest_missing_but_agent_changed_adds_interpretation_note`).
- [x] (proven) GCP Cloud Asset inventory `//*.googleapis.com/projects/...` names fail reconciliation against graph `projects/...` paths — **hit 2026-09-03:** `NormalizeGcpResourceId` lowercased full URIs without stripping the service prefix; fixed canonicalization in `GraphGcpInventoryReconciliationAnalyzer` (`GraphGcpInventoryReconciliationAnalyzerTests.Analyze_treats_cloud_asset_full_name_as_same_resource_as_projects_path`, `InventoryTopologyResourceNodeIndexTests.Resolve_returns_matching_gcp_topology_node_ids_for_cloud_asset_inventory_name`).
- [x] (proven) HTML sponsor export omits Interpretation Notes when summary formatter stub omits `## Interpretation Notes` — **hit 2026-09-03:** markdown export already had fallback append; HTML executive path did not (`EndToEndReplayComparisonExportServiceSponsorAndRelationshipDiffTests.GenerateHtml_executive_profile_appends_interpretation_notes_when_summary_formatter_omits_them`).
- [x] (proven) `ManifestChangedMaterially` ignored `ManifestDiffResult.Warnings` — **hit 2026-09-03:** warnings-only manifest diffs skipped synergy interpretation notes (`EndToEndReplayComparisonServiceRunDiffTests.BuildAsync_when_manifest_warnings_only_adds_material_manifest_interpretation_note`).
- [x] (proven) PDF detailed profile may omit detailed appendices when summary formatter is minimal — **hit 2026-09-04 (#664):** `EndToEndReplayComparisonPdfExportFormatter` emitted sponsor-style key counts for all non-short profiles instead of run/agent/manifest/export appendices; fixed with executive vs detailed branching aligned to markdown/HTML; regression in `EndToEndReplayComparisonPdfAndDocxParityTests.GeneratePdf_detailed_profile_includes_run_metadata_diff_section_not_only_key_counts`.
- [x] (proven) DOCX interpretation-notes fallback may diverge from markdown/HTML when summary formatter omits `## Interpretation Notes` — **hit 2026-09-04 (#664):** `EndToEndReplayComparisonDocxExportFormatter` detailed path never appended interpretation notes or warnings when summary stub omitted those headings; fixed with markdown/HTML parity fallback; regressions in `EndToEndReplayComparisonPdfAndDocxParityTests.GenerateDocx_detailed_profile_appends_interpretation_notes_when_summary_formatter_omits_them` and `GenerateDocx_detailed_profile_appends_warnings_when_summary_formatter_omits_them`.
- [x] (proven) PDF interpretation-notes fallback missing when summary formatter omits `## Interpretation Notes` — **hit 2026-09-04 (#664):** same gap as DOCX on PDF detailed path; fixed alongside detailed-appendices refactor; regression in `EndToEndReplayComparisonPdfAndDocxParityTests.GeneratePdf_detailed_profile_appends_interpretation_notes_when_summary_formatter_omits_them`.

2026-09-04 thorough hunt #664: proved PDF detailed appendices parity and DOCX/PDF interpretation-notes/warnings fallback gaps.

- [x] (proven) HTML/PDF/DOCX detailed manifest appendices omit relationship diffs while markdown detailed export renders them — **hit 2026-09-04 (#762):** `EndToEndReplayComparisonHtmlExportFormatter`, `EndToEndReplayComparisonPdfExportFormatter`, and `EndToEndReplayComparisonDocxExportFormatter` listed services/datastores/required-controls only; fixed with relationship sections and `RelationshipDiffItem.ToDisplayLine()`; regressions in `GenerateHtml_detailed_includes_relationship_subsections_when_populated`, `GeneratePdf_detailed_includes_relationship_subsections_when_populated`, `GenerateDocx_detailed_includes_relationship_subsections_when_populated`.
- [x] (proven) `EndToEndReplayComparisonHtmlExportFormatter.AppendAgentResultDiff` omits confidence and required-control/warning deltas — **hit 2026-09-04 (#762):** detailed HTML showed claims/findings only while markdown/PDF/DOCX include confidence and control/warning lists; fixed with markdown parity; regression in `GenerateHtml_detailed_includes_agent_confidence_and_required_control_diffs`.
- [x] (proven) `EndToEndReplayComparisonHtmlExportFormatter.AppendExportDiffs` omits `RequestDiff.ChangedFlags` / `ChangedValues` — **hit 2026-09-04 (#762):** HTML listed only top-level fields and warnings; fixed with markdown parity; regression in `GenerateHtml_detailed_includes_export_request_flag_and_value_diffs`.
- [x] (proven) `EndToEndReplayComparisonHtmlExportFormatter.MarkdownToSimpleHtml` leaves compare-quality-delta markdown tables as raw pipe text while `CompareQualityDeltaExportFormatter.AppendHtml` is unused — **hit 2026-09-04 (#763):** summary markdown table became `<p>| Metric | Before | After |</p>`; fixed by stripping the markdown section and appending structured HTML via `AppendHtml`; regression in `CompareQualityDeltaExportTests.GenerateHtml_default_profile_includes_compare_quality_delta_section`.
- [x] (invalid) `ComparisonDriftAnalyzer.CompareElement` may false-positive on JSON numbers that differ only in representation (`1` vs `1.0`) — **invalid 2026-09-04 (#763):** `Analyze_EquivalentIntegerAndDoubleScalars_DoesNotReportDrift` shows `SerializeToElement` normalizes equivalent scalars before `ToString()` compare.
- [x] (invalid) `GraphGcpInventoryReconciliationAnalyzer.CollectInventoryResourceIds` only reads inventory `name` — **invalid 2026-09-04 (#763):** hosted GCP extractor `GcpInventoryZipPackager` always emits Cloud Asset `name`; rows with only `gcpResourceId` are not in the production corpus (`Analyze_ignores_inventory_rows_without_cloud_asset_name_field` documents intentional asymmetry vs graph-side multi-key lookup).

2026-09-04 thorough hunt #763: proved HTML compare-quality-delta structured rendering gap; cheap-disproved drift numeric representation and GCP inventory alternate-key candidates.

- [x] (proven) PDF/DOCX exports omit compare-quality-delta when summary formatter stub omits `## Compare Quality Delta` — **hit 2026-09-04 (#764):** HTML #763 stripped/re-appended via `CompareQualityDeltaExportFormatter` but PDF/DOCX embedded raw summary only; fixed with shared `RemoveMarkdownSection` + plain-text delta append; regressions in `GeneratePdf_default_profile_includes_compare_quality_delta_when_summary_formatter_omits_section` and `GenerateDocx_default_profile_includes_compare_quality_delta_when_summary_formatter_omits_section`.
- [x] (proven) E2E detailed agent appendices omit evidence-ref deltas — **hit 2026-09-04 (#764):** markdown/HTML/PDF detailed exports listed claims/findings/controls/warnings but not `AddedEvidenceRefs` / `RemovedEvidenceRefs`; fixed across formatters; regressions in `GenerateMarkdown_detailed_includes_agent_evidence_ref_diffs`, `GenerateHtml_detailed_includes_agent_evidence_ref_diffs`, `GeneratePdf_detailed_includes_agent_evidence_ref_diffs`.
- [x] (proven) E2E detailed manifest appendices omit `ManifestDiffResult.Warnings` while interpretation synergy notes may reference warnings-only diffs — **hit 2026-09-04 (#765):** duplicate candidate row closed; see proven entry below.
- [x] (proven) `ReplayComparisonInterpretationDiffSlice.AgentOutputsChangedMaterially` ignores confidence-only and evidence-ref-only agent drift when manifest bodies are present — **hit 2026-09-04 (#765):** duplicate candidate row closed; see proven entry below.
- [x] (proven) Executive/sponsor `AppendSponsorReport` key counts omit relationship-only manifest deltas — **hit 2026-09-04 (#765):** duplicate candidate row closed; see proven entry below.

2026-09-04 seed hunt #764: proved PDF/DOCX compare-quality-delta fallback and agent evidence-ref export parity; reseeded manifest-warnings export body and interpretation materiality candidates.

- [x] (proven) E2E detailed manifest appendices omit `ManifestDiffResult.Warnings` while interpretation synergy notes reference warnings-only diffs — **hit 2026-09-04 (#765):** detailed markdown/HTML/PDF/DOCX `AppendManifestDiff` and summary formatter listed structural deltas only; fixed with manifest warnings sections; regressions in `GenerateMarkdown_detailed_includes_manifest_warnings_when_populated` and `GenerateHtml_detailed_includes_manifest_warnings_when_populated`.
- [x] (proven) `ReplayComparisonInterpretationDiffSlice.AgentOutputsChangedMaterially` ignores confidence-only and evidence-ref-only agent drift — **hit 2026-09-04 (#765):** synergy branch emitted "Neither agent outputs nor manifest changed materially" for confidence/evidence-only deltas; fixed via shared `AgentResultDeltaMateriality`; regressions in `BuildAsync_when_only_agent_confidence_changed_adds_material_agent_interpretation_note` and `BuildAsync_when_only_evidence_refs_changed_adds_material_agent_interpretation_note`.
- [x] (proven) Executive/sponsor `AppendSponsorReport` key counts omit relationship-only manifest deltas — **hit 2026-09-04 (#765):** sponsor manifest line counted services/datastores only; fixed with relationship +/- counts across markdown/HTML/PDF/DOCX; regression in `GenerateMarkdown_executive_profile_includes_relationship_counts_in_key_manifest_line`.

2026-09-04 thorough hunt #765: proved manifest-warnings export body gap, agent materiality interpretation misclassification, and sponsor relationship key-count parity.

- [x] (proven) `MarkdownArchitectureAnalysisExportService.AppendDeterminismAndDiffs` omits manifest relationship diffs — **hit 2026-09-04 (#766):** architecture-analysis markdown export listed services/datastores/controls/warnings only; fixed with relationship `ToDisplayLine()` sections; `DocxArchitectureAnalysisExportService` aligned for relationships and manifest warnings; regression in `GenerateMarkdown_manifest_diff_includes_relationship_subsections_when_populated`.
- [x] (proven) Executive/sponsor `AppendSponsorReport` key counts omit warnings-only and required-control-only manifest deltas — **hit 2026-09-04 (#767):** sponsor manifest line showed all-zero structural counts for warnings/controls-only diffs; fixed via shared `ManifestDiffMateriality.FormatSponsorKeyCountsLine` across markdown/HTML/PDF/DOCX; regressions in `GenerateMarkdown_executive_profile_includes_manifest_warning_count_in_key_manifest_line` and `GenerateMarkdown_executive_profile_includes_required_control_counts_in_key_manifest_line`.
- [x] (proven) `DeterminismCheckService.HasManifestDrift` ignores warnings-only manifest drift — **hit 2026-09-04 (#767):** structural-count-only check marked warnings-only replay iterations as manifest-matching; fixed via shared `ManifestDiffMateriality.HasMaterialChanges` (also deduped interpretation slice); regression in `RunAsync_when_manifest_diff_has_warnings_only_marks_manifest_drift`.

2026-09-04 thorough hunt #767: proved sponsor warnings/controls key-count parity and determinism warnings-only manifest drift detection.

- [x] (proven) `DocxArchitectureAnalysisExportService` agent diff omits evidence-ref and warning deltas — **hit 2026-09-04 (#768):** standard architecture-analysis DOCX listed claims/findings/controls only while markdown and E2E DOCX include evidence refs and warnings; fixed with markdown parity sections; regression in `GenerateDocxAsync_agent_result_diff_includes_evidence_refs_and_warnings`.
- [x] (invalid) `GraphGcpInventoryReconciliationAnalyzer.CollectInventoryResourceIds` reads only Cloud Asset `name` while graph side indexes `gcpResourceId` — **invalid 2026-09-04 (#769):** duplicate of #763; hosted GCP extractor always emits Cloud Asset `name`; `Analyze_ignores_inventory_rows_without_cloud_asset_name_field` documents intentional asymmetry.
- [x] (invalid) `ComparisonsApplicationService.IsComparisonRecordInScopeAsync` OR-gates left/right run and export anchors — **invalid 2026-09-04 (#769):** artifact replay is documented to not require both source runs; OR anchor gate enables stored-payload replay when one endpoint is deleted or out of scope; regression guard in `TryGetScopedRecordAsync_returns_record_when_only_left_run_anchor_is_in_scope`.
- [x] (proven) `ConsultingDocxSupplementalSections` Appendix C manifest diff lists services/controls counts only — **hit 2026-09-04 (#769):** Appendix C omitted datastore, relationship, and warning counts; fixed with full manifest diff count bullets; regression in `AddAppendices_includes_datastore_relationship_and_warning_manifest_counts`.

2026-09-04 thorough hunt #769: proved consulting Appendix C manifest-count parity; cheap-disproved GCP inventory alternate-key and comparison scope OR-gate candidates.

- [x] (proven) `ConsultingDocxSupplementalSections.AddArchitectureDetails` omits manifest relationships and returns before rendering when `Datastores` is empty — **hit 2026-09-04 (#771):** Architecture Details listed services/datastores only; relationship-only manifests (no datastores) silently dropped relationships; fixed with Relationships section and removed datastore early-return; regression in `AddArchitectureDetails_includes_relationships_when_datastores_are_empty`.
- [ ] (candidate) `ComparisonReplayPayloadComplexity.ScoreManifestDiff` ignores `manifestDiff.warnings` when structural lists are empty — warnings-only replay payloads may score as zero manifest complexity while materiality treats warnings as drift; verify whether cost-band under-scoring is intentional before hunt-ready promotion.
- [x] (proven) `ReplayComparisonExportsDiffSlice.BuildExportPairingKey` pairs exports on `ExportType|TemplateProfile|Format` only — **hit 2026-09-05 (#797):** same-profile exports with different `CompareRunId` / `CompareManifestVersion` mispaired when creation order differed across runs (same defect shape as proven #430 template-profile fix); fixed by extending pairing key with compare dimensions; regression in `BuildAsync_pairs_export_records_by_compare_run_id_not_creation_order`.

2026-09-05 thorough hunt #797: proved export compare-run pairing mispairing; warnings-only replay complexity candidate remains open.

2026-09-04 seed hunt #768: reseeded GCP inventory key asymmetry, comparison scope OR-gate, and consulting appendix manifest-count candidates; proved architecture-analysis DOCX agent evidence-ref/warning diff gap promoted from seed read.

2026-09-04 seed hunt #764: proved PDF/DOCX compare-quality-delta fallback and agent evidence-ref export parity; reseeded manifest-warnings export body and interpretation materiality candidates.

2026-09-03 seed hunt #547: proved GCP Cloud Asset URI normalization, HTML sponsor interpretation-notes fallback, and manifest-warnings materiality; reseeded PDF/DOCX export parity candidates.

2026-09-02 thorough hunt #430: proved export mispairing, array reorder drift, and agent-only interpretation-note gaps.

2026-08-26 seed hunt #6: reseeded export mispairing / array reorder drift / synergy-note candidates; proved duplicate Interpretation Notes and Warnings in E2E exports.

---

## Zone: application-billing-logic

- **id:** application-billing-logic
- **status:** open
- **impact:** high
- **aliases:** marketplace billing; checkout mutation; billing application layer
- **paths:** ArchLucid.Application/Billing/
- **test-filter:** FullyQualifiedName~Marketplace|FullyQualifiedName~BillingCheckout|FullyQualifiedName~TenantLlmCostReporting
- **hunts:** 5
- **bugs-found:** 7
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-03
- **last-bug:** 2026-09-03 — abandoned checkout Pending row blocked retry
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Marketplace mutation handler applies a subscription change to the wrong tenant — `MarketplaceChange*WebhookMutationHandler` receives resolved `tenantId` from persistence; no alternate tenant lookup in Application layer.
- [x] (invalid) Checkout session is created without binding the caller tenant id — checkout session creation lives in `ArchLucid.Api/Controllers/Billing/` and `Persistence/Billing`, not `ArchLucid.Application/Billing/`.
- [x] (invalid) Idempotent replay of a billing event double-applies seat or credit changes — replay guard and `TryInsertWebhookEventAsync` are in `AzureMarketplaceBillingProvider` (Persistence), not Application mutation handlers.
- [x] (proven) `TenantLlmCostReportingService.BuildDashboardAsync` sets `ByWorkspaceProject[].WorkspaceName` from `tenant.Name` instead of the scoped workspace display name — operators see tenant label on workspace breakdown rows (fixed 2026-08-23; `TenantLlmCostReportingServiceTests`).
- [x] (proven) `TenantLlmCostTopRunRanker.RankAsync` lists runs via `ListRunsByProjectAsync(..., "default", ...)` so create flows that map `SystemName` onto the run project slug yield an empty Top Runs panel — fixed 2026-08-23; `TenantLlmCostTopRunRankerTests.RankAsync_includes_runs_whose_project_slug_is_not_default`.
- [x] (proven) `TenantLlmCostReportingService.BuildDashboardAsync` daily chart labels prior-month UTC dates with current-month spend when `days` exceeds elapsed month days — fixed 2026-08-24; clamp window to month start (`TenantLlmCostReportingServiceTests.BuildDashboardAsync_daily_buckets_stay_within_current_utc_month`).
- [x] (proven) `TenantLlmCostReportingService.BuildDashboardAsync` labels tenant-wide `monthPressure` as "Current project" in `ByWorkspaceProject` — fixed 2026-08-24; row now reads "Tenant-wide (estimated)" (`TenantLlmCostReportingServiceTests.BuildDashboardAsync_labels_breakdown_as_tenant_wide_estimate`).
- [x] (proven) `MarketplaceChangePlanWebhookMutationHandler` defaults missing `planId` to `TenantTier.Standard` and mutates ledger — fixed 2026-08-24; defer without mutation (`MarketplaceChangePlanWebhookMutationHandlerTests.Ga_enabled_missing_planId_defers_without_ledger_mutation`).
- [x] (proven) `MarketplaceChangeQuantityWebhookMutationHandler` defaults missing `quantity` to one seat and mutates ledger — **hit 2026-09-02 (#511):** GA-enabled `ChangeQuantity` without `quantity` called `ReadQuantity` fallback `1` while sibling `ChangePlan` defers on missing `planId`; fixed with `TryReadQuantity` guard (`MarketplaceChangeQuantityWebhookMutationHandlerTests.Ga_enabled_missing_quantity_defers_without_ledger_mutation`).
- [x] (proven) `BillingCheckoutFacade.CreateCheckoutSessionAsync` treats any non-`Canceled` subscription as an active conflict — **hit 2026-09-03 (#564):** first checkout upserts `Pending` then abandoned retries returned `ActiveSubscriptionConflict`; fixed by blocking only `Active`/`Suspended` (`BillingCheckoutFacadeTests.CreateCheckoutSessionAsync_allows_retry_when_prior_checkout_left_pending_subscription`).
- [ ] (candidate) `MarketplaceChangeQuantityWebhookMutationHandler` gates on `AzureMarketplace.GaEnabled` only while sibling `ChangePlan` uses `BillingPlanMutationPolicy.WebhookPlanMutationsEnabled` (Stripe provider parity) — no Stripe `ChangeQuantity` dispatch path today; cheap-disproof before hunt-ready promotion.
- [ ] (candidate) `BillingCheckoutFacade.GetSubscriptionStatusAsync` maps `IsPaymentPastDue` only from `Suspended` status — verify Stripe `past_due` always suspends ledger row before status query.

2026-09-03 seed hunt #564: proved abandoned-checkout Pending retry conflict; reseeded ChangeQuantity Stripe policy parity and subscription-status past-due mapping candidates.

2026-09-02 seed hunt #511: reseeded from ArchLucid.Application/Billing marketplace mutation handlers; proved ChangeQuantity missing-quantity default seat mutation gap (symmetric to #508 ChangePlan missing planId deferral).

---

## Zone: application-pilots

- **id:** application-pilots
- **status:** open
- **impact:** medium
- **aliases:** buyer proof pack; board pack; pilot artifacts
- **paths:** ArchLucid.Application/Pilots/
- **test-filter:** FullyQualifiedName~BuyerProofPack|FullyQualifiedName~BoardPack
- **hunts:** 9
- **bugs-found:** 12
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — buyer proof ZIP ROI freshness badge used 90-day window while deltas JSON used 30-day HOLD
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Proof pack includes findings from a workspace outside the pilot scope — `GetRunDetailAsync` and `ValueReportBuilder.BuildAsync` both honor current `ScopeContext`; no cross-workspace join in pack builders (`PilotReportCardService.EnsureScopeMatches` pattern elsewhere).
- [x] (valid-no-repro) PDF builder silently drops a section when source data is missing — snapshot fallback governed-coverage gap fixed 2026-08-26; `SponsorOnePagerPdfBuilder` / `BoardPackPdfBuilder` intentionally omit buyer-safe and governed-coverage sections (compact surfaces with explicit skip copy where applicable).
- [x] (proven) `PilotValueReportService.AddFindings` counted operator-muted findings in tenant value-report severity totals — **hit 2026-09-03 (#591):** omitted `IsMuted` filter while `PilotRunDeltaComputer` excludes muted rows; fixed with `.Where(static f => !f.IsMuted)` (`BuildAsync_excludes_muted_findings_from_severity_totals`).
- [x] (invalid) Pack builder uses cached tenant data after a scope switch — `BuyerProofPackBuilder` / `BoardPackPdfBuilder` do not use `IMemoryCache`; only `PilotOutcomeSummaryService` caches and keys include workspace id.
- [x] (proven) `PilotRunDeltaComputer` agent-results path counts operator-muted findings in severity buckets and can select a muted row as top finding while snapshot fallback and `FirstValueReportBuilder.FormatSponsorTopFindings` exclude `IsMuted` — buyer proof ZIP deltas JSON overstated suppressed findings (hunt 2026-08-23).
- [x] (proven) Snapshot fallback severity buckets include `IsMuted` findings — **hit 2026-08-24:** `AggregateFindingsBySeverity(IReadOnlyList<Finding>)` omitted mute filter while governed coverage and top-finding paths filtered; regression in `ComputeAsync_WhenSnapshotFallbackIncludesMutedFindings_ExcludesThemFromSeverityBuckets`.
- [x] (proven) Unresolved PilotStrict trace query reported satisfied sponsor evidence — **hit 2026-08-24:** `PilotProofPackageCompletenessMapper` treated `AgentOutputPilotStrictSignalsResolved=false` as pass; fixed with explicit resolved check plus gate soft-gap (`Build_UnresolvedPilotStrictSignals_FlagsEvidenceUnsatisfied`).
- [x] (proven) `PilotScorecardBuilder` counted `ReadyForCommit` runs with manifest ids as committed — **hit 2026-08-24:** predicate used manifest version/id only; fixed to require `LegacyRunStatus == Committed` (`PilotScorecardBuilderTests.BuildAsync_ReadyForCommitRunWithManifest_IsNotCountedAsCommitted`).
- [x] (proven) Buyer proof `artifact-and-proof-summary.md` omitted governed-finding coverage — **hit 2026-08-24:** `BuyerProofPackArtifactSummaryBuilder` ignored `governedFindingCoverage` in deltas JSON (`BuyerProofPackArtifactSummaryBuilderTests.Build_WhenGovernedFindingCoveragePresent_EmitsGovernedCoverageSection`).
- [x] (proven) `PilotValueReportService` and `RecentPilotRunDeltasService` counted `ReadyForCommit` runs with manifest versions as committed — **hit 2026-08-25:** `IsCommittedSummary` / `IsCommitted` treated `CurrentManifestVersion` as sufficient; aligned with scorecard fix to require `Status == Committed` (`BuildAsync_ReadyForCommitRunWithManifest_IsNotCountedAsCommitted`, `GetRecentDeltasAsync_ExcludesReadyForCommitRunWithManifestVersion`).
- [x] (proven) `PilotRunDeltaComputer` partial agent results blocked findings-snapshot fallback — **hit 2026-08-26:** sparse non-muted agent rows skipped persisted snapshot severity/top/governed coverage when snapshot had more findings; fixed by loading snapshot whenever `FindingsSnapshotId` is set and preferring snapshot when it reports more findings (`ComputeAsync_WhenAgentResultsHaveSparseFindings_StillUsesFindingsSnapshotForSeverityTopFindingAndGovernedCoverage`).
- [x] (proven) `FirstValueReportBuilder.ResolveCostEvidenceFreshnessForBadges` never sees extractor collection timestamp — badges stay Missing unless `RoiConfidenceLabel` contains uploaded/extractor wording — **hit 2026-09-02:** `RoiConfidenceLabel` is baseline-provenance only; wired `RoiCostEvidenceCollectionResolver` + `PilotCostEvidenceFreshnessBadgeResolver` (`FirstValueReportBuilderCostEvidenceFreshnessTests`).
- [x] (valid-no-repro) `PilotProofPackageCompletenessMapper` committed timestamp Present contradicts buyer-safe gate soft gap when `CompletedUtc` resolves manifest timestamp — gate soft gap still surfaces in `PilotBuyerSafeEvidenceGateEvaluator`; `CommittedManifestTimestampResolved` fallback to `ManifestCommittedUtc` is intentional (`Build_WhenManifestCreatedUtcDefaultButDeltasCarryCompletedUtc_ResolvesCommittedTimestamp`).
- [x] (invalid) `SponsorEvidencePackService` explainability trace completeness vs `PilotRunDeltaComputer` delta counts diverge on sparse agent + snapshot runs — **closed 2026-08-26** proven fix loads snapshot when `FindingsSnapshotId` is set; pack and deltas share the same snapshot source.
- [x] (invalid) `PilotProofPackageCompletenessMapper.FindingsBySeverityPresent` hard-coded true — zero-finding runs still show Present in proof contract — intentional: empty severity breakdown is attested evidence, not missing data (`Build_ZeroTotalFindings_StillMarksFindingsEvidencePresent`).
- [x] (proven) `SponsorOnePagerPdfBuilder.BuildPdfAsync` with committed run and incomplete sponsor proof (non-demo) — bypassed `SponsorFirstValuePdfGate` / circulation watermarks that `FirstValueReportPdfBuilder` enforces; returned distributable PDF when first-value PDF export would block — **hit 2026-09-04 (#667):** omitted `IFirstValueReportBuilder` + `SponsorFirstValuePdfGate.EnsureCanGenerate`; fixed with gate parity before QuestPDF render; regressions in `SponsorOnePagerPdfBuilderTests` and `SponsorArtifactCrossSurfaceConsistencyTests`.

2026-09-04 thorough hunt #667: proved sponsor-one-pager PDF gate bypass on incomplete ROI baselines and demo tenants.

- [x] (proven) `FirstValueReportBuilder.ResolveCostEvidenceFreshnessForBadges` — sponsor badge freshness used 90-day `StaleAfterDays` while `pilot-run-deltas.json` `roiSourceFreshnessDisposition` uses 30-day `RoiMetricSourceFreshnessRules` HOLD — **hit 2026-09-05 (#802):** 31–89-day extractor timestamps showed Fresh/HOLD mismatch inside buyer proof ZIP; fixed by capping badge stale window to sponsor handoff threshold (`TryBuildZipAsync_when_extractor_is_stale_emits_hold_freshness_in_deltas_json`, `BuildMarkdownAsync_when_run_linked_extractor_is_stale_for_sponsor_handoff_emits_stale_badge_before_ninety_day_window`).
- [ ] (candidate) `SponsorReviewPacketBuilder` / `SelectTopHighCriticalFindings` — operator-muted Critical/Error findings may appear in `sponsor-review-packet.md` while deltas JSON excludes muted rows.
- [ ] (candidate) `SponsorEvidencePackService.BuildAsync` — `ToResponse` omits ROI freshness disposition wiring; demo-run delta may report blind `PASS` when savings + stale extractor would HOLD.

2026-09-05 seed hunt #802: reseeded buyer-proof cross-surface freshness after Wave-22 guards; proved 30-day vs 90-day sponsor badge parity gap; reseeded muted-finding and evidence-pack freshness candidates.

---

2026-09-03 thorough hunt #640 (hit): confidence path omitted Phase B LLM faithfulness; engine-type trace fallback used unordered `g.First()`; threaded faithfulness into `ComputeQualityGateAcceptedForConfidenceAsync` and `SelectPreferredTraceForAgentType`.

---

2026-09-03 thorough hunt #641 (hit): pilot sponsor gate omitted calibrated confidence + Phase B LLM faithfulness; confidence enrichment used host gate options instead of tenant resolver.

---

## Zone: agent-runtime-evaluation

- **id:** agent-runtime-evaluation
- **status:** open
- **impact:** medium
- **aliases:** agent evaluation; evaluation runner
- **paths:** ArchLucid.AgentRuntime/Evaluation/
- **test-filter:** FullyQualifiedName~Evaluation
- **hunts:** 8
- **bugs-found:** 11
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — confidence enrichment ignored recorded composite quality-gate rejection
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Evaluation runner scores a failed trace as passed — warn-only gate records parse failures without rejecting; pilot strict rejects unparsed output (`AgentOutputTraceQualityEvaluatorTests`).
- [x] (invalid) Runner uses a golden fixture from a different tenant's catalog — reference cases load from a single configured JSON path, not tenant-scoped catalogs (`AgentOutputReferenceCaseCatalog`).
- [x] (invalid) Batch evaluation swallows per-item failures and reports aggregate success — `AgentOutputEvaluationRecorder` evaluates each latest-per-task trace independently via `Task.WhenAll`.
- [x] (proven) Architecture finding confidence enrichment uses the first trace per agent type — **hit 2026-08-18:** `AgentArchitectureFindingConfidenceEnricher` keyed traces by `AgentType` instead of `TaskId`, so multiple tasks of the same agent type inherited the wrong schema/reference signals.
- [x] (proven) Findings snapshot confidence enrichment uses superseded or wrong trace — **hit 2026-08-19:** `FindingsSnapshotEvaluationConfidenceEnricher` grouped raw traces by `AgentType` and took `First()`, ignoring `AgentExecutionTraceLatestPerTaskSelector` and mis-scoring retried tasks.
- [x] (proven) PilotStrict sponsor evidence gate evaluates superseded auto-retry traces — **hit 2026-08-21:** `RunAgentOutputPilotEvidenceAggregator.WouldPilotStrictBlockSponsorEvidenceAsync` iterated all persisted traces; a rejected first attempt blocked sponsor evidence even when the latest retry passed PilotStrict.
- [x] (proven) Confidence enrichment ignores PilotStrict faithfulness rejection — **hit 2026-08-23:** `ComputeQualityGateAcceptedForConfidenceAsync` and both confidence enrichers evaluated traces without run evidence/faithfulness, so `schemaPassed` stayed true on outputs PilotStrict would reject for low agent-result faithfulness support.
- [x] (proven) Confidence enrichment ignores calibrated confidence on semantic reject floor — **hit 2026-08-26:** `ComputeQualityGateAcceptedForConfidenceAsync` omitted `calibratedConfidenceByTaskId`, so high heuristic semantic scores accepted traces the batch recorder rejected when `CalibratedConfidence` was below `SemanticRejectBelow`; fixed by threading calibrated lookup through `AgentEvaluationConfidencePipeline` (`AgentOutputTraceQualityEvaluatorTests.ComputeQualityGateAcceptedForConfidenceAsync_returns_false_when_calibrated_confidence_below_semantic_reject_floor`).
- [x] (proven) `ComputeQualityGateAcceptedForConfidenceAsync` omits Phase B LLM faithfulness enforcement — **hit 2026-09-03:** recorder path passed `llmFaithfulnessEvaluator` / options; confidence path did not; regression in `ComputeQualityGateAcceptedForConfidenceAsync_returns_false_when_phase_b_llm_faithfulness_below_reject_floor`
- [x] (proven) `AgentEvaluationConfidencePipeline.TraceByAgentType` uses unordered `g.First()` — **hit 2026-09-03:** engine-type fallback inherited arbitrary trace when multiple same-agent tasks lacked trace-id linkage; fixed with `SelectPreferredTraceForAgentType`; regression in `TryEnrichAsync_engine_type_fallback_prefers_parsed_trace_when_multiple_topology_tasks_exist`
- [x] (proven) `RunAgentOutputPilotEvidenceAggregator` omits calibrated confidence and Phase B LLM faithfulness — **hit 2026-09-03:** sponsor gate called `TryEvaluateTraceAsync` without `calibratedConfidenceByTaskId` or LLM faithfulness deps; regressions in `WouldPilotStrictBlockSponsorEvidenceAsync_blocks_when_calibrated_confidence_below_semantic_reject_floor` and `..._blocks_when_phase_b_llm_faithfulness_below_reject_floor`
- [x] (proven) Confidence enrichment ignores tenant `AgentOutputQualityGateMode` override — **hit 2026-09-03:** pipeline used host `IOptions` while recorder uses `IAgentOutputQualityGateOptionsResolver`; regression in `TryEnrichAsync_uses_resolved_tenant_pilot_strict_mode_for_schema_gate`
- [x] (invalid) Confidence schema gate uses heuristic-only semantic while recorder uses LLM-judge composite — intentional fast-path tradeoff documented on `HeuristicOnlyAgentOutputSemanticEvaluator`; calibrated confidence covers semantic reject floors; **cheap-disproof 2026-09-04 (#668):** recorder persists `RecordedQualityGateOutcome` from composite evaluation and confidence path now honors rejections instead of re-accepting via heuristic-only re-evaluation.
- [x] (proven) `ComputeQualityGateAcceptedForConfidenceAsync` ignored `RecordedQualityGateOutcome` / `QualityRejected` on traces — **hit 2026-09-04 (#668):** heuristic-only re-evaluation could set `schemaPassed=true` after composite recorder rejected the same trace (e.g. PilotStrict semantic floor); fixed with fail-closed recorded-outcome short-circuit aligned to `RealCommitAgentOutputQualityGateEvaluator`; regression in `ComputeQualityGateAcceptedForConfidenceAsync_returns_false_when_recorded_quality_gate_rejected`.

2026-09-04 thorough hunt #668: proved confidence enrichment recorded-gate parity gap; cheap-disproved heuristic-only vs composite candidate.

---

## Zone: decisioning

- **id:** decisioning
- **status:** open
- **impact:** medium
- **aliases:** decisioning engine; findings merge; advisory alerts
- **paths:** ArchLucid.Decisioning/
- **test-filter:** FullyQualifiedName~Decisioning|FullyQualifiedName~FindingsMerge
- **hunts:** 10
- **bugs-found:** 13
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — cross-run diff engines suppressed expansion findings when prior revision was empty
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (valid-no-repro) Merge keeps conflicting findings from two agents without deduplication — `FindingSnapshotConfluentMerger` dedupes payload-equal partitions and emits `finding-merge-conflict` for payload-unequal keys; `FindingsOrchestratorTests.GenerateFindingsSnapshotAsync_payload_conflict_is_confluent`.
- [x] (proven) Advisory alert fires for a finding outside the run scope — **hit 2026-08-18:** `AlertEvaluator` / `AlertMetricSnapshotBuilder` did not filter `RecommendationRecords` by `context.RunId`.
- [x] (proven) Comparison security improvements emit false `SecurityRegression` advisory signals — **hit 2026-08-19:** `ImprovementSignalAnalyzer` treated any `SecurityDelta` status change as regression, including NonCompliant→Compliant and newly added controls.
- [x] (valid-no-repro) Compliance gate passes when required evidence nodes are absent — `GraphComplianceEvaluator` flags uncovered required nodes; golden path tests confirm.
- [x] (proven) `SecurityDeltaRegressionClassifier` treats negated compliant phrases as good status — **hit 2026-08-23:** substring match on `compliant` ranked `Not Compliant` and `Non Compliant` as rank 2, so Compliant→Not Compliant deltas emitted no `SecurityRegression` signal.
- [x] (proven) `SecurityDeltaRegressionClassifier` substring tokens (`on`, `pass`, `off`) matched inside unrelated words — **hit 2026-08-24:** `Information only` ranked as compliant and `Bypass` as pass, emitting false `SecurityRegression` signals; fixed with whole-token matching.
- [x] (proven) `NewComplianceGapCount` alert counted security improvements as compliance gaps — **hit 2026-08-25:** `AlertEvaluator` and `AlertMetricSnapshotBuilder` used `SecurityChanges.Count` instead of `SecurityDeltaRegressionClassifier`; fixing controls raised false compliance alerts; regression in `Evaluate_NewComplianceGapCount_SecurityImprovements_NotCounted` and `Build_SecurityImprovements_NotCountedAsComplianceGaps`
- [x] (proven) `DeclarationSecurityBaselineClassifier.HasOpenAdminIngressHeuristic` substring-matched port tokens — **hit 2026-08-26:** `Contains("22")` flagged `0.0.0.0/0:2200` as SSH admin ingress; fixed with digit-bounded port matching; regression in `Classify_does_not_flag_port_2200_as_admin_ingress`
- [x] (proven) `DeclarationSecurityBaselineClassifier` / `DeclarationPremiseConflictClassifier.TryGetDeclarationProperty` with ARM-canonical `tf.*` keys from ingestion (`tf.publicnetworkaccess`, `tf.httpsonly`) — fixed 2026-08-26 via `DeclarationSecurityPropertyKeyResolver` and ARM alias dual-write in declaration parsers (`DeclarationSecurityPropertyKeyResolverTests`, `ArmJsonInfrastructureDeclarationParserTests.ParseAsync_PublicNetworkAccess_DualWritesTfAndArmAlias`).
- [x] (proven) `DeclarationPremiseConflictClassifier.IntentMatchesConflictKind` with negated intent phrases (`"do not disable public"`) — **hit 2026-09-02:** optional-requirement phrasing (`no requirement to disable public network access`) still matched `disable public`; extended negation suffix list; regression in `Classify_does_not_fire_private_network_conflict_for_optional_disable_public_phrase`.
- [x] (valid-no-repro) `DeclarationPremiseConflictFindingEngine.ResolveApplicableIntentNodes` with PROTECTS/APPLIES_TO edge weight just below `GraphEdgeDecisioningThresholds.MinWeightForSemanticLink` — sub-threshold fallback at `minWeightInclusive: 0` keeps narrow applicability; `AnalyzeAsync_emits_error_when_protects_edge_weight_is_just_below_semantic_link_threshold` confirms Error severity.
- [x] (valid-no-repro) `PortfolioRecurrenceFindingEngine.ResolveCurrentScopeIdentities` when the current system's persisted findings snapshot is empty on first pass — `IPortfolioRecurrenceCurrentReviewIdentitySource` plus `AddInFlightIdentitiesForSystem` merge in-flight identities; `AnalyzeAsync_when_current_snapshot_missing_uses_in_flight_identities` confirms recurrence emission.
- [x] (proven) `FindingsMergeAndGateStage.ExecuteAsync` omitted `PolicyPackCategoryCoverageValidator.GetMissingEngineTypeViolations` — **hit 2026-09-03 (#577):** pass-3 stage refactor wired category coverage only; `RequiredEngineTypes` from pinned packs never produced `policy-pack-coverage` engine failures; fixed in merge stage; regression in `FindingsMergeAndGateStageTests.ExecuteAsync_adds_engine_failure_when_required_engine_type_did_not_succeed`; architecture guard retargeted to merge stage
- [x] (proven) `RequirementCrossRunDiffFindingEngine` / `TopologyCrossRunDiffFindingEngine` with `PriorRunId` set but no prior graph snapshot id and no context prior-name properties — **hit 2026-09-04 (#712):** analyzers returned zero findings instead of failing closed; added `CrossRunDiffFindingPriorGuard.EnsurePriorRevisionResolvableOrThrow`; regression `AnalyzeAsync_when_prior_run_bound_without_revision_data_throws`
- [x] (valid-no-repro) `DecisionRuleCriteriaEvaluator.TryEvaluate` value mismatch on present field paths — criteria act as a match filter; missing fields warn, value mismatch silently skips the rule by design; regression `TryEvaluate_when_criteria_value_mismatches_present_field_returns_false_without_missing_paths`
- [x] (valid-no-repro) `PolicyPackCategoryCoverageValidator.GetMissingCategoryViolations` engine-type substring heuristic — built-in engines with `security` in `EngineType` are Security-category engines; successful invocation satisfies coverage intentionally; regression `GetMissingCategoryViolations_treats_successful_security_engine_type_as_security_coverage`
- [x] (proven) `RequirementCrossRunDiffFindingEngine` / `TopologyCrossRunDiffFindingEngine` returned zero findings when prior graph loaded but prior revision was empty while current graph expanded — **hit 2026-09-05 (#810 seed):** early `Prior*Names/Categories.Count == 0` guard suppressed Info expansion findings; removed guard; regressions `AnalyzeAsync_when_prior_graph_has_no_requirements_but_current_expands_emits_info_coverage_finding` and topology twin
- [x] (proven) `PolicyPackCategoryCoverageValidator` omitted topology engine-type inference — **hit 2026-09-05 (#810 seed):** clean `topology-structure` runs false-failed `RequiredFindingCategories` Topology coverage; added topology substring credit; regression `GetMissingCategoryViolations_treats_successful_topology_engine_type_as_topology_coverage`
- [x] (proven) `SecurityDeltaRegressionClassifier` ranked `gap` before `planned` and treated remediation phrases as worst-tier regression — **hit 2026-09-05 (#810 seed):** Compliant→`Gap remediation planned` fired false compliance alerts; rank planned/remediation phrases before bare `gap`; regression `IsRegression_gap_remediation_planned_from_compliant_is_not_regression`
- [x] (proven) `FindingSnapshotMergeKey.FromFinding` used case-sensitive `PolicyRuleId` — **hit 2026-09-05 (#810 seed):** `SEC-01` vs `sec-01` duplicated ADR-0063 merge keys; lowercased policy rule id segment; regression `Merge_joins_policy_rule_ids_case_insensitively`
- [ ] (candidate) `DeclarationPremiseConflictClassifier.ContainsAnyPhrase` — leading `"No {phrase}"` prohibitive intent (e.g. `"No private network required"`) may still match affirmative conflict phrases; negation suffix list covers `"No requirement to …"` / `"Do not …"` but not bare leading `"No …"`

2026-09-05 seed hunt #810 (hit): reseeded from zone files; proved empty-prior cross-run expansion suppression, topology category coverage false-fail, gap/planned security delta regression noise, and case-sensitive policy-rule merge keys.

2026-09-04 thorough hunt #712: proved cross-run prior-revision fail-open gap; cheap-disproof on criteria value-mismatch warnings and security substring heuristic.

---

## Zone: persistence-identity

- **id:** persistence-identity
- **status:** open
- **impact:** high
- **aliases:** identity repository; authentication identity dapper
- **paths:** ArchLucid.Persistence/Identity/
- **test-filter:** FullyQualifiedName~AuthenticationIdentity|FullyQualifiedName~IdentityRepository
- **hunts:** 8
- **bugs-found:** 12
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — InMemory identity concurrent insert race and ReEnable left DisabledUtc set
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Identity lookup by email returns a user from another tenant — `IAuthenticationIdentityRepository` has no email lookup; sign-in domain routing uses global domain keys by design.
- [x] (invalid) Link/unlink writes succeed without scoping to the caller tenant — persistence repos are record-oriented; caller tenant enforcement lives in application services.
- [x] (valid-no-repro) Cached identity read returns stale data after a tenant-scoped upsert — `CachingSecondaryReferenceDataRepositoryTests` proves eviction after upsert/insert for tenant IdP config and sign-in domains.
- [x] (proven) `InMemoryAuthenticationIdentityRepository.ReEnableAsync` reclaimed a disabled external key while another active identity already held it — **hit 2026-08-23:** in-memory store ignored the SQL filtered unique index (`UX_AuthenticationIdentities_ExternalKey WHERE DisabledUtc IS NULL`) and dual-activated the same external key.
- [x] (proven) `InMemoryTenantSignInEmailDomainRepository.FindByNormalizedDomainAsync` / `ListByTenantIdAsync` return soft-removed domains (`RemovedUtc` set) that `DapperTenantSignInEmailDomainRepository` excludes via `RemovedUtc IS NULL` — **hit 2026-08-23:** in-memory reads ignored soft-delete filter on all three query methods; dev/test routing could resurrect removed sign-in domains.
- [x] (proven) `DapperAuthenticationIdentityRepository.ReEnableAsync` threw on filtered unique-index violation — **hit 2026-08-24:** re-enabling a disabled identity while another active row held the same external key surfaced `SqlException` 2601/2627 instead of returning `false` like `InMemoryAuthenticationIdentityRepository`.
- [x] (proven) `InMemoryPlatformTenantAuthRecoveryGrantRepository.RevokeAsync` was not idempotent — **hit 2026-08-24:** second revoke returned `true` while Dapper only updates rows with `RevokedUtc IS NULL`, masking double-revoke regressions in dev/test.
- [x] (proven) `InMemoryTenantSignInEmailDomainRepository.UpdateAsync` could reassign domains across tenants — **hit 2026-08-24:** update keyed only by `NormalizedDomain`, unlike Dapper's `(TenantId, NormalizedDomain)` predicate, so a mismatched tenant id silently hijacked sign-in routing in memory hosts.
- [x] (proven) `DapperEmailOtpChallengeRepository.TryCompleteAsync` — parallel wrong-code attempts lost `FailedAttemptCount` increments on `RowVersion` conflict (`affected == 0` committed without retry) — **hit 2026-08-31 (#314):** rollback and retry up to eight times on optimistic concurrency miss; regression in `DapperEmailOtpChallengeRepositorySqlIntegrationTests` and `EmailOtpChallengeRepositoryConcurrencyTests`.
- [x] (proven) `DapperAuthenticationIdentityLinkProposalRepository.TryUpdateStatusAsync` / `InMemoryAuthenticationIdentityLinkProposalRepository.TryUpdateStatusAsync` — no `Status = PendingConfirmation` guard allowed confirmed proposals to be rewritten to cancelled — **hit 2026-08-31 (#323):** only transition from pending; regression in `InMemoryAuthenticationIdentityLinkProposalRepositoryCoverageTests` and `DapperAuthenticationIdentityLinkProposalRepositorySqlIntegrationTests`.
- [x] (proven) `SqlTrialIdentityUserRepository.RecordAccessFailedAsync` / `TrialLocalIdentityService.AuthenticateAsync` — read-modify-write with unconditional `UPDATE` lost lockout increments under parallel failed logins — **hit 2026-09-02 (#422):** atomic `AccessFailedCount + 1` with threshold lockout in SQL; service no longer passes absolute counts; regression in `SqlTrialIdentityUserRepositorySqlIntegrationTests` and `TrialLocalIdentityServiceTests`.
- [x] (proven) `EmailOtpRequestFlow.ExecuteAsync` — `InvalidateActiveChallengesForEmailAsync` then `InsertAsync` was non-atomic; concurrent resend could leave multiple active challenges — **hit 2026-09-02 (#422):** `ReplaceActiveChallengeForEmailAsync` transactional replace in Dapper and lock in in-memory repo; regression in `EmailOtpChallengeRepositoryConcurrencyTests`.
- [x] (proven) `InMemoryPlatformUserRepository.InsertAsync` — duplicate explicit `PlatformUserInsert.Id` silently overwrote the prior user while SQL raises PK violation — **hit 2026-09-03 (#545):** `TryAdd` + `DuplicatePlatformUserException`; regression in `InMemoryPlatformUserRepositoryCoverageTests`.
- [x] (proven) `InMemoryAuthenticationIdentityRepository.InsertAsync` — concurrent inserts with the same external key can both land in `_byId` (check-then-act race on `_activeExternalKeys`) — **hit 2026-09-04 (#669):** atomic `TryAdd` on active external-key index before `_byId` insert; regression in `InMemoryAuthenticationIdentityRepositoryCoverageTests.InsertAsync_concurrent_same_external_key_activates_only_one_identity`.
- [x] (proven) `AuthenticationIdentityRepositoryCore.WithReEnabled` — `Clone(existing, disabledUtc: null)` left `DisabledUtc` set via null-coalescing, so in-memory `ReEnableAsync` returned true but `FindByExternalKeyAsync` still filtered the row — **hit 2026-09-04 (#669):** `clearDisabledUtc: true`; regression in `DisableAsync_and_ReEnableAsync_toggle_active_lookup` and `PersistencePackageCoverageBatch4Tests`.
- [x] (invalid) `InMemoryWorkspaceMembershipRepository.UpsertAsync` — update path can reassign `TenantId` on an existing `(UserId, WorkspaceId)` row — Dapper `MERGE` also updates `TenantId` on match; same dev/test behavior as SQL.
- [x] (valid-no-repro) `InMemoryTenantIdentityProviderConfigurationRepository` — accepts `Guid.Empty` tenant id and round-trips caller `UpdatedUtc` — dev/test parity drift only; SQL validates `TenantId` and stamps `SYSUTCDATETIME()`; no production path through in-memory store.
- [x] (valid-no-repro) `DapperEmailOtpChallengeRepository.TryCompleteSingleAttemptAsync` — correct-code UPDATE on `RowVersion` conflict returns `AlreadyCompleted` without retry — fail-path retry proven (#314); success path uses `UPDLOCK` and no concurrent repro in integration tests.

2026-09-04 thorough hunt #669: proved in-memory identity concurrent insert race and `WithReEnabled` disabled-flag retention; cheap-disproved workspace membership tenant re-home; valid-no-repro on tenant IdP config drift and OTP correct-code RowVersion retry.

2026-09-03 seed hunt #545: proved InMemory platform-user duplicate Id overwrite; seeded concurrent identity insert, workspace membership tenant re-home, tenant IdP config InMemory/SQL drift, and OTP correct-code RowVersion retry candidates.

2026-08-31 seed hunts #314–#323: proved OTP RowVersion retry and link-proposal terminal status guard; seeded trial lockout lost-update and OTP resend race (proved 2026-09-02 #422).

---

## Zone: retrieval

- **id:** retrieval
- **status:** open
- **impact:** medium
- **aliases:** retrieval indexing; embedding; pricing retrieval
- **paths:** ArchLucid.Retrieval/
- **test-filter:** FullyQualifiedName~Retrieval|FullyQualifiedName~Indexing
- **hunts:** 8
- **bugs-found:** 13
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — lexical reranker policy-pack boost at zero overlap; Graph-RAG shared neighbor kept first seed score
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Index query returns chunks from another tenant's corpus — **hit 2026-08-18:** Azure policy-pack OData filter omitted platform sentinel `tenantId`, allowing cross-tenant `PolicyPack` matches when `IncludePlatformCorpora` is on.
- [x] (valid-no-repro) Pricing estimate uses the wrong model tariff for the tenant plan — EA multiplier and cache keys are tenant-scoped; covered by existing pricing tests.
- [x] (valid-no-repro) Reindex job deletes vectors for the wrong workspace — `RetrievalIndexingService` validates scope and passes all four scope fields to delete.
- [x] (proven) Structure-aware chunker splits fenced code blocks mid-fence when the fence segment exceeds `maxChars` — **hit 2026-08-23:** `StructureAwareTextChunker` fell back to `SimpleTextChunker` on the whole fence segment, emitting chunks with a single orphan ``` marker; fixed by re-wrapping inner splits with opener/closer fences.
- [x] (proven) `CachingEmbeddingService` cache key ignored embedding model identity — **hit 2026-08-24:** `embed:v1:{hash}` reused vectors after deployment/dimension change; regression in `EmbedAsync_does_not_reuse_cache_entry_after_embedding_model_identity_changes`
- [x] (proven) Azure Search document delete truncated at first 1000 chunk ids — **hit 2026-08-24:** `RemoveChunksForDocumentAsync` single search page left orphan vectors; regression in `DeleteAllPagesAsync_deletes_all_chunks_when_document_exceeds_search_page_size`
- [x] (proven) `IterativeRetrievalLoop` exceeded `TopK` after critique retry merge — **hit 2026-08-24:** merged union not capped; regression in `MaybeRetryAsync_returns_at_most_query_topk_hits_after_merge`
- [x] (proven) `PolicyPackRulePackIdMapper` threw on malformed `ContentJson` — **hit 2026-08-24:** `JsonException` aborted scope resolution; regression in `PolicyPackRulePackIdMapper_returns_null_when_pack_content_json_is_malformed`
- [x] (proven) `IterativeRetrievalLoop.MergeHits` kept stale score when critique retry returned the same `ChunkId` with a higher score — **hit 2026-09-02:** merge only inserted new chunk ids; fixed to upgrade on collision (`MaybeRetryAsync_when_retry_improves_same_chunk_score_uses_higher_score`).
- [x] (proven) `RetrievalIndexingService.IndexDocumentsAsync` recorded catalog state before vector upsert — **hit 2026-09-02:** failed upsert left document skipped on retry with same `ContentHash`; fixed by deferring `RecordIndexed` until after `UpsertChunksAsync` (`IndexDocumentsAsync_when_upsert_fails_still_reindexes_on_retry_with_same_content_hash`).
- [x] (proven) `CostRetailGroundingBuilder.ResolveGroundingProvider` matched `aws` inside Azure DR prose — **hit 2026-09-02:** substring scan picked AWS for `"Azure primary (DR on AWS us-east-1)"`; fixed with first word-boundary cloud-token mention (`Build_azure_evidence_with_dr_aws_substring_prefers_azure_not_aws`).
- [x] (proven) `RetrievalQueryService.ExecuteSearchPassAsync` clamped `TopK` to 25 while HTTP API allows 50 — **hit 2026-09-03 (#587):** `Math.Clamp(query.TopK, 1, 25)` silently capped `RetrievalController` requests above 25; fixed with `RetrievalQuery.MaxTopK` (50) parity (`SearchAsync_RespectsTopK_above_twenty_five_when_reranking_disabled`).
- [x] (proven) `IterativeRetrievalLoop.MaybeRetryAsync` final merge used raw `query.TopK` above `RetrievalQuery.MaxTopK` — **hit 2026-09-04 (#708):** critique-retry merge could return up to `2 × MaxTopK` unique hits when programmatic callers passed `TopK > 50`; fixed by clamping final `.Take` to `MaxTopK` (`MaybeRetryAsync_clamps_final_merge_to_retrieval_query_max_topk`).
- [x] (proven) `LexicalOverlapRetrievalReranker.ScoreOverlap` applied `PolicyPackCorpusBoost` when lexical overlap was zero — **hit 2026-09-05 (#814):** policy-pack chunks with no query token overlap ranked above higher-vector manifest hits via unconditional +0.05; fixed by gating boost on `overlap > 0` (`LexicalOverlapRetrievalReranker_RerankAsync_does_not_apply_policy_pack_boost_without_lexical_overlap`).
- [x] (proven) `GraphRagNeighborExpander.ExpandAsync` skipped score upgrade when the same neighbor was reachable from multiple seeds — **hit 2026-09-05 (#814):** first seed's discounted score was kept even when a later seed had a higher vector score; fixed by upgrading existing neighbor hits on collision (`ExpandAsync_shared_neighbor_uses_highest_seed_score_not_first_seed`).
- [x] (valid-no-repro) `GraphRagNeighborExpander.ExpandAsync` re-sorts by vector score after lexical rerank — post-expansion score ordering blends neighbor relevance with seed scores by design; lexical fallback reranker does not mutate `RetrievalHit.Score`, so any downstream score sort reflects vector/neighbor scores rather than overlap rank.
- [x] (valid-no-repro) `InMemoryVectorIndex.UpsertChunksAsync` silently evicts oldest chunks past `MaxChunks` — documented dev/single-node bound (`MaxChunks = 10_000`); production path uses Azure Search, not in-memory eviction.

2026-09-05 seed hunt #814 (hit): proved lexical policy-pack zero-overlap boost and Graph-RAG shared-neighbor stale score gaps.

2026-09-04 seed hunt #708 (hit): proved iterative retrieval final merge ignored `RetrievalQuery.MaxTopK` when `query.TopK` exceeded the contract ceiling.

2026-09-03 thorough hunt #587: proved TopK service/API contract mismatch; cheap-disproved graph-RAG rerank undo and in-memory eviction as intentional design.

---

## Zone: ui-oidc

- **id:** ui-oidc
- **status:** open
- **impact:** high
- **aliases:** oidc authority; sign-in routing; OIDC host
- **paths:** archlucid-ui/src/lib/oidc/
- **test-filter:** oidc-authority|oidc
- **hunts:** 14
- **bugs-found:** 19
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — OIDC authority hash fragment broke discovery URL; javascript: authorization_endpoint passed discovery parse
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Authority host check accepts a look-alike domain as the configured issuer — locus is `archlucid-ui/src/lib/auth/oidc-authority-host.ts`, outside this zone; covered by `oidc-authority-host.test.ts`.
- [x] (valid-no-repro) OIDC redirect builds a return URL that leaves the operator origin — `storePostSignInReturnUrl` / `isSafeReturnPath` reject absolute, protocol-relative, and smuggled paths; covered by `session.test.ts` and `safe-return-path.test.ts`.
- [x] (invalid) Silent renew uses a stale authority after tenant IdP switch — `ensureAccessTokenFresh` reads `getOidcAuthority()` on each refresh; discovery cache is keyed by normalized discovery URL, not a frozen authority snapshot.
- [x] (proven) Scheme-less OIDC authority builds a relative discovery URL against the SPA origin — **hit 2026-08-23:** `discoveryUrlForAuthority` concatenated `/.well-known/...` without normalizing a missing scheme, so `fetch` resolved against the app origin; fixed by prefixing `https://` when the authority omits `://`.
- [x] (proven) `clearOidcSession` leaves a stale post-sign-in return URL for the next sign-in — **hit 2026-08-23:** session clears omitted `OIDC_POST_SIGN_IN_RETURN_URL_KEY`, so an aborted sign-in could redirect a later login to an old path; fixed by clearing the return-url key with the other OIDC session keys.
- [x] (proven) Failed OIDC discovery fetch is cached permanently — **hit 2026-08-23:** `loadDiscoveryDocument` stored rejected promises in `discoveryPromises`, so a transient 503/network error blocked all later sign-in, refresh, and logout discovery until a full page reload; fixed by evicting the cache entry in `.catch` before rethrowing.
- [x] (proven) Concurrent `ensureAccessTokenFresh` calls fire duplicate refresh requests — **hit 2026-08-23:** parallel API callers each entered `ensureAccessTokenFresh` without a single-flight guard, so the IdP rejected the second refresh (`invalid_grant`) and the catch-all handler called `clearOidcSession`, logging the operator out after an otherwise successful refresh; fixed by deduping in-flight refresh with a shared promise.
- [x] (proven) Non-numeric `OIDC_EXPIRES_AT_MS_KEY` bypasses expiry skew so `getAccessTokenForApi` returns a stale access token — **hit 2026-08-23:** `getExpiresAtMs` used `Number(raw)` without validating finiteness, so corrupted session storage (`"not-a-number"`) yielded `NaN` and `Date.now() >= NaN - skew` stayed false while `isLikelySignedIn` already returned false; fixed by treating non-finite parsed values as expired.
- [x] (proven) In-flight token refresh resurrects OIDC session after `clearOidcSession` — **hit 2026-08-23 hunt #34:** `ensureAccessTokenFresh` always called `persistTokenResponse` when the IdP refresh completed, so sign-out or idle-timeout clears that ran mid-flight wrote tokens back into `sessionStorage`; fixed by tracking a session generation counter bumped on clear and skipping persist/clear side effects for stale refreshes.
- [x] (proven) Stale in-flight refresh blocks token refresh for a replacement session after `clearOidcSession` — **hit 2026-08-23 hunt #36:** `clearOidcSession` bumped the generation counter but left `refreshInFlight` set, so the first `ensureAccessTokenFresh` on a new sign-in awaited the prior session's refresh instead of starting one with the new refresh token; fixed by clearing the in-flight guard when session keys are removed.
- [x] (proven) Transient OIDC refresh network failure clears the operator session — **hit 2026-08-23 hunt #41:** `ensureAccessTokenFresh` catch-all called `clearOidcSession` on any refresh rejection, so a flaky `Failed to fetch` during background renew wiped tokens while the refresh token was still valid; fixed by clearing only on OAuth auth failures (`invalid_grant`, 401/403) and leaving the session intact for network/5xx errors.
- [x] (proven) Stale refresh `finally` clears the replacement session's in-flight guard — **hit 2026-08-23 hunt #42:** `ensureAccessTokenFresh` always set `refreshInFlight = null` in `finally`, so when a prior-session refresh completed after `clearOidcSession` and a replacement refresh had started, the stale `finally` nulled the guard and parallel API callers fired a duplicate IdP refresh (`invalid_grant` risk); fixed by clearing `refreshInFlight` only when it still references the completing promise. **Re-hit 2026-09-03 hunt #594:** regression restored unconditional `refreshInFlight = null`; `does not clear the replacement refresh guard when a stale refresh finally runs` failed (3 refresh calls); same conditional-`finally` fix reapplied.
- [x] (proven) Negative `expires_in` from token response writes a past expiry and breaks the session — **hit 2026-08-23:** `persistTokenResponse` stored `Date.now() + negative expires_in`, so a malformed IdP payload left the access token immediately expired and could tight-loop refresh; fixed by falling back to the default lifetime for negative values while still honoring zero.
- [x] (proven) Missing `access_token` in token response persists the literal string `"undefined"` — **hit 2026-08-23:** `sessionStorage.setItem` coerced `undefined` to `"undefined"`, so `isLikelySignedIn` returned true and API calls sent `Bearer undefined`; fixed by rejecting empty or non-string access tokens before writing session keys.
- [x] (proven) Malformed OIDC discovery document missing endpoints is cached permanently — **hit 2026-08-24:** `loadDiscoveryDocument` cached any HTTP 200 JSON body, so a partial discovery payload blocked sign-in, refresh, and logout discovery until a full page reload; fixed by validating required endpoints and evicting invalid documents from the cache.
- [x] (proven) Token endpoint OAuth error returned with HTTP 200 is treated as a token response — **hit 2026-08-24:** `postTokenForm` only parsed OAuth `error` bodies when `response.ok` was false, so `invalid_grant` in a 200 body threw on missing `access_token` and `ensureAccessTokenFresh` kept a stale refresh token instead of clearing the session; fixed by rejecting OAuth error JSON before returning token responses.
- [x] (proven) String `expires_in` from token response falls back to default lifetime — **hit 2026-08-24:** `resolveExpiresInSeconds` used `Number.isFinite` on the raw value, so IdPs that serialize `expires_in` as a JSON string were treated as non-finite and given the 3600s default; fixed by coercing with `Number()` before validation.
- [x] (proven) Supplemental Google OIDC redirect overwrites primary PKCE state — **hit 2026-09-04:** `initiateSupplementalOidcRedirect` called the same `storePkceState` keys as primary sign-in, so a pending work/school round-trip could be clobbered before callback; fixed with flow-scoped PKCE storage and callback token exchange keyed by matched flow (`initiate-redirect.test.ts`, `session.test.ts`, `CallbackClient.tsx`).
- [x] (proven) Malformed `end_session_endpoint` in discovery passes parse but breaks RP-initiated logout — **hit 2026-09-04:** `parseDiscoveryDocument` copied `end_session_endpoint` without `new URL()` validation, so `signOutAndRedirectHome` silently fell through to `/`; fixed by omitting invalid optional logout endpoints at parse time (`discovery.test.ts`).

2026-09-04 thorough hunt #716 (hit): proved supplemental PKCE overwrite and invalid end_session discovery gap.

- [x] (proven) `discoveryUrlForAuthority` appended `/.well-known/openid-configuration` into the authority hash fragment — **hit 2026-09-05 (#805):** authorities like `https://issuer/v2.0#fragment` fetched `https://issuer/v2.0` instead of the well-known document; fixed by normalizing through `URL` origin + pathname (`discovery.test.ts` ignores hash fragments).
- [x] (proven) `parseDiscoveryDocument` accepted non-http(s) `authorization_endpoint` values such as `javascript:` — **hit 2026-09-05 (#805):** `new URL()` alone allowed script-scheme authorize URLs from a compromised discovery payload; fixed by requiring `http:` or `https:` for required endpoints (`discovery.test.ts` rejects javascript scheme).

2026-09-05 seed hunt #805 (hit): reseeded zone; proved authority hash-fragment discovery URL bug and non-http(s) endpoint scheme gap.

---

## Zone: archlucid-core

- **id:** archlucid-core
- **status:** open
- **impact:** high
- **aliases:** core domain; security policies; tenancy models
- **paths:** ArchLucid.Core/
- **test-filter:** FullyQualifiedName~ArchLucid.Core
- **hunts:** 145
- **bugs-found:** 273
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — Wave-22 manifest-hash guards rejected PascalCase metadata keys
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) `PrivateNetworkAddressGuard.IsForbiddenIpAddress` — IPv4-mapped RFC1918 addresses bypass private-network guard — **hit 2026-09-03 (#597):** `::ffff:10.0.0.1` / `::ffff:192.168.1.1` stayed on the IPv6 branch after #223 ULA fix and returned allowed; SSRF policies missed mapped private literals; fixed by unmapping with `MapToIPv4()` before RFC1918 checks (`PrivateNetworkAddressGuard_IsForbiddenIpAddress_blocks_ipv4_mapped_private_addresses`).
- [x] (proven) `RunAuthorityPipelineDeadLetterDetection.TryDeserialize` — string-encoded / whole-number-double `schemaVersion` rejected — **hit 2026-09-03 (#600):** `"schemaVersion":"1"` and `1.0` failed strict `int` deserialize and dropped dead-letter detection after #596 failureClass casing fix; fixed with case-insensitive schemaVersion coercion and direct `failureClass` read (`IsDeadLettered_returns_true_for_string_encoded_schema_version`, `IsDeadLettered_returns_true_for_whole_number_double_schema_version`).
- [x] (invalid) `AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader` — committed run without `GoldenManifestId` resolves `NotStarted` — `dbo.Runs` CHECK (`LegacyRunStatus <> Committed OR GoldenManifestId IS NOT NULL`) prevents persisted rows; in-memory fixtures only; wave-9 Complete requires commit + golden manifest by design.
- [x] (proven) `CommercialPackagingTierResolver.ResolveCommercialTierLabel` — lowercase `TrialStatus` treated as non-active — **hit 2026-09-03 (#600):** `trialStatus:"active"` used `Ordinal` compare against `TrialLifecycleStatus.Active` and returned a tier label during active trial; fixed with `OrdinalIgnoreCase` (`ResolveCommercialTierLabel_returns_null_for_lowercase_active_trial_status`).
- [x] (valid-no-repro) `AgentExecutionTraceLatestPerTaskSelector` — whitespace-only `TaskId` groups with empty task id — `IsNullOrWhiteSpace` intentionally treats whitespace-only ids as missing so same-agent retries chain; regression `Select_when_task_id_is_whitespace_only_chains_with_missing_task_id`.
- [x] (proven) `AgentExecutionTraceLatestPerTaskSelector.GetLatestPerTaskKey` — padded `TaskId` breaks retry supersession — **hit 2026-09-03 (#600):** `" task-1 "` and `task-1` grouped separately so stale attempt 0 survived; fixed by trimming before keying (`Select_when_task_id_differs_only_by_outer_whitespace_chains_retries`).

2026-09-03 thorough hunt #600: proved schemaVersion coercion, lowercase trial status, and TaskId trim gaps; disproved committed-without-manifest (SQL CHECK) and whitespace-only TaskId chaining (intentional).

- [x] (proven) `CommercialTenantEligibility` / `TenantTrialSeatPolicy` — lowercase `TrialStatus` not treated as active — **hit 2026-09-03 (#601):** #600 fixed `CommercialPackagingTierResolver` only; `trialStatus:"active"` still bypassed seat-claim enforcement and Standard-tier commercial gates; fixed with `OrdinalIgnoreCase` (`RequiresSeatClaim_true_when_lowercase_active_trial_status`, `CommercialTenantEligibility_blocks_lowercase_active_trial_from_standard_gates`).

2026-09-03 seed hunt #601: reseeded tenancy helpers after #600 TrialStatus fix; proved sibling Ordinal parity gap.

- [x] (invalid) `AgentExecutionFailureSummaryJson.TryDeserialize` (Application) — string-encoded `schemaVersion` — wrong zone for `archlucid-core` thorough hunt; locus is `ArchLucid.Application/Runs/AgentExecutionFailureSummaryJson.cs`.
- [x] (valid-no-repro) `TenantTrialSeatPolicy` / `CommercialTenantEligibility` — lowercase `converted` / `expired` trial status — Core helpers only special-case `Active`; lowercase non-active statuses do not bypass seat-claim enforcement or active-trial commercial blocks (`CommercialTenantEligibility_does_not_special_case_lowercase_converted_or_expired_trial_status`).
- [x] (proven) `RunAuthorityPipelineDeadLetterDetection.TryDeserialize` — missing `schemaVersion` property rejected — **hit 2026-09-03 (#602):** forward-compatible `{"failureClass":"PipelineDeadLetter"}` payloads omitted `schemaVersion` but contract default is `1`; fixed by defaulting absent property to supported version (`IsDeadLettered_returns_true_when_schema_version_property_is_omitted`).

2026-09-03 thorough hunt #602: proved omitted failure-summary schemaVersion gap; disproved Application-layer and converted/expired casing candidates.

- [x] (invalid) `AgentExecutionFailureSummaryJson.TryDeserialize` (Application) — string-encoded `schemaVersion` parity gap — wrong zone for `archlucid-core`; locus is `ArchLucid.Application/Runs/AgentExecutionFailureSummaryJson.cs` (re-confirmed hunt #604).
- [x] (proven) `RunAuthorityPipelineDeadLetterDetection.TryDeserialize` — null JSON `schemaVersion` token rejected — **hit 2026-09-03 (#604):** `{"schemaVersion":null,"failureClass":"PipelineDeadLetter"}` failed after #602 omitted-property fix; null token now defaults to supported v1 (`IsDeadLettered_returns_true_when_schema_version_property_is_null`).

2026-09-03 thorough hunt #604: proved null failure-summary schemaVersion gap; re-disproved Application-layer candidate.

- [x] (proven) `RunAuthorityPipelineDeadLetterDetection.TryReadSupportedSchemaVersion` — boolean / `on` synonym `schemaVersion` JSON tokens rejected — **hit 2026-09-03 (#619):** `{"schemaVersion":true,"failureClass":"PipelineDeadLetter"}` and `"schemaVersion":"on"` failed after #600 string/number coercion while sibling readers already accept boolean synonyms; fixed with `TryParseBooleanString` and `JsonValueKind.True`/`False` handling (`IsDeadLettered_returns_true_for_boolean_true_schema_version`, `IsDeadLettered_returns_true_for_on_synonym_string_schema_version`).

2026-09-03 seed hunt #619: reseeded from `RunAuthorityPipelineDeadLetterDetection`; proved boolean / on-off synonym schemaVersion parity gap after #604 null-token fix.
- [x] (proven) `RunAuthorityPipelineDeadLetterDetection.TryReadSupportedSchemaVersion` — boolean / `on` synonym `schemaVersion` JSON tokens rejected — **hit 2026-09-03 (#616):** `{"schemaVersion":true,"failureClass":"PipelineDeadLetter"}` and `"schemaVersion":"on"` failed after #600 string/number coercion while sibling readers already accept boolean synonyms; fixed with `TryParseBooleanString` and `JsonValueKind.True`/`False` handling (`IsDeadLettered_returns_true_for_boolean_true_schema_version`, `IsDeadLettered_returns_true_for_on_synonym_string_schema_version`).

2026-09-03 seed hunt #616: reseeded from `RunAuthorityPipelineDeadLetterDetection`; proved boolean / on-off synonym schemaVersion parity gap after #604 null-token fix.

- [x] (invalid) `RunAuthorityPipelineDeadLetterDetection.TryDeserialize` — PascalCase `FailureClass` property name missed — case-insensitive property lookup already reads `FailureClass`; regression `IsDeadLettered_returns_true_for_PascalCase_failure_class_property_name`.

- [x] (invalid) `AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson` — string `"true"` / boolean `true` schemaVersion at current version not idempotent upgrade path — `TryReadSchemaVersion` maps boolean `true` to v1; `schemaVersion == CurrentSchemaVersion` returns success without mutation (re-confirmed hunt #636).
- [x] (invalid) `PrivateNetworkAddressGuard.IsForbiddenIpAddress` — decimal IPv4 literals (`3232235777`) bypass host-literal guard — `IPAddress.TryParse` accepts decimal notation as `192.168.1.1`; guard blocks RFC1918 (re-confirmed hunt #636).


- [x] (proven) `AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson` — string `"0"` / PascalCase `SchemaVersion` not coerced — **hit 2026-09-03 (#595):** case-sensitive property lookup and `GetValue<int>()` threw or returned missing-version errors while sibling `AzureExtractorPackageZipValidator` already accepts string/boolean/numeric tokens; fixed with case-insensitive lookup and validator-parity coercion (`TryUpgradeManifestJson_upgrades_string_zero_schema_version`, `TryUpgradeManifestJson_upgrades_PascalCase_schema_version_property`).
- [x] (proven) `AzureExtractorManifestSchemaUpgrader.TryParseWholeNumberString` — string-encoded whole-number `schemaVersion` rejected — **hit 2026-09-03 (#618):** `"schemaVersion":"1.0"` and `"0.0"` failed upgrade while sibling `AzureExtractorPackageZipValidator` already accepts decimal-string whole numbers via `double` floor coercion; fixed by delegating to `RunExplanationAggregateJsonReader.TryParseWholeNumberString` (`TryUpgradeManifestJson_accepts_string_whole_number_current_schema_version`, `TryUpgradeManifestJson_upgrades_string_whole_number_zero_schema_version`).

2026-09-03 seed hunt #618: reseeded from `AzureExtractorManifestSchemaUpgrader`; proved string whole-number schemaVersion parity gap after #595 string-zero/PascalCase fix.
- [x] (proven) `AzureExtractorManifestSchemaUpgrader.TryReadSchemaVersion` — boolean synonym / string-double `schemaVersion` tokens rejected — **hit 2026-09-03 (#612):** `"on"` / `"off"` and `"1.0"` failed `bool.TryParse` / integer-only string parse while `AzureExtractorPackageZipValidator` already accepts synonym and whole-number-double tokens; in-memory upgrade path rejected manifests the ZIP validator would accept; fixed with validator-parity boolean synonyms and fractional whole-number string coercion (`TryUpgradeManifestJson_accepts_on_synonym_for_current_schema_version`, `TryUpgradeManifestJson_upgrades_off_synonym_for_legacy_zero_schema_version`, `TryUpgradeManifestJson_accepts_string_whole_number_double_schema_version`).

2026-09-03 seed hunt #612: reseeded Azure extractor manifest coercion after #595; proved upgrader boolean-synonym and string-double parity gap.

- [x] (invalid) `RunAuthorityPipelineDeadLetterDetection.TryDeserialize` — boolean / string-boolean `schemaVersion` rejected — fixed in #616; regressions `IsDeadLettered_returns_true_for_boolean_true_schema_version` and `IsDeadLettered_returns_true_for_on_synonym_string_schema_version` (re-confirmed hunt #636).
- [x] (invalid) `PrivateNetworkAddressGuard.IsForbiddenHostLiteral` — decimal IPv4 literals bypass host-literal guard — same `IPAddress.TryParse` decimal notation as `3232235777` → `192.168.1.1`; guard blocks (re-confirmed hunt #636).

- [x] (proven) `CloudInventoryExtractorPackageZipValidator.Validate` — zip-slip / zip-bomb archives accepted without `ZipArchiveSafety` — **hit 2026-09-03 (#636):** AWS/GCP inventory ingest validator skipped `ZipArchiveSafety.ValidateArchive` while sibling `AzureExtractorPackageZipValidator` already rejects unsafe entry paths; fixed with Azure parity safety gate (`Validate_zip_slip_entry_path_is_invalid_archive`).

2026-09-03 thorough hunt #636: proved cloud inventory ZIP safety parity gap; disproved boolean-true current-schema upgrader path, decimal IPv4 literals, and duplicate dead-letter boolean `schemaVersion` candidate.

- [x] (proven) `CommercialPackagingTierResolver` / `TenantTrialSeatPolicy` / `CommercialTenantEligibility` — padded `TrialStatus` not treated as active — **hit 2026-09-03 (#642):** after #600/#601 `OrdinalIgnoreCase` parity, `trialStatus:" active "` still bypassed tier resolution null, seat-claim enforcement, and Standard-tier commercial gates; fixed with `TrialLifecycleStatus.EqualsStatus` trim+ignore-case helper (`ResolveCommercialTierLabel_returns_null_for_padded_active_trial_status`, `RequiresSeatClaim_true_when_padded_active_trial_status`, `CommercialTenantEligibility_blocks_padded_active_trial_from_standard_gates`).

2026-09-03 seed hunt #642: reseeded tenancy helpers after #601 lowercase TrialStatus fix; proved whitespace-padded active status parity gap.

- [x] (proven) `AzureRetailPricesCatalogClient.IsMonthlyMeter` — bare `Month` substring false-positive on `1 NonMonthly` — **hit 2026-09-03 (#644):** unbounded `Contains("Month")` matched non-monthly unit-of-measure after #539/#586 bounded-token fixes for ` mo` and `/mo`; inflated consumption SKU monthly cost estimates; fixed with `ContainsMonthWordToken` / `ContainsSlashMonthWordToken` (`LooksLikeConsumptionUsd_rejects_nonmonthly_unit_of_measure_false_positive`, `TryMonthlyUsdFromRow_rejects_nonmonthly_unit_of_measure_false_positive`).

- [x] (proven) `GraphSnapshotCommittedReuseResolver.PinFingerprintMatchesHeader` / `PinStringPropertyMatches` — padded pin hash properties blocked committed graph reuse — **hit 2026-09-03 (#644):** `architectureVersionId` already trimmed in #630 but `policyPackPinsHashSha256Hex` and sibling pin fingerprints compared raw stored text; whitespace-padded graph context properties failed observational equality despite matching run header pins; fixed with `.Trim()` on stored pin strings (`TryResolveAsync_reuses_graph_when_policy_pack_pins_hash_has_outer_whitespace`).

2026-09-03 seed hunt #644: reseeded from `AzureRetailPricesSkuMatchers` and `GraphSnapshotCommittedReuseResolver`; proved `NonMonthly` month-token false positive and pin-hash trim parity gap.

- [x] (proven) `AzureRetailPricesCatalogClient.IsHourMeter` — bare `hrs` substring false-positive on `1 Purchrs` — **hit 2026-09-03 (#645):** unbounded `Contains("hrs")` matched non-hourly unit-of-measure after #533 bounded `/hr` and hour-word token fixes; inflated consumption SKU hourly cost estimates; fixed with bounded ` hrs` token and standalone `hrs` synonym (`LooksLikeConsumptionUsd_rejects_purchrs_unit_of_measure_false_positive`).

- [x] (proven) `GraphSnapshotCommittedReuseResolver.IsObservationallyEqual` — padded `contextCanonicalFingerprint` / `knowledgeModelFingerprint` blocked committed graph reuse — **hit 2026-09-03 (#645):** pin-hash trim landed in #644 but context and KM fingerprint compares stayed raw; whitespace-padded graph context properties failed observational equality; fixed with bilateral `.Trim()` on stored and expected fingerprints (`TryResolveAsync_reuses_graph_when_context_fingerprint_has_outer_whitespace`, `TryResolveAsync_reuses_graph_when_knowledge_model_fingerprint_has_outer_whitespace`).

2026-09-03 seed hunt #645: reseeded from `GraphSnapshotCommittedReuseResolver` after #644 pin-hash trim; proved context/KM fingerprint trim parity gap and `hrs` substring false positive.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — `reproduce` environment names misclassified as production-like — **hit 2026-09-03 (#646):** unbounded `Contains("prod")` matched `Reproduce` / `reproduce-bug-*` bug-repro environment names after non-production exclusions; production-like config lint and bypass-auth guards applied incorrectly; fixed by excluding reproduce-like environment name prefixes (`EnvironmentNameImpliesProductionLike_rejects_reproduce_environment_names`).

2026-09-03 seed hunt #646: reseeded from `HostingEnvironmentNamePatterns`; proved `prod` substring false positive on reproduce environment names.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — `product` environment names misclassified as production-like — **hit 2026-09-03 (#647):** after #646 reproduce exclusion, unbounded `Contains("prod")` still matched `Product` / `product-dev` team environment names; production-like config lint and bypass-auth guards applied incorrectly; fixed by excluding product-like environment name prefixes (`EnvironmentNameImpliesProductionLike_rejects_product_team_environment_names`).

- [x] (proven) `AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd` — `Non-Reservation` retail `Type` rejected as reservation — **hit 2026-09-03 (#647):** unbounded `Contains("Reservation")` matched `Non-Reservation` consumption rows and excluded valid hourly/monthly SKUs from cost estimates; fixed with non-reservation exclusions before reservation rejection (`LooksLikeConsumptionUsd_accepts_non_reservation_type_with_hourly_unit`).

2026-09-03 seed hunt #647: reseeded from `HostingEnvironmentNamePatterns` and `AzureRetailPricesSkuMatchers`; proved product environment `prod` false positive and `Non-Reservation` retail type rejection after #646 reproduce fix.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — `produce` environment names misclassified as production-like — **hit 2026-09-03 (#648):** after #647 product exclusion, unbounded `Contains("prod")` still matched `Produce` / `produce-dev` environment names; production-like config lint and bypass-auth guards applied incorrectly; fixed by excluding produce-like environment name prefixes (`EnvironmentNameImpliesProductionLike_rejects_produce_environment_names`).

- [x] (proven) `AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd` — `Non-Government` retail `MeterTier` rejected as government — **hit 2026-09-03 (#648):** unbounded `Contains("Government")` matched `Non-Government` consumption rows and excluded valid hourly/monthly SKUs from cost estimates; fixed with non-government exclusions before government rejection (`LooksLikeConsumptionUsd_accepts_non_government_meter_tier_with_hourly_unit`).

- [x] (invalid) `AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd` — `Rsv` substring false-positive on observability meter names — `Observability` does not contain contiguous `Rsv`; cheap-disproof on hunt #648.

2026-09-03 seed hunt #648: reseeded from `HostingEnvironmentNamePatterns` and `AzureRetailPricesSkuMatchers`; proved produce environment `prod` false positive and `Non-Government` retail tier rejection; disproved `Rsv` observability false positive.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — `prodigy` environment names misclassified as production-like — **hit 2026-09-03 (#649):** after #648 produce exclusion, unbounded `Contains("prod")` still matched `Prodigy` / `prodigy-dev` environment names; production-like config lint and bypass-auth guards applied incorrectly; fixed by excluding prodigy-like environment name prefixes (`EnvironmentNameImpliesProductionLike_rejects_prodigy_environment_names`).

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — `prodigal` environment names misclassified as production-like — **hit 2026-09-03 (#649):** same unbounded `Contains("prod")` matched `Prodigal` / `prodigal-dev` environment names; fixed by excluding prodigal-like environment name prefixes (`EnvironmentNameImpliesProductionLike_rejects_prodigal_environment_names`).

- [x] (invalid) `AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd` — `Rsv` substring false-positive on `Cursive` meter names — `Cursive` contains `rsi` at the embedded substring, not contiguous `Rsv`; cheap-disproof on hunt #649.

2026-09-03 seed hunt #649: reseeded from `HostingEnvironmentNamePatterns`; proved prodigy and prodigal environment `prod` false positives; disproved `Cursive`/`Rsv` meter-name false positive.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — unbounded `Contains("prod")` false positives on unrelated environment names — **hit 2026-09-03 (#650):** after #646–#649 per-word exclusions, `prodding` / `prodding-dev` still matched; replaced substring scan with `production` substring plus standalone delimiter-bounded `prod` tokens so reproduce/product/produce/prodigy/prodigal/prodding no longer match while `PreProduction` / `staging-prod` still do (`EnvironmentNameImpliesProductionLike_rejects_prodding_environment_names`).

2026-09-03 seed hunt #650: reseeded from `HostingEnvironmentNamePatterns`; proved prodding `prod` false positive; replaced whack-a-mole exclusions with bounded prod-token matching.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — `reproduction` environment names misclassified as production-like — **hit 2026-09-03 (#651):** #650 `production` substring check matched `Reproduction` / `reproduction-bug` because `reproduction` embeds `production`; production-like guards applied to bug-repro environments; fixed by excluding reproduction-like name prefixes before the production substring scan while preserving `PreProduction` (`EnvironmentNameImpliesProductionLike_rejects_reproduction_environment_names`).

2026-09-03 seed hunt #651: reseeded from `HostingEnvironmentNamePatterns` after #650 bounded prod-token fix; proved reproduction environment `production` substring false positive.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — embedded `reproduction` environment names misclassified as production-like — **hit 2026-09-03 (#653):** #651 prefix-only exclusion missed `my-reproduction-bug` (`-reproduction-` embedded) and `reproductions` (plural); `production` substring scan still matched; fixed with delimiter-bounded embedded reproduction tokens and plural exact/prefix/suffix parity (`EnvironmentNameImpliesProductionLike_rejects_embedded_reproduction_environment_names`).

2026-09-03 seed hunt #653: reseeded from `HostingEnvironmentNamePatterns` after #651 reproduction prefix fix; proved embedded reproduction and plural reproduction environment gaps.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — mixed-delimiter `reproduction` environment names misclassified as production-like — **hit 2026-09-03 (#654):** #653 embedded-token check only matched homogeneous `-reproduction-` / `_reproduction_` pairs; `my-reproduction_bug` and `my_reproduction-bug` still hit the `production` substring scan; fixed with mixed `-reproduction_` / `_reproduction-` embedded tokens (`EnvironmentNameImpliesProductionLike_rejects_mixed_delimiter_reproduction_environment_names`).

2026-09-03 seed hunt #654: reseeded from `HostingEnvironmentNamePatterns` after #653 homogeneous embedded reproduction fix; proved mixed-delimiter reproduction environment gap.

- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — dot-delimiter `reproduction` environment names misclassified as production-like — **hit 2026-09-04 (#655):** #654 mixed-delimiter fix only covered `-`/`_` pairs; `my.reproduction.bug`, `reproduction.bug`, and `bug.reproduction` still hit the `production` substring scan; fixed with `.` prefix/suffix parity and delimiter-combination embedded reproduction tokens (`EnvironmentNameImpliesProductionLike_rejects_dot_delimiter_reproduction_environment_names`).

2026-09-04 seed hunt #655: reseeded from `HostingEnvironmentNamePatterns` after #654 mixed-delimiter reproduction fix; proved dot-delimiter reproduction environment gap.

- [x] (proven) `RequestConstraintClassifier` — substring false positives on ai/search/private capability and constraint tokens — **hit 2026-09-04 (#735):** unbounded `Contains` matched `email`→ai, `research`→search, and `non-private`/`non private`→private networking; starter evidence refs incorrectly added AI/search/private policy packs; fixed with `RequestConstraintTokenMatcher` standalone-word and non-prefixed-negation phrase matching (`RequiresAiCapability_does_not_false_positive_on_email_capability_phrasing`, `RequiresSearchCapability_does_not_false_positive_on_research_capability_phrasing`, `HasPrivateNetworkingConstraint_does_not_false_positive_on_non_private_phrasing`).
- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — underscore/dot/space `non_production` variants misclassified as production-like — **hit 2026-09-04 (#735):** after #655 hyphen-only exclusions, `non_production` / `non.production` / `non production` still hit the `production` substring scan; fixed with delimiter-variant non-production exclusions (`EnvironmentNameImpliesProductionLike_rejects_non_production_delimiter_variants`).
- [x] (proven) `RequiredAuditEventTypes.IsRequired` — padded required event type wire values rejected — **hit 2026-09-04 (#735):** outer whitespace on governance audit wire values failed `Ordinal` equality and skipped fail-closed routing; fixed with `Trim()` before registry lookup (`IsRequired_trims_outer_whitespace_on_wire_values`).

2026-09-04 seed hunt #735: reseeded from `RequestConstraintClassifier`, `HostingEnvironmentNamePatterns`, and `RequiredAuditEventTypes`; proved substring constraint/capability false positives, non-production delimiter variants, and padded required-audit trim gap.

- [x] (proven) `RequestConstraintClassifier.RequiresSqlCapability` — embedded `sql` substring false positives — **hit 2026-09-04 (#736):** #735 fixed ai/search tokens but SQL still used unbounded `Contains`; `NoSQL` / `MySQL` capability phrasing incorrectly added SQL catalog refs; fixed with standalone-word matching (`RequiresSqlCapability_does_not_false_positive_on_nosql_capability_phrasing`, `RequiresSqlCapability_does_not_false_positive_on_mysql_capability_phrasing`).
- [x] (proven) `RequestConstraintClassifier.HasEncryptionConstraint` — negated encryption phrases not excluded — **hit 2026-09-04 (#736):** `non-encryption` / `non_encryption` constraints still matched after #735 private-networking negation parity; fixed with `ContainsAffirmativePhrase` (`HasEncryptionConstraint_does_not_false_positive_on_non_encryption_phrasing`).
- [x] (proven) `HostingEnvironmentNamePatterns.EnvironmentNameImpliesProductionLike` — `non-prod` shorthand variants misclassified as production-like — **hit 2026-09-04 (#736):** #735 full-word `non_production` exclusions missed common `non-prod` / `non.prod` / `non_prod` / `non prod` shorthand; standalone `prod` token still matched; fixed with non-prod shorthand exclusions (`EnvironmentNameImpliesProductionLike_rejects_non_prod_shorthand_variants`).
- [x] (proven) `AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd` — underscore `Non_Reservation` / `Non_Government` delimiter gaps — **hit 2026-09-04 (#736):** #647 hyphen-only `non-reservation` / `non-government` exclusions missed underscore variants; valid consumption SKUs rejected from cost estimates; fixed with delimiter-variant helpers (`LooksLikeConsumptionUsd_accepts_non_reservation_underscore_type_with_hourly_unit`, `LooksLikeConsumptionUsd_accepts_non_government_underscore_meter_tier_with_hourly_unit`).
- [x] (proven) `AgentModelExecutionProfileParser.TryParse` — `high_assurance` underscore alias rejected — **hit 2026-09-04 (#736):** hyphen/space aliases accepted since #223 but underscore form fell through to Balanced default; fixed with `high_assurance` parity (`TryParse_accepts_high_assurance_display_labels`).
- [x] (invalid) `FocusedPilotModePolicyPacks.IsAllowedPackDisplayName` — lowercase/mixed-case baseline pack display names rejected — duplicate of #737 proven row; `OrdinalIgnoreCase` allow-list already shipped.
- [x] (invalid) `PlatformOverlayPolicyPacks.IsOverlayDisplayName` — lowercase overlay display names rejected — duplicate of #737 proven row; overlay sets already `OrdinalIgnoreCase`.

2026-09-04 seed hunt #736: reseeded #735 parity surfaces; proved SQL/encryption classifier gaps, non-prod environment shorthand, retail SKU delimiter variants, and high-assurance underscore alias; seeded focused-pilot and overlay display-name casing candidates.

- [x] (proven) `FocusedPilotModePolicyPacks.IsAllowedPackDisplayName` — lowercase baseline pack display names rejected — **hit 2026-09-04 (#737):** `AllowedDisplayNames` used `StringComparer.Ordinal` while `ReferencesIncludeFocusedPilotToken` is case-insensitive; lowercase `security architecture baseline` failed focused-review allow-list and excluded valid baseline packs; fixed with `OrdinalIgnoreCase` (`IsAllowedPackDisplayName_matches_case_insensitive_baseline_display_names`, `IsPackAllowedInFocusedReview_allows_lowercase_baseline_pack_display_name`).
- [x] (proven) `PlatformOverlayPolicyPacks.IsOverlayDisplayName` — lowercase overlay display names rejected — **hit 2026-09-04 (#737):** Ordinal overlay `HashSet` lookup missed lowercase WAF/CIS display names so focused-review overlay bypass (`isPlatformOverlayForRunCloud`) failed; fixed with `OrdinalIgnoreCase` on overlay name sets (`IsOverlayDisplayName_matches_case_insensitive_overlay_display_names`).

2026-09-04 thorough hunt #737: promoted and proved both #736 casing candidates; focused-pilot baseline and platform overlay display-name gates now case-insensitive.

- [x] (proven) `RequestConstraintClassifier.HasManagedIdentityConstraint` — `unmanaged identity` / `non-managed identity` false positives — **hit 2026-09-04 (#738):** #735 negation parity missed `un-` prefix on `managed identity` phrase; unmanaged constraints incorrectly added managed-identity policy refs; fixed with `ContainsAffirmativePhrase` + `un-` negation prefix (`HasManagedIdentityConstraint_does_not_false_positive_on_unmanaged_identity_phrasing`, `HasManagedIdentityConstraint_does_not_false_positive_on_non_managed_identity_phrasing`).
- [x] (proven) `IntegrationWebhookPayloadSamples.ResolveEventType` — uppercase canonical `com.archlucid.*` constants rejected — **hit 2026-09-04 (#738):** `KnownEventTypes` used `StringComparer.Ordinal` while Teams trigger catalog is case-insensitive; `COM.ARCHLUCID.AUTHORITY.RUN.COMPLETED` threw on CLI simulate-webhook; fixed with case-insensitive known-type resolution returning canonical casing (`ResolveEventType_accepts_uppercase_canonical_event_type`).
- [x] (proven) `AzureRetailPricesCatalogClient.LooksLikeConsumptionUsd` — dot-delimiter `Non.Reservation` / `Non.Government` gaps — **hit 2026-09-04 (#738):** #736 underscore parity missed dot variants; valid consumption SKUs rejected; fixed with `non.reservation` / `non.government` exclusions (`LooksLikeConsumptionUsd_accepts_non_reservation_dot_type_with_hourly_unit`, `LooksLikeConsumptionUsd_accepts_non_government_dot_meter_tier_with_hourly_unit`).
- [x] (valid-no-repro) `Permissions.IsKnown` — padded permission strings rejected when callers bypass `ValidateAndNormalize` — `IsKnown` is exact-match only; sole caller `ValidateAndNormalize` trims before lookup and `CustomRoleService` routes through `ValidateAndNormalize` exclusively; padded direct `IsKnown` behavior is intentional (`IsKnown_returns_false_for_padded_permission_without_trim`, `ValidateAndNormalize_trims_before_IsKnown_lookup`).

2026-09-04 thorough hunt #739: cheap-disproved `Permissions.IsKnown` trim candidate; no bypass path in repo; dry.

- [x] (proven) `DigestDeliveryManifestHashGuard` / `IntegrationEventOutboxManifestHashGuard` — PascalCase `ManifestHash` / `ManifestHashSha256` / `RunId` rejected — **hit 2026-09-05 (#801):** Wave-22 guards used case-sensitive `TryGetProperty` while sibling JSON readers accept PascalCase; run-linked digest delivery and outbox publish blocked valid payloads; fixed with `RunExplanationAggregateJsonReader.TryGetPropertyCaseInsensitive` (`EnsureRunLinkedDigestManifestHashOrThrow_accepts_PascalCase_ManifestHash`, `EnsureRunScopedPayloadIncludesManifestHashOrThrow_accepts_PascalCase_ManifestHash`, `EnsureRunScopedPayloadIncludesManifestHashOrThrow_accepts_PascalCase_ManifestHashSha256`).
- [ ] (candidate) `RequestConstraintClassifier` / `RequestConstraintTokenMatcher` — `no-` / `not ` negation prefix gap on managed-identity / AI / SQL / private-networking constraints; `no-sql` may match standalone-word SQL token without negation handling.
- [ ] (candidate) `RequiredAuditEventTypes.IsRequired` — lowercase governance audit wire values rejected after #735 trim fix; external emitters with mis-cased strings may skip fail-closed routing.

2026-09-05 seed hunt #801: reseeded Wave-22 manifest-hash guards; proved PascalCase manifestHash/runId parity gap; reseeded constraint negation and audit casing candidates.
- [x] (proven) `RunAuthorityPipelineDeadLetterDetection.IsDeadLettered` — case-sensitive `failureClass` value match — **hit 2026-09-03 (#596):** PascalCase `"PipelineDeadLetter"` in persisted `LastFailureReason` JSON missed dead-letter detection while canonical constant is `pipelineDeadLetter`; run list/detail showed not dead-lettered; fixed with `OrdinalIgnoreCase` comparison (`IsDeadLettered_returns_true_for_PascalCase_pipeline_dead_letter_failure_class_value`).
- [x] (proven) Teams trigger parse silently disables all notifications for unknown-only JSON — **hit 2026-08-20:** `ParseOrDefault` filtered unknown entries to an empty list instead of returning the documented all-on default when every stored trigger name was unrecognized
- [x] (valid-no-repro) Tenant scope model treats empty workspace as a wildcard — `ActivityScopeTags` rejects `Guid.Empty` workspace ids; no wildcard semantics in Core tenancy models.
- [x] (valid-no-repro) Configuration default enables a production-unsafe integration flag — ITSM/native and quick-scan defaults are gated by environment validators and hosted-SaaS overrides.
- [x] (proven) Integration webhook simulate rejects governance approval and alert-acknowledged aliases — **hit 2026-08-21:** `ResolveEventType` switch omitted `GovernanceApprovalApproved`, `GovernanceApprovalRejected`, and `AlertAcknowledged` PascalCase/kebab aliases while sibling triggers were wired; CLI simulate-webhook threw for those event names.
- [x] (proven) Tenant Azure OpenAI deployment catalog lookup is case-sensitive on JSON tier keys — **hit 2026-08-23:** `TenantAzureOpenAiDeploymentsCatalog.TryParse` returned a case-sensitive dictionary so `ResolveDeploymentName` missed `Default` / mixed-case tier keys and fell back to the raw tier name instead of the configured deployment; regression in `TenantAzureOpenAiDeploymentsCatalogTests`.
- [x] (proven) Governance promotion webhook sample omits `environment` and schema activation fields so Service Bus `promotion_environment` routing is never resolved — **hit 2026-08-23:** `CreateGovernancePromotionActivated` emitted `targetEnvironment` / `promotionRecordId` instead of the publisher contract (`environment`, `activationId`, `manifestVersion`, `activatedBy`, `activatedUtc`); regression in `GovernancePromotionActivated_webhook_sample_matches_schema_and_resolves_promotion_environment`
- [x] (proven) `IntegrationWebhookPayloadSamples.ResolveEventType` ignores `IntegrationEventTypes.MapToCanonical` for legacy `com.archiforge.*` vendor aliases — **hit 2026-08-23:** Service Bus dispatch and outbox priority map legacy strings but CLI simulate-webhook threw before payload creation; regression in `ResolveEventType_maps_legacy_vendor_alias_before_known_set_lookup`
- [x] (proven) IPv6 unique-local addresses bypass outbound HTTPS private-network guard — **hit 2026-08-24:** `PrivateNetworkAddressGuard` blocked IPv4 RFC1918 and IPv6 link-local but not `fc00::/7` ULA; regression in `PrivateNetworkAddressGuard_IsForbiddenIpAddress_blocks_ipv6_link_local_and_unique_local`
- [x] (proven) PascalCase `routingCriteria` / `severities` metadata silently disables alert routing filters — **hit 2026-08-24:** `AlertRoutingCriteriaMetadata.Parse` used case-sensitive `TryGetProperty`; empty criteria fail-open in `AlertRoutingMatcher`; regression in `AlertRoutingCriteriaMetadata_Parse_PascalCase_property_names_preserves_severity_filter`
- [x] (proven) `FindingJsonConverter` downgrades unknown severity strings to `Info` — **hit 2026-08-24:** unlike `ArchitectureFindingJsonConverter`, labels like `blocker` hydrated as `Info`; fixed to throw on unknown labels (`FindingJsonConverterTests.Deserialize_unknown_severity_throws`)
- [x] (proven) Azure Marketplace webhook `PlanId` PascalCase missed → tier defaults to Standard — **hit 2026-08-24:** `TryGetPlanId` only read camelCase `planId`; regression in `TryGetPlanId_reads_PascalCase_planId`
- [x] (proven) `FindingJsonConverter` ignored numeric `humanReviewStatus` and `enforcementTier` ordinals — **hit 2026-08-25:** `GetString()` on numeric JSON threw or skipped review state; string-only `enforcementTier` left Advisory as PolicyViolation; fixed with `ReadHumanReviewStatus` / `ReadEnforcementTier` aligned to contract converters (`FindingJsonConverterTests.Deserialize_numeric_humanReviewStatus_maps_defined_ordinals`, `Deserialize_numeric_enforcementTier_maps_advisory_ordinal`).
- [x] (proven) `FindingJsonConverter.ReadInsightDensityFields` requires string `treatment` / `classification` tokens — numeric `1` (DemoteToChecklist / ChecklistCoverage) silently stays null on snapshot reload — **hit 2026-08-26:** same gap as pre-fix `humanReviewStatus`; fixed with `ReadTreatment` / `ReadClassification` (`Deserialize_numeric_treatment_maps_demote_to_checklist_ordinal`, `Deserialize_numeric_classification_maps_checklist_coverage_ordinal`).
- [x] (proven) `MarketplaceWebhookPayloadParser.ReadQuantity` is case-sensitive on `quantity` — PascalCase `"Quantity":5` falls back to `1` while `TryGetPlanId` already uses case-insensitive lookup — **hit 2026-08-26:** fixed with `TryGetPropertyCaseInsensitive` (`ReadQuantity_reads_PascalCase_quantity`).
- [x] (proven) `IntegrationEventServiceBusApplicationProperties.TryResolveAlertFired` uses case-sensitive `TryGetProperty("severity")` — PascalCase `"Severity":"Critical"` omits the `severity` user property and breaks SQL subscription filters — **hit 2026-08-26:** fixed with `TryGetStringPropertyCaseInsensitive` (`TryResolveForPublish_alert_fired_maps_PascalCase_severity`).
- [x] (proven) `FindingJsonConverter` `properties.enforcementTier` and `evaluationConfidenceLevel` accept undefined enum strings via `Enum.TryParse` without `Enum.IsDefined` — numeric-string `"99"` may hydrate cast ordinals — **hit 2026-08-27:** properties `enforcementTier` and top-level `evaluationConfidenceLevel` accepted `"99"`; fixed with `ReadEnforcementTierFromString` / `ReadConfidenceLevel` (`Deserialize_properties_enforcementTier_numeric_string_out_of_range_throws`, `Deserialize_evaluationConfidenceLevel_numeric_string_out_of_range_throws`).
- [x] (proven) `GraphJsonElementReaders.ReadProperties` returns an empty dictionary when any property value is non-string — mixed-type graph node `properties` bags lose all entries on deserialize — **hit 2026-08-27:** fallback now preserves string entries when `Dictionary<string,string>` deserialize fails (`GraphNodeJsonConverter_Read_mixed_type_properties_preserves_string_entries`).
- [x] (proven) `ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault` accepts undefined review-status strings via `Enum.TryParse` without `Enum.IsDefined` — **hit 2026-08-27:** numeric-string `"99"` cast to `(FindingHumanReviewStatus)99`; fixed with `Enum.IsDefined` guard (`ParseOrDefault_returns_NotRequired_for_undefined_numeric_string`).
- [x] (proven) `FindingJsonConverter.EnumReaders` top-level string paths for `enforcementTier`, `humanReviewStatus`, `treatment`, `classification`, and `severity` accept numeric-string `"99"` via bare `Enum.TryParse` while properties-bag / numeric JSON paths guard with `Enum.IsDefined` — **hit 2026-08-28 (#223):** top-level string tokens bypassed guards added only on properties path; fixed with `ReadEnforcementTierFromString` reuse and numeric-string + `IsDefined` checks (`Deserialize_enforcementTier_numeric_string_out_of_range_throws`, `Deserialize_humanReviewStatus_numeric_string_out_of_range_throws`).
- [x] (proven) `FindingEnforcementTierClassifier.TryReadTierFromProperties` accepts undefined `properties.enforcementTier` via bare `Enum.TryParse` — **hit 2026-08-28 (#223):** numeric-string `"99"` short-circuited classification; fixed with `Enum.IsDefined` guard (`ClassifyFinding_ignores_undefined_enforcement_tier_property_value`).
- [x] (proven) `IntegrationEventServiceBusCorrelationId.TryResolveFromPayload` uses case-sensitive `TryGetProperty("correlationId")` — PascalCase `"CorrelationId"` omitted so Service Bus publish loses payload correlation fallback when activity tag unset — **hit 2026-08-28 (#223):** fixed with case-insensitive property lookup (`TryResolveForPublish_reads_PascalCase_CorrelationId_from_payload_when_activity_unset`).
- [x] (proven) `IntegrationEventServiceBusCorrelationId.TryResolveFromPayload` reads `correlationId` only when the JSON token is a string — numeric correlation ids returned null and dropped Service Bus publish correlation fallback — **hit 2026-08-28 (#223):** accept string or number tokens (`TryResolveForPublish_reads_numeric_correlationId_from_payload_when_activity_unset`).
- [x] (proven) `IntegrationEventServiceBusApplicationProperties.TryGetStringPropertyCaseInsensitive` uses `GetString()` only — numeric JSON `deduplicationKey` threw and dropped Service Bus subscription filter properties — **hit 2026-08-28 (#223):** accept string or number tokens (`TryResolveForPublish_alert_resolved_maps_numeric_deduplication_key`).
- [x] (proven) `AgentModelExecutionProfileParser.TryParse` rejects `"High Assurance"` display label while accepting `"high-assurance"` — **hit 2026-08-28 (#223):** operator tenant-setting labels failed profile parse; fixed with display-label alias (`TryParse_accepts_high_assurance_display_labels`).
- [x] (proven) `PolicyPackExpectationFacetParser.ParseBreachSeverity` accepts undefined severity numeric-strings via bare `Enum.TryParse` without `Enum.IsDefined` — **hit 2026-08-28 (#225):** numeric-string `"99"` hydrated as breach severity label; fixed with `Enum.IsDefined` guard (`Parse_breach_severity_numeric_string_out_of_range_returns_null`).
- [x] (proven) `FindingJsonConverter.ReadStringDict` calls `GetString()` on numeric `properties` tokens and aborts full finding deserialize — **hit 2026-08-28 (#225):** coerce number tokens to invariant strings and preserve sibling string entries (`Deserialize_properties_numeric_values_preserve_string_entries`).
- [x] (proven) `FindingJsonConverter.Read` case-sensitive on `findingSchemaVersion` — PascalCase `"FindingSchemaVersion": 2` defaulted schema version to `0` on snapshot reload — **hit 2026-08-28 (#251):** `TryGetPropertyCaseInsensitive` (`Deserialize_pascal_case_findingSchemaVersion_maps_version`).
- [x] (proven) `FindingJsonConverter.ReadStringList` case-sensitive on `relatedNodeIds` / `recommendedActions` — PascalCase `"RelatedNodeIds"` dropped graph linkage on snapshot reload — **hit 2026-08-28 (#251):** `TryGetPropertyCaseInsensitive` in `ReadStringList` (`Deserialize_pascal_case_relatedNodeIds_maps_list`).
- [x] (proven) `FindingJsonConverter.ReadStringDict` case-sensitive on `properties` — PascalCase `"Properties"` dropped properties bag on snapshot reload — **hit 2026-08-28 (#251):** `TryGetPropertyCaseInsensitive` in `ReadStringDict` (`Deserialize_pascal_case_properties_bag_maps_entries`).
- [x] (proven) `FindingJsonConverter.ReadInsightDensityFields` case-sensitive on `treatment` / `classification` — PascalCase `"Treatment"` left insight-density fields null on reload — **hit 2026-08-28 (#251):** `TryGetPropertyCaseInsensitive` (`Deserialize_pascal_case_treatment_maps_demote_to_checklist`).
- [x] (proven) `FindingJsonConverter.Read` case-sensitive on `payloadType` and `payload` — PascalCase `"PayloadType"` / `"Payload"` skipped typed payload rehydration on snapshot reload — **hit 2026-08-28 (#251):** `TryGetPropertyCaseInsensitive` for payload type and body (`Deserialize_pascal_case_payloadType_and_payload_map_typed_payload`).
- [x] (proven) `FindingJsonConverter.ReadTrace` case-sensitive on `trace` — PascalCase `"Trace"` dropped explainability trace on snapshot reload — **hit 2026-08-28 (#251):** `TryGetPropertyCaseInsensitive` in `ReadTrace` (`Deserialize_pascal_case_trace_maps_source_agent_execution_trace_id`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — case-sensitive `TryGetProperty` on faithfulness fields drops PascalCase aggregate JSON → `ResolveDisposition` returns PASS instead of HOLD/WARN — **hit 2026-08-29 (#262):** case-insensitive lookup for ratio, fallback, warning, citations; regression in `RunExplanationConfidenceCalloutBuilderTests.FromAggregateJson_maps_PascalCase_faithfulness_fields`.
- [x] (proven) `RealLlmOutputStructuralValidator.ValidateAgentResultStructure` — case-sensitive top-level/finding/trace property lookup rejects PascalCase `AgentResult` envelopes from external LLM tooling — **hit 2026-08-29 (#262):** `TryGetPropertyCaseInsensitive` on required keys; regression in `RealLlmOutputStructuralValidatorTests.ValidateAgentResultStructure_accepts_PascalCase_property_names`.
- [x] (proven) `FindingJsonConverter.Read` case-sensitive on `category`, `enforcementTier`, `humanReviewStatus`, and `evaluationConfidenceLevel` — PascalCase exporter labels silently defaulted on reload — **hit 2026-08-31 (#279):** `TryGetPropertyCaseInsensitive` for remaining scalar enum/string fields; regression in `FindingJsonConverterTests.Deserialize_pascal_case_category_maps_value`, `Deserialize_pascal_case_enforcementTier_maps_advisory`, `Deserialize_pascal_case_humanReviewStatus_maps_approved`, `Deserialize_pascal_case_evaluationConfidenceLevel_maps_high`.
- [x] (proven) `FindingJsonConverter.ReadOptionalString` numeric coercion gap — numeric `agentExecutionTraceId` / `runIdRef` tokens threw or returned null — **hit 2026-08-31 (#279):** coerce number tokens to invariant strings; regression in `FindingJsonConverterTests.Deserialize_numeric_runIdRef_coerces_to_string`, `Deserialize_numeric_agentExecutionTraceId_coerces_to_string`.
- [x] (proven) `QualityGateWarnOnlyProductionLikeConfigurationLint.ShouldEmitFinding` — undefined `AgentOutputQualityGateMode` numeric-strings parsed via bare `Enum.TryParse` and suppressed production-like WarnOnly advisory — **hit 2026-08-31 (#279):** `Enum.IsDefined` guard with fail-open emit for undefined numeric ordinals; regression in `QualityGateWarnOnlyProductionLikeConfigurationLintTests.ShouldEmitFinding_production_real_undefined_quality_gate_numeric_string_emits_rule`.
- [x] (proven) `FindingJsonConverter.ReadSeverity` — PascalCase `"Severity"` defaulted to `Info` while sibling enum fields used case-insensitive lookup — **hit 2026-09-01 (#417):** `TryGetPropertyCaseInsensitive` in `ReadSeverity`; regression in `FindingJsonConverterTests.Deserialize_pascal_case_severity_maps_error`.
- [x] (proven) `FindingJsonConverter.Read` — PascalCase `ConfidenceScore` / `InsightDensityScore` (and sibling numeric scalars) silently dropped on snapshot reload — **hit 2026-09-01 (#417):** case-insensitive lookup for remaining numeric scalar fields; regression in `FindingJsonConverterTests.Deserialize_pascal_case_confidenceScore_maps_value`.
- [x] (proven) `FindingJsonConverter.ReadStringList` — numeric `relatedNodeIds` array entries threw and aborted full finding deserialize — **hit 2026-09-01 (#417):** coerce number tokens via `ReadStringDictValue`; regression in `FindingJsonConverterTests.Deserialize_relatedNodeIds_numeric_entries_coerce_to_strings`.
- [x] (proven) `IntegrationWebhookPayloadSamples.ResolveEventType` — legacy `com.archiforge.*` vendor aliases threw before `IntegrationEventTypes.MapToCanonical` — **hit 2026-09-01 (#417):** map legacy alias before known-set lookup; regression in `CorePackageCoverageBatchRc27Tests.ResolveEventType_maps_legacy_vendor_alias_before_known_set_lookup`.
- [x] (proven) `MarketplaceWebhookPayloadParser.TryGetPlanId` — numeric `planId` threw via `GetString()` instead of coercing like `ReadQuantity` — **hit 2026-09-01 (#417):** accept string or number tokens in `TryGetStringPropertyCaseInsensitive`; regression in `MarketplaceWebhookPayloadParserTests.TryGetPlanId_reads_numeric_planId`.
- [x] (proven) `AlertRoutingCriteriaMetadata.ReadStringArray` — numeric severity ordinals in `severities` array silently dropped; only string entries survived routing filter parse — **hit 2026-09-02 (#418):** `ReadSeverityArray` maps `FindingSeverity` ordinals to `AlertSeverity` labels (`Error` → `High`); regression in `AlertRoutingCriteriaMetadata_Parse_numeric_severity_ordinals_map_alert_labels` and `AlertRoutingMatcher_numeric_severity_metadata_filters_non_matching_signals`.
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — string-encoded `faithfulnessSupportRatio` and `deterministicFallbackUsed` ignored (number/boolean JSON tokens only) so `ResolveDisposition` returned PASS instead of WARN/HOLD — **hit 2026-09-02 (#419):** `TryReadFiniteDouble` / `TryReadBoolean` coerce string tokens; regression in `RunExplanationConfidenceCalloutBuilderTests.FromAggregateJson_maps_string_encoded_faithfulness_support_ratio` and `FromAggregateJson_maps_string_encoded_deterministic_fallback_flag`.
- [x] (proven) `FindingJsonConverter.Read` — case-sensitive `GetProperty` on required scalars (`findingId`, `findingType`, `engineType`, `title`, `rationale`) threw `KeyNotFoundException` on PascalCase snapshot reload while sibling fields already used case-insensitive lookup — **hit 2026-09-02 (#422):** `ReadRequiredString` with `TryGetPropertyCaseInsensitive`; regression in `Deserialize_pascal_case_required_scalar_fields_maps_values`.
- [x] (invalid) `DecisionConfidenceSourceMapper.ToBuyerLabel` undefined enum numeric-string maps to wrong buyer label — undefined ordinals fall through switch default to `Unknown`; no mislabel risk.

- [x] (proven) `FindingJsonConverter.Read` — string-encoded `confidenceScore` / `evaluationConfidenceScore` / `projectedImpactUsd` / `insightDensityScore` ignored (number JSON tokens only) — **hit 2026-09-02 (#431):** exporter string numerics left nullable scores null on snapshot reload; fixed with shared `TryReadFiniteDouble` / `TryReadInt32` / `TryReadDecimal` coercion (`FindingJsonConverterTests.Deserialize_string_encoded_confidenceScore_maps_value`).
- [x] (proven) `AzureExtractorPackageZipValidator.TryReadManifestSchemaError` — case-sensitive `schemaVersion` lookup — **hit 2026-09-02 (#431):** PascalCase `"SchemaVersion":1` rejected valid customer ZIP manifests; fixed with case-insensitive property lookup (`AzureExtractorPackageZipValidatorTests.Validate_pascal_case_schemaVersion_succeeds`); same fix in `CloudInventoryExtractorPackageZipValidator`.
- [x] (proven) `FindingJsonConverter.Read` — string-encoded `findingSchemaVersion` ignored (number JSON tokens only) — **hit 2026-09-02 (#432):** `"findingSchemaVersion":"2"` defaulted schema version to `0` while sibling numeric fields already coerced string tokens; fixed with `TryReadInt32` (`FindingJsonConverterTests.Deserialize_string_encoded_findingSchemaVersion_maps_version`).
- [x] (proven) `AzureExtractorPackageZipValidator.TryReadManifestSchemaError` — string-encoded `schemaVersion` rejected — **hit 2026-09-02 (#432):** `"schemaVersion":"1"` failed manifest validation; fixed with `TryReadSchemaVersion` string coercion (`AzureExtractorPackageZipValidatorTests.Validate_string_schemaVersion_succeeds`); same fix in `CloudInventoryExtractorPackageZipValidator`.
- [x] (proven) `AlertRoutingCriteriaMetadata.ReadSeverityArrayItem` — string-encoded `FindingSeverity` ordinals in `severities` array pass through literally instead of mapping to alert labels — **hit 2026-09-02 (#433):** `"severities":["2"]` stored `"2"` instead of `High` and broke matcher filters; fixed with numeric-string ordinal coercion (`AlertRoutingCriteriaMetadata_Parse_string_encoded_severity_ordinals_map_alert_labels`, `AlertRoutingMatcher_string_encoded_severity_metadata_filters_non_matching_signals`).
- [x] (proven) `AzureExtractorResourceInventoryReader.TryReadString` — numeric `name` / `resourceType` JSON tokens skipped so inventory rows dropped — **hit 2026-09-02 (#433):** `"name":12345` omitted row from costing inventory; fixed with `TryReadStringToken` number coercion (`AzureExtractorResourceInventoryReaderTests.TryReadFromZip_numeric_name_and_resourceType_coerce_to_strings`).
- [x] (proven) `GraphJsonElementReaders.ReadFirstString` — numeric `nodeId` / `sourceId` JSON tokens return null so graph nodes deserialize with empty ids — **hit 2026-09-02 (#434):** `"nodeId":12345` hydrated as empty string; fixed with number coercion in `ReadFirstString` (`GraphNodeJsonConverterTests.Read_numeric_nodeId_and_sourceId_coerce_to_strings`).
- [x] (proven) `AlertRoutingCriteriaMetadata.ReadStringArray` — numeric `findingTypes` / `tags` array entries silently dropped — **hit 2026-09-02 (#434):** `"findingTypes":[42]` omitted filter token; fixed with `TryReadStringArrayItem` number coercion (`AlertRoutingCriteriaMetadata_Parse_numeric_findingTypes_coerce_to_strings`, `AlertRoutingMatcher_numeric_findingType_metadata_filters_non_matching_signals`).
- [x] (proven) `AzureExtractorResourceInventoryReader.ExtractSku` — numeric `sku.name` JSON tokens ignored — **hit 2026-09-02 (#434):** `"sku":{"name":12345}` left `SkuName` null; fixed with `TryReadStringToken` on sku object fields (`AzureExtractorResourceInventoryReaderTests.TryReadFromZip_numeric_sku_name_coerces_to_string`).
- [x] (proven) `GraphJsonElementReaders.ReadProperties` — numeric-only `properties` bag entries dropped on dictionary deserialize fallback — **hit 2026-09-02 (#435):** `"properties":{"resourceId":12345}` hydrated as empty bag; fixed by coercing number tokens to strings in fallback (`GraphJsonElementReadersPropertiesTests.ReadProperties_numeric_only_values_coerce_to_strings`).
- [x] (proven) `FindingJsonConverter.Read` — numeric `reviewedAtUtc` JSON tokens ignored (string round-trip only) — **hit 2026-09-02 (#435):** unix-millisecond `reviewedAtUtc` left null on snapshot reload; fixed with `TryReadReviewedAtUtc` (`FindingJsonConverterTests.Deserialize_unix_millisecond_reviewedAtUtc_maps_value`).
- [x] (proven) `FindingJsonConverter.Read` — numeric `category` / `payloadType` JSON tokens throw or default via bare `GetString()` — **hit 2026-09-02 (#436):** `"category":42` threw `JsonException` and `"payloadType":7` aborted deserialize; fixed by routing through `ReadOptionalString` coercion (`Deserialize_numeric_category_coerces_to_string`, `Deserialize_numeric_payloadType_coerces_to_string`).
- [x] (proven) `FindingJsonConverter.TryReadReviewedAtUtc` — string-encoded unix-millisecond `reviewedAtUtc` ignored — **hit 2026-09-02 (#436):** `"reviewedAtUtc":"1735689600000"` left null after #435 number-token fix; fixed with numeric-string unix coercion (`Deserialize_string_encoded_unix_millisecond_reviewedAtUtc_maps_value`).
- [x] (proven) `RealLlmOutputStructuralValidator` — numeric `findings[].severity` JSON tokens rejected while top-level numeric `agentType` already accepted — **hit 2026-09-02 (#437):** `"severity":2` failed structural validation for external LLM envelopes; fixed with `TryReadNonEmptyTextToken` (`ValidateAgentResultStructure_accepts_numeric_finding_severity`).
- [x] (proven) `RealLlmOutputStructuralValidator` — numeric `trace.sourceAgentExecutionTraceId` rejected (string/null only) — **hit 2026-09-02 (#437):** `"sourceAgentExecutionTraceId":9001` failed validation; fixed by accepting number tokens (`ValidateAgentResultStructure_accepts_numeric_source_agent_execution_trace_id`).
- [x] (proven) `RealLlmOutputStructuralValidator` — numeric finding content fields (`description` / `title` / etc.) rejected while numeric `severity` already accepted — **hit 2026-09-02 (#438):** `"description":42` failed `findingContent` validation; fixed by reusing `TryReadNonEmptyTextToken` (`ValidateAgentResultStructure_accepts_numeric_finding_content_field`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — numeric `citations` count ignored (array JSON only) — **hit 2026-09-02 (#438):** `"citations":2` left `CitationCount` null so WARN disposition was skipped; fixed with numeric token coercion (`FromAggregateJson_maps_numeric_citation_count`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — numeric `deterministicFallbackUsed` ignored (boolean/string JSON only) — **hit 2026-09-02 (#439):** `"deterministicFallbackUsed":1` left fallback false so HOLD disposition was skipped; fixed with numeric boolean coercion in `TryReadBoolean` (`FromAggregateJson_maps_numeric_deterministic_fallback_flag`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — numeric `faithfulnessWarning` ignored (string JSON only) — **hit 2026-09-02 (#439):** `"faithfulnessWarning":42` dropped warning text so WARN disposition was skipped; fixed with `TryReadNonEmptyTextToken` (`FromAggregateJson_maps_numeric_faithfulness_warning`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — string-encoded `citations` count ignored (array/number JSON only) — **hit 2026-09-02 (#439):** `"citations":"2"` left `CitationCount` null; fixed with string numeric coercion (`FromAggregateJson_maps_string_encoded_citation_count`).
- [x] (proven) `GraphJsonElementReaders.ReadProperties` — boolean `properties` bag entries dropped on dictionary deserialize fallback — **hit 2026-09-02 (#440):** `"properties":{"enabled":true}` hydrated without boolean keys; fixed by coercing true/false tokens to strings (`ReadProperties_boolean_values_coerce_to_strings`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — boolean `faithfulnessWarning` ignored (string/number JSON only) — **hit 2026-09-02 (#440):** `"faithfulnessWarning":true` dropped warning text so WARN disposition was skipped; fixed by extending `TryReadNonEmptyTextToken` (`FromAggregateJson_maps_boolean_faithfulness_warning`).
- [x] (proven) `GraphJsonElementReaders.ReadProperties` — null `properties` bag entries deserialize as null strings — **hit 2026-09-02 (#441):** `"properties":{"region":null}` hydrated with null values instead of empty strings; fixed by normalizing null tokens on deserialize and fallback (`ReadProperties_null_values_coerce_to_empty_strings`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — whole-number `citations` JSON ignored when not int32-coercible — **hit 2026-09-02 (#441):** `"citations":2.0` left `CitationCount` null; fixed with `TryReadWholeNumber` double fallback (`FromAggregateJson_maps_whole_number_citation_count`).
- [x] (proven) `GraphJsonElementReaders.TryReadStringToken` — boolean graph node id tokens return null — **hit 2026-09-02 (#442):** `"nodeId":true` hydrated as empty string; fixed by coercing true/false tokens to strings (`Read_boolean_nodeId_coerces_to_string`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — string-encoded whole-number `citations` count ignored — **hit 2026-09-02 (#442):** `"citations":"2.0"` left `CitationCount` null; fixed with `TryParseWholeNumberString` (`FromAggregateJson_maps_string_encoded_whole_number_citation_count`).
- [x] (proven) `RealLlmOutputStructuralValidator` — boolean finding `severity` rejected (string/number JSON only) — **hit 2026-09-02 (#443):** `"severity":true` failed structural validation for external LLM envelopes; fixed by extending `TryReadNonEmptyTextToken` (`ValidateAgentResultStructure_accepts_boolean_finding_severity`).
- [x] (proven) `AlertRoutingCriteriaMetadata.TryReadStringArrayItem` — boolean `tags` array entries silently dropped — **hit 2026-09-02 (#443):** `"tags":[true,"ops"]` omitted boolean token and broke matcher filters; fixed by coercing true/false tokens to strings (`AlertRoutingCriteriaMetadata_Parse_boolean_tags_coerce_to_strings`).
- [x] (proven) `AlertRoutingCriteriaMetadata.ReadSeverityArrayItem` — boolean `severities` array entries silently dropped — **hit 2026-09-02 (#444):** `"severities":[true,"High"]` omitted boolean token and broke matcher filters; fixed by coercing true/false tokens to strings (`AlertRoutingCriteriaMetadata_Parse_boolean_severities_coerce_to_strings`).
- [x] (proven) `IntegrationEventServiceBusApplicationProperties.TryReadStringOrNumberToken` — boolean `deduplicationKey` ignored (string/number JSON only) — **hit 2026-09-02 (#444):** `"deduplicationKey":true` returned null and dropped Service Bus subscription filter properties; fixed by coercing boolean tokens (`TryResolveForPublish_alert_resolved_maps_boolean_deduplication_key`).
- [x] (proven) `AlertRoutingCriteriaMetadata.ReadSeverityArrayItem` — string-encoded whole-number severity ordinals pass through literally — **hit 2026-09-02 (#445):** `"severities":["2.0"]` stored `"2.0"` instead of `High` and broke matcher filters; fixed with decimal-string ordinal coercion (`AlertRoutingCriteriaMetadata_Parse_string_encoded_whole_number_severity_ordinals_map_alert_labels`).
- [x] (proven) `IntegrationEventServiceBusCorrelationId.TryReadCorrelationIdToken` — boolean `correlationId` ignored (string/number JSON only) — **hit 2026-09-02 (#445):** `"correlationId":true` returned null and dropped Service Bus publish correlation fallback; fixed by coercing boolean tokens (`TryResolveForPublish_reads_boolean_correlationId_from_payload_when_activity_unset`).
- [x] (proven) `AlertRoutingCriteriaMetadata.ReadSeverityArrayItem` — whole-number double severity ordinals silently dropped — **hit 2026-09-02 (#446):** `"severities":[2.0,3.0]` omitted ordinals because `TryGetInt32` failed on `2.0`; fixed with `TryReadWholeNumberSeverityOrdinal` (`AlertRoutingCriteriaMetadata_Parse_whole_number_double_severity_ordinals_map_alert_labels`).
- [x] (proven) `RealLlmOutputStructuralValidator` — boolean `trace.sourceAgentExecutionTraceId` rejected (string/number/null only) — **hit 2026-09-02 (#446):** `"sourceAgentExecutionTraceId":true` failed structural validation; fixed by accepting boolean tokens (`ValidateAgentResultStructure_accepts_boolean_source_agent_execution_trace_id`).
- [x] (proven) `IntegrationEventServiceBusCorrelationId.TryReadCorrelationIdToken` — whole-number double `correlationId` ignored (string/int64 JSON only) — **hit 2026-09-02 (#447):** `"correlationId":42424242.0` returned null and dropped Service Bus publish correlation fallback; fixed with whole-number double coercion (`TryResolveForPublish_reads_whole_number_double_correlationId_from_payload_when_activity_unset`).
- [x] (proven) `IntegrationEventServiceBusApplicationProperties.TryReadStringOrNumberToken` — whole-number double `deduplicationKey` / `severity` ignored — **hit 2026-09-02 (#447):** `"deduplicationKey":42424242.0` returned null; `"severity":2.0` omitted user properties; fixed with whole-number double coercion (`TryResolveForPublish_alert_resolved_maps_whole_number_double_deduplication_key`, `TryResolveForPublish_alert_fired_maps_whole_number_double_severity`).
- [x] (proven) `FindingJsonConverter.ReadSeverity` — whole-number double severity ordinals throw — **hit 2026-09-02 (#447):** `"severity":2.0` threw `JsonException` on snapshot reload; fixed with `TryReadWholeNumberInt32` (`Deserialize_whole_number_double_severity_maps_error`).
- [x] (proven) `FindingJsonConverter.ReadStringDictValue` — whole-number double list/property entries silently dropped — **hit 2026-09-02 (#447):** `"relatedNodeIds":[42.0]` hydrated as empty list; fixed with whole-number double coercion (`Deserialize_relatedNodeIds_whole_number_double_entries_coerce_to_strings`).
- [x] (proven) `RealLlmOutputStructuralValidator.JsonAgentTypeMatchesExpected` — whole-number double `agentType` rejected — **hit 2026-09-02 (#448):** `"agentType":1.0` failed structural validation for Topology envelopes; fixed with `TryReadWholeNumberAgentType` (`ValidateAgentResultStructure_accepts_whole_number_double_agentType`).
- [x] (proven) `FindingJsonConverter` enum numeric readers — whole-number double ordinals throw on reload — **hit 2026-09-02 (#448):** `"humanReviewStatus":1.0` threw `JsonException`; fixed by routing enum numeric paths through `TryReadWholeNumberInt32` (`Deserialize_whole_number_double_humanReviewStatus_maps_pending`).
- [x] (proven) `FindingJsonConverter.ReadOptionalString` — whole-number double scalar refs return null — **hit 2026-09-02 (#448):** `"runIdRef":42.0` left null on snapshot reload; fixed with whole-number double coercion (`Deserialize_whole_number_double_runIdRef_coerces_to_string`).
- [x] (proven) `FindingJsonConverter.TryReadInt32` — whole-number double schema/score fields ignored — **hit 2026-09-02 (#448):** `"findingSchemaVersion":2.0` defaulted to `0`; fixed by delegating to `TryReadWholeNumberInt32` (`Deserialize_whole_number_double_findingSchemaVersion_maps_version`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadBoolean` — whole-number double fallback flags ignored — **hit 2026-09-02 (#449):** `"deterministicFallbackUsed":1.0` left fallback false so HOLD disposition was skipped; fixed with whole-number double coercion (`FromAggregateJson_maps_whole_number_double_deterministic_fallback_flag`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadFiniteDouble` — boolean `faithfulnessSupportRatio` ignored — **hit 2026-09-02 (#449):** `"faithfulnessSupportRatio":false` left ratio null so PASS was returned instead of HOLD; fixed by coercing boolean tokens to `0.0`/`1.0` (`FromAggregateJson_maps_boolean_false_faithfulness_support_ratio_as_hold`).
- [x] (proven) `AzureExtractorPackageZipValidator.TryReadSchemaVersion` — whole-number double `schemaVersion` rejected — **hit 2026-09-02 (#449):** `"schemaVersion":1.0` failed valid ZIP manifest validation; fixed with `TryReadWholeNumberSchemaVersion` (`Validate_whole_number_double_schemaVersion_succeeds`); same fix in `CloudInventoryExtractorPackageZipValidator`.
- [x] (proven) `FindingJsonConverter.TryReadInt32` — string-encoded whole-number schema fields ignored — **hit 2026-09-02 (#449):** `"findingSchemaVersion":"2.0"` defaulted to `0`; fixed with `TryParseWholeNumberString` (`Deserialize_string_encoded_whole_number_findingSchemaVersion_maps_version`).
- [x] (proven) `MarketplaceWebhookPayloadParser.ReadQuantity` — whole-number double and string-encoded quantity tokens fall back to default seat count — **hit 2026-09-02 (#450):** `"quantity":5.0` and `"quantity":"5.0"` returned `1` instead of `5`; fixed with whole-number coercion (`ReadQuantity_reads_whole_number_double_quantity`, `ReadQuantity_reads_string_encoded_whole_number_quantity`).
- [x] (proven) `FindingJsonConverter.ReadOptionalString` — boolean scalar refs return null — **hit 2026-09-02 (#450):** `"runIdRef":true` left null on snapshot reload; fixed by coercing boolean tokens (`Deserialize_boolean_runIdRef_coerces_to_string`).
- [x] (proven) `AzureExtractorPackageZipValidator.TryReadSchemaVersion` — string-encoded whole-number `schemaVersion` rejected — **hit 2026-09-02 (#450):** `"schemaVersion":"1.0"` failed valid ZIP manifest validation; fixed with `TryParseWholeNumberString` (`Validate_string_whole_number_schemaVersion_succeeds`); same fix in `CloudInventoryExtractorPackageZipValidator`.
- [x] (proven) `FindingJsonConverter` enum string readers — string-encoded whole-number ordinals throw on reload — **hit 2026-09-02 (#450):** `"humanReviewStatus":"1.0"` threw `JsonException`; fixed by routing string numeric paths through `TryParseWholeNumberString` (`Deserialize_string_encoded_whole_number_humanReviewStatus_maps_pending`).
- [x] (proven) `FindingJsonConverter.ReadSeverity` — string-encoded whole-number severity ordinals throw on reload — **hit 2026-09-02 (#452):** `"severity":"2.0"` threw `JsonException` while sibling enum readers already accepted decimal strings; fixed with `TryParseWholeNumberString` (`Deserialize_string_encoded_whole_number_severity_maps_error`).
- [x] (proven) `AzureExtractorResourceInventoryReader.TryReadStringToken` — boolean `name` / `resourceType` JSON tokens skipped so inventory rows dropped — **hit 2026-09-02 (#452):** `"name":true` omitted row from costing inventory; fixed by coercing boolean tokens to strings (`TryReadFromZip_boolean_name_and_resourceType_coerce_to_strings`).
- [x] (proven) `FindingJsonConverter.TryReadFiniteDouble` / `TryReadInt32` / `TryReadDecimal` — boolean confidence and impact score JSON tokens ignored — **hit 2026-09-02 (#453):** `"confidenceScore":true` left nullable scores null on snapshot reload while explanation aggregate reader already coerced booleans; fixed with `1.0`/`1`/`1m` coercion (`Deserialize_boolean_confidenceScore_maps_one`, `Deserialize_boolean_evaluationConfidenceScore_maps_one`).
- [x] (proven) `AzureExtractorResourceInventoryReader.ExtractSku` — boolean top-level `sku` JSON token ignored — **hit 2026-09-02 (#453):** `"sku":true` left `SkuName` null; fixed by coercing boolean tokens (`TryReadFromZip_boolean_sku_coerces_to_string`).
- [x] (proven) `MarketplaceWebhookPayloadParser.ReadQuantity` — boolean `quantity` JSON token ignored and falls back to caller default — **hit 2026-09-02 (#454):** `"quantity":true` with `fallback:10` returned `10` instead of coercing to `1`; fixed by mapping booleans before fallback (`ReadQuantity_reads_boolean_quantity_instead_of_fallback`).
- [x] (proven) `GraphJsonElementReaders.ReadFirstDouble` — boolean `weight` JSON token ignored so graph edges default to `1.0` — **hit 2026-09-02 (#454):** `"weight":false` hydrated as `1.0`; fixed by coercing boolean tokens (`Read_boolean_weight_coerces_to_zero_or_one`).
- [x] (proven) `AzureExtractorPackageZipValidator.TryReadSchemaVersion` / `CloudInventoryExtractorPackageZipValidator` — boolean `schemaVersion` rejected — **hit 2026-09-02 (#454):** `"schemaVersion":true` failed valid ZIP manifest validation; fixed by coercing boolean tokens (`Validate_boolean_schemaVersion_succeeds`).
- [x] (proven) `FindingJsonConverter.TryReadFiniteDouble` / `TryReadInt32` / `TryReadDecimal` — string-encoded boolean score JSON tokens ignored — **hit 2026-09-02 (#455):** `"confidenceScore":"true"` left nullable scores null after #453 boolean JSON fix; fixed with string boolean coercion (`Deserialize_string_encoded_boolean_confidenceScore_maps_one`).
- [x] (proven) `MarketplaceWebhookPayloadParser.ReadQuantity` — string-encoded boolean `quantity` falls back to caller default — **hit 2026-09-02 (#455):** `"quantity":"true"` with `fallback:10` returned `10` instead of `1`; fixed with string boolean coercion (`ReadQuantity_reads_string_encoded_boolean_quantity_instead_of_fallback`).
- [x] (proven) `GraphJsonElementReaders.ReadFirstDouble` — string-encoded boolean `weight` ignored so graph edges default to `1.0` — **hit 2026-09-02 (#455):** `"weight":"false"` hydrated as `1.0` after #454 boolean JSON fix; fixed with string boolean coercion (`Read_string_encoded_boolean_weight_coerces_to_zero`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadFiniteDouble` — string-encoded boolean `faithfulnessSupportRatio` ignored — **hit 2026-09-02 (#456):** `"faithfulnessSupportRatio":"false"` left ratio null so PASS was returned instead of HOLD; fixed with string boolean coercion (`FromAggregateJson_maps_string_encoded_boolean_faithfulness_support_ratio_as_hold`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.FromAggregateJson` — boolean / string-encoded boolean `citations` count ignored — **hit 2026-09-02 (#456):** `"citations":true` and `"citations":"true"` left `CitationCount` null; fixed with boolean token coercion (`FromAggregateJson_maps_boolean_citation_count`, `FromAggregateJson_maps_string_encoded_boolean_citation_count`).
- [x] (proven) `AzureExtractorPackageZipValidator.TryReadSchemaVersion` / `CloudInventoryExtractorPackageZipValidator` — string-encoded boolean `schemaVersion` rejected — **hit 2026-09-02 (#456):** `"schemaVersion":"true"` failed valid ZIP manifest validation after #454 boolean JSON fix; fixed with string boolean coercion (`Validate_string_boolean_schemaVersion_succeeds`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadBoolean` — string-encoded whole-number `deterministicFallbackUsed` ignored — **hit 2026-09-02 (#457):** `"deterministicFallbackUsed":"1.0"` left fallback false so HOLD disposition was skipped after #449 whole-number JSON fix; fixed with `TryParseWholeNumberString` (`FromAggregateJson_maps_string_encoded_whole_number_deterministic_fallback_flag`).
- [x] (proven) `RealLlmOutputStructuralValidator.EnumTryParseLenient` — string-encoded whole-number `agentType` rejected — **hit 2026-09-02 (#457):** `"agentType":"1.0"` failed structural validation while numeric `1.0` already accepted in #448; fixed with `TryParseWholeNumberString` (`ValidateAgentResultStructure_accepts_string_encoded_whole_number_double_agentType`).
- [x] (proven) `IntegrationEventServiceBusCorrelationId.TryReadCorrelationIdToken` — string-encoded whole-number `correlationId` not normalized — **hit 2026-09-02 (#458):** `"correlationId":"42424242.0"` stayed decimal while numeric `42424242.0` normalized to `"42424242"` in #447; fixed with `TryParseWholeNumberString` (`TryResolveForPublish_reads_string_encoded_whole_number_double_correlationId_from_payload_when_activity_unset`).
- [x] (proven) `IntegrationEventServiceBusApplicationProperties.TryReadStringOrNumberToken` — string-encoded whole-number `deduplicationKey` / `severity` not normalized — **hit 2026-09-02 (#458):** `"deduplicationKey":"42424242.0"` and `"severity":"2.0"` kept decimal strings while numeric whole-number doubles normalized in #447; fixed with shared string whole-number coercion (`TryResolveForPublish_alert_resolved_maps_string_encoded_whole_number_double_deduplication_key`, `TryResolveForPublish_alert_fired_maps_string_encoded_whole_number_double_severity`).
- [x] (proven) `FindingJsonConverter` enum readers — boolean / string-encoded boolean `severity` rejected — **hit 2026-09-02 (#459):** `"severity":true` and `"severity":"true"` threw while sibling numeric/score readers already coerced booleans to ordinals; fixed with `TryReadBooleanOrdinal` / `TryParseBooleanOrdinalString` (`Deserialize_boolean_severity_maps_warning`, `Deserialize_string_encoded_boolean_severity_maps_warning`).
- [x] (proven) `FindingJsonConverter.ReadHumanReviewStatus` — boolean / string-encoded boolean review status rejected — **hit 2026-09-02 (#459):** `"humanReviewStatus":true` and `"humanReviewStatus":"true"` threw on snapshot reload; fixed with shared boolean ordinal coercion (`Deserialize_boolean_humanReviewStatus_maps_pending`, `Deserialize_string_encoded_boolean_humanReviewStatus_maps_pending`).
- [x] (proven) `RealLlmOutputStructuralValidator.TryResolveAgentType` — string-encoded whole-number parameter rejected — **hit 2026-09-02 (#459):** `ValidateAgentResultStructure("1.0", …)` failed while JSON `"agentType":"1.0"` already accepted in #457; fixed with `TryParseWholeNumberString` (`ValidateAgentResultStructure_accepts_string_encoded_whole_number_double_agentType_parameter`).
- [x] (proven) `FindingJsonConverter.ReadOptionalString` — string-encoded whole-number `runIdRef` not normalized — **hit 2026-09-02 (#460):** `"runIdRef":"42.0"` stayed decimal while numeric `42.0` normalized to `"42"` in #448; fixed with `TryParseWholeNumberLongString` (`Deserialize_string_encoded_whole_number_double_runIdRef_coerces_to_string`).
- [x] (proven) `FindingJsonConverter.ReadStringDictValue` — string-encoded whole-number `relatedNodeIds` / `properties` entries not normalized — **hit 2026-09-02 (#460):** `"relatedNodeIds":["42.0"]` and `"properties":{"resourceId":"42.0"}` kept decimal strings while numeric whole-number doubles normalized in #447; fixed with shared long whole-number string coercion (`Deserialize_relatedNodeIds_string_encoded_whole_number_double_entries_coerce_to_strings`, `Deserialize_properties_string_encoded_whole_number_double_values_coerce_to_strings`).
- [x] (proven) `FindingJsonConverter.ReadOptionalString` — string-encoded boolean `runIdRef` case not normalized — **hit 2026-09-02 (#461):** `"runIdRef":"True"` kept PascalCase while boolean JSON used lowercase `GetRawText()`; fixed with `TryCoerceStringTokenToRawText` (`Deserialize_string_encoded_boolean_runIdRef_coerces_to_lowercase_string`).
- [x] (proven) `FindingJsonConverter.ReadStringDictValue` — string-encoded boolean `properties` / `recommendedActions` case not normalized — **hit 2026-09-02 (#461):** `"enabled":"True"` and `"recommendedActions":["True"]` kept PascalCase while boolean JSON tokens used lowercase `GetRawText()`; fixed with shared string boolean coercion (`Deserialize_properties_string_encoded_boolean_values_coerce_to_lowercase_strings`, `Deserialize_recommendedActions_string_encoded_boolean_entries_coerce_to_lowercase_strings`).

- [x] (proven) `AzureExtractorResourceInventoryReader.TryReadStringToken` — string-encoded boolean `name` / `resourceType` case not normalized — **hit 2026-09-02 (#462):** `"name":"True"` kept PascalCase while boolean JSON used lowercase `GetRawText()`; fixed with `TryNormalizeBooleanString` (`TryReadFromZip_string_encoded_boolean_name_and_resourceType_coerce_to_lowercase_strings`).
- [x] (proven) `GraphJsonElementReaders.TryReadStringToken` / `ReadProperties` — string-encoded boolean graph tokens case not normalized — **hit 2026-09-02 (#462):** `"nodeId":"True"` and `"properties":{"enabled":"True"}` kept PascalCase while boolean JSON used lowercase `GetRawText()`; fixed with shared boolean normalization (`Read_string_encoded_boolean_nodeId_coerces_to_lowercase_string`, `ReadProperties_string_encoded_boolean_values_coerce_to_lowercase_strings`).
- [x] (proven) `MarketplaceWebhookPayloadParser.TryGetStringPropertyCaseInsensitive` — string-encoded boolean `planId` case not normalized — **hit 2026-09-02 (#462):** `"planId":"True"` kept PascalCase while boolean JSON used lowercase `GetRawText()`; fixed with `TryNormalizeBooleanString` (`TryGetPlanId_reads_string_encoded_boolean_planId`).

- [x] (proven) `IntegrationEventServiceBusCorrelationId.TryReadCorrelationIdToken` — string-encoded boolean `correlationId` case not normalized — **hit 2026-09-02 (#463):** `"correlationId":"True"` kept PascalCase while boolean JSON used lowercase `GetRawText()`; fixed with `TryNormalizeBooleanString` (`TryResolveForPublish_reads_string_encoded_boolean_correlationId_from_payload_when_activity_unset`).
- [x] (proven) `IntegrationEventServiceBusApplicationProperties.TryReadStringOrNumberToken` — string-encoded boolean `deduplicationKey` case not normalized — **hit 2026-09-02 (#463):** `"deduplicationKey":"True"` kept PascalCase while boolean JSON used lowercase `GetRawText()`; fixed with `TryNormalizeBooleanString` (`TryResolveForPublish_alert_resolved_maps_string_encoded_boolean_deduplication_key`).
- [x] (proven) `AlertRoutingCriteriaMetadata.TryReadStringArrayItem` / `ReadSeverityArrayItem` — string-encoded boolean `tags` / `severities` case not normalized — **hit 2026-09-02 (#463):** `"tags":["True"]` and `"severities":["True"]` kept PascalCase while boolean JSON used lowercase `GetRawText()`; fixed with shared boolean normalization (`AlertRoutingCriteriaMetadata_Parse_string_encoded_boolean_tags_coerce_to_lowercase_strings`, `AlertRoutingCriteriaMetadata_Parse_string_encoded_boolean_severities_coerce_to_lowercase_strings`).

- [x] (proven) `MarketplaceWebhookPayloadParser.TryGetStringPropertyCaseInsensitive` — string-encoded whole-number `planId` not normalized — **hit 2026-09-02 (#464):** `"planId":"42424242.0"` kept decimal while numeric whole-number doubles normalized in Service Bus #458; fixed with `TryParseWholeNumberLongString` (`TryGetPlanId_reads_string_encoded_whole_number_double_planId`).
- [x] (proven) `AzureExtractorResourceInventoryReader.TryReadStringToken` — string-encoded whole-number `name` / `resourceType` not normalized — **hit 2026-09-02 (#464):** `"name":"42.0"` kept decimal while numeric whole-number doubles normalized in finding readers #448; fixed with shared long whole-number string coercion (`TryReadFromZip_string_encoded_whole_number_double_name_coerces_to_string`).
- [x] (proven) `GraphJsonElementReaders.TryReadStringToken` / `ReadProperties` — string-encoded whole-number graph tokens not normalized — **hit 2026-09-02 (#464):** `"nodeId":"42.0"` and `"properties":{"resourceId":"42.0"}` kept decimal strings; fixed with shared long whole-number string coercion (`Read_string_encoded_whole_number_double_nodeId_coerces_to_string`, `ReadProperties_string_encoded_whole_number_double_values_coerce_to_strings`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadNonEmptyTextToken` — string-encoded boolean `faithfulnessWarning` case not normalized — **hit 2026-09-02 (#464):** `"faithfulnessWarning":"True"` kept PascalCase while boolean JSON used lowercase `GetRawText()`; fixed with `TryParseBooleanString` coercion (`FromAggregateJson_maps_string_encoded_boolean_faithfulness_warning`).

- [x] (proven) `AlertRoutingCriteriaMetadata.TryReadStringArrayItem` — whole-number double / string-encoded `findingTypes` not normalized — **hit 2026-09-02 (#465):** `[42.0]` and `["42.0"]` kept decimal while integer JSON normalized to `"42"`; fixed with `TryReadWholeNumberLongToken` / `TryParseWholeNumberLongString` (`AlertRoutingCriteriaMetadata_Parse_whole_number_double_findingTypes_coerce_to_strings`, `AlertRoutingCriteriaMetadata_Parse_string_encoded_whole_number_double_findingTypes_coerce_to_strings`).
- [x] (proven) `MarketplaceWebhookPayloadParser.TryGetStringPropertyCaseInsensitive` — whole-number double `planId` JSON token not normalized — **hit 2026-09-02 (#465):** `42424242.0` kept decimal while string-encoded whole-number path normalized in #464; fixed with `TryReadWholeNumberLongToken` (`TryGetPlanId_reads_whole_number_double_planId`).
- [x] (proven) `AzureExtractorResourceInventoryReader.TryReadStringToken` — whole-number double `name` JSON token not normalized — **hit 2026-09-02 (#465):** `42.0` kept decimal while string-encoded whole-number path normalized in #464; fixed with `TryReadWholeNumberLongToken` (`TryReadFromZip_whole_number_double_name_coerces_to_string`).
- [x] (proven) `GraphJsonElementReaders.TryReadStringToken` / `ReadProperties` — whole-number double graph token JSON not normalized — **hit 2026-09-02 (#465):** `nodeId:42.0` and `properties.resourceId:42.0` kept decimal; fixed with shared whole-number token coercion (`Read_whole_number_double_nodeId_coerces_to_string`, `ReadProperties_whole_number_double_values_coerce_to_strings`).

- [x] (proven) `RealLlmOutputStructuralValidator.JsonAgentTypeMatchesExpected` — boolean `agentType` JSON rejected — **hit 2026-09-02 (#466):** `"agentType":true` failed structural validation while sibling finding fields already accepted boolean tokens; fixed with `TryReadBooleanOrdinalAgentType` (`ValidateAgentResultStructure_accepts_boolean_agentType`).
- [x] (proven) `RealLlmOutputStructuralValidator.EnumTryParseLenient` — string-encoded boolean `agentType` rejected — **hit 2026-09-02 (#466):** `"agentType":"True"` failed validation while numeric/string whole-number ordinals already accepted; fixed with `TryParseBooleanOrdinalString` (`ValidateAgentResultStructure_accepts_string_encoded_boolean_agentType`).
- [x] (proven) `RealLlmOutputStructuralValidator.TryResolveAgentType` — string-encoded boolean parameter rejected — **hit 2026-09-02 (#466):** `ValidateAgentResultStructure("True", …)` failed while JSON `"agentType":"True"` parity was missing; fixed with shared boolean ordinal coercion (`ValidateAgentResultStructure_accepts_string_encoded_boolean_agentType_parameter`).

- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadNonEmptyTextToken` — whole-number double `faithfulnessWarning` JSON token not normalized — **hit 2026-09-02 (#467):** `"faithfulnessWarning":42.0` kept decimal while integer JSON normalized to `"42"` in #439; fixed with whole-number token coercion (`FromAggregateJson_maps_whole_number_double_faithfulness_warning`).
- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadNonEmptyTextToken` — string-encoded whole-number `faithfulnessWarning` not normalized — **hit 2026-09-02 (#467):** `"faithfulnessWarning":"42.0"` kept decimal while numeric whole-number doubles normalized in sibling readers #465; fixed with `TryParseWholeNumberString` (`FromAggregateJson_maps_string_encoded_whole_number_double_faithfulness_warning`).

- [x] (proven) `PolicyPackExpectationFacetParser.ParseRequireBudgetCap` — string-encoded whole-number advisory flag ignored — **hit 2026-09-02 (#468):** `policyCostRequireBudgetCap="1.0"` returned null instead of `true` while `"1"` already mapped; fixed with `TryParseWholeNumberString` (`Parse_require_budget_cap_string_encoded_whole_number_maps_true`).
- [x] (proven) `PolicyPackExpectationFacetParser.ParseBreachSeverity` — string-encoded whole-number severity ordinal ignored — **hit 2026-09-02 (#468):** `policyCostBreachSeverity="2.0"` returned null while `"2"` already mapped; fixed with whole-number ordinal coercion (`Parse_breach_severity_string_encoded_whole_number_ordinal_maps_label`).

- [x] (proven) `ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault` — string-encoded whole-number review status ignored — **hit 2026-09-02 (#469):** inbound `"1.0"` defaulted to `NotRequired` while `"1"` mapped to `Pending`; fixed with `TryParseWholeNumberString` (`ParseOrDefault_string_encoded_whole_number_maps_pending`).
- [x] (proven) `QualityGateWarnOnlyProductionLikeConfigurationLint.ShouldEmitFinding` — string-encoded whole-number quality-gate mode ignored — **hit 2026-09-02 (#469):** config `"0.0"` skipped WarnOnly advisory while `"0"` emitted; fixed with whole-number coercion (`ShouldEmitFinding_production_real_string_encoded_whole_number_warn_only_emits_rule`).

- [x] (proven) `FindingEnforcementTierClassifier.TryReadTierFromProperties` — string-encoded whole-number `properties.enforcementTier` ignored — **hit 2026-09-02 (#470):** `"1.0"` fell through to policy-violation classification while `"1"` honored advisory tier; fixed with `TryParseWholeNumberString` (`ClassifyFinding_honors_string_encoded_whole_number_enforcement_tier_property`).
- [x] (proven) `DecisionConfidenceSourceMapper.ToBuyerLabel` — string-encoded whole-number confidence source ignored — **hit 2026-09-02 (#470):** `"5.0"` mapped to `Unknown` while `"5"` mapped to model-assisted; fixed with ordinal coercion and `Enum.IsDefined` guard on name parse (`ToBuyerLabel_parses_string_encoded_whole_number_ordinal`).
- [x] (proven) `AgentModelExecutionProfileParser.TryParse` — string-encoded whole-number profile ordinal rejected — **hit 2026-09-02 (#470):** `"2.0"` failed parse while `"2"` accepted HighAssurance; fixed with whole-number ordinal coercion (`TryParse_accepts_string_encoded_whole_number_high_assurance_ordinal`).
- [x] (proven) `WebhookSecrets.TimestampWithinSkew` — string-encoded whole-number unix timestamp rejected — **hit 2026-09-02 (#470):** `"1735689600.0"` failed skew validation while integer strings accepted; fixed with `TryParseWholeNumberLong` (`TimestampWithinSkew_accepts_string_encoded_whole_number_epoch`).

- [x] (proven) `ArchitectureRunStatusTransitionTable.TryParseStatus` — string-encoded whole-number legacy status ignored — **hit 2026-09-02 (#471):** `"4.0"` failed parse while `"4"` mapped to `ReadyForCommit`; fixed with `TryParseWholeNumberString` (`TryParseStatus_parses_string_encoded_whole_number_ordinal`).
- [x] (proven) `ArchitectureRiskRegisterHumanReviewLabel.ParseOrDefault` — string-encoded boolean review status ignored — **hit 2026-09-02 (#471):** `"True"` defaulted to `NotRequired` while sibling finding enum readers already coerced boolean ordinals; fixed with `TryParseBooleanOrdinalString` (`ParseOrDefault_string_encoded_boolean_maps_pending`).

- [x] (proven) `FindingEnforcementTierClassifier.TryReadTierFromProperties` — string-encoded boolean `properties.enforcementTier` ignored — **hit 2026-09-02 (#472):** `"True"` fell through to policy-violation classification while `"1"` honored advisory tier; fixed with boolean ordinal coercion (`ClassifyFinding_honors_string_encoded_boolean_enforcement_tier_property`).
- [x] (proven) `AgentModelExecutionProfileParser.TryParse` — string-encoded boolean profile ordinal rejected — **hit 2026-09-02 (#472):** `"True"` failed parse while numeric `"1"` accepted Balanced; fixed with `TryParseBooleanOrdinalString` (`TryParse_accepts_string_encoded_boolean_balanced_ordinal`).
- [x] (proven) `PolicyPackExpectationFacetParser.ParseBreachSeverity` — string-encoded boolean severity ordinal ignored — **hit 2026-09-02 (#472):** `policyCostBreachSeverity="True"` returned null while `"Warning"` accepted; fixed with boolean ordinal coercion (`Parse_breach_severity_string_encoded_boolean_maps_label`).
- [x] (proven) `ArchitectureRunStatusTransitionTable.TryParseStatus` — string-encoded boolean legacy status ignored — **hit 2026-09-02 (#472):** `"True"` failed parse while `"1"` mapped to `Created`; fixed with boolean ordinal coercion (`TryParseStatus_parses_string_encoded_boolean_ordinal`).

- [x] (proven) `QualityGateWarnOnlyProductionLikeConfigurationLint.ShouldEmitFinding` — string-encoded boolean quality-gate mode ignored — **hit 2026-09-02 (#473):** config `"False"` skipped WarnOnly advisory while `"0"` / `"0.0"` emitted; fixed with `TryParseBooleanOrdinalString` (`ShouldEmitFinding_production_real_string_encoded_boolean_warn_only_emits_rule`).

- [x] (proven) `PolicyPackExpectationFacetParser.ParseBreachSeverity` — coerced severity labels not normalized for downstream enum parse — **hit 2026-09-02 (#474):** `"2.0"` / `"True"` stored raw while `PolicyExpectationCostGraphReader.ResolveBreachSeverityOverride` only accepts enum names; fixed by returning `FindingSeverity.ToString()` for ordinal/boolean coercion paths (`Parse_breach_severity_string_encoded_whole_number_ordinal_maps_label`, `Parse_breach_severity_string_encoded_boolean_maps_label`).

- [x] (proven) `PolicyPackPriorityFloor.NormalizeTier` — string-encoded whole-number priority floor ignored — **hit 2026-09-02 (#475):** advisory `priorityFloor="2.0"` / `"0.0"` defaulted to `P1` while `"2"` / `"0"` honored `P2` / `P0`; fixed with whole-number and boolean ordinal coercion (`ResolveFloor_string_encoded_whole_number_p2_maps_p2`, `ResolveFloor_string_encoded_whole_number_p0_maps_p0`).

- [x] (proven) `PolicyPackExpectationFacet.IsEmpty` — explicit `RequireBudgetCap=false` treated as empty — **hit 2026-09-02 (#476):** parsed opt-out `"0"` / `"False"` returned `IsEmpty=true` while `RequireBudgetCap` was set, conflating explicit false with unset; fixed by requiring `RequireBudgetCap.HasValue` (`Parse_explicit_false_require_budget_cap_facet_is_not_empty`).

- [x] (proven) `PolicyPackExpectationFacetParser.ParseRequireBudgetCap` — `on` / `off` advisory synonyms ignored — **hit 2026-09-02 (#477):** `cost.requireBudgetCap="on"` / `"off"` returned null while `"yes"` / `"no"` already mapped; fixed by accepting on/off alongside yes/no (`Parse_require_budget_cap_on_off_synonyms_map_true_and_false`).

- [x] (proven) `PolicyPackExpectationFacetParser.ParseRequireBudgetCap` — `enabled` / `disabled` advisory synonyms ignored — **hit 2026-09-02 (#478):** `cost.requireBudgetCap="enabled"` / `"disabled"` returned null while yes/no/on/off already mapped; fixed by accepting enabled/disabled (`Parse_require_budget_cap_enabled_disabled_synonyms_map_true_and_false`).

- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadBoolean` — string-encoded `on` / `off` / `enabled` / `disabled` fallback flags ignored — **hit 2026-09-02 (#478):** `"deterministicFallbackUsed":"on"` left fallback false so PASS was returned instead of HOLD while yes/no already mapped; fixed by accepting on/off/enabled/disabled (`FromAggregateJson_maps_string_encoded_on_deterministic_fallback_flag`).

- [x] (proven) `QualityGateWarnOnlyProductionLikeConfigurationLint.TryParseBooleanString` — `off` / `on` / `yes` / `no` / `enabled` / `disabled` quality-gate mode synonyms ignored — **hit 2026-09-02 (#479):** config `"off"` skipped WarnOnly advisory while `"False"` / `"0"` emitted; fixed by accepting boolean synonyms before ordinal coercion (`ShouldEmitFinding_production_real_off_synonym_warn_only_emits_rule`).

- [x] (proven) `FindingEnforcementTierClassifier.TryParseBooleanString` — `on` / `off` property-tier synonyms ignored — **hit 2026-09-02 (#480):** `properties.enforcementTier="on"` fell through to policy-violation while `"True"` honored advisory; fixed with shared boolean synonym coercion (`ClassifyFinding_honors_on_synonym_enforcement_tier_property`).

- [x] (proven) `PolicyPackPriorityFloor.TryParseBooleanString` — `off` priority-floor synonym ignored — **hit 2026-09-02 (#480):** advisory `priorityFloor="off"` defaulted to `P1` while `"False"` / `"0"` mapped `P0`; fixed with boolean synonym coercion (`ResolveFloor_off_synonym_maps_p0`).

- [x] (proven) `ArchitectureRunStatusTransitionTable.TryParseBooleanString` — `on` legacy status synonym ignored — **hit 2026-09-02 (#480):** `"on"` failed parse while `"True"` mapped to `Created`; fixed with boolean synonym coercion (`TryParseStatus_parses_on_synonym_boolean_ordinal`).

- [x] (proven) `MarketplaceWebhookPayloadParser.TryParseBooleanString` — `on` quantity synonym ignored — **hit 2026-09-02 (#480):** `"quantity":"on"` fell back to caller default while `"true"` coerced to `1`; fixed with boolean synonym coercion (`ReadQuantity_reads_on_synonym_quantity_instead_of_fallback`).

- [x] (proven) `AgentModelExecutionProfileParser.TryParseBooleanString` — `on` profile ordinal synonym ignored — **hit 2026-09-02 (#481):** `"on"` failed parse while `"True"` mapped to Balanced; fixed with boolean synonym coercion (`TryParse_accepts_on_synonym_balanced_ordinal`).

- [x] (proven) `ArchitectureRiskRegisterHumanReviewLabel.TryParseBooleanString` — `on` review-status synonym ignored — **hit 2026-09-02 (#481):** `"on"` defaulted to `NotRequired` while `"True"` mapped to `Pending`; fixed with boolean synonym coercion (`ParseOrDefault_on_synonym_maps_pending`).

- [x] (proven) `PolicyPackExpectationFacetParser.TryParseBooleanString` — `on` breach-severity synonym ignored — **hit 2026-09-02 (#481):** advisory `breachSeverity="on"` returned null while `"True"` mapped to Warning; fixed with boolean synonym coercion (`Parse_breach_severity_on_synonym_maps_label`).

- [x] (proven) `RealLlmOutputStructuralValidator.TryParseBooleanString` — `on` agentType synonym ignored — **hit 2026-09-02 (#481):** `"agentType":"on"` failed structural validation while `"True"` accepted; fixed with boolean synonym coercion (`ValidateAgentResultStructure_accepts_on_synonym_agentType`).

- [x] (proven) `AzureExtractorPackageZipValidator.TryParseBooleanString` — `on` schemaVersion synonym ignored — **hit 2026-09-02 (#481):** `"schemaVersion":"on"` failed manifest validation while `"True"` accepted; fixed with boolean synonym coercion (`Validate_on_synonym_schemaVersion_succeeds`).

- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryParseBooleanString` — `on` citation-count synonym ignored — **hit 2026-09-02 (#482):** `"citations":"on"` left `CitationCount` null while `"true"` coerced to `1`; fixed with boolean synonym coercion (`FromAggregateJson_maps_string_encoded_on_citation_count`).

- [x] (proven) `FindingJsonConverter.TryParseBooleanString` — `on` finding-field synonym ignored — **hit 2026-09-02 (#482):** `severity:"on"` threw and `properties.enabled:"on"` stayed raw while `"True"` already coerced; fixed with boolean synonym coercion (`Deserialize_string_encoded_on_severity_maps_warning`, `Deserialize_properties_string_encoded_on_boolean_values_coerce_to_lowercase_strings`).

- [x] (proven) `CloudInventoryExtractorPackageZipValidator.TryParseBooleanString` — `on` schemaVersion synonym ignored — **hit 2026-09-02 (#482):** parity gap after #481 Azure fix; `"schemaVersion":"on"` failed manifest validation; fixed with boolean synonym coercion (`Validate_on_synonym_schemaVersion_succeeds`).

- [x] (proven) `AlertRoutingCriteriaMetadata.TryNormalizeBooleanString` — `on` routing severity synonym ignored — **hit 2026-09-02 (#483):** `severities:["on"]` stayed raw while `"True"` coerced to `"true"`; fixed with boolean synonym coercion (`AlertRoutingCriteriaMetadata_Parse_string_encoded_on_severities_coerce_to_lowercase_strings`).

- [x] (proven) `GraphJsonElementReaders.TryNormalizeBooleanString` — `on` graph property synonym ignored — **hit 2026-09-02 (#483):** `properties.enabled:"on"` stayed raw while `"True"` coerced; fixed with boolean synonym coercion (`ReadProperties_string_encoded_on_boolean_values_coerce_to_lowercase_strings`).

- [x] (proven) `GraphJsonElementReaders.ReadFirstDouble` — `on` numeric field synonym ignored — **hit 2026-09-02 (#483):** `weight:"on"` returned null while `"true"` coerced to `1.0`; fixed with boolean synonym coercion (`ReadFirstDouble_string_encoded_on_coerces_to_one`).

- [x] (proven) `IntegrationEventServiceBusCorrelationId.TryNormalizeBooleanString` — `on` correlation-id synonym ignored — **hit 2026-09-02 (#483):** `"correlationId":"on"` passed through raw while `"True"` normalized to `"true"`; fixed with boolean synonym coercion (`TryResolveForPublish_reads_string_encoded_on_correlationId_from_payload_when_activity_unset`).

- [x] (proven) `IntegrationEventServiceBusApplicationProperties.TryNormalizeBooleanString` — `on` deduplication-key synonym ignored — **hit 2026-09-02 (#483):** `"deduplicationKey":"on"` passed through raw while `"True"` normalized to `"true"`; fixed with boolean synonym coercion (`TryResolveForPublish_alert_resolved_maps_string_encoded_on_deduplication_key`).

- [x] (proven) `RunExplanationConfidenceCalloutBuilder.TryReadDouble` — `on` faithfulness-ratio synonym ignored — **hit 2026-09-02 (#483):** `"faithfulnessSupportRatio":"on"` returned null while `"false"` coerced to `0.0`; fixed with boolean synonym coercion (`FromAggregateJson_maps_string_encoded_on_faithfulness_support_ratio`).

- [x] (proven) `MarketplaceWebhookPayloadParser.TryNormalizeBooleanString` — `on` planId synonym ignored — **hit 2026-09-02 (#484):** `"planId":"on"` passed through raw while `"True"` normalized to `"true"`; fixed with boolean synonym coercion (`TryGetPlanId_reads_string_encoded_on_planId`).

- [x] (proven) `AzureExtractorResourceInventoryReader.TryNormalizeBooleanString` — `on` inventory name synonym ignored — **hit 2026-09-02 (#484):** `"name":"on"` passed through raw while `"True"` normalized to `"true"`; fixed with boolean synonym coercion (`TryReadFromZip_string_encoded_on_name_coerces_to_lowercase_string`).

- [x] (proven) `AwsEc2OfferIndexParser.TryGetLinuxOnDemandHourlyUsd` — numeric `pricePerUnit.USD` JSON tokens ignored (string round-trip only) — **hit 2026-09-02 (#486):** `"USD":0.0104` returned null while `"0.0104"` parsed; fixed with `TryReadUsdPrice` number coercion (`TryGetLinuxOnDemandHourlyUsd_parses_numeric_usd_price`).

- [x] (proven) `GcpCloudBillingCatalogClient.TryReadTieredRateUsd` — numeric `unitPrice.units` / `unitPrice.nanos` JSON tokens ignored (string round-trip only) — **hit 2026-09-02 (#487):** `"nanos":10400000` returned null while `"10400000"` parsed; fixed with `TryReadInt64Token` / `TryReadInt32Token` (`TryGetComputeEngineMonthlyUsdAsync_parses_numeric_unit_price_tokens`).

- [x] (proven) `GcpCloudBillingCatalogClient.TryReadInt32Token` / `TryReadInt64Token` — whole-number double `unitPrice.units` / `unitPrice.nanos` JSON tokens ignored — **hit 2026-09-02 (#488):** `"nanos":10400000.0` returned null while integer `10400000` parsed in #487; fixed with whole-number double coercion (`TryGetComputeEngineMonthlyUsdAsync_parses_whole_number_double_unit_price_tokens`).

- [x] (proven) `AwsEc2OfferIndexParser.TryReadUsdPrice` — boolean / string-encoded boolean `pricePerUnit.USD` JSON tokens ignored — **hit 2026-09-02 (#489):** `"USD":true` and `"USD":"true"` returned null while numeric/string price tokens already parsed in #486; fixed with boolean coercion and `TryGetDouble` fallback (`TryGetLinuxOnDemandHourlyUsd_parses_boolean_usd_price`, `TryGetLinuxOnDemandHourlyUsd_parses_string_encoded_boolean_usd_price`).

- [x] (proven) `AwsEc2OfferIndexParser` / `GcpCloudBillingCatalogClient` — whitespace-padded hourly `unit` / `usageUnit` strings rejected — **hit 2026-09-02 (#490):** `"unit":" Hrs "` and `"usageUnit":" h "` skipped hourly SKUs while unpadded tokens matched; fixed with trim-aware unit checks (`TryGetLinuxOnDemandHourlyUsd_parses_whitespace_padded_unit`, `TryGetComputeEngineMonthlyUsdAsync_parses_whitespace_padded_usage_unit`).
- [x] (proven) `GcpCloudBillingCatalogClient.TryReadInt32Token` / `TryReadInt64Token` — boolean `unitPrice.units` / `unitPrice.nanos` JSON tokens ignored — **hit 2026-09-02 (#490):** `"nanos":true` returned null after #487–#488 numeric fixes; fixed with boolean coercion on units/nanos readers (`TryGetComputeEngineMonthlyUsdAsync_parses_boolean_unit_price_tokens`).

2026-09-02 seed hunt #490: reseeded from ArchLucid.Core costing parsers; proved whitespace-padded unit matching and GCP boolean units/nanos coercion gaps after #489 AWS USD boolean fix.

- [x] (proven) `AwsEc2OfferIndexParser.TryReadAttribute` — whitespace-padded product attribute strings rejected — **hit 2026-09-02 (#491):** `"instanceType":" t3.micro "` failed to match `t3.micro` while unpadded attributes worked; fixed by trimming attribute values and USD price strings (`TryGetLinuxOnDemandHourlyUsd_parses_whitespace_padded_instance_type_attribute`, `TryGetLinuxOnDemandHourlyUsd_parses_whitespace_padded_usd_price_string`).

2026-09-02 seed hunt #491: reseeded from ArchLucid.Core costing parsers; proved AWS offer-index attribute trim gap after #490 unit/usageUnit trim fix.

- [x] (proven) `AwsEc2OfferIndexParser.TryReadHourlyUnit` / `GcpCloudBillingCatalogClient.IsHourlyUsageUnit` — boolean / string-encoded boolean hourly `unit` / `usageUnit` tokens rejected — **hit 2026-09-02 (#492):** `"unit":true` / `"usageUnit":true` and `"on"` synonyms skipped hourly SKUs while `"Hrs"` / `"h"` strings matched; fixed with boolean coercion and `TryParseBooleanString` fallback (`TryGetLinuxOnDemandHourlyUsd_parses_boolean_hourly_unit_token`, `TryGetLinuxOnDemandHourlyUsd_parses_string_encoded_on_synonym_hourly_unit`, `TryGetComputeEngineMonthlyUsdAsync_parses_boolean_hourly_usage_unit_token`, `TryGetComputeEngineMonthlyUsdAsync_parses_string_encoded_on_synonym_hourly_usage_unit`).

2026-09-02 seed hunt #492: reseeded from ArchLucid.Core costing parsers; proved AWS/GCP hourly unit boolean coercion gap after #491 attribute trim fix.

- [x] (proven) `AwsEc2OfferIndexParser` / `GcpCloudBillingCatalogClient` — case-sensitive `USD` / `usageUnit` JSON property lookup — **hit 2026-09-02 (#493):** PascalCase `"Usd"` and `"UsageUnit"` skipped hourly SKUs while canonical casing matched; fixed with case-insensitive property lookup (`TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_usd_price_property`, `TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_usage_unit_property`).

2026-09-02 seed hunt #493: reseeded from ArchLucid.Core costing parsers; proved case-sensitive price-unit property lookup after #492 boolean hourly unit fix.

- [x] (proven) `AwsEc2OfferIndexParser.TryReadAttribute` / `GcpCloudBillingCatalogClient` SKU description lookup — case-sensitive attribute and `description` JSON property names — **hit 2026-09-02 (#494):** PascalCase `"InstanceType"` and `"Description"` skipped matching SKUs while canonical casing worked; fixed with case-insensitive property lookup in `TryReadAttribute` and SKU description resolution (`TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_instance_type_attribute`, `TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_description_property`).

2026-09-02 seed hunt #494: reseeded from ArchLucid.Core costing parsers; proved case-sensitive attribute/description property lookup after #493 USD/usageUnit casing fix.

- [x] (proven) `AwsEc2OfferIndexParser` / `GcpCloudBillingCatalogClient.TryReadTieredRateUsd` — case-sensitive nested price JSON property names — **hit 2026-09-02 (#495):** PascalCase `"PricePerUnit"`, `"TieredRates"`, `"UnitPrice"`, `"Units"`, and `"Nanos"` skipped hourly SKUs while canonical casing matched; fixed with case-insensitive property lookup on nested price paths (`TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_price_per_unit_property`, `TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_tiered_rate_properties`).

2026-09-02 seed hunt #495: reseeded from ArchLucid.Core costing parsers; proved case-sensitive nested price property lookup after #494 attribute/description casing fix.

- [x] (proven) `AwsEc2OfferIndexParser` / `GcpCloudBillingCatalogClient` — case-sensitive `priceDimensions` / `pricingInfo` / `pricingExpression` JSON property names — **hit 2026-09-02 (#496):** PascalCase `"PriceDimensions"`, `"PricingInfo"`, and `"PricingExpression"` skipped hourly SKUs while canonical casing matched; fixed with case-insensitive property lookup (`TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_price_dimensions_property`, `TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_pricing_info_property`).

2026-09-02 seed hunt #496: reseeded from ArchLucid.Core costing parsers; proved case-sensitive priceDimensions/pricingInfo property lookup after #495 nested price casing fix.

- [x] (proven) `AwsEc2OfferIndexParser` / `GcpCloudBillingCatalogClient` — case-sensitive `attributes` / `skus` JSON property names — **hit 2026-09-02 (#498):** PascalCase `"Attributes"` and `"Skus"` skipped hourly SKUs while canonical casing matched; fixed with case-insensitive property lookup (`TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_attributes_property`, `TryGetComputeEngineMonthlyUsdAsync_parses_pascal_case_skus_root_property`).

2026-09-02 seed hunt #498: reseeded from ArchLucid.Core costing parsers; proved case-sensitive attributes/skus property lookup after #496 priceDimensions/pricingInfo casing fix.

- [x] (proven) `AwsEc2OfferIndexParser` — case-sensitive root `products` / `terms` / `OnDemand` JSON property names — **hit 2026-09-02 (#499):** PascalCase `"Products"` / `"Terms"` and lowercase `"ondemand"` skipped the entire offer index while canonical casing matched; fixed with case-insensitive root property lookup (`TryGetLinuxOnDemandHourlyUsd_parses_pascal_case_root_offer_properties`).

2026-09-02 seed hunt #499: reseeded from ArchLucid.Core costing parsers; proved case-sensitive root offer-index property lookup after #498 attributes/skus casing fix.

- [x] (proven) `GcpCloudBillingCatalogClient.TryReadTieredRateUsd` — omitted zero `units` property rejected nanos-only `unitPrice` — **hit 2026-09-02 (#500):** `"unitPrice": { "nanos": 10400000 }` returned null while explicit `"units": 0` parsed; fixed by defaulting missing units to zero (`TryGetComputeEngineMonthlyUsdAsync_parses_unit_price_with_omitted_zero_units`).

2026-09-02 seed hunt #500: reseeded from ArchLucid.Core costing parsers; proved GCP unitPrice omitted-zero-units gap after #499 AWS root casing fix.

- [x] (proven) `GcpCloudBillingCatalogClient.TryReadTieredRateUsd` — omitted zero `nanos` property rejected units-only `unitPrice` — **hit 2026-09-02 (#501):** `"unitPrice": { "units": 1 }` returned null while explicit `"nanos": 0` parsed after #500 units default; fixed by defaulting missing nanos to zero (`TryGetComputeEngineMonthlyUsdAsync_parses_unit_price_with_omitted_zero_nanos`).

2026-09-02 seed hunt #501: reseeded from ArchLucid.Core costing parsers; proved GCP unitPrice omitted-zero-nanos gap (symmetric to #500 omitted-zero-units fix).

- [x] (proven) `AwsEc2OfferIndexParser` — case-sensitive OnDemand product SKU key lookup — **hit 2026-09-02 (#502):** `products` key `"ABC"` with `OnDemand` key `"abc"` returned null while matching casing parsed; fixed with case-insensitive OnDemand product key lookup (`TryGetLinuxOnDemandHourlyUsd_parses_mismatched_on_demand_product_key_casing`).

2026-09-02 seed hunt #502: reseeded from ArchLucid.Core costing parsers; proved AWS OnDemand product-key casing gap after #501 GCP omitted-zero-nanos fix.

- [x] (proven) `GcpCloudBillingCatalogClient.IsHourlyUsageUnit` — `Hrs` hourly usage-unit synonym rejected — **hit 2026-09-02 (#503):** `"usageUnit": "Hrs"` returned null while `"h"` and boolean/`"on"` synonyms already parsed; fixed by accepting `Hrs` alongside `h` (`TryGetComputeEngineMonthlyUsdAsync_parses_hrs_synonym_hourly_usage_unit`).

2026-09-02 seed hunt #503: reseeded from ArchLucid.Core costing parsers; proved GCP Hrs hourly usage-unit synonym gap after #502 AWS OnDemand key casing fix.

- [x] (proven) `AwsEc2OfferIndexParser.TryReadHourlyUnit` — `h` hourly unit synonym rejected — **hit 2026-09-02 (#504):** `"unit": "h"` returned null while `"Hrs"` and boolean/`"on"` synonyms already parsed; fixed by accepting `h` alongside `Hrs` (`TryGetLinuxOnDemandHourlyUsd_parses_h_synonym_hourly_unit`).

2026-09-02 seed hunt #504: reseeded from ArchLucid.Core costing parsers; proved AWS h hourly unit synonym gap (symmetric to #503 GCP Hrs fix).

- [x] (proven) `GcpCloudBillingCatalogClient.TryFetchComputeHourlyUsdAsync` — only first `pricingInfo` entry consulted — **hit 2026-09-02 (#505):** SKU with non-hourly `pricingInfo[0]` (`usageUnit: "mo"`) and hourly `pricingInfo[1]` returned null instead of scanning later entries; fixed by iterating all `pricingInfo` rows (`TryGetComputeEngineMonthlyUsdAsync_uses_later_hourly_pricing_info_entry`).

2026-09-02 seed hunt #505: reseeded from ArchLucid.Core costing parsers; proved GCP pricingInfo first-entry-only scan gap after #504 AWS h unit synonym fix.

- [x] (proven) `GcpCloudBillingCatalogClient.TryReadTieredRateUsd` — only first `tieredRates` entry consulted — **hit 2026-09-02 (#506):** zero-price `tieredRates[0]` caused null while `tieredRates[1]` held the paid hourly rate; fixed by iterating all tier rows (`TryGetComputeEngineMonthlyUsdAsync_uses_later_paid_tiered_rate_entry`).

2026-09-02 seed hunt #506: reseeded from ArchLucid.Core costing parsers; proved GCP tieredRates first-entry-only scan gap after #505 pricingInfo iteration fix.

- [x] (proven) `AwsEc2OfferIndexParser.TryReadHourlyUnit` — `hour` / `hours` hourly unit synonyms rejected — **hit 2026-09-02 (#508):** `"unit": "hour"` returned null while `"h"` / `"Hrs"` / `"on"` synonyms already parsed; fixed by accepting `hour` and `hours` (`TryGetLinuxOnDemandHourlyUsd_parses_hour_synonym_hourly_unit`).

2026-09-02 seed hunt #508: reseeded from ArchLucid.Core costing parsers; proved AWS hour/hours hourly unit synonym gap after #506 GCP tieredRates iteration fix.

- [x] (proven) `GcpCloudBillingCatalogClient.IsHourlyUsageUnit` — `hour` / `hours` hourly usage-unit synonyms rejected — **hit 2026-09-02 (#509):** `"usageUnit": "hour"` returned null while `"h"` / `"Hrs"` synonyms already parsed after #503; fixed by accepting `hour` and `hours` (`TryGetComputeEngineMonthlyUsdAsync_parses_hour_synonym_hourly_usage_unit`).

2026-09-02 seed hunt #509: reseeded from ArchLucid.Core costing parsers; proved GCP hour/hours usage-unit synonym gap (symmetric to #508 AWS hour fix).

- [x] (proven) `AwsEc2OfferIndexParser.TryReadHourlyUnit` — `hr` hourly unit synonym rejected — **hit 2026-09-02 (#510):** `"unit": "hr"` returned null while `"h"` / `"Hrs"` / `"hour"` / `"hours"` synonyms already parsed after #508; fixed by accepting `hr` (`TryGetLinuxOnDemandHourlyUsd_parses_hr_synonym_hourly_unit`).

2026-09-02 seed hunt #510: reseeded from ArchLucid.Core costing parsers; proved AWS hr hourly unit synonym gap (symmetric to #508 hour/hours fix).

- [x] (proven) `GcpCloudBillingCatalogClient.IsHourlyUsageUnit` — `hr` hourly usage-unit synonym rejected — **hit 2026-09-02 (#512):** `"usageUnit": "hr"` returned null while `"h"` / `"Hrs"` / `"hour"` / `"hours"` synonyms already parsed after #509; fixed by accepting `hr` (`TryGetComputeEngineMonthlyUsdAsync_parses_hr_synonym_hourly_usage_unit`).

2026-09-02 seed hunt #512: reseeded from ArchLucid.Core costing parsers; proved GCP hr usage-unit synonym gap (symmetric to #510 AWS hr fix).

- [x] (proven) `AzureRetailPricesCatalogClient.IsHourMeter` — `1 Hr` hourly unit-of-measure synonym rejected — **hit 2026-09-02 (#513):** `"UnitOfMeasure": "1 Hr"` failed `LooksLikeConsumptionUsd` / `TryMonthlyUsdFromRow` while `"1 Hour"` and `"Hrs"` already matched; fixed by accepting ` hr` token and standalone `h` / `hr` synonyms (`AzureRetailPricesSkuMatchersTests.TryMonthlyUsdFromRow_accepts_hr_unit_of_measure_synonym`).

2026-09-02 seed hunt #513: reseeded from ArchLucid.Core Azure retail SKU matchers; proved Hr hourly UOM synonym gap after #512 GCP hr usage-unit fix.

- [x] (proven) `AzureRetailPricesCatalogClient.IsHourMeter` — `1 h` hourly unit-of-measure synonym rejected — **hit 2026-09-02 (#514):** `"UnitOfMeasure": "1 h"` failed `TryMonthlyUsdFromRow` while `"1 Hr"` and `"1 Hour"` already matched after #513; fixed by accepting ` h` token (`AzureRetailPricesSkuMatchersTests.TryMonthlyUsdFromRow_accepts_h_unit_of_measure_synonym`).

2026-09-02 seed hunt #514: reseeded from ArchLucid.Core Azure retail SKU matchers; proved h hourly UOM synonym gap (symmetric to #513 Hr fix).

- [x] (proven) `AzureRetailPricesCatalogClient.IsMonthlyMeter` — `1 Mo` monthly unit-of-measure synonym rejected — **hit 2026-09-02 (#515):** `"UnitOfMeasure": "1 Mo"` failed `TryMonthlyUsdFromRow` while `"1 Month"` already matched; fixed by accepting ` mo` token and standalone `mo` synonym (`AzureRetailPricesSkuMatchersTests.TryMonthlyUsdFromRow_accepts_mo_unit_of_measure_synonym`).

2026-09-02 seed hunt #515: reseeded from ArchLucid.Core Azure retail SKU matchers; proved Mo monthly UOM synonym gap (symmetric to #513–#514 hourly token fixes).

- [x] (proven) `AzureRetailPricesCatalogClient.IsMonthlyMeter` — `1/mo` monthly unit-of-measure synonym rejected — **hit 2026-09-02 (#516):** `"UnitOfMeasure": "1/mo"` failed `TryMonthlyUsdFromRow` while `"1 Month"` and `"1 Mo"` already matched after #515; fixed by accepting `/mo` token (`AzureRetailPricesSkuMatchersTests.TryMonthlyUsdFromRow_accepts_slash_mo_unit_of_measure_synonym`).

2026-09-02 seed hunt #516: reseeded from ArchLucid.Core Azure retail SKU matchers; proved slash-mo monthly UOM synonym gap (symmetric to #515 Mo fix).

- [x] (proven) `AzureRetailPricesCatalogClient.IsHourMeter` — `1/hr` hourly unit-of-measure synonym rejected — **hit 2026-09-02 (#517):** `"UnitOfMeasure": "1/hr"` failed `TryMonthlyUsdFromRow` while `"1 Hr"` and `"1 h"` already matched after #513–#514; fixed by accepting `/hr` token (`AzureRetailPricesSkuMatchersTests.TryMonthlyUsdFromRow_accepts_slash_hr_unit_of_measure_synonym`).

2026-09-02 seed hunt #517: reseeded from ArchLucid.Core Azure retail SKU matchers; proved slash-hr hourly UOM synonym gap (symmetric to #516 slash-mo fix).

- [x] (proven) `AzureRetailPricesCatalogClient.IsHourMeter` — `1/h` hourly unit-of-measure synonym rejected — **hit 2026-09-02 (#518):** `"UnitOfMeasure": "1/h"` failed `TryMonthlyUsdFromRow` while `"1/hr"` and `"1 h"` already matched after #514/#517; fixed by accepting `/h` token (`AzureRetailPricesSkuMatchersTests.TryMonthlyUsdFromRow_accepts_slash_h_unit_of_measure_synonym`).

2026-09-02 seed hunt #518: reseeded from ArchLucid.Core Azure retail SKU matchers; proved slash-h hourly UOM synonym gap (symmetric to #517 slash-hr fix).

- [x] (proven) `MarketplaceWebhookPayloadParser.TryReadQuantity` — quantity above `int.MaxValue` silently clamped to `2147483647` — **hit 2026-09-02 (#519):** `"quantity":2147483648` and `"quantity":5000000000` returned `true` with clamped seat count via unchecked `(int)` double cast; fixed with `numeric <= int.MaxValue` guard (`TryReadQuantity_rejects_quantity_above_int_max`, `ReadQuantity_uses_fallback_when_quantity_above_int_max`, `TryReadQuantity_rejects_string_encoded_quantity_above_int_max`).

2026-09-02 seed hunt #519: reseeded from ArchLucid.Core marketplace webhook parser; proved quantity overflow clamp gap beyond Azure UOM synonym sweep.

- [x] (proven) `MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId` — embedded `enterprise` substring false-positive — **hit 2026-09-02 (#521):** `NonEnterpriseStandard` mapped to `Enterprise` via bare `Contains("enterprise")`; fixed with delimiter-token matching (`TierStorageCodeFromPlanId_does_not_false_positive_on_non_enterprise_substring`, `TierStorageCodeFromPlanId_maps_delimited_enterprise_token`).

2026-09-02 seed hunt #521: reseeded from ArchLucid.Core marketplace billing parser; proved planId tier substring false-positive beyond quantity overflow fix.

- [x] (proven) `GcpCloudBillingCatalogClient.TryFetchComputeHourlyUsdAsync` — machine-type `Contains` prefix collision — **hit 2026-09-02 (#522):** catalog SKU `n1-standard-10` matched lookup for `n1-standard-1` and returned the higher hourly rate; fixed with boundary-aware `DescriptionMatchesMachineType` (`TryGetComputeEngineMonthlyUsdAsync_prefers_exact_machine_type_over_prefix_collision`).

2026-09-02 seed hunt #522: reseeded from ArchLucid.Core costing parsers; proved GCP billing catalog machine-type prefix collision beyond marketplace billing fixes.

- [x] (proven) `CommercialPackagingTierResolver.ResolveCommercialTierLabel` — non-`Active` subscription ignored purchased caps — **hit 2026-09-02 (#523):** canceled subscription with `WorkspacesPurchased=8` fell through to usage inference and returned `Team` instead of `Professional`; fixed by resolving purchased caps whenever a subscription row exists (`ResolveCommercialTierLabel_uses_purchased_caps_when_subscription_is_not_active`).

2026-09-02 seed hunt #523: reseeded from ArchLucid.Core billing packaging resolver; proved non-Active subscription purchased-cap drift beyond GCP costing prefix fix.

- [x] (proven) `AzureRetailPricesCatalogClient.RowMatchesCollapsed` — collapsed SKU `StartsWith`/`Contains` prefix collision — **hit 2026-09-02 (#525):** `Standard_D4` matched retail row `Standard_D48s_v5` after underscore collapse (`StandardD4` prefix of `StandardD48sv5`) and picked the wrong Azure retail price; fixed with boundary-aware `HasCollapsedSkuPrefix` / `CollapsedSkuContains` (`RowMatchesSku_rejects_d4_series_prefix_collision_against_d48`).

2026-09-02 seed hunt #525: reseeded from ArchLucid.Core Azure retail SKU matchers; proved collapsed SKU prefix collision (parity with GCP #522 machine-type fix).

- [x] (proven) `MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId` — slash/colon-delimited `enterprise` token not recognized — **hit 2026-09-02 (#526):** `contoso/enterprise/monthly` and `contoso:enterprise:annual` returned `Standard` because `IsPlanIdDelimiter` omitted `/` and `:` after #521 delimiter-token fix; fixed by extending delimiters (`TierStorageCodeFromPlanId_maps_slash_or_colon_delimited_enterprise_token`).

2026-09-02 seed hunt #526: reseeded from ArchLucid.Core marketplace webhook parser; proved slash/colon planId enterprise token gap beyond #521 delimiter fix.

- [x] (proven) `AwsEc2OfferIndexParser.TryReadAttribute` — numeric product attribute JSON tokens ignored — **hit 2026-09-02 (#528):** `"instanceType":12345` returned null for lookup `"12345"` while string attributes already parsed after #491 trim fix; fixed with whole-number coercion (`TryGetLinuxOnDemandHourlyUsd_parses_numeric_instance_type_attribute`).

2026-09-02 seed hunt #528: reseeded from ArchLucid.Core AWS offer-index parser; proved numeric attribute token coercion gap beyond #491 whitespace trim fix.

- [x] (proven) `AzureRetailPricesCatalogClient.HasCollapsedSkuBoundary` — letter-variant SKU suffix prefix collision — **hit 2026-09-02 (#529):** `Standard_D4` matched retail row `Standard_D4s_v5` after #525 digit-boundary fix because `s` suffix after size digit `4` was still accepted (`StandardD4` prefix of `StandardD4sv5`); fixed by rejecting letter suffixes immediately following a digit (`RowMatchesSku_rejects_letter_suffix_series_collision`).

2026-09-02 seed hunt #529: reseeded from ArchLucid.Core Azure retail SKU matchers; proved letter-suffix prefix collision beyond #525 digit-boundary fix.

- [x] (proven) `GcpCloudBillingCatalogClient.DescriptionMatchesMachineType` — letter-variant machine-type suffix prefix collision — **hit 2026-09-02 (#531):** lookup `n1-standard-1` matched catalog SKU `n1-standard-1d` after #522 digit-boundary fix because trailing `d` was not rejected; fixed by rejecting letter suffixes immediately following a digit (`TryGetComputeEngineMonthlyUsdAsync_rejects_letter_suffix_machine_type_collision`).

2026-09-02 seed hunt #531: reseeded from ArchLucid.Core GCP billing catalog; proved letter-suffix machine-type collision (parity with Azure #529).

- [x] (proven) `GcpCloudBillingCatalogClient.DescriptionMatchesMachineType` — letter-variant machine-type prefix collision — **hit 2026-09-02 (#537):** lookup `e2-micro` matched catalog SKU `ve2-micro` after #531 suffix-boundary fix because leading `v` was not rejected; fixed by rejecting letter prefixes immediately before the match (`TryGetComputeEngineMonthlyUsdAsync_rejects_letter_prefix_machine_type_collision`).

2026-09-02 seed hunt #537: reseeded from ArchLucid.Core GCP billing catalog; proved letter-prefix machine-type collision (parity with #531 suffix fix).

- [x] (proven) `AzureRetailPricesCatalogClient.HasCollapsedSkuBoundary` — letter-variant SKU prefix collision — **hit 2026-09-03 (#539):** `E2s_v5` matched retail row `Standard_VE2s_v5` after #529 suffix-boundary fix because uppercase series letter `V` before `E2` was not rejected (GCP #537 parity gap); fixed by rejecting uppercase letter prefixes immediately before the match (`RowMatchesSku_rejects_letter_prefix_series_collision_against_ve_family`, `RowMatchesSku_accepts_standard_e_series_when_hint_omits_standard_prefix`).
- [x] (proven) `AzureRetailPricesCatalogClient.IsHourMeter` — ` h` substring false-positive on `1 horsepower` — **hit 2026-09-03 (#539):** bare `Contains(" h")` matched non-hourly `1 horsepower` after #514 hourly synonym fix; fixed with boundary-aware `ContainsBoundedToken` (`LooksLikeConsumptionUsd_rejects_horsepower_unit_of_measure_false_positive`).
- [x] (proven) `AzureRetailPricesCatalogClient.IsMonthlyMeter` — ` mo` substring false-positive on `1 moment` — **hit 2026-09-03 (#539):** bare `Contains(" mo")` matched non-monthly `1 moment` after #515 monthly synonym fix; fixed with boundary-aware `ContainsBoundedToken` (`LooksLikeConsumptionUsd_rejects_moment_unit_of_measure_false_positive`).

2026-09-03 seed hunt #539: reseeded from ArchLucid.Core Azure retail SKU matchers; proved letter-prefix SKU collision (GCP #537 parity) and hourly/monthly UOM substring false-positives beyond #533 `/h` boundary fix.

- [x] (proven) `AzureRetailPricesCatalogClient.IsMonthlyMeter` — `/mo` substring false-positive on `1/moment` — **hit 2026-09-03 (#586):** bare `Contains("/mo")` matched non-monthly `1/moment` after #539 ` mo` bounded-token fix (parity gap with #533 `/h` → `ContainsSlashHourToken`); fixed with boundary-aware `ContainsSlashMonthToken` (`LooksLikeConsumptionUsd_rejects_moment_slash_mo_unit_of_measure_false_positive`, `TryMonthlyUsdFromRow_rejects_moment_slash_mo_unit_of_measure_false_positive`).

2026-09-03 seed hunt #586: reseeded from ArchLucid.Core Azure retail SKU matchers; proved `/mo` UOM substring false-positive beyond #539 bounded ` mo` token fix.

- [x] (proven) `AzureRetailPricesCatalogClient.IsHourMeter` — `Hour` and `/hr` substring false-positives on `1 Hourglass` / `1/hrocket` — **hit 2026-09-03 (#588):** bare `Contains("Hour")` matched `Hourglass` and bare `Contains("/hr")` matched `/hrocket` after #533/#586 slash-token boundary fixes; fixed with `ContainsHourWordToken` (` hour` / ` hours`) and `ContainsSlashHrToken` (`LooksLikeConsumptionUsd_rejects_hourglass_hour_word_false_positive`, `LooksLikeConsumptionUsd_rejects_hrocket_slash_hr_unit_of_measure_false_positive`, `TryMonthlyUsdFromRow_accepts_hours_unit_of_measure_synonym`).

2026-09-03 seed hunt #588: reseeded from ArchLucid.Core Azure retail SKU matchers; proved `Hour` and `/hr` UOM substring false-positives beyond #586 `/mo` boundary fix.

- [x] (proven) `MarketplaceWebhookPayloadParser.TierStorageCodeFromPlanId` — backslash/pipe-delimited `enterprise` token not recognized — **hit 2026-09-02 (#532):** `contoso\enterprise\monthly` and `contoso|enterprise|annual` returned `Standard` because `IsPlanIdDelimiter` omitted `\` and `|` after #526 slash/colon fix; fixed by extending delimiters (`TierStorageCodeFromPlanId_maps_backslash_or_pipe_delimited_enterprise_token`).

2026-09-02 seed hunt #532: reseeded from ArchLucid.Core marketplace webhook parser; proved backslash/pipe planId enterprise token gap beyond #526 delimiter fix.

- [x] (proven) `AzureRetailPricesCatalogClient.IsHourMeter` — `/h` substring false-positive on `1/health` — **hit 2026-09-02 (#533):** bare `Contains("/h")` matched non-hourly `1/health` unit-of-measure and treated the row as hourly consumption after #518 `/h` synonym fix; fixed with boundary-aware `ContainsSlashHourToken` (`LooksLikeConsumptionUsd_rejects_health_unit_of_measure_false_positive`, `TryMonthlyUsdFromRow_rejects_health_unit_of_measure_false_positive`).

2026-09-02 seed hunt #533: reseeded from ArchLucid.Core Azure retail SKU matchers; proved `/h` UOM substring false-positive beyond hourly synonym sweep.

2026-09-02 seed hunt #487: reseeded from ArchLucid.Core costing parsers; proved GCP billing catalog numeric units/nanos coercion gap (parity with #486 AwsEc2 USD fix).

2026-09-02 seed hunt #486: reseeded from ArchLucid.Core costing parsers after boolean-synonym sweep; proved AwsEc2 offer-index numeric USD price coercion gap.

2026-09-02 seed hunt #485: reseeded from ArchLucid.Core after boolean-synonym sweep closure; cheap-disproof found whitespace-padded enum labels and DecisionConfidenceSource boolean parity already correct (valid-no-repro); added breach-severity off synonym regression coverage.

2026-09-02 seed hunt #484: reseeded from ArchLucid.Core; proved final TryNormalizeBooleanString on/off gaps in marketplace webhook planId and Azure inventory name readers.

2026-09-02 seed hunt #483: reseeded from ArchLucid.Core; proved routing metadata, graph readers, Service Bus property normalization, and faithfulness-ratio on/off boolean synonym gaps.

2026-09-02 seed hunt #482: reseeded from ArchLucid.Core; proved citation-count, finding JSON, and cloud-inventory extractor on/off boolean synonym gaps.

2026-09-02 seed hunt #481: reseeded from ArchLucid.Core; proved execution-profile, risk-register, breach-severity, golden-corpus agentType, and extractor schemaVersion on/off boolean synonym gaps.

2026-09-02 seed hunt #480: reseeded from ArchLucid.Core; proved enforcement-tier, priority-floor, run-status, and marketplace quantity on/off boolean synonym gaps.

2026-09-02 seed hunt #479: reseeded from ArchLucid.Core; proved production-like quality-gate off/no/on boolean synonym coercion gap.

2026-09-02 seed hunt #478: reseeded from ArchLucid.Core; proved require-budget-cap enabled/disabled and explanation fallback on/off boolean synonym gaps.

2026-09-02 seed hunt #477: reseeded from ArchLucid.Core; proved policy-pack require-budget-cap on/off synonym gap; added FilterRules whole-number rule-priority regression coverage.

2026-09-02 seed hunt #476: reseeded from ArchLucid.Core; proved policy-pack expectation facet explicit false opt-out reported empty.

2026-09-02 seed hunt #475: reseeded from ArchLucid.Core; proved policy-pack priority floor string whole-number coercion gap.

2026-09-02 seed hunt #474: reseeded from ArchLucid.Core; proved policy-pack breach severity stores non-parseable coerced labels for downstream cost override reader.

2026-09-02 seed hunt #473: reseeded from ArchLucid.Core; proved production-like quality-gate string boolean ordinal coercion gap; added regression coverage for enforcement-tier false override and execution-profile economy boolean ordinal.

2026-09-02 seed hunt #472: reseeded from ArchLucid.Core; proved enforcement-tier, execution-profile, policy-pack breach severity, and run-status string boolean ordinal coercion gaps.

2026-09-02 seed hunt #471: reseeded from ArchLucid.Core; proved run-status legacy string whole-number and risk-register boolean review-status coercion gaps.

2026-09-02 seed hunt #470: reseeded from ArchLucid.Core; proved enforcement-tier, confidence-source, execution-profile, and webhook timestamp string whole-number coercion gaps.

2026-09-02 seed hunt #469: reseeded from ArchLucid.Core; proved risk-register human-review and production-like quality-gate string whole-number coercion gaps.

2026-09-02 seed hunt #468: reseeded from ArchLucid.Core; proved policy-pack advisory string whole-number coercion gaps.

2026-09-02 seed hunt #467: reseeded from ArchLucid.Core; proved explanation faithfulnessWarning whole-number double coercion gaps.

2026-09-02 seed hunt #466: reseeded from ArchLucid.Core; proved golden-corpus boolean agentType coercion gaps.

2026-09-02 seed hunt #465: reseeded from ArchLucid.Core; proved graph/azure/marketplace/alert-routing whole-number double JSON token coercion gaps.

2026-09-02 seed hunt #464: reseeded from ArchLucid.Core; proved graph/azure/marketplace/explanation string whole-number and boolean case coercion gaps.

2026-09-02 seed hunt #463: reseeded from ArchLucid.Core; proved integration/alert-routing string-encoded boolean case normalization gaps.

2026-09-02 seed hunt #462: reseeded from ArchLucid.Core; proved graph/azure/marketplace string-encoded boolean case normalization gaps.

2026-09-02 seed hunt #461: reseeded from ArchLucid.Core; proved finding string-encoded boolean scalar/list/properties normalization gaps.

2026-09-02 seed hunt #460: reseeded from ArchLucid.Core; proved finding string whole-number scalar and properties-bag coercion gaps.

2026-09-02 seed hunt #459: reseeded from ArchLucid.Core; proved finding enum boolean coercion gaps and golden-corpus string whole-number agentType parameter parity.

2026-09-02 seed hunt #458: reseeded from ArchLucid.Core; proved Service Bus publish string-encoded whole-number correlation, deduplication, and severity normalization gaps.

2026-09-02 seed hunt #457: reseeded from ArchLucid.Core; proved explanation string whole-number deterministic fallback and golden-corpus string-encoded agentType ordinal gaps.

2026-09-02 seed hunt #456: reseeded from ArchLucid.Core; proved explanation aggregate string/boolean citation coercion and extractor string boolean schemaVersion gaps.

2026-09-02 seed hunt #455: reseeded from ArchLucid.Core; proved string-encoded boolean quantity, graph edge weight, and finding confidence score coercion gaps.

2026-09-02 seed hunt #454: reseeded from ArchLucid.Core; proved marketplace boolean quantity fallback leak, graph edge boolean weight, and extractor boolean schemaVersion gaps.

2026-09-02 seed hunt #453: reseeded from ArchLucid.Core; proved finding boolean confidence score coercion and Azure extractor boolean sku gaps.

2026-09-02 seed hunt #452: reseeded from ArchLucid.Core; proved finding string-encoded whole-number severity and Azure extractor boolean resource field coercion gaps.

2026-09-02 seed hunt #450: reseeded from ArchLucid.Core; proved marketplace quantity whole-number coercion, finding boolean runIdRef, extractor string schemaVersion, and enum string-encoded ordinal gaps.

2026-09-02 seed hunt #449: reseeded from ArchLucid.Core; proved explanation aggregate boolean/whole-number coercion, extractor schemaVersion whole-number doubles, and finding string-encoded whole-number schema gaps.

2026-09-02 seed hunt #448: reseeded from ArchLucid.Core; proved golden-corpus whole-number double agentType and finding whole-number double enum/scalar coercion gaps.

2026-09-02 seed hunt #447: reseeded from ArchLucid.Core; proved Service Bus whole-number double token gaps and finding whole-number double severity/relatedNodeIds coercion gaps.

2026-09-02 seed hunt #446: reseeded from ArchLucid.Core; proved alert routing whole-number double severity ordinals and golden-corpus boolean trace source id gaps.

2026-09-02 seed hunt #445: reseeded from ArchLucid.Core; proved alert routing string-encoded whole-number severity ordinals and Service Bus boolean correlation id gaps.

2026-09-02 seed hunt #444: reseeded from ArchLucid.Core; proved alert routing boolean severity coercion and Service Bus boolean deduplication key gaps.

2026-09-02 seed hunt #443: reseeded from ArchLucid.Core; proved golden-corpus boolean finding severity and alert routing boolean tag coercion gaps.

2026-09-02 seed hunt #442: reseeded from ArchLucid.Core; proved graph node boolean id coercion and explanation aggregate string-encoded whole-number citation count gaps.

2026-09-02 seed hunt #441: reseeded from ArchLucid.Core; proved graph properties null coercion and explanation aggregate whole-number citation count gaps.

2026-09-02 seed hunt #440: reseeded from ArchLucid.Core; proved graph properties boolean coercion and explanation aggregate boolean faithfulness warning gaps.

2026-09-02 seed hunt #439: reseeded from ArchLucid.Core; proved explanation aggregate numeric fallback flag, numeric faithfulness warning, and string-encoded citation count gaps.

2026-09-02 seed hunt #438: reseeded from ArchLucid.Core; proved golden-corpus numeric finding content and explanation aggregate numeric citation count gaps.

2026-09-02 seed hunt #437: reseeded from ArchLucid.Core; proved golden-corpus numeric finding severity and trace id validation gaps.

2026-09-02 seed hunt #436: reseeded from ArchLucid.Core; proved finding numeric category/payloadType coercion and string-encoded unix reviewedAtUtc gaps.

2026-09-02 seed hunt #435: reseeded from ArchLucid.Core; proved graph properties numeric coercion and finding unix reviewedAtUtc gaps.

2026-09-02 seed hunt #434: reseeded from ArchLucid.Core; proved graph node numeric id coercion, alert routing numeric findingTypes, and Azure extractor numeric sku name gaps.

2026-09-02 seed hunt #433: reseeded from ArchLucid.Core; proved alert routing string-encoded severity ordinals and Azure extractor numeric resource name coercion gaps.

2026-09-02 seed hunt #432: reseeded from ArchLucid.Core; proved finding string-encoded findingSchemaVersion and extractor manifest string schemaVersion gaps.

2026-09-02 seed hunt #431: reseeded from ArchLucid.Core; proved finding string-encoded numeric scalars and extractor manifest PascalCase schemaVersion gaps.

2026-09-02 seed hunt #422 (hit): promoted required-scalar PascalCase gap after #417/#419 sibling fixes; proved with failing repro.

2026-09-02 thorough hunt #418 (hit): proved numeric severity ordinals in routing metadata dropped and fail-opened matcher filters.

2026-09-01 seed hunt #417 (hit): reseeded from ArchLucid.Core; proved PascalCase severity/scalar gaps, numeric relatedNodeIds coercion, legacy webhook alias MapToCanonical wiring, and numeric marketplace planId; seeded alert-routing numeric severity ordinal candidate.

2026-08-31 thorough hunt #311 (dry): cheap-disproved stale picker candidates — all three #279 rows already on master via PR #900; regression tests pass; no failing repro.

2026-08-31 thorough hunt #279: proved remaining FindingJsonConverter PascalCase scalar gaps, numeric optional-string coercion, and quality-gate undefined ordinal lint suppression.

2026-08-28 seed hunt #225: proved policy-pack breach-severity undefined ordinal and finding properties-bag numeric token handling; seeded quality-gate undefined-mode sibling candidate.

2026-08-28 seed hunt #223: proved top-level finding enum-string guards, classifier property-tier guard, Service Bus correlation casing/number, numeric dedupe key, and agent profile display label; seeded properties-bag numeric and policy-pack severity sibling candidates.

2026-08-28 seed hunt #251: proved PascalCase `findingSchemaVersion`, list/properties/treatment/payload/trace lookup gaps promoted from prior seed rows; seeded remaining scalar PascalCase and numeric optional-string coercion candidates.

2026-08-29 seed hunt #262: proved faithfulness aggregate PascalCase and golden-corpus AgentResult structural PascalCase; seeded FindingJsonConverter top-level PascalCase candidate.

---

## Zone: archlucid-contracts

- **id:** archlucid-contracts
- **status:** open
- **impact:** low
- **aliases:** API contracts; DTO serialization; OpenAPI models
- **paths:** ArchLucid.Contracts/
- **test-filter:** FullyQualifiedName~Contracts
- **hunts:** 16
- **bugs-found:** 26
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — architecture finding numeric sourceAgent ordinal ignored
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (valid-no-repro) JSON round-trip drops a required field on a versioned request DTO — `KeyContractsJsonRoundTripTests` and `JsonRoundTripPropertyTests` cover core request/run DTO shapes.
- [x] (proven) Enum serialization accepts an out-of-range value as the default variant — **hit 2026-08-19:** `ServiceType`, `DatastoreType`, `RuntimePlatform`, and `RelationshipType` JSON converters cast numeric ordinals without `Enum.IsDefined`; fixed on master in `47e7613370` (same pattern as `AgentType` in `4d4340387c`).
- [x] (invalid) Contract change breaks backward compatibility without a version bump signal — versioning is policy/process, not a deserialization defect in these converters.
- [x] (proven) `FindingSeverity` numeric ordinals bypass validation in eval-corpus and architecture-finding converters — `EvalCorpusFindingSeverityJsonConverter` and `ArchitectureFindingJsonConverter.ReadSeverity` cast out-of-range integers; fixed with `Enum.IsDefined` + regression tests.
- [x] (proven) Case-variant unknown sentinel bypasses structured-brief readiness — **hit 2026-08-21:** `IsUnknownConfirmSentinel` used ordinal string equality so `"unknown — confirm before review"` counted as a confirmed quality-attribute chip and could unblock review start under TB-2343.
- [x] (proven) Hyphen/en-dash unknown sentinel variants bypass structured-brief readiness — **hit 2026-08-23:** `IsUnknownConfirmSentinel` compared only case-normalized text, so `"Unknown - confirm before review"` (ASCII hyphen) and en-dash variants counted as confirmed brief entries and could satisfy `QualityAttributeMeetsMinimum`; fixed by normalizing dash glyphs before comparison.
- [x] (proven) `CloudProvider`, `ArchitectureRunStatus`, and `AgentTaskStatus` accept out-of-range integer ordinals via global `JsonStringEnumConverter` — **hit 2026-08-24:** `cloudProvider: 99` and similar status ordinals deserialized without `Enum.IsDefined`; fixed with dedicated converters and `[JsonConverter]` on each enum (`CloudProviderJsonConverterTests`, `ArchitectureRunStatusJsonConverterTests`, `AgentTaskStatusJsonConverterTests`).
- [x] (proven) `AgentResultClaimListJsonConverter` drops PascalCase structured claims — **hit 2026-08-24:** `TryGetProperty` is case-sensitive so `{"Detail":"..."}` yielded empty claims; fixed with case-insensitive property lookup (`ContractsPackageCoverageBatchRc28cTests`).
- [x] (proven) `ArchitectureFindingJsonConverter.ReadSeverity` downgrades unknown severity strings to `Info` — **hit 2026-08-24:** labels like `"blocker"` silently became `Info` while `EvalCorpusFindingSeverityJsonConverter` throws; fixed to throw on unknown labels (`ArchitectureFindingJsonConverterTests`).
- [x] (proven) CLI agent-result bridge maps one-based contract `AgentType` ordinals onto zero-based generated ordinals — **hit 2026-08-24:** `AgentType.Topology` (`1`) became generated `Cost` (`1`) and emitted `"agentType":"Cost"`; fixed by bridging generated agent results by enum name (`SubmitAgentResultAsync_writes_contract_agent_type_name`).
- [x] (proven) Global API enum conversion still permits out-of-range numeric `StructuralExecutionMode`, `FindingEnforcementTier`, `FindingHumanReviewStatus`, and `FindingTreatment`; unlike protected sibling enums, these types have no defined-value converter, so ordinal `99` may reach downstream switches — **hit 2026-08-25:** ordinal `99` deserialized silently via global `JsonStringEnumConverter`; fixed with dedicated converters and `Enum.IsDefined` guards (`StructuralExecutionModeJsonConverterTests`, `FindingEnforcementTierJsonConverterTests`, `FindingHumanReviewStatusJsonConverterTests`, `FindingTreatmentJsonConverterTests`).
- [x] (proven) `AgentResultClaimListJsonConverter` flattens structured claim text but ignores an entry-level `evidenceRefs` array, so `{"detail":"Subnet missing","evidenceRefs":["pol-123"]}` loses its evidence linkage — **hit 2026-08-25:** structured claim objects dropped claim-level refs at parse time; fixed with `AgentResultJsonConverter.MergeClaimEvidenceRefs`; regression in `Deserialize_merges_structured_claim_evidence_refs_into_result_evidence_refs`.
- [x] (invalid) `FindingJsonConverter` reads `humanReviewStatus` only when the token is a string; persisted JSON with numeric `1` leaves the default `NotRequired`, silently downgrading pending review state on round trip — locus is `ArchLucid.Core/Findings/Serialization/FindingJsonConverter.cs`, outside zone `paths` (`ArchLucid.Contracts/` only).
- [x] (proven) `ArchitectureFindingJsonConverter.Read` required `enforcementTier` to be a JSON string, so numeric `1` (Advisory) stayed default `PolicyViolation` and `99` was accepted silently — **hit 2026-08-25:** sibling `FindingEnforcementTierJsonConverter` already guards ordinals; the finding converter bypassed it; fixed with `TryReadEnforcementTier` (`Deserialize_numeric_enforcement_tier_maps_advisory_ordinal`, `Deserialize_integer_enforcement_tier_out_of_range_throws`).
- [x] (proven) `ArchitectureFindingJsonConverter.Read` uses case-sensitive `JsonDocument.TryGetProperty("enforcementTier")` while `AgentResultParser` sets `PropertyNameCaseInsensitive = true` — PascalCase `"EnforcementTier":"Advisory"` never matches and stays `PolicyViolation` — **hit 2026-08-26:** fixed with `TryGetPropertyIgnoreCase` (`Deserialize_pascal_case_enforcement_tier_maps_advisory`).
- [x] (proven) `ArchitectureFindingJsonConverter` evidenceRefs loop keeps only `JsonValueKind.String` items, so `{"evidenceRefs":[{"id":"pol-123"}]}` yields an empty list while eval-corpus payloads use object refs — **hit 2026-08-26:** fixed with `ReadEvidenceRef` extracting `id` from object entries (`Deserialize_object_evidence_refs_extracts_id_property`).
- [x] (invalid) `RequestStatus` has no defined-value `[JsonConverter]` unlike sibling `ArchitectureRunStatusJsonConverter`, so numeric `99` can deserialize through `ContractJson.Default` / `JsonStringEnumConverter` and reach request-lifecycle switches — enum is forward-looking vocabulary only (`docs/library/STATE_MACHINES.md` §1); no DTO or persistence column references `RequestStatus`, so no JSON deserialization path exists in zone `paths`.
- [x] (proven) `AgentResultJsonConverter.MergeClaimEvidenceRefs` — object-shaped claim `evidenceRefs` (`{"id":"pol-123"}`) dropped at parse while finding-level `ReadEvidenceRef` already extracts `id` — **hit 2026-08-31 (#332):** loop accepted only `JsonValueKind.String`; fixed with shared `ReadEvidenceRef` object `id` extraction; regression in `AgentResultClaimListJsonConverterEvidenceRefsTests.Deserialize_merges_object_shaped_claim_evidence_refs_into_result_evidence_refs`.
- [x] (proven) `ArchitectureFindingJsonConverter.ReadInsightDensityFields` ignored numeric `treatment` / `classification` ordinals — **hit 2026-09-02 (#426):** string-only `Enum.TryParse` while `enforcementTier` accepted ordinals; fixed with `TryReadFindingTreatment` / `TryReadFindingClassification`; regression in `Deserialize_numeric_treatment_maps_promote_ordinal` and `Deserialize_integer_treatment_out_of_range_throws`.
- [x] (proven) `ArchitectureFindingJsonConverter.ReadInsightDensityFields` ignored PascalCase `Severity` / `Treatment` / `Classification` — **hit 2026-09-02 (#426):** case-sensitive `TryGetProperty` while `enforcementTier` used `TryGetPropertyIgnoreCase`; fixed with ignore-case lookup for severity/treatment/classification; regression in `Deserialize_pascal_case_treatment_maps_promote`.
- [x] (proven) `FindingConfidenceLevel` accepted out-of-range integer ordinals via global `JsonStringEnumConverter` — **hit 2026-09-02 (#426):** ordinal `99` deserialized silently; fixed with `FindingConfidenceLevelJsonConverter` + `Enum.IsDefined`; regression in `FindingConfidenceLevelJsonConverterTests.Deserialize_integer_out_of_range_throws`.
- [x] (proven) `ArchitectureDraftStructuredBrief.ParseQualityAttributeEntries` treated comma-delimited unknown sentinel as one confirmed chip — **hit 2026-09-02 (#426):** `"defense in depth, Unknown - confirm before review"` satisfied minimum because chips split only on `;`; fixed by splitting on `,` and requiring every chip to be confirmed; regression in `QualityAttributeMeetsMinimum_rejects_comma_delimited_unknown_sentinel_chip`.
- [x] (proven) `ArchitectureFindingJsonConverter.ReadSeverity` still downgraded unknown labels to `Info` in default switch arm — **hit 2026-09-02 (#426):** regression against 2026-08-24 fix; `_ => FindingSeverity.Info` restored silent downgrade for labels like `"blocker"`; fixed to throw like `EvalCorpusFindingSeverityJsonConverter`.

2026-09-02 thorough hunt #426: proved treatment/classification ordinal + PascalCase parity, confidence-level ordinal guard, comma-delimited unknown quality-attribute chip, and severity unknown-label regression.

- [x] (proven) `RelationshipTypeJsonConverter.Read` — unknown LLM alias labels (`"feeds into"`) silently downgraded to `RelationshipType.Calls` via default switch arm — **hit 2026-09-03 (#542):** throw `JsonException` on unknown labels (severity parity); regression in `RelationshipTypeJsonConverterTests.Read_unknown_relationship_label_throws`.
- [x] (proven) `ArchitectureFindingJsonConverter.ReadMessage` — PascalCase `Description` / `Message` / `Title` / `Detail` ignored while `severity`/`treatment`/`classification` already used `TryGetPropertyIgnoreCase` — **hit 2026-09-03 (#542):** case-insensitive lookup for message aliases and `recommendation`; regression in `ArchitectureFindingJsonConverterTests.Deserialize_pascal_case_description_maps_message`.

2026-09-03 seed hunt #542: proved relationship-type unknown-alias downgrade and architecture-finding PascalCase message alias gap.

- [x] (proven) `ArchitectureFindingJsonConverter.Read` — PascalCase `Category` / `EvidenceRefs` / `FindingId` / `PolicyRuleId` / insight-density scalars ignored while `severity`/`treatment`/`classification` already used `TryGetPropertyIgnoreCase` — **hit 2026-09-04 (#663):** case-sensitive `TryGetProperty` left category empty and evidence refs dropped on PascalCase LLM payloads; fixed with ignore-case lookup for remaining scalar/array fields; regressions in `Deserialize_pascal_case_description_maps_message` and `Deserialize_pascal_case_evidence_refs_extracts_id_property`.
- [x] (proven) `AgentResultJsonConverter.MergeClaimEvidenceRefs` — PascalCase `Claims` skipped structured claim `evidenceRefs` merge — **hit 2026-09-04 (#663):** case-sensitive `TryGetProperty("claims")` while payload deserialize is case-insensitive; fixed with `TryGetPropertyIgnoreCase`; regression in `Deserialize_merges_structured_claim_evidence_refs_when_claims_property_is_pascal_case`.
- [x] (invalid) `ServiceTypeJsonConverter` / `RuntimePlatformJsonConverter` / `DatastoreTypeJsonConverter` — unknown LLM alias labels silently map to `Unknown` while `RelationshipTypeJsonConverter` throws on unknown labels — **invalid 2026-09-04 (#761):** `ServiceType`/`RuntimePlatform`/`DatastoreType` expose first-class `Unknown` and RC28f tests document blank/unknown → `Unknown` by design; `RelationshipType` has no `Unknown` variant so throw-on-unknown is correct.
- [x] (proven) `RelationshipTypeJsonConverter.Read` — whitespace relationship label returns default `Calls` instead of throwing like unknown labels — **hit 2026-09-04 (#761):** `""` and `"   "` silently became `Calls` after #542 strictness for unknown aliases; fixed to throw `JsonException`; regression in `RelationshipTypeJsonConverterTests.Read_whitespace_relationship_label_throws`.

2026-09-04 thorough hunt #761: cheap-disproved service/runtime/datastore unknown→`Unknown` parity candidate; proved RelationshipType whitespace silent `Calls` downgrade.

- [x] (proven) `ArchitectureFindingJsonConverter.Read` — numeric `sourceAgent` ordinal ignored while `enforcementTier`/`severity`/`treatment` accept defined ordinals — **hit 2026-09-05 (#796):** `"sourceAgent": 2` left `SourceAgent` at invalid default `0` instead of `AgentType.Cost`; fixed with `TryReadSourceAgent` + `Enum.IsDefined`; regressions in `Deserialize_numeric_source_agent_maps_cost_ordinal` and `Deserialize_integer_source_agent_out_of_range_throws`; updated wave-21 test fixtures to include required `enforcementTier`.
- [ ] (candidate) `ArchitectureFindingJsonConverter.ReadSeverity` — whitespace-only severity string silently maps to `Info` instead of throwing like unknown labels — may be intentional empty-severity default for partial LLM payloads; needs cheap-disproof against eval-corpus strictness.

2026-09-05 seed hunt #796 (hit): reseeded archlucid-contracts after wave-21 churn; proved architecture-finding numeric sourceAgent ordinal gap; seeded whitespace-severity default candidate.

2026-08-31 seed hunt #332 (hit): proved object-shaped claim `evidenceRefs` dropped in `AgentResultJsonConverter`; seeded numeric/PascalCase insight-density fields, `FindingConfidenceLevel` ordinal, and comma-delimiter brief sentinel candidates.

---

## Zone: context-ingestion

- **id:** context-ingestion
- **status:** open
- **impact:** medium
- **aliases:** context ingestion; connector stages; canonicalization
- **paths:** ArchLucid.ContextIngestion/
- **test-filter:** FullyQualifiedName~ContextIngestion|FullyQualifiedName~Canonicalization
- **hunts:** 82
- **bugs-found:** 145
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — multiline nested-block headers flattened inner scalars to parent tf.*
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Canonicalization drops tenant id from ingested connector payload — no tenant id in canonical objects; isolation is repository scope
- [x] (invalid) Stage pipeline continues after a failed validation with partial graph — parsers skip bad declarations by design with warnings, not a validation gate
- [x] (invalid) Duplicate external keys from two tenants collapse into one node — ingestion is per-project snapshot, not multi-tenant batch dedup
- [x] (proven) `InfrastructureDeclarationConnector.DeltaAsync` keys resources by `SourceId` (declaration id) so multiple resources in one declaration collapse in `SetDiffConnectorDeltaComputer` — fixed with composite `SourceId|ObjectType|Name` key
- [x] (proven) `ContextIngestionRequestMapper.FromArchitectureRequest` assigns fresh random `DocumentId` / `DeclarationId` on every map, so identical re-ingest reports false add/remove churn — fixed with `ContextIngestionStableReferenceIds` keyed by name + content type / format
- [x] (proven) `ContextIngestionStableReferenceIds` hashes `contentType` / declaration `format` case-sensitively while parsers and `SupportedContextDocumentContentTypes` accept casing variants — **hit 2026-08-23:** re-map with `TEXT/PLAIN` or `JSON` produced different stable ids and false connector add/remove deltas; fixed by lowercasing format/contentType in `StableId` hash input; regression in `ContextIngestionStableReferenceIdsTests` and `DocumentConnectorTests.DeltaAsync_ReMappedDocumentWithDifferentContentTypeCasing`
- [x] (proven) `ContextIngestionStableReferenceIds` hashes document/declaration **names** case-sensitively — **hit 2026-08-24:** `spec.txt` vs `SPEC.TXT` churned stable ids and document connector deltas; fixed by lowercasing name in `StableId` hash input (`ContextIngestionStableReferenceIdsTests`, `DocumentConnectorTests.DeltaAsync_ReMappedDocumentWithDifferentNameCasing`).
- [x] (proven) `PolicyReferencePayloadNormalizer` kept whitespace-padded policy references — **hit 2026-08-24:** `" SOC2 "` vs `"SOC2"` produced duplicate controls and false connector add/remove; fixed by trimming, skipping blanks, and deduping within batch (`PolicyReferenceConnectorTopologyTests`).
- [x] (proven) `PlainTextContextDocumentParser` truncated long line text to 80-char names that collided in document connector delta keys — **hit 2026-08-24:** two long `REQ:` lines with shared prefix reported `UnchangedCount = 1`; fixed with hash suffix on truncated names (`DocumentConnectorTests.DeltaAsync_LongRequirementsWithSharedNamePrefix_ReportsBothUnchanged`).
- [x] (proven) `PlainTextContextDocumentParser` ignored UTF-8 BOM before `REQ:` prefix — **hit 2026-08-24:** `\uFEFFREQ:` lines produced zero requirements; fixed by stripping leading BOM (`PlainTextContextDocumentParserTests.ParseAsync_Utf8BomReqLine_ExtractsRequirement`).
- [x] (proven) `CanonicalDeduplicator` merged infrastructure resources from different declarations when name/type matched — **hit 2026-08-24:** same `hub-vnet` from `decl-a` and `decl-b` collapsed to one object; fixed by scoping dedupe suffix to non-`PolicyReference` `SourceId` (`CanonicalDeduplicatorTests.Deduplicate_KeepsInfrastructureResourcesFromDifferentDeclarations`).
- [x] (proven) `PolicyReferencePayloadNormalizer` kept policy reference casing in `SourceId` — **hit 2026-08-25:** `SOC2` vs `soc2` reported false add/remove on policy-reference connector delta; fixed by lowercasing trimmed references for `SourceId`, `Name`, and batch dedupe (`PolicyReferenceConnectorTopologyTests.DeltaAsync_PolicyReferenceCaseChange_ReportsUnchanged`).
- [x] (proven) `SecurityBaselineHintsPayloadNormalizer` padded hints false-modified delta — **hit 2026-08-25:** `StableHintSourceId` hashed trimmed text but `Name`/`text` kept padding; fixed by trimming/skipping blanks before emit (`ConnectorHintNormalizationDeltaTests.SecurityBaselineHintsConnector_DeltaAsync_PaddedHint_ReportsUnchanged`).
- [x] (proven) `InlineRequirementsPayloadNormalizer` padded requirements false-modified delta — **hit 2026-08-25:** same trim/hash mismatch as security baseline hints; fixed by trimming/skipping blanks (`ConnectorHintNormalizationDeltaTests.InlineRequirementsConnector_DeltaAsync_PaddedRequirement_ReportsUnchanged`).
- [x] (proven) `TopologyHintsPayloadNormalizer` topology hint casing and slash spacing churned `ObjectId` deltas — **hit 2026-08-25:** `TopologyHintStableObjectIds` hashed case-sensitive text and slash hints kept spacing in `ObjectId`; fixed by canonicalizing slash segments, lowercasing stable keys, and skipping whitespace-only hints (`ConnectorHintNormalizationDeltaTests`).
- [x] (proven) `JsonInfrastructureDeclarationParser` preserved `resourceType` casing in properties — **hit 2026-08-25:** `VNet` vs `vnet` false-modified infrastructure declaration deltas; fixed by lowercasing `resourceType` property (`ConnectorHintNormalizationDeltaTests.JsonInfrastructureDeclarationParser_ResourceTypeCasing_IsCanonicalized`).
- [x] (proven) `InlineRequirementsPayloadNormalizer` long requirement `Name` truncation without hash suffix — **hit 2026-08-25:** two inline requirements sharing an 80-char prefix collapsed to one `Name`, so `ContextIngestionService` `PriorRequirementNames` metadata dropped a requirement; fixed with shared `ContextIngestionStableLineNames.BuildDisplayName` (same pattern as `PlainTextContextDocumentParser`); regressions `InlineRequirementsPayloadNormalizerTests`, `ContextIngestionServiceTests.IngestAsync_WhenPreviousSnapshotHadLongInlineRequirements_StoresAllPriorRequirementNames`
- [x] (proven) `SecurityBaselineHintsPayloadNormalizer` kept hint casing in `SourceId` — **hit 2026-08-25:** `Encrypt At Rest` vs `encrypt at rest` reported false add/remove on security-baseline connector delta; fixed by lowercasing trimmed hints for `SourceId`, `Name`, and `text` (`ConnectorHintNormalizationDeltaTests.SecurityBaselineHintsConnector_DeltaAsync_CaseChange_ReportsUnchanged`)
- [x] (proven) `InlineRequirementsPayloadNormalizer` kept requirement casing in `SourceId` — **hit 2026-08-25:** `Must Encrypt` vs `must encrypt` reported false add/remove on inline-requirements connector delta; fixed by lowercasing trimmed requirements for `SourceId`, `Name`, and `text` (`ConnectorHintNormalizationDeltaTests.InlineRequirementsConnector_DeltaAsync_CaseChange_ReportsUnchanged`)
- [x] (proven) `SetDiffConnectorDeltaComputer` compared normalized batches to enriched previous snapshot objects — **hit 2026-08-25:** enricher-added `category` / `topologySensitivity` on saved snapshots made identical topology re-ingest report false modified; fixed by comparing only current-object property keys (`SetDiffConnectorDeltaComputerTests.Compute_SameKeyExtraPropertyInPrevious_CountsAsUnchanged`, `ContextIngestionServiceTests.IngestAsync_IdenticalTopologyHintOnSecondIngest_ReportsUnchangedDelta`)
- [x] (proven) `PolicyTopologyOverlapResolver.ResolveApplicableTopologyNodeIds` did not canonicalize slash spacing before stable id — **hit 2026-08-25:** `parentNet / childSubnet` overlap id mismatched topology hint `ObjectId` after normalizer collapsed slash spacing; fixed with shared `TopologyHintStableObjectIds.CanonicalizeHintName` (`PolicyReferenceConnectorTopologyTests.NormalizeAsync_WhenPolicyOverlapsSlashSpacedTopologyHint_UsesCanonicalTopologyObjectId`)
- [x] (proven) `JsonInfrastructureDeclarationParser` preserved padded `name` in `CanonicalObject.Name` — **hit 2026-08-25:** `" hub-vnet "` vs `"hub-vnet"` false-churned infrastructure declaration connector delta keys; fixed by trimming resource names (`InfrastructureDeclarationConnectorTests`)
- [x] (proven) `PlainTextContextDocumentParser` threw on blank prefixed lines — **hit 2026-08-26:** `REQ:` / `REQ:   ` lines called `BuildDisplayName("")` and threw; fixed by skipping whitespace-only bodies after prefix (`PlainTextContextDocumentParserTests.ParseAsync_BlankPrefixedLine_SkipsEntry`)
- [x] (proven) `StaticRequestPayloadNormalizer` kept padded description text — **hit 2026-08-26:** `" billing api redesign "` vs trimmed text reported false modified on static-request connector delta; fixed by trimming before emit (`ConnectorHintNormalizationDeltaTests.StaticRequestContextConnector_DeltaAsync_PaddedDescription_ReportsUnchanged`)
- [x] (proven) `SimpleTerraformDeclarationParser` preserved `terraformType` casing in properties — **hit 2026-08-26:** `azurerm_virtual_network` vs `azurerm_Virtual_Network` false-modified infrastructure declaration deltas; fixed by lowercasing `terraformType` (`SimpleTerraformDeclarationParserTests`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformTypeCasingChange_ReportsUnchanged`)
- [x] (proven) `JsonInfrastructureDeclarationParser.CanParse` rejected padded `format` — **hit 2026-08-26:** `Format = " json "` skipped valid JSON declarations despite stable declaration ids; fixed by trimming format in `CanParse` (`InfrastructureDeclarationConnectorTests.NormalizeAsync_PaddedJsonFormat_ParsesDeclaration`)
- [x] (proven) `AppServiceNetworkAccessSecurityBaselineExpander` matched non-App-Service names containing `app` — **hit 2026-08-26:** `application-gateway` with `ipSecurityRestrictions` spawned spurious security baselines; fixed by requiring explicit App Service `resourceType` (`AppServiceNetworkAccessSecurityBaselineExpanderTests.Expand_application_gateway_with_ip_rules_does_not_create_security_baselines`)
- [x] (proven) `PlainTextContextDocumentParser` kept prefixed line text casing in `Name`/`text` — **hit 2026-08-26:** `REQ: Must Encrypt` vs `REQ: must encrypt` reported false add/remove on document connector delta; fixed by lowercasing REQ/POL/SEC lines and canonicalizing TOP lines like topology hints (`DocumentConnectorTests.DeltaAsync_DocumentRequirementCaseChange_ReportsUnchanged`, `PlainTextContextDocumentParserTests`)
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` preserved `terraformType` casing in properties — **hit 2026-08-26:** `azurerm_virtual_network` vs `azurerm_Virtual_Network` false-modified infrastructure declaration deltas; fixed by lowercasing `terraformType` and canonicalizing resource `Name` prefix (`TerraformShowJsonInfrastructureDeclarationParserTests`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonTypeCasingChange_ReportsUnchanged`)
- [x] (proven) `PolicyTopologyOverlapResolver.Overlaps` did not canonicalize slash spacing on policy reference text — **hit 2026-08-26:** `parentNet / childSubnet` missed overlap with canonical topology hint `parentNet/childSubnet`; fixed with shared `TopologyHintStableObjectIds.CanonicalizeHintName` in `Overlaps` (`PolicyTopologyOverlapResolverTests`, `PolicyReferenceConnectorTopologyTests.NormalizeAsync_WhenSlashSpacedPolicyReferenceOverlapsCanonicalTopologyHint_UsesCanonicalTopologyObjectId`)
- [x] (proven) `StaticRequestPayloadNormalizer` kept description casing in `text` — **hit 2026-08-26:** `Billing API redesign` vs `billing api redesign` reported false modified on static-request connector delta; fixed by lowercasing trimmed description for `text` (`ConnectorHintNormalizationDeltaTests.StaticRequestContextConnector_DeltaAsync_CaseChange_ReportsUnchanged`)
- [x] (proven) `SimpleTerraformDeclarationParser` kept padded HCL resource names — **hit 2026-08-26:** `" hub-vnet "` vs `"hub-vnet"` false-churned infrastructure declaration connector delta keys; fixed by trimming regex-captured resource names (`SimpleTerraformDeclarationParserTests.ParseAsync_TrimsPaddedResourceName`, `InfrastructureDeclarationConnectorTests.DeltaAsync_PaddedSimpleTerraformResourceName_ReportsUnchanged`)
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser.CanParse` rejected padded `format` — **hit 2026-08-26:** `Format = " terraform-show-json "` skipped valid declarations despite stable declaration ids; fixed by trimming format in `CanParse` (`TerraformShowJsonInfrastructureDeclarationParserTests.CanParse_TrimsPaddedFormat`, `InfrastructureDeclarationConnectorTests.NormalizeAsync_PaddedTerraformShowJsonFormat_ParsesDeclaration`)
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` kept padded resource `name` in `CanonicalObject.Name` — **hit 2026-08-26:** `" core "` vs `"core"` churned infra delta keys; fixed by trimming resource names (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_TrimsPaddedResourceName`, `InfrastructureDeclarationConnectorTests.DeltaAsync_PaddedTerraformShowJsonResourceName_ReportsUnchanged`)
- [x] (proven) `SupportedContextDocumentContentTypes.IsSupported` rejected padded content types — **hit 2026-08-26:** `ContentType = " text/plain "` skipped valid documents; fixed by trimming before list lookup (`SupportedContextDocumentContentTypesTests`, `DocumentConnectorTests.NormalizeAsync_PaddedContentType_ParsesDocument`)
- [x] (proven) `AppServiceNetworkAccessSecurityBaselineExpander.IsAppServiceTopology` ignored `terraformType` — **hit 2026-08-26:** `azurerm_linux_web_app` with `ipSecurityRestrictions` did not spawn network-rule security baselines; fixed by recognizing App Service terraform types (`AppServiceNetworkAccessSecurityBaselineExpanderTests.Expand_terraform_linux_web_app_with_open_internet_rule_creates_security_baseline`)
- [x] (proven) `JsonInfrastructureDeclarationParser` preserved `subtype`/`region` casing in properties — **hit 2026-08-26:** `EastUS`/`Hub` vs `eastus`/`hub` false-modified infrastructure declaration deltas; fixed by lowercasing trimmed `subtype` and `region` (`JsonInfrastructureDeclarationParserTests`, `InfrastructureDeclarationConnectorTests.DeltaAsync_JsonRegionSubtypeCasingChange_ReportsUnchanged`)
- [x] (proven) `AppServiceNetworkAccessSecurityBaselineExpander` only read `ipSecurityRestrictions` top-level key — **hit 2026-08-26:** terraform-show-json `tf.ip_security_restrictions` values never expanded into network-rule security baselines; fixed by reading ARM and terraform property keys (`AppServiceNetworkAccessSecurityBaselineExpanderTests.Expand_terraform_tf_ip_security_restrictions_creates_security_baseline`)
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` kept `mode`/`providerName` casing in properties — **hit 2026-08-26:** `Managed`/`Registry.Terraform.IO/...` vs `managed`/lowercase provider false-modified infra declaration deltas; fixed by lowercasing both fields (`TerraformShowJsonInfrastructureDeclarationParserTests`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonModeProviderCasingChange_ReportsUnchanged`)
- [x] (proven) `JsonInfrastructureDeclarationParser` preserved custom `properties` value casing — **hit 2026-08-26:** `Standard_LRS` vs `standard_lrs` false-modified infrastructure declaration deltas; fixed by lowercasing trimmed custom property values (`JsonInfrastructureDeclarationParserTests.ParseAsync_CustomPropertyValues_AreCanonicalized`)
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` kept `tf.*` string value casing — **hit 2026-08-26:** `EastUS` vs `eastus` in `tf.location` false-modified infra declaration deltas; fixed by lowercasing trimmed terraform value strings (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_TfStringValues_AreCanonicalized`, golden corpus `case-07`)
- [x] (proven) `AppServiceNetworkAccessSecurityBaselineExpander` ignored snake_case `ip_address` in terraform rule JSON — **hit 2026-08-26:** `tf.ip_security_restrictions` with `ip_address` never detected open-internet rules; fixed with snake_case JSON deserialization fallback (`AppServiceNetworkAccessSecurityBaselineExpanderTests.Expand_terraform_snake_case_ip_address_detects_open_internet`)
- [x] (proven) `SimpleTerraformDeclarationParser` kept padded HCL resource type tokens — **hit 2026-08-26:** `" azurerm_virtual_network "` vs trimmed type churned infra delta keys; fixed by trimming regex-captured resource type (`SimpleTerraformDeclarationParserTests.ParseAsync_TrimsPaddedResourceType`, `InfrastructureDeclarationConnectorTests.DeltaAsync_PaddedSimpleTerraformResourceType_ReportsUnchanged`)
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` kept `terraformDependsOn` reference casing — **hit 2026-08-26:** `module.Foo` vs `module.foo` false-modified infra declaration deltas; fixed by lowercasing trimmed depends_on references (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_DependsOnReferences_AreCanonicalized`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonDependsOnCasingChange_ReportsUnchanged`)
- [x] (proven) `ContextIngestionService.ApplyScopeMetadata` joined `TopologyHints`/`Constraints` without trimming or lowercasing — **hit 2026-08-26:** padded or differently-cased scope metadata churned snapshot `SourceHashes`; fixed with shared topology hint canonicalization and trim/lowercase for constraints (`ContextIngestionServiceTests.IngestAsync_TopologyHintPaddingAndCasing_ProducesStableScopeMetadata`, `IngestAsync_ConstraintPaddingAndCasing_ProducesStableScopeMetadata`)
- [x] (proven) `ContextIngestionService.ApplyScopeMetadata` joined `RequiredCapabilities` without trimming or lowercasing — **hit 2026-08-26:** `" Cost-Analysis "` vs `cost-analysis` churned `SourceHashes`; fixed by trim/lowercase like constraints (`ContextIngestionServiceTests.IngestAsync_RequiredCapabilityPaddingAndCasing_ProducesStableScopeMetadata`)
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` kept non-string `tf.*` JSON blob casing via `GetRawText()` — **hit 2026-08-26:** object/array terraform values preserved string casing and key order, false-modifying infra declaration deltas; fixed with `CanonicalizeTerraformValueText` / sorted-key JSON rewrite (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_CanonicalizesComplexTfJsonCasing`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonComplexTfJsonCasingChange_ReportsUnchanged`)
- [x] (valid-no-repro) `PolicyReferencePayloadNormalizer` raw `TopologyHints` casing breaks overlap resolution — overlap resolver already canonicalizes hint names before stable id; regression `PolicyReferenceConnectorTopologyTests.NormalizeAsync_WhenPolicyOverlapsDifferentlyCasedTopologyHint_UsesCanonicalTopologyObjectId`
- [x] (proven) `ContextIngestionService.ApplyScopeMetadata` joined confirmed `Assumptions` with trim only — **hit 2026-08-26:** `" Existing SQL Database Reused "` vs `existing sql database reused` churned `SourceHashes`; fixed by trim/lowercase like constraints (`ContextIngestionServiceTests.IngestAsync_AssumptionPaddingAndCasing_ProducesStableScopeMetadata`)
- [x] (proven) `ContextIngestionService.ApplyScopeMetadata` stored `QualityAttribute`/`FailureModeNote` with trim only — **hit 2026-08-26:** padded casing variants churned brief scope metadata hashes; fixed by trim/lowercase (`ContextIngestionServiceTests.IngestAsync_QualityAttributePaddingAndCasing_ProducesStableScopeMetadata`, `IngestAsync_FailureModeNotePaddingAndCasing_ProducesStableScopeMetadata`)
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` preserved numeric `tf.*` JSON formatting — **hit 2026-08-26:** `1` vs `1.0` false-modified infra declaration deltas; fixed with `CanonicalizeTerraformNumberText` whole-number normalization (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_EquivalentNumericRepresentations_ProduceSameTfProperties`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonEquivalentNumericFormatChange_ReportsUnchanged`)
- [x] (proven) `ContextIngestionService.ApplyScopeMetadata` stored raw `ActorsJson` without canonical JSON rewrite — **hit 2026-08-26:** PascalCase vs camelCase actor property keys churned `SourceHashes`; fixed by deserialize/re-serialize via `ActorDescriptor` (`ContextIngestionServiceTests.IngestAsync_ActorsJsonPropertyCasing_ProducesStableScopeMetadata`)
- [x] (valid-no-repro) `TerraformShowJsonInfrastructureDeclarationParser` preserves scientific-notation numeric literals — `1e0` vs `1` already canonicalizes to `"1"` via `CanonicalizeTerraformNumberText`; regression `TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_EquivalentScientificNotation_ProduceSameTfProperties`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonScientificNotationNumericChange_ReportsUnchanged`
- [x] (proven) `ContextIngestionService.ApplyScopeMetadata` built `PriorTopologyCategories` from enricher `category` values without lowercasing — **hit 2026-08-26:** `Network|Storage` vs `network|storage` churned metadata hashes; fixed by lowercasing category values before join (`ContextIngestionServiceTests.IngestAsync_PriorTopologyCategoryCasing_ProducesStableScopeMetadata`)
- [x] (proven) `ContextIngestionService.ApplyScopeMetadata` built `PriorRequirementNames` from prior requirement `Name` values without lowercasing — **hit 2026-08-26:** `Availability|Encryption` vs `availability|encryption` churned metadata hashes; fixed by lowercasing requirement names before join (`ContextIngestionServiceTests.IngestAsync_PriorRequirementNameCasing_ProducesStableScopeMetadata`)
- [x] (proven) `ContextIngestionService.CanonicalizeActorsJson` preserved actor array element order — **hit 2026-08-26:** semantically equivalent actor sets in different order churned `SourceHashes`; fixed by stable sort before serialize (`ContextIngestionServiceTests.IngestAsync_ActorsJsonElementOrder_ProducesStableScopeMetadata`)
- [x] (valid-no-repro) `TerraformShowJsonInfrastructureDeclarationParser` preserves boolean `tf.*` string literals — JSON `true` and string `"true"` both canonicalize to `"true"`; regression `TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_EquivalentBooleanRepresentations_ProduceSameTfProperties`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonBooleanStringChange_ReportsUnchanged`
- [x] (valid-no-repro) `ContextIngestionService.CanonicalizeActorsJson` does not normalize enum casing in serialized actor JSON — `Human` vs `human` deserialize to the same `ActorDescriptor` enum ordinals and serialize identically; regression `ContextIngestionServiceTests.IngestAsync_ActorsJsonEnumCasing_ProducesStableScopeMetadata`.
- [x] (valid-no-repro) `TerraformShowJsonInfrastructureDeclarationParser` preserves `null` vs missing `tf.*` keys — explicit JSON null canonicalizes to empty and is skipped like absent keys; regression `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonNullVsMissingTfValue_ReportsUnchanged`.
- [x] (valid-no-repro) `ContextIngestionService.ApplyScopeMetadata` stores raw `ActorsJson` for invalid JSON — malformed payloads trim to the same hash; regression `ContextIngestionServiceTests.IngestAsync_InvalidActorsJsonPadding_ProducesStableScopeMetadata`.
- [x] (proven) Infrastructure declaration parsers preserved resource `Name` casing while `InfrastructureDeclarationConnector.DeltaAsync` keys deltas case-sensitively — **hit 2026-08-26:** `hub-vnet` vs `Hub-Vnet` reported false add/remove on JSON, simple-terraform, and terraform-show-json re-ingest; fixed by lowercasing trimmed resource names in all three parsers (`JsonInfrastructureDeclarationParserTests.ParseAsync_ResourceNameCasing_IsCanonicalized`, `SimpleTerraformDeclarationParserTests.ParseAsync_ResourceNameCasing_IsCanonicalized`, `TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_ResourceNameCasing_IsCanonicalized`, `InfrastructureDeclarationConnectorTests.DeltaAsync_*ResourceNameCasingChange_ReportsUnchanged`).
- [x] (proven) `ContextIngestionService.ApplyScopeMetadata` joined `TopologyHints`/`RequiredCapabilities`/`Constraints`/confirmed `Assumptions` without sorting — **hit 2026-08-26:** semantically identical lists in different order churned `SourceHashes` (same class as proven `CanonicalizeActorsJson` element-order bug); fixed with `OrderBy` before join (`ContextIngestionServiceTests.IngestAsync_TopologyHintsListOrder_ProducesStableScopeMetadata`, `IngestAsync_RequiredCapabilitiesListOrder_ProducesStableScopeMetadata`, `IngestAsync_ConstraintsListOrder_ProducesStableScopeMetadata`, `IngestAsync_AssumptionsListOrder_ProducesStableScopeMetadata`).
- [x] (proven) `PlainTextContextDocumentParser` left default random `CanonicalObject.ObjectId` on prefixed lines — **hit 2026-08-26:** identical document re-parse rotated `obj-{ObjectId}` graph node ids; fixed with `ContextIngestionStableLineNames.StableObjectId` for REQ/POL/SEC and `TopologyHintStableObjectIds.FromHintName` for `TOP:` (`PlainTextContextDocumentParserTests.ParseAsync_TopLine_Reparse_ProducesStableObjectId`, `ParseAsync_RequirementLine_Reparse_ProducesStableObjectId`).
- [x] (proven) `PlainTextContextDocumentParser` `TOP:` slash hints omitted stable `ObjectId` and `parentNodeId`, and `PolicyReferencePayloadExtractor` ignored document topology — **hit 2026-08-26:** document-only `TOP: parentNet/childSubnet` missed policy overlap with `parentNet`; fixed with `PlainTextDocumentTopologyResourceBuilder` and `PlainTextDocumentTopologyHintExtractor` feeding `PolicyReferencePayloadExtractor` (`PlainTextContextDocumentParserTests.ParseAsync_TopSlashHint_SetsStableObjectIdAndParentNodeId`, `PolicyReferenceConnectorTopologyTests.NormalizeAsync_WhenPolicyOverlapsDocumentTopologyHint_SetsApplicableTopologyNodeIds`).
- [x] (proven) `PolicyTopologyOverlapResolver.ResolveApplicableTopologyNodeIds` joined overlapping hint ids without sorting — **hit 2026-08-26:** `["prod-vnet","prod-subnet"]` vs `["prod-subnet","prod-vnet"]` produced different `applicableTopologyNodeIds` strings and false modified on policy-reference connector delta; fixed with `OrderBy` before `string.Join` (`PolicyTopologyOverlapResolverTests.ResolveApplicableTopologyNodeIds_is_stable_across_overlapping_hint_list_order`, `PolicyReferenceConnectorTopologyTests.DeltaAsync_OverlappingTopologyHintListOrder_ReportsUnchanged`).
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` joined `depends_on` references without sorting — **hit 2026-08-26:** `["azurerm_resource_group.main","azurerm_virtual_network.hub"]` vs reversed order produced different `terraformDependsOn` strings and false modified on infrastructure declaration connector delta; fixed with `OrderBy` before `string.Join` (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_CanonicalizesDependsOnReferenceOrder`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonDependsOnOrderChange_ReportsUnchanged`).
- [x] (proven) `SecurityBaselineSensitivityScopeExpander` joined matching topology node ids without sorting — **hit 2026-08-26:** reordering equivalent data-bearing topology resources produced different `protectedTopologyNodeIds` strings on enriched security baselines; fixed with `OrderBy` before `string.Join` (`SecurityBaselineSensitivityScopeExpanderTests.Expand_protected_topology_node_ids_are_stable_across_topology_list_order`).
- [x] (proven) `JsonInfrastructureDeclarationParser` preserved custom `properties` key casing — **hit 2026-08-26:** `Sku` vs `sku` produced different property keys and false modified on infrastructure declaration connector delta after snapshot reload with ordinal property bags; fixed by lowercasing trimmed custom property keys (`JsonInfrastructureDeclarationParserTests.ParseAsync_CustomPropertyKeys_AreCanonicalized`, `InfrastructureDeclarationConnectorTests.DeltaAsync_JsonCustomPropertyKeyCasingChange_ReportsUnchanged`).
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser.SanitizePropertyKey` preserved JSON value field casing in `tf.*` keys — **hit 2026-08-26:** `Location` vs `location` produced different `tf.*` property keys and false modified on infrastructure declaration connector delta after snapshot reload with ordinal property bags; fixed by lowercasing sanitized keys (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_TfPropertyKeys_AreCanonicalized`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonTfPropertyKeyCasingChange_ReportsUnchanged`).
- [x] (proven) `AppServiceNetworkAccessSecurityBaselineExpander` copied parent `SourceType` onto expander-spawned security baselines — **hit 2026-08-26:** enriched `InfrastructureDeclaration` network-rule baselines in prior snapshots were absent from normalized connector output and reported false removed on identical re-ingest; fixed with dedicated `AppServiceNetworkRule` source type (`InfrastructureDeclarationConnectorTests.DeltaAsync_AppServiceExpandedBaselines_ReportsUnchangedOnIdenticalReIngest`).
- [x] (proven) `AppServiceNetworkAccessSecurityBaselineExpander` left default random `ObjectId` on network-rule baselines — **hit 2026-08-26:** identical expand passes produced new `obj-{ObjectId}` graph node ids each time; fixed with `ContextIngestionStableLineNames.StableObjectId` keyed by app service id and `controlId`, and named-rule `controlId` slots instead of array index (`AppServiceNetworkAccessSecurityBaselineExpanderTests.Expand_reparse_produces_stable_object_ids_for_network_baselines`).
- [x] (proven) `KubernetesManifestCanonicalObjectMapper.TryAddResource` left default random `ObjectId` on K8s resources — **hit 2026-08-26:** identical kubernetes-json re-parse rotated `obj-{ObjectId}` graph node ids; fixed with `ContextIngestionStableLineNames.StableObjectId` keyed by declaration id, kind, and canonical name (`KubernetesJsonInfrastructureDeclarationParserTests.ParseAsync_reparse_produces_stable_object_ids_for_deployments`).
- [x] (invalid) `BicepInfrastructureDeclarationParser.ResourceRegex` silently skips quoted-symbolic resource headers — Bicep resource symbolic names are identifiers, not quoted strings; `resource 'storage' 'Microsoft.Storage/...'` is invalid Bicep and correctly yields zero resources (`BicepInfrastructureDeclarationParserTests.ParseAsync_ignores_quoted_symbolic_names_because_bicep_requires_identifiers`).
- [x] (proven) `TopologyResourceCanonicalEnricher.InferCategory` ignored `k8s.kind` — **hit 2026-08-26:** kubernetes-json Deployments classified as `general` instead of `compute`; fixed with `k8s.kind` branch before ARM/Terraform heuristics (`CompositeCanonicalEnricherTests.Enrich_classifies_kubernetes_deployment_as_compute`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser.CopyBoundedProperties` preserved numeric `tf.*` JSON formatting — **hit 2026-08-26:** `capacity: 1` vs `capacity: 1.0` false-modified infrastructure declaration connector deltas; fixed with shared `CanonicalInfrastructurePropertyBag.CanonicalizeNumberText` (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_EquivalentNumericRepresentations_ProduceSameTfProperties`, `InfrastructureDeclarationConnectorTests.DeltaAsync_ArmJsonEquivalentNumericFormatChange_ReportsUnchanged`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser` / `CanonicalInfrastructurePropertyBag.TryAddTfProperty` preserved `tf.*` property key casing — **hit 2026-08-26:** `allowBlobPublicAccess` vs `allowblobpublicaccess` produced different ordinal snapshot keys and false-modified infra declaration deltas; fixed by lowercasing sanitized keys in `TryAddTfProperty` and `TerraformShowJsonInfrastructureDeclarationParser` (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_TfPropertyKeys_AreCanonicalized`, `InfrastructureDeclarationConnectorTests.DeltaAsync_ArmJsonTfPropertyKeyCasingChange_ReportsUnchanged`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser.TryAddResource` left default random `ObjectId` on ARM resources — **hit 2026-08-26:** identical arm-json re-parse rotated `obj-{ObjectId}` graph node ids; fixed with shared `InfrastructureDeclarationStableObjectIds.ForDeclaredResource` keyed by declaration id, resource type, and name (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_Reparse_ProducesStableObjectId`).
- [x] (proven) `BicepInfrastructureDeclarationParser` left default random `ObjectId` on Bicep resources — **hit 2026-08-26:** identical bicep re-parse rotated `obj-{ObjectId}` graph node ids; fixed with `InfrastructureDeclarationStableObjectIds.ForDeclaredResource` (`BicepInfrastructureDeclarationParserTests.ParseAsync_Reparse_ProducesStableObjectId`).
- [x] (proven) `JsonInfrastructureDeclarationParser` left default random `ObjectId` on JSON infra resources — **hit 2026-08-26:** identical json declaration re-parse rotated `obj-{ObjectId}` graph node ids; fixed with `InfrastructureDeclarationStableObjectIds.ForDeclaredResource` (`JsonInfrastructureDeclarationParserTests.ParseAsync_Reparse_ProducesStableObjectId`).
- [x] (proven) `SimpleTerraformDeclarationParser` left default random `ObjectId` on HCL resources — **hit 2026-08-26:** identical simple-terraform re-parse rotated `obj-{ObjectId}` graph node ids; fixed with `InfrastructureDeclarationStableObjectIds.ForDeclaredResource` (`SimpleTerraformDeclarationParserTests.ParseAsync_Reparse_ProducesStableObjectId`).
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` left default random `ObjectId` on terraform-show-json resources — **hit 2026-08-26:** identical terraform-show-json re-parse rotated `obj-{ObjectId}` graph node ids; fixed with `InfrastructureDeclarationStableObjectIds.ForDeclaredResource` (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_Reparse_ProducesStableObjectId`).
- [x] (proven) `InlineRequirementsPayloadNormalizer` left default random `ObjectId` on inline requirements — **hit 2026-08-26:** identical re-normalize rotated `obj-{ObjectId}` graph node ids; fixed with `ContextIngestionStableLineNames.StableObjectId` keyed by canonical requirement text (`InlineRequirementsPayloadNormalizerTests.NormalizeAsync_Reparse_ProducesStableObjectId`).
- [x] (proven) `SecurityBaselineHintsPayloadNormalizer` left default random `ObjectId` on security baseline hints — **hit 2026-08-26:** identical re-normalize rotated `obj-{ObjectId}` graph node ids; fixed with `ContextIngestionStableLineNames.StableObjectId` keyed by canonical hint text (`ConnectorHintNormalizationDeltaTests.SecurityBaselineHintsNormalizer_Reparse_ProducesStableObjectId`).
- [x] (proven) `StaticRequestPayloadNormalizer` left default random `ObjectId` on static request description — **hit 2026-08-26:** identical re-normalize rotated `obj-{ObjectId}` graph node ids; fixed with `ContextIngestionStableLineNames.StableObjectId` keyed by canonical description text (`ConnectorHintNormalizationDeltaTests.StaticRequestNormalizer_Reparse_ProducesStableObjectId`).
- [x] (proven) `PolicyReferencePayloadNormalizer` left default random `ObjectId` on policy references — **hit 2026-08-26:** identical re-normalize rotated `obj-{ObjectId}` graph node ids; fixed with `ContextIngestionStableLineNames.StableObjectId` keyed by canonical policy reference (`ConnectorHintNormalizationDeltaTests.PolicyReferenceNormalizer_Reparse_ProducesStableObjectId`).
- [x] (proven) `SetDiffConnectorDeltaComputer.BuildInitialDelta` used `current.Count` instead of distinct stable-key count — **hit 2026-08-26:** duplicate `SourceId` in first ingest reported `AddedCount = 2` but second ingest indexed to one key and reported false remove; fixed by indexing current batch before initial delta (`SetDiffConnectorDeltaComputerTests.Compute_NoPrevious_DuplicateStableKeys_CountDistinctKeysAsAdded`).
- [x] (proven) `InfrastructureDeclarationConnector.DeltaAsync` keyed resources by `SourceId|ObjectType|Name` only — **hit 2026-08-26:** cluster-scoped Kubernetes Deployment and Service both named `api` collapsed to one delta key; fixed with `InfrastructureDeclarationDeltaKey` including `k8s.kind` / `resourceType` / `terraformType` disambiguators (`InfrastructureDeclarationConnectorTests.DeltaAsync_KubernetesDeploymentAndServiceSameClusterName_CountsBothResources`).
- [x] (proven) `DocumentConnector.DeltaAsync` keyed lines by `SourceId:Name` only — **hit 2026-08-26:** `REQ:` and `POL:` with identical canonical text collapsed to one delta key; fixed by including `ObjectType` in document delta keys (`DocumentConnectorTests.DeltaAsync_RequirementAndPolicyWithSameCanonicalText_CountsBothResources`).
- [x] (proven) `CanonicalDeduplicator.GetDedupeFingerprint` omitted `k8s.kind` — **hit 2026-08-26:** cluster-scoped Kubernetes Deployment and Service both named `api` collapsed to one snapshot object after enrich/dedupe despite connector delta fix; fixed by fingerprinting `k8s.kind` (`CanonicalDeduplicatorTests.Deduplicate_KeepsKubernetesResourcesWithSameNameDifferentKind`).
- [x] (proven) `InfrastructureDeclarationDeltaKey` / `CanonicalDeduplicator` / `JsonInfrastructureDeclarationParser` ignored JSON `subtype` and `region` when `resourceType` and `Name` matched — **hit 2026-08-26:** two `vnet` resources both named `hub` with different `subtype`/`region` collapsed to one delta key, deduped to one object, and shared unstable `ObjectId`; fixed with `InfrastructureDeclarationResourceIdentity` disambiguators (`InfrastructureDeclarationConnectorTests.DeltaAsync_JsonSameTypeNameDifferentSubtype_CountsBothResources`, `CanonicalDeduplicatorTests.Deduplicate_KeepsJsonResourcesWithSameTypeNameDifferentSubtype`).
- [x] (proven) `TopologyHintStableObjectIds.CanonicalizeHintName` only normalized spacing around the first `/` — **hit 2026-08-26:** `prod / vnet / subnet-a` vs `prod/vnet/subnet-a` churned topology-hints connector deltas and `ObjectId`; fixed by trimming all slash segments (`TopologyHintStableObjectIdsTests.CanonicalizeHintName_ThreeSegmentInnerSlashSpacing_EquivalentPathsMatch`, `ConnectorHintNormalizationDeltaTests.TopologyHintsConnector_DeltaAsync_ThreeSegmentInnerSlashSpacing_ReportsUnchanged`).
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser.CollectFromModule` ignored module/resource `address` when sibling child modules declared the same Terraform type + label — **hit 2026-08-26:** two `azurerm_subnet.this` resources in `module.network` and `module.data` collapsed to one `Name`, `ObjectId`, and delta key; fixed by resolving terraform resource addresses from JSON `address` or `moduleAddress.type.label` (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_SiblingChildModulesSameResourceLabel_EmitsTwoResources`, `InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonSiblingModulesSameLabel_CountsBothResources`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser.ReadName` kept only the first segment of composite ARM `name` arrays — **hit 2026-08-26:** `["hub-vnet","subnet-a"]` and `["hub-vnet","subnet-b"]` both parsed as `hub-vnet`, collapsing delta keys and dedupe fingerprints; fixed by joining array segments with `/` (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_CompositeSubnetNames_EmitsDistinctChildNames`, `InfrastructureDeclarationConnectorTests.DeltaAsync_ArmJsonCompositeSubnetNames_CountsBothResources`).
- [x] (proven) `InfrastructureDeclarationResourceIdentity` / `CanonicalDeduplicator` with JSON resources sharing `type`+`name`+`subtype`+`region` but differing custom `properties` — **hit 2026-08-26:** identity disambiguators stopped at subtype/region so distinct `cidr` values collapsed; fixed by appending sorted custom property segments (`InfrastructureDeclarationConnectorTests.DeltaAsync_JsonSameTypeNameSubtypeRegionDifferentCustomProperties_CountsBothResources`).
- [x] (proven) `TopologyHintStableObjectIds.CanonicalizeHintName` with internal whitespace (`hub  vnet` vs `hub vnet`) — **hit 2026-08-26:** double-space hints churned topology-hints connector deltas; fixed by collapsing internal whitespace in each segment (`TopologyHintStableObjectIdsTests`, `ConnectorHintNormalizationDeltaTests.TopologyHintsConnector_DeltaAsync_InternalWhitespaceChange_ReportsUnchanged`).
- [x] (proven) `CanonicalInfrastructurePropertyBag.TryAddTfBlockProperty` preserves nested block-name casing (`tf.Site_Config` vs `tf.site_config`) — **hit 2026-08-26:** unlike `TryAddTfProperty`, block keys were not lowercased, false-modifying simple-terraform deltas; fixed with `.ToLowerInvariant()` on sanitized block names (`CanonicalInfrastructurePropertyBagTests`, `InfrastructureDeclarationConnectorTests.DeltaAsync_SimpleTerraformNestedBlockNameCasingChange_ReportsUnchanged`).
- [x] (proven) `SimpleTerraformDeclarationParser` / `InfrastructureDeclarationDeltaKey` with duplicate `resource` blocks sharing type+label — **hit 2026-08-26:** stable identity was `terraformType|label` only so malformed duplicate HCL collapsed in delta; fixed with per-declaration `terraformOccurrence` suffix (`SimpleTerraformDeclarationParserTests.ParseAsync_DuplicateResourceBlocksSameTypeLabel_EmitsDistinctObjects`, `InfrastructureDeclarationConnectorTests.DeltaAsync_DuplicateSimpleTerraformResourceBlocks_CountsBothResources`).
- [x] (proven) `AppServiceNetworkAccessSecurityBaselineExpander.IsAppServiceTopology` matched `Microsoft.Web/sites/config` via `Contains("Microsoft.Web/sites")` — **hit 2026-08-26:** child config resources with `ipSecurityRestrictions` spawned spurious public-endpoint baselines; fixed by exact `Microsoft.Web/sites` match (`AppServiceNetworkAccessSecurityBaselineExpanderTests.Expand_sites_config_child_resource_does_not_create_security_baselines`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser.TryAddResource` built `ObjectId` from `type|name` only while JSON parser included custom-property disambiguators — **hit 2026-08-26:** duplicate ARM storage accounts with different `properties` shared graph `ObjectId`; fixed with `InfrastructureDeclarationResourceIdentity.AppendSubtypeRegionDisambiguators` (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_SameTypeNameDifferentProperties_EmitsDistinctObjectIds`).
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` duplicate root `type+label` without `address` collapsed `ObjectId` — **hit 2026-08-26:** simple-terraform already had `terraformOccurrence`; show-json path now assigns per-label occurrence suffix (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_DuplicateRootResourceLabelsWithoutAddress_EmitsDistinctObjectIds`).
- [x] (proven) `TopologyHintsPayloadNormalizer` / `PlainTextDocumentTopologyResourceBuilder` linked `parentNodeId` to first slash segment only — **hit 2026-08-26:** `prod/vnet/subnet-a` parented to `prod` instead of `prod/vnet`; fixed with `LastIndexOf('/')` immediate-parent resolution (`TopologyHintsConnectorParentTests.NormalizeAsync_ThreeSegmentHint_SetsParentNodeIdToImmediateParent`).
- [x] (proven) `InfrastructureDeclarationDeltaKey.For` terraform branch omitted disambiguators for duplicate show-json root labels — **hit 2026-08-26:** duplicate `azurerm_subnet.this` rows reported `AddedCount = 1`; fixed by emitting `terraformOccurrence` from show-json parser (`InfrastructureDeclarationConnectorTests.DeltaAsync_TerraformShowJsonDuplicateRootLabel_CountsBothResources`).

2026-08-26 thorough hunt #43: all four hunt-ready rows proved and fixed.
- [x] (proven) `SecurityBaselineSensitivityScopeExpander` padded `baselineScope` blocked sensitivity match — **hit 2026-08-26:** `" data-bearing "` vs `data-bearing` left baselines without `protectedTopologyNodeIds`; fixed by trimming explicit scope (`SecurityBaselineSensitivityScopeExpanderTests.Expand_padded_baseline_scope_links_matching_topology`).
- [x] (proven) `KubernetesYamlInfrastructureDeclarationParser` drops PascalCase manifest keys (`Kind`, `Metadata.Name`) after YamlDotNet camelCase serialization — **hit 2026-08-26:** exporter YAML with `Kind`/`Metadata.Name` returned zero resources; fixed with case-insensitive JSON property reads in `KubernetesManifestCanonicalObjectMapper` (`KubernetesYamlInfrastructureDeclarationParserTests.ParseAsync_PascalCaseKeys_MapsDeployment`).
- [x] (proven) `PolicyTopologyOverlapResolver.Overlaps` uses bidirectional `Contains` — **hit 2026-08-26:** policy `prod` false-positived on topology hint `production-vnet`; fixed with delimited prefix/suffix matching (`PolicyTopologyOverlapResolverTests`, `PolicyReferenceConnectorTopologyTests.NormalizeAsync_prod_policy_does_not_target_production_vnet_hint`).
- [x] (proven) `TopologyHintsPayloadNormalizer` vs document `TOP:` path disagree on long-hint `Name` truncation — **hit 2026-08-26:** connector kept full `canonicalHint` while document path used `BuildDisplayName`, so identical long hints produced mismatched display names and divergent graph labels for the same `ObjectId`; fixed by aligning connector `Name` with `ContextIngestionStableLineNames.BuildDisplayName` (`TopologyHintsPayloadNormalizerTests`).
- [x] (proven) `KubernetesManifestCanonicalObjectMapper.ResolveObjectType` matched `kind` case-sensitively — **hit 2026-08-26:** `"kind": "secret"` classified as `TopologyResource` instead of `SecurityBaseline`, skipping secret-handling and misrouting K8s security objects from lowercase exporters; fixed with `ToLowerInvariant()` before kind switch (`KubernetesJsonInfrastructureDeclarationParserTests.ParseAsync_LowercaseKind_ClassifiesSecretAsSecurityBaseline`, `KubernetesYamlInfrastructureDeclarationParserTests.ParseAsync_LowercaseKindValue_ClassifiesSecretAsSecurityBaseline`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser` read `resources`/`type`/`name`/`properties` case-sensitively — **hit 2026-08-26:** exporter JSON with PascalCase `Resources`/`Type`/`Name`/`Properties` returned zero resources; fixed with case-insensitive JSON property reads (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_PascalCasePropertyNames_MapsStorageAccount`).
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` read `values`/`root_module`/`resources`/`type`/`name` case-sensitively — **hit 2026-08-26:** exporter JSON with PascalCase `Values`/`Root_Module`/`Resources`/`Type`/`Name` returned zero resources; fixed with case-insensitive JSON property reads (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_PascalCasePropertyNames_MapsStorageAccount`).
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser` kept padded `type` whitespace in `terraformType` and resource `Name` — **hit 2026-08-26:** `" azurerm_virtual_network "` vs `azurerm_virtual_network` false-modified infrastructure declaration deltas and misaligned occurrence keys; fixed by trimming `type` in `TryAddResource` and `CountModuleLabelOccurrences` (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_TrimsPaddedResourceType`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser.CopyBoundedProperties` dropped JSON array `properties` — **hit 2026-08-26:** `ipSecurityRestrictions` arrays were skipped so `AppServiceNetworkAccessSecurityBaselineExpander` never saw open-internet rules from arm-json declarations; fixed by serializing array/object values via `TryAddTfJsonProperty` and normalizing expander key lookup (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_WebSiteWithIpSecurityRestrictions_PreservesRulesForNetworkExpander`).
- [x] (proven) `TerraformShowJsonInfrastructureDeclarationParser.RedactTopLevelSensitiveTfValues` ignored nested `sensitive_values` markers — **hit 2026-08-26:** nested `site_config.connection_string` leaked plaintext inside `tf.site_config` JSON blob; fixed by redacting `tf.*` keys when nested sensitive markers are present (`TerraformShowJsonInfrastructureDeclarationParserTests.ParseAsync_redacts_nested_sensitive_tf_object_values`).
- [x] (valid-no-repro) `KubernetesYamlInfrastructureDeclarationParser` YAML `kind: List` path — mapper already expands List items after YamlDotNet round-trip; added YAML-path regression `KubernetesYamlInfrastructureDeclarationParserTests.ParseAsync_KindList_MapsMultipleItems`.
- [x] (proven) `CanonicalInfrastructurePropertyBag.ShouldRedactKey` matched snake_case fragments only — **hit 2026-08-26:** camelCase `connectionString` leaked plaintext into `tf.connectionstring`; fixed by normalizing key/fragment comparison without underscores (`CanonicalInfrastructurePropertyBagTests.TryAddTfProperty_redacts_camelCase_sensitive_keys`).
- [x] (proven) `TopologyHintsPayloadNormalizer` kept duplicate canonical hints in one batch — **hit 2026-08-26:** `["prod/vnet"," prod/vnet "]` emitted two `CanonicalObject` rows with the same `ObjectId`; fixed with within-batch `seenHints` dedupe like `PolicyReferencePayloadNormalizer` (`TopologyHintsPayloadNormalizerTests.NormalizeAsync_DuplicateHints_EmitsSingleCanonicalObject`, `ConnectorHintNormalizationDeltaTests.TopologyHintsConnector_NormalizeAsync_DuplicateHints_EmitsSingleCanonicalObject`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser` / `CanonicalTfJsonSerializer` preserved exporter casing inside `tf.*` JSON array blobs — **hit 2026-08-26:** `Name`/`IpAddress` vs `name`/`ipaddress` in `ipSecurityRestrictions` false-modified infrastructure declaration deltas; fixed with sorted-key lowercase canonical JSON rewrite (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_ArrayPropertyCasing_IsCanonicalized`, `InfrastructureDeclarationConnectorTests.DeltaAsync_ArmJsonArrayPropertyCasingChange_ReportsUnchanged`).
- [x] (proven) `CanonicalInfrastructurePropertyBag.TryAddTfJsonProperty` leaked nested sensitive keys inside ARM object `tf.*` blobs — **hit 2026-08-26:** `siteConfig.connectionString` plaintext survived inside `tf.siteconfig` JSON; fixed by redacting whole blob when `CanonicalTfJsonSerializer.ContainsSensitiveNestedKey` matches (`CanonicalInfrastructurePropertyBagTests.TryAddTfJsonProperty_redacts_nested_sensitive_object_values`, `ArmJsonInfrastructureDeclarationParserTests.ParseAsync_NestedSensitiveObjectValue_IsRedacted`).
- [x] (proven) `SimpleTerraformResourceBlockParser` did not strip `/* */` block comments — **hit 2026-08-26:** HCL with block comments before or after assignments dropped/corrupted `location` attribute parsing; fixed with `TryConsumeBlockComment` (`SimpleTerraformDeclarationParserTests.ParseAsync_BlockCommentBeforeAssignment_StillParsesLocation`, `ParseAsync_InlineBlockCommentAfterValue_ParsesCleanLocation`).
- [x] (proven) `KubernetesManifestCanonicalObjectMapper` / `InfrastructureDeclarationDeltaKey` / `CanonicalDeduplicator` with duplicate identical manifests — **hit 2026-08-26:** two Deployments with same kind/name shared `ObjectId`, collapsed connector delta keys, and deduped to one object; fixed with per-declaration `k8sOccurrence` suffix (`KubernetesYamlInfrastructureDeclarationParserTests.ParseAsync_DuplicateDeployments_EmitDistinctObjectIds`, `InfrastructureDeclarationConnectorTests.DeltaAsync_DuplicateKubernetesDeployments_CountsBothResources`, `CanonicalDeduplicatorTests.Deduplicate_KeepsDuplicateKubernetesManifestsWithOccurrence`).
- [x] (proven) `CanonicalInfrastructurePropertyBag.MaxTfPropertyCount` dropped `ipSecurityRestrictions` before network expander — **hit 2026-08-26:** 24-property cap filled by scalar props before security JSON was copied; fixed by copying security-priority properties first and raising JSON length limit for those keys (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_ManyScalarProperties_StillPreservesIpSecurityRestrictions`).
- [x] (proven) `BicepResourceBodyParser` preserved inline `//` comments in scalar values — **hit 2026-08-27:** `publicNetworkAccess: 'Enabled' // primary region` vs un-commented value false-modified infrastructure declaration deltas; fixed with `StripTrailingSlashSlashComment` before unquoting (HCL `#` parity); regression in `BicepInfrastructureDeclarationParserTests.ParseAsync_InlineSlashSlashComment_DoesNotChangeTfPublicNetworkAccess` and `InfrastructureDeclarationConnectorTests.DeltaAsync_BicepInlineSlashSlashCommentChange_ReportsUnchanged`.

- [x] (proven) `SimpleTerraformResourceBlockParser` treated `key = [` array headers as scalar assignments — **hit 2026-09-02:** `ip_security_restrictions = [` stored `tf.ip_security_restrictions = "["` and leaked inner object scalars so App Service network-rule expander never ran; fixed with balanced-bracket extraction and shared `BicepArrayLiteralConverter` HCL `=` object parsing (`SimpleTerraformDeclarationParserTests.ParseAsync_IpSecurityRestrictionsArray_PreservesRulesForNetworkExpander`, `ParseAsync_IpSecurityRestrictionsArray_ExpandsNetworkBaseline`).
- [x] (valid-no-repro) `BicepResourceBodyParser` inline single-line array literals — `ipSecurityRestrictions: [{ name: 'AllowAll', ... }]` already parses via balanced-bracket extraction; regression `BicepInfrastructureDeclarationParserTests.ParseAsync_InlineSingleLineArray_PreservesIpSecurityRestrictions`.
- [x] (valid-no-repro) `DocumentConnector.DeltaAsync` spaced `REQ :` prefix vs `REQ:` — prior `TryGetPrefixedBody` fix already reports unchanged; regression `DocumentConnectorTests.DeltaAsync_SpacedRequirementPrefixChange_ReportsUnchanged`.

2026-09-02 seed hunt #430: reseeded from parser files; proved simple-terraform HCL array literal gap; disproved Bicep inline-array and document spaced-prefix delta regressions.

- [x] (proven) `SimpleTerraformResourceBlockParser` nested `site_config` blocks stored raw body and dropped inner `ip_security_restrictions` arrays — **hit 2026-09-02 (#524):** HCL `site_config { ip_security_restrictions = [ ... ] }` emitted only `tf.site_config` text and leaked inner scalars, so App Service network-rule expander never ran; fixed by flattening `site_config`/`properties` with balanced-brace extraction (Bicep parity) (`SimpleTerraformDeclarationParserTests.ParseAsync_NestedSiteConfigIpSecurityRestrictionsArray_PreservesRulesForNetworkExpander`, `ParseAsync_NestedSiteConfigIpSecurityRestrictionsArray_ExpandsNetworkBaseline`).

2026-09-02 seed hunt #524: reseeded from context-ingestion parsers; proved nested simple-terraform site_config array flatten gap beyond top-level HCL array fix (#430).

- [x] (proven) `SimpleTerraformResourceBlockParser` / `BicepResourceBodyParser` — multiline `key =` / `key:` array headers not recognized — **hit 2026-09-02 (#527):** `ip_security_restrictions =` newline `[` leaked inner scalars (`tf.name`, `tf.ip_address`) instead of `tf.ip_security_restrictions` JSON array; fixed by probing the next non-empty line for `[` after a header-only assignment (`ParseAsync_MultilineIpSecurityRestrictionsArray_PreservesRulesForNetworkExpander` in simple-terraform and Bicep tests).

2026-09-02 seed hunt #527: reseeded from context-ingestion parsers; proved multiline array header gap beyond same-line HCL/Bicep array fixes (#430/#524).

- [x] (proven) `InfrastructureDeclarationBraceBodyExtractor.ExtractBalancedBraceBody` — `}` inside quoted strings prematurely closed nested blocks — **hit 2026-09-02 (#530):** `site_config { note = "has } char" public_network_access = "Disabled" }` dropped `tf.public_network_access` because brace depth ignored quotes while bracket extraction already tracked them; fixed with quote-aware brace scanning (`ParseAsync_NestedSiteConfigWithClosingBraceInQuotedString_StillParsesTrailingScalars` in simple-terraform and Bicep tests).

2026-09-02 seed hunt #530: reseeded from context-ingestion brace extractor; proved quote-unaware brace depth gap beyond #527 multiline array header fix.

- [x] (proven) `InfrastructureDeclarationBraceBodyExtractor` — `]` / `}` inside `//` line comments prematurely closed balanced bodies — **hit 2026-09-02 (#534):** `ip_security_restrictions = [ // legacy rule ]` truncated at comment `]` and leaked inner scalars (`tf.name`, `tf.ip_address`) instead of `tf.ip_security_restrictions` JSON array; fixed by skipping `//`, `/* */`, and `#` comments before delimiter depth counting in shared brace/bracket extractor (`ParseAsync_IpSecurityRestrictionsArrayWithBracketInLineComment_PreservesRulesForNetworkExpander`, `ParseAsync_NestedSiteConfigWithClosingBraceInLineComment_StillParsesTrailingScalars` in simple-terraform and Bicep tests).

2026-09-02 seed hunt #534: reseeded from context-ingestion brace extractor; proved comment-unaware delimiter depth gap beyond #530 quote-aware brace fix.

- [x] (proven) `InfrastructureDeclarationBraceBodyExtractor` — escaped `\"` inside double-quoted strings prematurely closed nested blocks — **hit 2026-09-03 (#538):** `note = "has \"} char"` truncated at the escaped quote and dropped `tf.public_network_access`; fixed with backslash-skip in quote-aware delimiter scanning plus shared `UnquoteInfrastructureScalar` for `\"`/`\\` unescape (`ParseAsync_NestedSiteConfigWithEscapedQuoteBeforeClosingBrace_StillParsesTrailingScalars` in simple-terraform and Bicep tests).

2026-09-03 seed hunt #538: reseeded from context-ingestion brace extractor; proved escaped-quote delimiter depth gap beyond #534 comment-aware fix.

- [x] (proven) `CanonicalInfrastructurePropertyBag` comment strippers — escaped `\"` before `#` / `//` / `/*` truncated scalar values — **hit 2026-09-03 (#585):** `note = "eastus\" # region"` stored `tf.note = eastus\` because `StripTrailingHclComment` toggled quote state on escaped quotes without backslash-skip (same class as #538 brace extractor); fixed with backslash-skip in `StripTrailingHclComment`, `StripTrailingSlashSlashComment`, and `StripTrailingBlockComment` (`ParseAsync_EscapedQuoteBeforeHash_DoesNotTruncateScalarValue`).

2026-09-03 seed hunt #585: reseeded from context-ingestion comment strippers; proved escaped-quote comment-strip gap beyond #538 brace-extractor fix.

- [x] (proven) `SimpleTerraformResourceBlockParser` scalar assignments — inline `//` comments not stripped (Bicep parity gap) — **hit 2026-09-03 (#590):** `location = "eastus" // primary region` stored `tf.location = "eastus" // primary region` and false-modified infrastructure declaration deltas; fixed with `StripTrailingSlashSlashComment` and `StripTrailingBlockComment` before unquoting (`SimpleTerraformDeclarationParserTests.ParseAsync_InlineSlashSlashComment_DoesNotChangeTfLocation`, `InfrastructureDeclarationConnectorTests.DeltaAsync_SimpleTerraformInlineSlashSlashCommentChange_ReportsUnchanged`).

2026-09-03 seed hunt #590: reseeded from simple-terraform vs Bicep scalar comment parity; proved missing `//`/`/* */` strip on HCL scalar values beyond #585 escaped-quote `#` fix.

- [x] (proven) `PlainTextDocumentTopologyHintExtractor.EnumerateHintNames` — spaced `TOP :` prefix ignored — **hit 2026-09-03 (#598):** strict `StartsWith("TOP:")` missed `TOP : parentNet/childSubnet` while `PlainTextContextDocumentParser` already accepted optional whitespace before `:` via `TryGetPrefixedBody`; policy↔topology overlap never linked document-sourced hints; fixed by extracting shared `PlainTextDocumentPrefixedLine.TryGetPrefixedBody` (`EnumerateHintNames_SpacedPrefixBeforeColon_ExtractsTopologyHint`).
- [x] (proven) `BicepArrayLiteralConverter.ParseObjectScalars` — block comments inside array objects not skipped — **hit 2026-09-03 (#598):** `ip_security_restrictions = [{ name = "AllowAll" /* ip_address = "1.1.1.1" */ }]` parsed commented-out `ip_address` as live scalar (body-level block-comment parity gap after #590); fixed with `TryConsumeBlockComment` in array-object scalar scan (`ParseAsync_IpSecurityRestrictionsArrayWithBlockCommentedProperty_DoesNotParseCommentedScalar`).

2026-09-03 seed hunt #598: reseeded from plain-text topology hint extractor and array-literal converter; proved spaced `TOP :` prefix parity gap and array-object block-comment gap.

- [x] (proven) `BicepArrayLiteralConverter.ParseObjectScalars` — comma-separated properties on one line inside array objects parsed as single scalar — **hit 2026-09-03 (#599):** `[{ name: 'AllowAll', ipAddress: '0.0.0.0/0', action: 'Allow' }]` stored only `name` with trailing assignment text; `AppServiceNetworkAccessSecurityBaselineExpander` never detected open-internet rules; fixed by splitting assignment segments on commas outside quoted strings (`ParseAsync_InlineSingleLineArray_ExpandsNetworkBaseline`, `ParseAsync_InlineCommaSeparatedArrayObject_ExpandsNetworkBaseline`).

2026-09-03 seed hunt #599: reseeded from array-literal converter; proved comma-separated inline array-object scalar gap beyond #598 block-comment fix.

- [x] (invalid) `BicepArrayLiteralConverter.ParseObjectScalars` — full-line `#` HCL comments inside array objects may be mis-parsed if comment text resembles assignments — full-line `#` lines skipped; inline `#` is EOL comment per HCL so trailing segments are intentionally ignored (`ParseAsync_InlineArrayObjectWithFullLineHashComment_DoesNotParseCommentedAssignment`).
- [x] (proven) `InfrastructureDeclarationBraceBodyExtractor` / `CanonicalInfrastructurePropertyBag.UnquoteInfrastructureScalar` — HCL single-quoted `''` escape not honored — **hit 2026-09-03 (#605):** `owner''s rule` and `token''s } literal` left doubled apostrophes in `tf.*` values; `''` inside single-quoted strings could prematurely toggle delimiter depth; fixed with `''` skip in brace/bracket scanning and `UnescapeSingleQuotedInner` (`ParseAsync_SingleQuotedDoubledApostropheInNestedBlock_ParsesTrailingScalar`, `ParseAsync_SingleQuotedDoubledApostropheBeforeClosingBraceInNestedBlock_ParsesTrailingScalar`, `ParseAsync_SingleQuotedApostropheInArrayRuleName_ParsesIpAddress`).
- [x] (valid-no-repro) `InfrastructureDeclarationBraceBodyExtractor` — lone unescaped `'` in single-quoted scalars (`'O'Brien'`) — invalid HCL; delimiter scan still breaks and leaks array scalars to top level; Terraform requires `''` escaping (`ParseAsync_UnescapedSingleQuotedApostrophe_LeaksArrayScalarsToTopLevel`).
- [x] (valid-no-repro) `PlainTextDocumentTopologyHintExtractor.EnumerateHintNames` — tab-indented `TOP:` lines — extractor and `PlainTextContextDocumentParser` both use `TrimEntries` split; regression `EnumerateHintNames_TabIndentedTopLine_MatchesParser`.

2026-09-03 thorough hunt #605: proved HCL `''` single-quote escape gap; disproved hash-comment mis-parse, tab-indent mismatch, and unescaped lone apostrophe (invalid HCL).

- [x] (proven) `BicepArrayLiteralConverter.TryConsumeBlockComment` — `/*` inside quoted array-object scalars stripped as block comment — **hit 2026-09-03 (#634):** `name = 'Allow /* All'` in inline `ip_security_restrictions` array truncated at `/*`, dropped `ip_address`/`action`, and broke App Service network-rule expander; fixed with quote-aware `/*` detection honoring `''` escapes (`ParseAsync_InlineArrayObjectWithBlockCommentSequenceInsideSingleQuotedName_PreservesFullRuleName`, `ParseAsync_InlineArrayObjectWithBlockCommentSequenceInsideDoubleQuotedName_PreservesFullRuleName`).

- [x] (invalid) `BicepArrayLiteralConverter.TryParseToJsonElement` — primitive string `ip_security_restrictions` arrays silently dropped — `ip_security_restrictions = ["0.0.0.0/0"]` is invalid HCL/Bicep (object blocks required); object-only converter correctly omits malformed security-rule arrays; regression `ParseAsync_PrimitiveStringIpSecurityRestrictionsArray_DoesNotEmitTfProperty` (cheap-disproof hunt #643).

- [x] (proven) `BicepArrayLiteralConverter.TryParseToJsonElement` — primitive `list(string)` array literals silently dropped — **hit 2026-09-03 (#643):** `address_prefixes = ["10.0.1.0/24"]` and Bicep `addressPrefixes: ['10.0.1.0/24']` consumed array lines but emitted no `tf.*` JSON because converter only parsed `{` object elements; fixed with primitive string array fallback and security-priority object-only guard (`ParseAsync_PrimitiveStringAddressPrefixesArray_PreservesTfProperty`, `ParseAsync_PrimitiveStringAddressPrefixesArray_PreservesMultipleValues`, `ParseAsync_BicepPrimitiveStringAddressPrefixesArray_PreservesTfProperty`).

2026-09-03 thorough hunt #643: cheap-disproved primitive-string `ip_security_restrictions` candidate (invalid HCL); proved valid `list(string)` primitive array gap.

- [x] (proven) `BicepArrayLiteralConverter.TryParseToJsonElement` — empty primitive `list(string)` array literals silently dropped — **hit 2026-09-03 (#652):** `address_prefixes = []` parsed via `TryParsePrimitiveStrings` but `TryParseToJsonElement` rejected `Count == 0` so no `tf.address_prefixes` emitted; fixed by accepting empty primitive arrays (`ParseAsync_EmptyPrimitiveStringAddressPrefixesArray_PreservesTfProperty`).

- [x] (invalid) `BicepArrayLiteralConverter.TryParseToJsonElement` — multiline primitive `list(string)` arrays silently dropped — multiline `address_prefixes = [ "10.0.1.0/24", "10.0.2.0/24" ]` already preserves `tf.address_prefixes` via existing comma-segment parser (cheap-disproof hunt #652).

2026-09-03 seed hunt #652: reseeded from `BicepArrayLiteralConverter` after #643 primitive-array fallback; proved empty primitive array gap; disproved multiline primitive-array candidate.

- [x] (proven) `BicepArrayLiteralConverter.TryParseToJsonElement` — whitespace-only primitive `list(string)` array literals silently dropped — **hit 2026-09-03 (#655):** `address_prefixes = ["  ", ""]` skipped blank segments then `TryParsePrimitiveStrings` returned `null` for `Count == 0` so no `tf.address_prefixes` emitted (#652 empty-array parity gap); fixed by returning the collected list even when all elements are blank (`ParseAsync_WhitespaceOnlyPrimitiveStringAddressPrefixesArray_PreservesEmptyTfProperty`).

- [x] (invalid) `BicepArrayLiteralConverter.TryParsePrimitiveStrings` — single-quoted HCL primitive `list(string)` arrays silently dropped — `address_prefixes = ['10.0.1.0/24']` already preserves `tf.address_prefixes` via `UnquoteInfrastructureScalar` (cheap-disproof hunt #655).

- [x] (invalid) `BicepArrayLiteralConverter.TryParsePrimitiveStrings` — trailing-comma primitive `list(string)` arrays silently dropped — `address_prefixes = ["10.0.1.0/24",]` already preserves `tf.address_prefixes` via comma-segment parser (cheap-disproof hunt #655).

2026-09-03 seed hunt #655: reseeded from `BicepArrayLiteralConverter` after #652 empty-array fix; proved whitespace-only primitive array gap; disproved single-quoted and trailing-comma candidates.

- [x] (proven) `BicepArrayLiteralConverter.TryParseToJsonElement` — empty object elements in array literals silently dropped `tf.*` property — **hit 2026-09-04 (#656):** `ip_security_restrictions = [{}]` skipped zero-property object bodies, fell through to primitive parsing (`inner.Contains('{')`), and emitted no `tf.ip_security_restrictions` (#652 empty-array parity gap for object arrays); fixed by always appending parsed object bodies even when property bag is empty (`ParseAsync_EmptyObjectInIpSecurityRestrictionsArray_PreservesTfProperty`).
- [x] (valid-no-repro) `BicepArrayLiteralConverter.TryParsePrimitiveStrings` — unquoted numeric primitive `list(number)` arrays silently dropped — `service_endpoints = [10, 20]` already preserves `tf.service_endpoints` via primitive fallback; regression `ParseAsync_NumericPrimitiveAddressPrefixesArray_PreservesTfProperty` (cheap-disproof hunt #656).

2026-09-04 seed hunt #656: reseeded from `BicepArrayLiteralConverter` after #655 whitespace-only primitive fix; proved empty object array gap; disproved unquoted numeric primitive-array candidate.

- [x] (proven) `BicepResourceBodyParser.TryConsumeMultilineArrayAssignment` — `#` comment lines before `[` not skipped during multiline array probe — **hit 2026-09-04 (#741):** HCL/terraform probe skips `#` lines but Bicep only skipped `//`, so `ipSecurityRestrictions:` + `# legacy` + `[...]` leaked inner rule scalars and omitted `tf.ipsecurityrestrictions`; fixed by skipping `#` lines in probe loop (terraform #527 parity); regression in `ParseAsync_MultilineIpSecurityRestrictionsArrayWithHashCommentLine_PreservesRulesForNetworkExpander`
- [x] (proven) `BicepResourceBodyParser.ParseBodyIntoProperties` — inline `#` HCL comments on scalar values not stripped — **hit 2026-09-04 (#741):** `publicNetworkAccess: 'Enabled' # primary region` stored polluted `tf.publicnetworkaccess` and false-modified infra declaration deltas (#590 `//` parity gap); fixed with `StripTrailingHclComment` before unquote; regressions in `ParseAsync_InlineHashComment_DoesNotChangeTfPublicNetworkAccess` and `DeltaAsync_BicepInlineHashCommentChange_ReportsUnchanged`
- [x] (valid-no-repro) `PlainTextDocumentPrefixedLine` — `POL :` spaced-prefix parity — shared `TryGetPrefixedBody` already accepts optional whitespace before `:` for all prefixed line types; regression in `ParseAsync_SpacedPolPrefixBeforeColon_ExtractsPolicyControl`
- [x] (valid-no-repro) `BicepArrayLiteralConverter.TryParsePrimitiveStrings` — boolean `list(bool)` arrays silently dropped — `service_endpoints = [true, false]` already emits canonicalized `tf.service_endpoints`; regression in `ParseAsync_BooleanPrimitiveArray_PreservesTfProperty`

2026-09-04 seed hunt #741: reseeded from Bicep/terraform parser parity; proved multiline-array `#` probe and inline `#` scalar gaps; cheap-disproved POL spaced-prefix and boolean primitive-array candidates.

- [x] (proven) `BicepResourceBodyParser` / `SimpleTerraformResourceBlockParser.TryConsumeMultilineArrayAssignment` — `/* */` block-comment lines before `[` not skipped during multiline array probe — **hit 2026-09-04 (#742):** probe skipped `#`/`//` after #741 but not block comments, so `ipSecurityRestrictions:` + `/* legacy */` + `[...]` dropped `tf.ipsecurityrestrictions` and leaked inner rule scalars (#527/`#` parity gap); fixed with `InfrastructureDeclarationLineCommentScanner.TryConsumeBlockComment` in probe loop; regressions in `ParseAsync_MultilineIpSecurityRestrictionsArrayWithBlockCommentBeforeBracket_PreservesRulesForNetworkExpander` (Bicep and simple-terraform)
- [x] (valid-no-repro) `BicepResourceBodyParser` — inline `#` after `[` on same-line array header — `ipSecurityRestrictions: [ # legacy` already preserves rules via comment-aware `ExtractBalancedBracketBody`; regression candidate deferred (same-line `#` after `[` passes existing bracket extractor)
- [x] (valid-no-repro) `PlainTextDocumentPrefixedLine` — `SEC :` spaced-prefix parity — shared `TryGetPrefixedBody` already accepts optional whitespace before `:`; regression in `ParseAsync_SpacedSecPrefixBeforeColon_ExtractsSecurityBaseline` (added this hunt)

2026-09-04 seed hunt #742: reseeded multiline-array probe after #741 `#` fix; proved block-comment before `[` gap in Bicep and simple-terraform; cheap-disproved inline-`#`-after-`[` and `SEC :` prefix candidates.

- [x] (proven) `BicepResourceBodyParser` scalar/array/multiline assignment regexes — HCL `=` assignments silently ignored in Bicep bodies — **hit 2026-09-04 (#743):** `publicNetworkAccess = 'Enabled'` and `ipSecurityRestrictions = [...]` were not parsed while `BicepArrayLiteralConverter` already accepted `=` inside array objects; fixed by allowing `(?::|=)` in body assignment regexes; regressions in `ParseAsync_HclEqualsScalarAssignment_ParsesTfProperty` and `ParseAsync_HclEqualsArrayHeader_PreservesIpSecurityRestrictions`
- [x] (valid-no-repro) Multiline `/* */` block comment spanning multiple lines before `[` — `InfrastructureDeclarationLineCommentScanner` in probe loop already skips spanning comments; covered by existing #742 single-line block-comment regression
- [x] (valid-no-repro) Two empty objects in security array `[{}, {}]` — #656 empty-object append already serializes multiple elements; regression in `ParseAsync_TwoEmptyObjectsInSecurityArray_PreservesTfProperty`
- [x] (valid-no-repro) Bicep line-level `${...}` interpolation reference lines — lines without `:`/`=` assignment shape are skipped without leaking scalars

2026-09-04 seed hunt #743: reseeded Bicep body parser after #742 comment-probe fixes; proved HCL `=` assignment parity gap; cheap-disproved spanning block-comment, dual empty-object, and `${}` line candidates.

- [x] (proven) `BicepResourceBodyParser.NestedBlockStartRegex` — HCL `=` nested block headers silently parsed as scalar `{` — **hit 2026-09-04 (#746):** `networkAcls = { defaultAction: 'Deny' }` stored `tf.networkacls = '{'` and leaked `tf.defaultaction` while scalar/array `#743` parity accepted `=`; fixed by allowing `(?::|=)` in nested-block regex; regression in `ParseAsync_HclEqualsNestedBlockHeader_PreservesNetworkAclsBlock`.
- [x] (proven) `BicepResourceBodyParser.TryConsumeArrayAssignment` — inline `#` comment between `=` and `[` on same-line array header not skipped — **hit 2026-09-04 (#748):** `ipSecurityRestrictions = # legacy rules [...]` missed `ArrayAssignmentRegex` and stored no `tf.ipsecurityrestrictions`; fixed by allowing `(?:#[^[]*)?` before `[` in Bicep/terraform array assignment regexes; regressions in `ParseAsync_InlineHashCommentBeforeArrayBracket_PreservesIpSecurityRestrictions` (Bicep + simple-terraform).
- [x] (invalid) `SimpleTerraformResourceBlockParser.NestedBlockStartRegex` — Bicep-style `block: {` colon headers in HCL bodies — invalid HCL; `NestedBlockStartRegex` requires `{` immediately after block name and customer payloads use `block {` only.
- [x] (valid-no-repro) `BicepResourceBodyParser` — `${...}` interpolation inside nested block bodies may leak partial scalars when closing brace balance is malformed — scalar assignments containing `${` are skipped (`ParseBodyIntoProperties` lines 114–118); malformed references do not emit partial `tf.*` scalars.

2026-09-04 thorough hunt #748: proved inline-hash-before-bracket array header gap; cheap-disproved HCL colon-nested-block and malformed-interpolation candidates.

- [x] (proven) `BicepResourceBodyParser.ArrayAssignmentRegex` — inline `//` comment between `=` and `[` on same-line array header not skipped — **hit 2026-09-04 (#749):** `#748` added `#` probe only; `ipSecurityRestrictions = // legacy [...]` still missed array parsing; fixed with `(?:#[^[]*|//[^[]*)?` before `[` in Bicep/terraform array regexes; regressions in `ParseAsync_InlineSlashSlashCommentBeforeArrayBracket_PreservesIpSecurityRestrictions`.
- [x] (proven) `BicepResourceBodyParser.NestedBlockStartRegex` — inline `#`/`//` comment between `=` and `{` on same-line nested block header not skipped — **hit 2026-09-04 (#749):** `networkAcls = # deny { ... }` stored scalar `{` after `#746` `=` parity; fixed with `(?:#[^{]*|//[^{]*)?` before `{` (Bicep `:`/`=` headers and terraform `block` headers); regressions in `ParseAsync_InlineHashCommentBeforeNestedBlockBrace_PreservesNetworkAclsBlock` and `ParseAsync_InlineHashCommentBeforeNestedBlockBrace_PreservesRetentionPolicyBlock`.
- [x] (valid-no-repro) Same-line `/* */` block comment between assignment operator and `[` or `{` — `InfrastructureDeclarationLineCommentScanner.TryConsumeBlockComment` strips inline block comments from each body line before `ArrayAssignmentRegex` / `NestedBlockStartRegex` matching (#749 `#`/`//` regex parity already handled EOL comments only); **cheap-disproof 2026-09-04 (#753):** regressions in `ParseAsync_InlineBlockCommentBeforeArrayBracket_PreservesIpSecurityRestrictions`, `ParseAsync_InlineBlockCommentBeforeNestedBlockBrace_PreservesNetworkAclsBlock`, and terraform parity tests.
- [x] (valid-no-repro) `BicepResourceBodyParser.MultilineArrayAssignmentRegex` — `//` full-line comment between `=` and multiline `[` — **cheap-disproof 2026-09-04 (#753):** `TryConsumeMultilineArrayAssignment` probe loop already skips `//` lines (hash #741 parity); regression in `ParseAsync_MultilineIpSecurityRestrictionsArrayWithSlashSlashCommentLine_PreservesRulesForNetworkExpander`.

2026-09-04 thorough hunt #753 (dry): cheap-disproved two #749 block-comment and multiline-`//` candidates; added inline-block and multiline-`//` regression coverage; no new hunt-ready repro in zone.

- [x] (proven) `BicepResourceBodyParser` / `SimpleTerraformResourceBlockParser` — multiline nested-block headers (`key =` newline `{`) flattened inner scalars to parent `tf.*` — **hit 2026-09-05 (#803):** `#527` multiline-array parity gap for `{` delimiters; `networkAcls =` / `retention_policy =` on own line skipped `NestedBlockStartRegex` and leaked `defaultAction`/`days` as top-level keys; fixed with `TryConsumeMultilineNestedBlockAssignment` (`ParseAsync_MultilineNestedBlockHeader_PreservesNetworkAclsBlock`, `ParseAsync_MultilineNestedBlockHeader_PreservesRetentionPolicyBlock`).
- [ ] (candidate) `KubernetesManifestCanonicalObjectMapper.ProjectContainerSecurityContext` — snake_case `security_context` fields not projected; `TryGetPropertyIgnoreCase` does not bridge naming-convention variants.
- [ ] (candidate) `TerraformShowJsonInfrastructureDeclarationParser.TryAddResource` — `values` loop skips `ShouldRedactKey` when `sensitive_values` absent; plaintext `connection_string` may leak into `tf.*` properties.

2026-09-05 seed hunt #803: reseeded after dry #753; proved multiline nested-block header gap; reseeded K8s snake_case security_context and terraform-show-json redaction candidates.

2026-09-04 seed hunt #749: reseeded after #748 hash-before-bracket fix; proved `//`-before-bracket and hash/slash-before-brace nested-header gaps; seeded block-comment-before-delimiter and multiline-`//`-probe candidates.

- [x] (proven) `PlainTextContextDocumentParser` required `REQ:`/`POL:`/`TOP:`/`SEC:` prefix without optional whitespace before colon — **hit 2026-09-02:** `REQ : Must scale` lines were skipped while `REQ: Must scale` parsed; fixed with `TryGetPrefixedBody` accepting optional whitespace before `:` (`PlainTextContextDocumentParserTests.ParseAsync_SpacedPrefixBeforeColon_ExtractsRequirement`).
- [x] (proven) `BicepResourceBodyParser` treated `key: [` array headers as scalar assignments — **hit 2026-09-02:** `ipSecurityRestrictions: [` stored `tf.ipsecurityrestrictions = "["` and leaked inner object scalars (`tf.name`, `tf.ipaddress`) so App Service network-rule expander never ran; fixed with balanced-bracket extraction and `BicepArrayLiteralConverter` JSON serialization (`BicepInfrastructureDeclarationParserTests.ParseAsync_AppServiceIpSecurityRestrictionsArray_IsPreservedForNetworkExpander`, `ParseAsync_AppServiceIpSecurityRestrictionsArray_ExpandsNetworkBaseline`).

2026-09-02 seed hunt #429: reseeded from exhausted zone files; proved Bicep array literal parsing and plain-text spaced-prefix extraction.

- [x] (proven) `BicepInfrastructureDeclarationParser` duplicate symbolic resource names shared `ObjectId` / delta key — **hit 2026-09-02:** two `resource storage` blocks with different API versions collapsed in `InfrastructureDeclarationStableObjectIds` (terraform `terraformOccurrence` / K8s `k8sOccurrence` parity gap); fixed with per-declaration `bicepOccurrence` suffix (`BicepInfrastructureDeclarationParserTests.ParseAsync_DuplicateSymbolicNamesDifferentApiVersions_EmitDistinctObjectIds`).
- [x] (proven) `PlainTextContextDocumentParser.CanonicalizeLineText` did not collapse internal whitespace on `REQ:`/`POL:`/`SEC:` lines — **hit 2026-09-02:** `REQ: Must  Encrypt` vs `REQ: Must Encrypt` churned document connector stable ids (`TOP:` path already used `TopologyHintStableObjectIds.CanonicalizeHintName`); fixed by canonicalizing all prefixed line types (`PlainTextContextDocumentParserTests.ParseAsync_RequirementInternalWhitespace_Reparse_ProducesStableObjectId`).

2026-08-27 seed hunt #121: reseeded Bicep duplicate-name and plain-text internal-whitespace candidates; proved Bicep inline `//` comment scalar normalization.

2026-08-26 seed hunt #55: proved ARM tf JSON canonicalization, nested sensitive ARM blobs, HCL block comments, duplicate K8s occurrence, security-priority tf cap.

- [x] (proven) `ArmJsonInfrastructureDeclarationParser.TryAddResource` — non-deployment parent `resources[]` (e.g. VNet nested subnets) silently dropped — **hit 2026-09-02:** only deployment-wrapper children were recursed; fixed by recursing nested `resources[]` after adding each parent resource (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_VnetNestedSubnets_MapsChildResources`).
- [x] (proven) `BicepResourceBodyParser.ParseBodyIntoProperties` — `/* */` block comments parsed as scalar assignments — **hit 2026-09-02:** HCL parity already existed in `SimpleTerraformResourceBlockParser`; fixed with `TryConsumeBlockComment` in Bicep body scanner (`BicepInfrastructureDeclarationParserTests.ParseAsync_BlockCommentBeforeAssignment_StillParsesPublicNetworkAccess`).
- [x] (proven) `BicepResourceBodyParser.UnquoteScalar` — inline `/* */` after scalar values polluted `tf.*` canonical values — **hit 2026-09-02:** `publicNetworkAccess: 'Enabled' /* primary region */` false-modified infra declaration deltas; fixed with `StripTrailingBlockComment` (`BicepInfrastructureDeclarationParserTests.ParseAsync_InlineBlockCommentAfterValue_ParsesCleanPublicNetworkAccess`).
- [x] (proven) `CanonicalTfJsonSerializer.WriteValue` — array element order preserved verbatim — **hit 2026-09-02:** semantically identical `tf.*` array reorderings false-modified infrastructure declaration deltas; fixed by sorting array elements by canonical serialized form (`InfrastructureDeclarationConnectorTests.DeltaAsync_ArmJsonArrayPropertyOrderChange_ReportsUnchanged`).

2026-09-02 thorough hunt #428: proved all six open candidates (Bicep occurrence, plain-text whitespace, ARM nested children, Bicep block/inline block comments, tf-array order).

2026-08-27 seed hunt #56: proved kubernetes-json top-level resource array; seeded ARM nested-child, Bicep block-comment, Bicep inline-block-comment, and tf-array-order candidates.

- [x] (proven) `SimpleTerraformResourceBlockParser.ResourceHeaderRegex` accepted only double-quoted resource headers — **hit 2026-08-26:** `resource 'azurerm_virtual_network' 'core'` returned zero resources; fixed with single-quoted header alternation (`SimpleTerraformDeclarationParserTests.ParseAsync_SingleQuotedResourceHeader_MapsResource`).
- [x] (proven) `SimpleTerraformResourceBlockParser.ParseBodyIntoProperties` re-parsed nested block inner lines as top-level scalars — **hit 2026-08-26:** `site_config { public_network_access = "Disabled" }` also emitted spurious `tf.public_network_access`; fixed by advancing `lineIndex` past consumed nested block lines (`SimpleTerraformDeclarationParserTests.ParseAsync_NestedBlock_DoesNotEmitDuplicateTopLevelScalars`).
- [x] (proven) `SimpleTerraformResourceBlockParser` preserved inline `#` comments in scalar values — **hit 2026-08-26:** `location = "eastus" # primary` false-modified infra declaration deltas; fixed with `StripTrailingHclComment` before unquoting (`SimpleTerraformDeclarationParserTests.ParseAsync_InlineHashComment_DoesNotChangeTfLocation`).
- [x] (proven) `JsonInfrastructureDeclarationParser` accepted only `{ "resources": [...] }` shape — **hit 2026-08-26:** top-level resource array `[{ "type": "vnet", ... }]` returned zero resources; fixed by parsing root arrays (`JsonInfrastructureDeclarationParserTests.ParseAsync_TopLevelResourceArray_MapsVnet`).
- [x] (proven) `ArmJsonInfrastructureDeclarationParser.TryAddResource` early-return on `Microsoft.Resources/deployments` dropped child `resources[]` — **hit 2026-08-26:** nested VNet inside deployment wrapper returned zero resources; fixed by recursing into deployment children before return (`ArmJsonInfrastructureDeclarationParserTests.ParseAsync_DeploymentWrapperChildren_MapsNestedVnet`).
- [x] (proven) `KubernetesJsonInfrastructureDeclarationParser.ParseAsync` accepted only single-object root documents — **hit 2026-08-27:** top-level manifest array `[{ "kind": "Deployment", ... }, { "kind": "Service", ... }]` returned zero resources (unlike `kind: List` wrapper and unlike proven `json` top-level array fix); fixed by expanding root arrays before `KubernetesManifestCanonicalObjectMapper.MapDocuments` (`KubernetesJsonInfrastructureDeclarationParserTests.ParseAsync_TopLevelResourceArray_MapsMultipleKinds`).

2026-08-26 seed hunt #55: reseeded simple-terraform headers/nested blocks/comments / JSON top-level array / ARM deployment children; proved all five hunt-ready rows.

2026-08-26 thorough hunt #54: proved nested terraform sensitive_values redaction gap; disproved K8s YAML List parser gap.

2026-08-26 thorough hunt #53: proved arm-json array property serialization gap for App Service network rules.

2026-08-26 thorough hunt #52: proved topology-hints within-batch dedupe gap.

2026-08-26 seed hunt #51: reseeded ARM array / nested sensitive_values / K8s YAML List / topology-hint dedupe candidates; proved camelCase sensitive-key redaction gap.

2026-08-26 seed hunt #49: reseeded terraform-show-json casing path; proved PascalCase property reads.

2026-08-26 seed hunt #48: reseeded ARM/K8s parser casing paths; proved arm-json PascalCase property reads.

2026-08-26 seed hunt #47: reseeded from mapper/enricher paths; proved lowercase Kubernetes kind `ObjectType` classification.

2026-08-26 thorough hunt #46: proved long-hint topology display name alignment.

2026-08-26 thorough hunt #45: proved PascalCase kubernetes-yaml parsing and policy/topology overlap delimiter matching.

2026-08-26 seed hunt #44: reseeded three rows; proved sensitivity-scope padding mismatch.

---

## Zone: knowledge-graph-provenance

- **id:** knowledge-graph-provenance
- **status:** open
- **impact:** medium
- **aliases:** knowledge graph; provenance; lineage
- **paths:** ArchLucid.KnowledgeGraph/; ArchLucid.Provenance/
- **test-filter:** FullyQualifiedName~KnowledgeGraph|FullyQualifiedName~Provenance
- **hunts:** 7
- **bugs-found:** 7
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — `KnowledgeGraphService` truncation dropped edges when endpoint `NodeId` casing differed from kept nodes
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Graph merge links a node to provenance from another tenant — `DefaultGraphBuilder` / `ProvenanceBuilder` build from a single scoped snapshot; tenant isolation is repository/query scope, not a merge defect in these files
- [x] (invalid) Lineage query traverses into a sibling tenant's artifact store — `ArchLucid.Provenance` query/build paths do not open cross-tenant artifact stores; persistence uses `ScopeContext` on snapshot reads/writes
- [x] (invalid) Provenance record is written without workspace scope — `SqlProvenanceSnapshotRepository` and `ProvenanceGraphAccessService` persist/query with `TenantId` + `WorkspaceId` + `ProjectId`
- [x] (proven) Topology projected-spend enrichment overwrites parsed constraint spend when property keys use non-canonical casing — **hit 2026-08-19:** `CostConstraintProjectedSpendEnricher.HasProjectedSpend` used case-sensitive `ContainsKey` while deserialized `GraphNode.Properties` can use PascalCase keys
- [x] (proven) Topology cost projection under-scales when instance-count property keys use PascalCase — **hit 2026-08-19:** `GraphTopologyInfrastructureCostNodes.ReadProperty` used case-sensitive `TryGetValue`, so `InstanceCount` on deserialized nodes defaulted quantity to 1
- [x] (proven) Explicit parent-child containment edges omitted when `parentNodeId` uses PascalCase on a case-sensitive property bag — **hit 2026-08-20:** `DefaultGraphEdgeInferer` used case-sensitive `Properties.TryGetValue` for `parentNodeId`, `connectedToNodeIds`, and targeted topology id keys
- [x] (proven) WAF alignment flag omitted when associated-findings property keys use PascalCase — **hit 2026-08-21:** `GraphMaterializationStages` read `associatedFindings` / `findings` from raw `CanonicalObject.Properties` with case-sensitive `TryGetValue` instead of the normalized node bag via `GraphNodePropertyReader`
- [x] (proven) Topology sensitivity misclassified when property keys use PascalCase on a case-sensitive bag — **hit 2026-08-23:** `TopologySensitivityClassifier` used case-sensitive `TryGetValue` for `topologySensitivity`, `category`, `publicNetworkAccess`, and `resourceType` instead of `GraphNodePropertyReader`
- [x] (proven) Graph→finding provenance edge omitted when `RelatedNodeIds` casing differs from graph `NodeId` — **hit 2026-09-02:** `ProvenanceBuilder` used ordinal `graphNodeIds` and `nodeMap` keys, so `InfluencedByGraphNode` was skipped when findings referenced the same node with different casing; fixed with `StringComparer.OrdinalIgnoreCase` (`Build_links_graph_influence_when_related_node_id_differs_only_by_case`)
- [x] (proven) `KnowledgeGraphService.BuildSnapshotAsync` truncation dropped valid edges when endpoint casing differed from kept node ids — **hit 2026-09-04 (#713):** `kept` used `StringComparer.Ordinal` while `GraphValidator` and inferrers treat node ids case-insensitively; edges with `FromNodeId`/`ToNodeId` casing variants were removed during `MaxNodes` truncation; fixed with `OrdinalIgnoreCase` on `kept`; regression `BuildSnapshotAsync_TruncationRetainsEdgesWhenEndpointCasingDiffersFromKeptNodeId`
- [x] (valid-no-repro) `ContributingDecisionIds.Distinct(StringComparer.Ordinal)` vs manifest decision id casing — `nodeMap` is `OrdinalIgnoreCase` so `ContributedToArtifact` edges still resolve; casing-only duplicates may emit duplicate edges (low severity parity gap with `AppliedRuleIds` dedup)

2026-09-02 seed hunt #421 (hit): promoted graph→finding case-mismatch from `ProvenanceBuilder` vs `DefaultGraphEdgeInferer`/`GraphValidator` ordinal-ignore-case parity; proved with failing repro.

2026-09-04 seed hunt #713 (hit): proved truncation edge filter case mismatch; cheap-disproof on `ContributingDecisionIds` casing (duplicate edges only).

---

## Zone: notifications-pipeline

- **id:** notifications-pipeline
- **status:** open
- **impact:** medium
- **aliases:** notifications; email dispatchers beyond weekly summary
- **paths:** ArchLucid.Notifications/; ArchLucid.Application/Notifications/; ArchLucid.Api/Controllers/Advisory/DigestSubscriptionsController.cs
- **test-filter:** FullyQualifiedName~Notifications|FullyQualifiedName~EmailDispatcher|FullyQualifiedName~DigestSubscriptionsController
- **hunts:** 17
- **bugs-found:** 28
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — trial/commit admin mailbox trim-only bypassed IdentityEmailNormalizer
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (invalid) Dispatcher sends to recipients outside the tenant membership list — no membership-validation locus in zone; callers supply mailboxes
- [x] (invalid) Template render includes another user's email in the body — zone Razor models carry URLs/metadata only, no cross-user mailbox fields
- [x] (invalid) Send failure is treated as success and suppresses retry — post-reservation ledger block is documented intentional (TB-089 / EMAIL_NOTIFICATIONS.md)
- [x] (proven) Weekly sponsor summary and report dispatchers share one idempotency key — **hit 2026-08-19:** `WeeklySponsorSummaryEmailDispatcher` reused `weekly-sponsor-report:{tenant}:{isoWeek}` so the summary email was skipped when the report sent first in the same ISO week
- [x] (proven) Weekly sponsor summary email subject still says "report" — **hit 2026-08-23:** `WeeklySponsorSummaryEmailDispatcher.TryDispatchAsync` copied subject/log strings from `WeeklySponsorReportEmailDispatcher` after the idempotency-key split; recipients saw "weekly sponsor report" on the summary email class
- [x] (proven) Weekly sponsor summary Razor template references a deleted model type — **hit 2026-08-24:** `WeeklySponsorSummary.cshtml` still declared `@model WeeklyExecutiveSummaryEmailModel` after the rename to `WeeklySponsorReportEmailModel`, so RazorLight compilation failed on every summary dispatch; fixed model binding and sponsor-summary copy.
- [x] (proven) Weekly sponsor report template is missing from embedded Razor resources — **hit 2026-08-24:** `WeeklySponsorReportEmailDispatcher` targeted `WeeklySponsorReport` but no `WeeklySponsorReport.cshtml` shipped; report email render threw `TemplateNotFoundException`; added template and removed orphan `WeeklyExecutiveSummary.cshtml`.
- [x] (proven) Weekly sponsor summary reserved the sent-email ledger before template render — **hit 2026-08-24:** a render failure reserved the weekly ledger key and permanently skipped the summary for that tenant/week; fixed by rendering before ledger reservation (matching the report dispatcher).
- [x] (proven) Finding remediation assignment email swallowed provider send failures — **hit 2026-08-24:** `FindingRemediationAssignmentEmailDispatcher` returned `false` after reserving the ledger, so the assignment API returned 204 while the assignee never received mail and retries were blocked; fixed by throwing on send failure and recording the ledger only after a successful send.
- [x] (proven) Recurrence completion email reserved ledger before template render — **hit 2026-08-24:** `RecurrenceCompletionEmailDispatcher` called `TryRecordSentAsync` before `RenderHtmlAsync`; a Razor failure permanently suppressed the schedule-run email; fixed by rendering before ledger reservation.
- [x] (proven) Weekly sponsor summary treated whitespace-only recipients as success — **hit 2026-08-24:** `WeeklySponsorSummaryEmailDispatcher` only checked `toMailboxes.Count == 0`, reserved the ledger, skipped blank entries, and returned `true` without sending; fixed by normalizing recipients like the report dispatcher.
- [x] (proven) Exec digest email reserved ledger before template render — **hit 2026-08-24:** `ExecDigestEmailDispatcher` reserved the weekly ledger before render and accepted all-whitespace recipient lists; fixed by render-before-ledger and recipient normalization.
- [x] (proven) Trial lifecycle email reserved ledger before template render — **hit 2026-08-24:** `TrialLifecycleEmailDispatcher` reserved the idempotency key before Razor render; template failures permanently blocked trial onboarding mail; fixed by rendering before ledger reservation.
- [x] (proven) Digest webhook subscriptions bypass the alert-routing SSRF destination policy — **hit 2026-08-24:** `DigestSubscriptionsController.Create` persisted `SlackWebhook` and `TeamsWebhook` destinations without calling `AlertRoutingWebhookDestinationPolicy`, accepting HTTP and loopback URLs; fixed by applying the shared policy before persistence.
- [x] (proven) Multi-recipient digest dispatch reserved tenant-level ledger before the send loop — **hit 2026-08-25:** `ExecDigestEmailDispatcher` (and sibling weekly/recurrence dispatchers) called `TryRecordSentAsync` on the tenant/week key before iterating mailboxes; when the first recipient succeeded and a later send failed, retry returned `false` and skipped remaining recipients; fixed with per-mailbox send-then-ledger via `MultiRecipientEmailDispatch` and `ISentEmailLedger.IsRecordedAsync`; regression in `ExecDigestEmailDispatcher_partial_multi_recipient_send_failure_delivers_remaining_recipients_on_retry`.
- [x] (proven) Digest subscription create accepts blank channel/destination — **hit 2026-08-25:** `DigestSubscriptionsController.Create` persisted subscriptions with empty `ChannelType`/`Destination` while `AlertRoutingSubscriptionsController` rejects them; fixed required-field validation; regression in `Create_rejects_blank_channel_or_destination`
- [x] (invalid) Commit sponsor email has no sent-email ledger — single-recipient notifier uses stable provider idempotency key `architecture-commit-sponsor:{tenant}:{runId}`; no multi-recipient retry loop that `ISentEmailLedger` guards
- [x] (proven) User invitation email idempotency key includes fresh GUID — **hit 2026-08-25:** `UserInvitationEmailNotifier` appended `Guid.NewGuid()` on every send so provider retries duplicated invitation mail; fixed with invitation-token suffix from `acceptUrl`; regression in `TrySendInvitationAsync_uses_stable_idempotency_key_for_same_invitation`
- [x] (proven) Email OTP idempotency key buckets by minute — **hit 2026-08-25:** `EmailOtpEmailNotifier` keyed idempotency as `template:email:yyyyMMddHHmm`, so a second sign-in code issued within the same minute reused the provider key and could suppress delivery of the new code; fixed with per-code fingerprint via `EmailOtpRequestMetadataHasher`; regression in `TrySendSignInCodeAsync_uses_distinct_idempotency_keys_for_different_codes_in_same_minute`
- [x] (proven) Trial lifecycle email reserved ledger before provider send — **hit 2026-08-25:** `TrialLifecycleEmailDispatcher` called `TryRecordSentAsync` before `SendAsync`; a transient send failure left the ledger reserved and blocked Service Bus retry; fixed with `IsRecordedAsync` skip + record-after-send (`TrialLifecycleEmailDispatcherTests.DispatchAsync_send_failure_does_not_block_retry`).
- [x] (valid-no-repro) Marketing and support notifiers swallow send failures without surfacing to callers — `MarketingEarlyAccessSalesNotifier` and `SupportProblemReportNotifier` log and return after durable capture (`AppendAsync` / `InsertAsync`); callers are fire-and-forget notification side-effects with provider idempotency keys, not ledger-guarded multi-recipient dispatch.
- [x] (invalid) Digest webhook delivery omits digest attempt persistence on channel failure — `DigestDeliveryDispatcher` (caller) creates and updates `DigestDeliveryAttempt` rows for every channel including Slack webhook; channel delegates delivery only (`DigestDeliveryDispatcherTests.DeliverAsync_WhenChannelFails_AuditsFailureWithoutThrowing`).
- [x] (proven) `FindingRemediationAssignmentEmailDispatcher` resent assignment mail on idempotent retry — **hit 2026-08-26:** dispatcher skipped `IsRecordedAsync` before send, so safe retries duplicated mail and returned `false`; fixed with ledger short-circuit before render (`FindingRemediationAssignmentEmailDispatcherTests.TryDispatchAsync_skips_duplicate_send_when_ledger_already_recorded`).
- [x] (proven) `DigestSubscriptionsController.Create` persisted whitespace-padded destinations without trimming — **hit 2026-09-02 (#425):** trimmed `ChannelType`/`Destination` before persistence like alert routing; regression in `DigestSubscriptionsControllerTests.Create_trims_channel_type_and_destination_before_persisting`.
- [x] (invalid) Advisory digest email subscriptions route through `FakeEmailSender` only — digest and alert email channels share `IEmailSender` abstraction wired to `FakeEmailSender` in composition; transactional mail uses separate `IEmailProvider` path by design until production digest/alert email integration ships.
- [x] (proven) `DigestSubscriptionsController.Create` accepted unknown channel types — **hit 2026-09-02 (#425):** invalid `channelType` persisted until dispatch failed each scan; fixed with supported-channel validation at create; regression in `DigestSubscriptionsControllerTests.Create_rejects_unknown_channel_types`.
- [x] (proven) `RecurrenceCompletionNotificationService` recorded `emailSent: false` on replay when ledger already recorded all recipients — **hit 2026-09-02 (#425):** `MultiRecipientEmailDispatch` returned `false` when every mailbox was skipped via `IsRecordedAsync`; fixed idempotent replay to return `true` (parity with `FindingRemediationAssignmentEmailDispatcher`); regression in `RecurrenceCompletionEmailDispatcherTests.TryDispatchAsync_returns_true_when_all_mailboxes_already_recorded`.

2026-09-02 thorough hunt #425: proved digest subscription trim + unknown-channel validation; multi-recipient ledger replay success; cheap-disproved FakeEmailSender as shared digest/alert composition design.

- [x] (proven) `DigestSubscriptionFacade.CreateAsync` accepted non-mailbox Email destinations — **hit 2026-09-03 (#540):** `finance-team` and `finance@` persisted while exec/sponsor digest preferences already validate mailboxes via `IdentityEmailNormalizer`; fixed with email-channel mailbox validation and lowercase normalization (`DigestSubscriptionsControllerTests.Create_rejects_invalid_email_destination`).
- [x] (proven) `DigestSubscriptionFacade.CreateAsync` persisted non-canonical `ChannelType` casing — **hit 2026-09-03 (#540):** lowercase `email` stored as-is instead of `DigestDeliveryChannelType.Email`; fixed with `CanonicalizeChannelType` (`DigestSubscriptionsControllerTests.Create_canonicalizes_email_channel_type_to_contract_constant`).
- [x] (proven) `ExecDigestUnsubscribeController` success text copied from sponsor digest — **hit 2026-09-03 (#540):** valid exec-digest unsubscribe returned `"Sponsor digest email has been turned off..."`; fixed copy to `"Exec digest email..."` (`ExecDigestUnsubscribeControllerTests.UnsubscribeAsync_valid_token_disables_email_and_returns_plain_text`).
- [x] (proven) `FindingRemediationAssignmentEmailDispatcher` accepted malformed assignee mailboxes — **hit 2026-09-03 (#583):** `IsMailboxAddress` only required `@` with index > 0, so `finance@` rendered and sent while digest subscriptions reject via `IdentityEmailNormalizer`; fixed with shared normalizer; regression in `FindingRemediationAssignmentEmailDispatcherTests.TryDispatchAsync_rejects_invalid_assignee_mailbox_without_sending`.
- [x] (invalid) `WeeklySponsorReportEmailDispatcher` subject capitalizes "Sponsor" while summary email uses lowercase "sponsor" — intentional product copy distinction (`weekly Sponsor report` vs `weekly sponsor summary`); no delivery/idempotency impact.
- [x] (proven) `TrialLifecycleEmailDispatcher` / `TrialScheduledLifecycleEmailScanner` — lowercase `TrialStatus` not treated as active/converted — **hit 2026-09-03 (#623):** after Core #600/#601 `OrdinalIgnoreCase` parity, notifications pipeline still used `Ordinal` so `trialStatus:"active"` skipped scheduled scans and lifecycle dispatch; fixed with `OrdinalIgnoreCase` (`DispatchAsync_sends_welcome_when_trial_status_is_lowercase_active`, `DispatchAsync_sends_converted_email_when_trial_status_is_lowercase_converted`, `PublishDueAsync_publishes_mid_trial_for_lowercase_active_trial_status`).

2026-09-03 thorough hunt #623: proved trial lifecycle TrialStatus casing gap; cheap-disproved sponsor subject capitalization as copy-only.

- [x] (proven) `TrialLifecycleEmailDispatcher.PassesTriggerGate` — lowercase `TrialStatus` suppresses lifecycle mail — **hit 2026-09-03 (#613):** `trialStatus:"active"` failed `Ordinal` compare against `TrialLifecycleStatus.Active` after #600–#601 fixed sibling Core tenancy helpers; mid-trial/expiring/limit emails silently skipped; fixed with `OrdinalIgnoreCase` for Active/Converted gates (`DispatchAsync_sends_mid_trial_email_when_trial_status_is_lowercase_active`).
- [x] (invalid) `ExecDigestUnsubscribeController` class XML summary still says sponsor digest — wrong developer-doc `<summary>` on exec controller; user-visible unsubscribe response copy fixed in #540.

2026-09-03 thorough hunt #613: cheap-disproved sponsor subject capitalization candidate; proved trial lifecycle TrialStatus casing gap.

2026-09-03 seed hunt #583: reseeded notifications-pipeline; proved remediation-assignment mailbox validation gap vs digest subscription parity; cheap-disproved exec unsubscribe XML summary as non-user-facing.

- [x] (proven) `TrialLifecycleEmailDispatcher` / `TrialScheduledLifecycleEmailScanner` — padded `TrialStatus` bypasses active/converted gates — **hit 2026-09-04 (#660):** after Core #642 `TrialLifecycleStatus.EqualsStatus` trim parity elsewhere, notifications pipeline still used raw `string.Equals` so `" active "` skipped welcome/mid-trial/expiring mail and scheduled scans; fixed with `TrialLifecycleStatus.EqualsStatus` for Active/Converted gates; regressions in `DispatchAsync_sends_welcome_when_padded_active_trial_status` and `PublishDueAsync_publishes_mid_trial_for_padded_active_trial_status`.

2026-09-04 seed hunt #660: reseeded from trial lifecycle TrialStatus parity after #623 casing fix; proved padded TrialStatus gate gap vs Core `EqualsStatus` trim parity.

- [x] (proven) `TrialLifecycleEmailDispatcher.PassesTriggerGate` / `TrialScheduledLifecycleEmailScanner.PublishDueAsync` — `Expired` trigger required `TrialStatus == Active`, so lifecycle scheduler advancing `Active → Expired` before dispatch or scan permanently suppressed trial-ended mail — **hit 2026-09-04 (#754):** allow `Expired` trigger for Active or Expired tenants with past `TrialExpiresUtc`; scanner enqueues expired trigger for Expired tenants; regressions in `DispatchAsync_sends_expired_email_when_trial_status_already_expired` and `PublishDueAsync_publishes_expired_trigger_when_trial_status_already_expired`.
- [x] (valid-no-repro) `ExecDigestUnsubscribeController` / `SponsorDigestUnsubscribeController` — valid token when `TryDisableEmailAsync` returns false (missing prefs or already disabled) still returns HTTP 200 success copy — **cheap-disproof 2026-09-05 (#795):** intentional idempotent unsubscribe UX; signed token proves intent; duplicate clicks and already-disabled prefs should not surface errors to end users.
- [x] (proven) `TrialLifecycleEmailDispatcher.DispatchAsync` / `CommitSponsorEmailNotifier.NotifyAfterCommitAsync` — admin mailbox from `ITenantTrialEmailContactLookup` accepted with trim-only (`Contains('@')` upstream) and sent to malformed addresses like `finance@` while digest subscriptions and remediation assignment reject via `IdentityEmailNormalizer` — **hit 2026-09-05 (#795):** validate and normalize admin mailbox before send; regressions in `DispatchAsync_skips_send_when_admin_mailbox_is_malformed` and `NotifyAfterCommitAsync_when_admin_mailbox_malformed_does_not_send`.

2026-09-05 thorough hunt #795 (hit): proved admin-mailbox normalization gap; cheap-disproved unsubscribe idempotency as intentional.

2026-09-04 seed hunt #754: reseeded notifications-pipeline after #660; proved trial expired-email race between lifecycle advancement and email dispatch/scan; seeded unsubscribe idempotency and admin-mailbox normalization candidates.

## Zone: artifact-synthesis

- **id:** artifact-synthesis
- **status:** open
- **impact:** medium
- **aliases:** artifact synthesis; docx generator; packaging sanitization
- **paths:** ArchLucid.ArtifactSynthesis/
- **test-filter:** FullyQualifiedName~ArtifactSynthesis|FullyQualifiedName~Docx
- **hunts:** 7
- **bugs-found:** 9
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-09-04 — DOCX export omitted assumptions/constraints and unsanitized posture gaps
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Generated document embeds unsanitized user HTML/script — `LlmArtifactFreeTextSanitizer` and `WordDocumentBuilder` emit plain OpenXML text nodes (control/bidi strip only); DOCX does not execute embedded markup as script
- [x] (invalid) Packager includes artifacts from a run outside the requested scope — `ArtifactPackagingService` only zips the `artifacts` list passed by the caller; no cross-run artifact selection locus in this zone
- [x] (invalid) Validation passes when required manifest hash is missing — `ExportManifestBuilder` intentionally writes empty `committedManifestHash` when `RunExportReadmeContext.ManifestHash` is absent; `ArtifactBundleValidator` does not model manifest-hash enforcement (see `ArtifactPackagingServiceExportManifestTests`)
- [x] (proven) `ReferenceArchitectureMarkdownGenerator` hardcoded `## Constraints` as `Not specified.` — **hit 2026-08-24:** committed `MandatoryConstraints` / `Preferences` dropped while `ArchitectureNarrativeArtifactGenerator` emitted them; regression in `ReferenceArchitectureMarkdownGenerator_GenerateAsync_emits_committed_constraints_not_not_specified`
- [x] (proven) `UnresolvedIssuesArtifactGenerator` dropped `SupportingFindingIds` — **hit 2026-08-24:** JSON projection omitted finding provenance; regression in `GenerateAsync_preserves_supporting_finding_ids`
- [x] (proven) `ArtifactBundleValidator` fail-open on content-hash mismatch — **hit 2026-08-24:** required non-empty hash but never compared to `ArtifactHashing.ComputeHash`; regression in `Validate_when_content_hash_mismatch_throws`
- [x] (proven) `FileNameSanitizer` allowed Unicode slash homoglyphs in export paths — **hit 2026-08-24:** fullwidth solidus U+FF0F survived sanitization; regression in `FileNameSanitizer_replaces_invalid_windows_characters` (`..／..／manifest.json`)
- [x] (proven) `ArchitectureNarrativeArtifactGenerator` omitted `Topology.SelectedPatterns` — **hit 2026-08-25:** narrative listed resources/gaps only while `ReferenceArchitectureMarkdownGenerator` and DOCX export emitted `- Pattern:` lines; regression in `ArchitectureNarrativeArtifactGenerator_GenerateAsync_emits_topology_selected_patterns`
- [x] (proven) `ArchitectureNarrativeArtifactGenerator` omitted `manifest.Decisions` — **hit 2026-09-02 (#536):** narrative jumped from placeholder sections to unresolved issues while `ReferenceArchitectureMarkdownGenerator` and DOCX export listed committed decisions; fixed with `## Decisions` section (`ArchitectureNarrativeArtifactGenerator_GenerateAsync_emits_committed_decisions`).
- [x] (invalid) `MermaidDiagramArtifactGenerator` ignores typed golden topology — AST built only from `manifest.Decisions`, not `Topology.Services` / `Datastores` — **cheap-disproof 2026-09-04 (#732):** decision-graph generator by design; `ReferenceArchitectureMarkdownGenerator` also omits typed services/datastores (uses string `Resources` only); regression in `MermaidDiagramArtifactGeneratorTests.GenerateAsync_builds_decision_graph_only_when_typed_topology_services_present`.
- [x] (proven) `DocxExportService.BuildDocumentAsync` omits Constraints and Assumptions sections present in markdown artifacts — **hit 2026-09-04 (#732):** assumptions/constraints sections added after cost posture (parity with `ReferenceArchitectureMarkdownGenerator` / `ArchitectureNarrativeArtifactGenerator`); regression in `DocxExportServiceGoldenTests.ExportAsync_includes_assumptions_and_constraints_sections`.
- [x] (proven) `DocxExportService` skips `LlmArtifactFreeTextSanitizer` on manifest posture strings (topology gaps, security/compliance gaps) — **hit 2026-09-04 (#732):** `SanitizeArtifactText` on topology/security/compliance gap lines, resources, patterns, and cost risks/notes; regression in `DocxExportServiceGoldenTests.ExportAsync_strips_control_chars_from_topology_gap_text`.
- [x] (proven) `ReferenceArchitectureMarkdownGenerator` / `ArchitectureNarrativeArtifactGenerator` hardcoded `## Assumptions` as `Not specified.` — **hit 2026-08-26:** committed `manifest.Assumptions` dropped while Constraints were already emitted from manifest; fixed by listing assumptions or `No assumptions were recorded.` (`ReferenceArchitectureMarkdownGenerator_GenerateAsync_emits_committed_assumptions_not_not_specified`, `ArchitectureNarrativeArtifactGenerator_GenerateAsync_emits_committed_assumptions_not_not_specified`).

- [ ] (candidate) `MermaidDiagramRenderer.Render` / `MermaidDiagramArtifactGenerator.GenerateAsync` — `DecisionId` or `Title` containing whitespace, `]`, or embedded newlines is interpolated into `flowchart TD` node lines with quote-only label escaping (`node.NodeId` unquoted; labels only replace `"`) — **wrong outcome:** malformed `architecture.mmd` and `DocxExportService` Mermaid CLI rasterization falls back to truncated monospace embed — **mechanism:** `decision_{decision.DecisionId}` node id is not sanitized; `Render` does not escape `]`, newlines, or bracket characters in labels beyond double-quote substitution.
- [ ] (candidate) `DocxExportService.BuildDocumentAsync` — security/compliance posture **table** cells (`ControlId`, `ControlName`, `Status`, `Impact`, `AppliesToCategory`) pass raw manifest strings into `WordDocumentBuilder.AddFourColumnTable` while sibling gap lines use `SanitizeArtifactText` (#732) — **wrong outcome:** C0 control or bidi override characters from committed manifest control rows reach architecture-package DOCX tables unchanged.
- [ ] (candidate) `DocxExportService.Sections.AppendRunExplanation` / `AppendComparisonExplanation` — `KeyDrivers`, `RiskImplications`, `CostImplications`, `ComplianceImplications`, `MajorChanges`, and `KeyTradeoffs` bullet lists bypass `SanitizeArtifactText` while `Summary` / `DetailedNarrative` / `Narrative` prose blocks are sanitized — **wrong outcome:** LLM-origin control/bidi text in sponsor narrative bullets reaches exported DOCX when `request.RunExplanation` or `request.ComparisonExplanation` is populated.
- [ ] (candidate) `MermaidDiagramArtifactGenerator.GenerateAsync` — builds decision-only `DiagramAst` while sibling `DiagramAstGenerator` materializes `manifest.UnresolvedIssues.Items` as `issue-{i}` nodes with `flags` edges — **wrong outcome:** `diagram-ast.json` contains open-issue nodes but `architecture.mmd` omits them, so bundle/DOCX Mermaid consumers show an incomplete graph versus the AST artifact — **mechanism:** `DiagramAstGenerator` loops issues (lines 32–39); `MermaidDiagramArtifactGenerator` loops decisions only (distinct from closed typed-topology #732 candidate).

2026-09-05 seed hunt #831 (seed-only): reseeded post-#732 DOCX/Mermaid parity gaps; four new candidates on Mermaid syntax sanitization, posture table sanitization, explanation bullet sanitization, and unresolved-issue diagram parity.

2026-09-04 thorough hunt #732 (hit): proved DOCX assumptions/constraints parity and posture-string sanitization; cheap-disproved mermaid typed-topology candidate.

2026-09-02 thorough hunt #536: proved architecture narrative decisions parity gap vs reference-architecture markdown and DOCX export.

---

## Zone: host-composition

- **id:** host-composition
- **status:** open
- **impact:** medium
- **aliases:** host composition; DI registration; startup modules
- **paths:** ArchLucid.Host.Composition/
- **test-filter:** FullyQualifiedName~Host.Composition|FullyQualifiedName~ServiceCollectionExtensions
- **hunts:** 10
- **bugs-found:** 10
- **consecutive-dry-hunts:** 2
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-08-26 — Combined durable omitted BackgroundJobQueueProcessorHostedService
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Singleton service caches the first request tenant for the process lifetime — `CachingGovernanceDashboardService` keys cache entries with `HotPathCacheKeys.GovernanceDashboard(scope, tenantId, …)` per request scope
- [x] (invalid) Optional security service is not registered in production configuration — harm-class template; no single missing-security locus identified in composition partials
- [x] (invalid) Composition registers two implementations for the same tenant-scoped interface — `ISponsorReportRecipientLookup` is registered in both weekly modules with the same implementation type; MS.DI last registration wins without functional divergence
- [x] (proven) Weekly sponsor summary pipeline never wired into composition root — **hit 2026-08-19:** `RegisterWeeklySponsorSummaryServices` / worker infrastructure existed but were not called from `AddArchLucidApplicationServices`, so `IWeeklySponsorSummaryEmailDispatcher` was absent from DI
- [x] (proven) Weekly sponsor summary container offload has no `IArchLucidJob` — **hit 2026-08-20:** `RegisterWeeklySponsorSummaryWorkerInfrastructure` skips `WeeklySponsorSummaryHostedService` when `Jobs:OffloadedToContainerJobs` includes `weekly-sponsor-summary`, but `RegisterArchLucidJobRunners` never registered a matching job so container offload silently dropped delivery
- [x] (proven) Data-archival container offload drops agent trace blob cleanup — **hit 2026-08-21:** `RegisterAgentResultBlobCleanupHostedService` reused `ArchLucidJobsOffload.IsOffloaded(..., DataArchival)` so offloading `data-archival` unregistered `AgentResultBlobCleanupHostedService` even though no matching `IArchLucidJob` exists
- [x] (valid-no-repro) Orphan-probe container offload drops `OrphanProbeArchLucidJob` — `InMemoryStorageProviderRegistrar` / `SqlStorageProviderRegistrar` register `IArchLucidJob` before the hosted-service gate; `ContainerJobsOffloadRegistrationTests` offload parity (2026-08-23)
- [x] (valid-no-repro) Required-audit-trail-orphan-probe offload drops matching `IArchLucidJob` — same dual registration pattern as orphan-probe; `ContainerJobsOffloadRegistrationTests` (2026-08-23)
- [x] (valid-no-repro) Audit-change-feed offload with Cosmos audit enabled drops `AuditEventChangeFeedArchLucidJob` — `RegisterCosmosPolyglotPersistence` registers job after hosted-service gate; `ContainerJobsOffloadRegistrationTests` (2026-08-23)
- [x] (valid-no-repro) Logic App trial-email owner still registers `TrialLifecycleEmailScanHostedService` — `RegisterTrialLifecycleEmailHostedServices` gates on `TrialLifecycleEmailRoutingOptions.IsLogicAppOwnerMode`; `ContainerJobsOffloadRegistrationTests` (2026-08-23)
- [x] (proven) `DataArchivalHostHealthCheck` registered when data-archival container-offloaded — **hit 2026-08-24:** readiness stayed healthy with archival enabled while in-process loop was offloaded; regression in `AddArchLucidApplicationServices_Worker_offloads_data_archival_does_not_register_DataArchivalHostHealthCheck`
- [x] (proven) `ScimTokenRotationReminderJob` registered on Api role — **hit 2026-08-24:** split Api+Worker deployments duplicated daily rotation admin notices; regression in `AddArchLucidApplicationServices_Api_role_does_not_register_ScimTokenRotationReminderJob`
- [x] (proven) `LlmMonthlyTenantBudgetReservationReclaimHostedService` lacked leader election — **hit 2026-08-24:** every replica reclaimed and inflated `LlmMonthlyBudgetReservationReclaimedTotal`; now uses `HostLeaderElectionCoordinator` + `hosted:llm-monthly-tenant-budget-reservation-reclaim`
- [x] (proven) `InMemoryValueReportJobQueue` poll failed across service instances — **hit 2026-08-24:** enqueue/poll used per-process memory only; regression in `InMemoryValueReportJobQueue_poll_reads_job_enqueued_on_another_instance_via_distributed_cache`
- [x] (hunt-ready) `OutboxProcessorsCompositionRegistrar.RegisterIntegrationEventConsumer` gates on `hostingRole == Worker` only — sibling outbox/advisory registrars include `Combined`, so default Combined hosts never register `AzureServiceBusIntegrationEventConsumer` or integration handlers.
- [x] (proven) Combined role omitted Service Bus integration event consumer — **hit 2026-08-25:** `RegisterIntegrationEventConsumer` returned before wiring handlers/consumer when role was `Combined`; fixed to match Worker (`ContainerJobsOffloadRegistrationTests.AddArchLucidApplicationServices_Combined_role_registers_ServiceBus_integration_event_consumer`).
- [x] (valid-no-repro) `servicebus-integration-events` container offload drops `ServiceBusIntegrationEventsArchLucidJob` — `RegisterArchLucidJobRunners` always registers the job; only `AzureServiceBusIntegrationEventConsumer` is gated by offload (`ContainerJobsOffloadRegistrationTests.AddArchLucidApplicationServices_Worker_offloads_servicebus_integration_events_registers_job_not_consumer`, 2026-08-26).
- [x] (proven) Per-process `AddDistributedMemoryCache` broke async value report poll across Api replicas — **hit 2026-08-26:** `SponsorRoiCompositionRegistrar` registered per-process `IDistributedCache` when no shared Redis/hot-path cache was configured, so load-balanced replicas could not see enqueue state; fixed with `IValueReportJobPollStateCache` (registered `IDistributedCache` → dedicated Redis → process-shared fallback) and `ServiceCollectionExtensionsRegistrationTests.AddArchLucidApplicationServices_value_report_async_job_poll_works_across_separate_api_replica_roots`.
- [x] (proven) Combined durable background jobs omit queue processor — **hit 2026-08-26:** `RegisterBackgroundJobs` registered `BackgroundJobQueueProcessorHostedService` only for `Worker` when `BackgroundJobs:Mode=Durable`; Combined hosts enqueued to SQL/queue but never drained; fixed with Combined branch + `BackgroundJobRepositoryCancellationWriter`; regression in `AddArchLucidApplicationServices_Combined_durable_registers_BackgroundJobQueueProcessorHostedService` and `AddArchLucidApplicationServices_Api_durable_does_not_register_BackgroundJobQueueProcessorHostedService`.
- [x] (invalid) `DraftIntakeCompositionRegistrar` registers `AdvisoryDraftOperationHostedService` without hosting-role gate — `AdvisoryDraftOperationQueue` is a per-process bounded `Channel`; the HTTP host that enqueues must drain its own queue; regression documents intent in `AddArchLucidApplicationServices_Api_role_registers_in_memory_async_operation_processors`.
- [x] (invalid) `RunLifecycleOrchestrationCompositionRegistrar` registers `ArchitectureRunAsyncOperationHostedService` without hosting-role gate — `ArchitectureRunAsyncOperationQueue` is in-process (TB-2075); async create/execute admitted on Api must be processed locally; same regression test.
- [x] (valid-no-repro) `RegisterDurableBackgroundJobInfrastructure` registers `BackgroundJobStuckRunningWatchdogHostedService` for Api durable enqueue-only hosts — intentional: watchdog reclaims stale `Running` rows via SQL and re-notifies the durable queue for Worker drain (`HostLeaderElectionCoordinator`); regression in `AddArchLucidApplicationServices_Api_durable_registers_stuck_running_watchdog_without_queue_processor`.
- [x] (valid-no-repro) `first-tenant-funnel-archival` container offload drops `FirstTenantFunnelArchivalArchLucidJob` — `RegisterArchLucidJobRunners` always registers the job; only `FirstTenantFunnelArchivalHostedService` is gated by offload (`ContainerJobsOffloadRegistrationTests.AddArchLucidApplicationServices_Worker_offloads_first_tenant_funnel_archival_still_registers_job_not_hosted_service`, 2026-09-04).
- [x] (valid-no-repro) `trial-lifecycle` container offload drops `TrialLifecycleArchLucidJob` — same dual registration pattern; `ContainerJobsOffloadRegistrationTests.AddArchLucidApplicationServices_Worker_offloads_trial_lifecycle_still_registers_job_not_scheduler_hosted_service` (2026-09-04).
- [x] (valid-no-repro) `exec-digest-weekly` / `weekly-architecture-digest` container offload drops matching `IArchLucidJob` — jobs always registered; hosted services gated by offload (`ContainerJobsOffloadRegistrationTests` exec-digest and weekly-architecture-digest parity, 2026-09-04).
- [x] (invalid) `ApiRequestUsageEventBatchFlushHostedService` registered on Worker without metering middleware — Worker flush is a harmless no-op on an empty buffer; Api role registers flush where middleware enqueues (`ContainerJobsOffloadRegistrationTests.AddArchLucidApplicationServices_Api_role_registers_ApiRequestUsageEventBatchFlushHostedService`, 2026-09-04).

2026-09-02 thorough hunt #427: cheap-disproved all three hosting-role-gate candidates; fixed `TrialLifecycleCompositionModule_registers_trial_lifecycle_services` to use Worker role for preseed assertion.

2026-09-04 seed hunt #733: seeded four container-offload / metering candidates; cheap-disproved all via `ContainerJobsOffloadRegistrationTests` (first-tenant-funnel-archival, trial-lifecycle, exec-digest-weekly, weekly-architecture-digest offload parity; Api metering flush on Api role). No hunt-ready rows; seed-only.

---

## Zone: cloud-extractors

- **id:** cloud-extractors
- **status:** open
- **impact:** high
- **aliases:** aws extractor; gcp extractor; azure extractor
- **paths:** ArchLucid.Integrations.AwsExtractor/; ArchLucid.Integrations.GcpExtractor/; ArchLucid.Integrations.AzureExtractor/
- **test-filter:** FullyQualifiedName~AwsExtractor|FullyQualifiedName~GcpExtractor|FullyQualifiedName~AzureExtractor
- **hunts:** 11
- **bugs-found:** 14
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-26
- **last-bug:** 2026-08-26 — ARM nextLink followed into different subscription
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) AWS STS AssumeRole hardcoded to commercial `us-east-1` — **hit 2026-08-24:** `HostedAwsExtractorClient.AssumeRoleAsync` ignored connection `RegionEndpoint` and always constructed `AmazonSecurityTokenServiceClient(RegionEndpoint.USEast1)`; regression in `Create_uses_connection_region_for_sts_endpoint`
- [x] (proven) GCP WIF audience `https://` provider double-prefixed — **hit 2026-08-24:** `GcpWorkloadIdentityCredentialFactory.NormalizeAudience` prepended `//iam.googleapis.com/` to full `https://iam.googleapis.com/...` URLs; regression in `NormalizeAudience_normalizes_https_iam_googleapis_com_prefix`
- [x] (valid-no-repro) Extractor pulls resources using credentials from another tenant's connector — tenant binding lives in application orchestration (`HostedAwsExtractorRunService`, connection repositories); integration clients consume caller-supplied credentials only
- [x] (valid-no-repro) ARM/resource id mapping drops subscription scope and mis-attributes resources — `GetOnlyHostedAzureArmReadClient` preserves full ARM `id` strings from list API; no subscription-scope stripping locus in extractor integration layer
- [x] (proven) AWS Resource Explorer inventory truncated at first page — **hit 2026-08-24:** `HostedAwsExtractorClient.SearchResourcesAsync` used single `SearchAsync` with `MaxResults=50` and no `NextToken` loop; regression in `SearchResourcesAsync_paginates_until_next_token_exhausted`
- [x] (proven) AWS `AccountId` not validated against assumed `RoleArn` — **hit 2026-08-24:** manifest accepted mismatched account id vs role ARN account; regression in `CollectZipAsync_rejects_role_arn_account_mismatch`
- [x] (proven) Azure ARM rows missing `id`/`type` dropped without warning — **hit 2026-08-24:** `MapResource` returned null with no log; regression in `ListSubscriptionResourcesAsync_logs_when_arm_row_missing_id_or_type`
- [x] (proven) GCP workload-identity audience prefix case-sensitive — **hit 2026-08-24:** `NormalizeAudience` used `Ordinal` for `//iam.googleapis.com/` prefix; regression in `NormalizeAudience_normalizes_mixed_case_audience_prefix`
- [x] (proven) GCP `ProjectId` not validated against impersonated service account email — **hit 2026-08-24:** `HostedGcpExtractorClient.CollectZipAsync` stamped manifest/search scope from request `ProjectId` without checking `{name}@{project}.iam.gserviceaccount.com`; dual-path gap vs AWS `AwsIamRoleArn.EnsureAccountMatches`; regression in `CollectZipAsync_rejects_service_account_project_mismatch`
- [x] (proven) Azure ARM subscription list pagination follows repeating `nextLink` indefinitely — **hit 2026-08-24:** `GetOnlyHostedAzureArmReadClient.ListSubscriptionResourcesAsync` had no visited-link guard; regression in `ListSubscriptionResourcesAsync_throws_when_next_link_repeats`
- [x] (proven) AWS inventory stamps every resource with connection region — **hit 2026-08-24:** `AwsResourceExplorerInventoryCollector.CollectAsync` passed `regionSystemName` into `AwsInventoryResourceEntry.Location` instead of `resource.Region`; regression in `CollectAsync_uses_resource_region_not_connection_region`
- [x] (proven) `AwsResourceExplorerInventoryCollector.CollectAsync` hardcodes `QueryString = "arn:aws:*"`; GovCloud inventory returns zero rows because partition ARNs use `arn:aws-us-gov:*` — **hit 2026-08-25:** query ignored connection GovCloud region; fixed with `AwsResourceExplorerQueryString.ResolveForRegion` (`CollectAsync_uses_govcloud_partition_query_for_us_gov_region`).
- [x] (proven) `AwsIamRoleArn.TryGetAccountId` rejects GovCloud IAM role ARNs — **hit 2026-08-25:** prefix check required `arn:aws:iam::` so `arn:aws-us-gov:iam::123456789012:role/ReadOnly` failed validation and blocked GovCloud extractor runs; fixed by locating account id via `:iam::` infix across partitions; regression in `TryGetAccountId_accepts_aws_us_gov_partition_role_arn`
- [x] (proven) `AwsResourceExplorerInventoryCollector.CollectAsync` follows repeating `NextToken` indefinitely — **hit 2026-08-25:** pagination loop had no visited-token guard or page cap; regression in `CollectAsync_throws_when_next_token_repeats`
- [x] (proven) `HostedGcpExtractorClient.CollectZipAsync` validates service-account email project but not WIF provider path project; mismatched pool provider `projects/other-project/...` passes validation while Asset search scopes `projects/my-project` — **hit 2026-08-25:** added `GcpWorkloadIdentityPoolProvider.EnsureProjectMatches` dual-path guard vs `GcpServiceAccountEmail` (`GcpWorkloadIdentityPoolProviderTests`, `HostedGcpExtractorClientTests.CollectZipAsync_rejects_workload_identity_pool_provider_project_mismatch`).
- [x] (proven) `GetOnlyHostedAzureArmReadClient.ListSubscriptionResourcesAsync` follows ARM `nextLink` without validating subscription id — **hit 2026-08-26:** malicious or mis-issued `nextLink` to `/subscriptions/{other}/resources` pulled cross-subscription inventory; fixed with `HostedAzureArmNextLinkValidator.EnsureTargetsSubscription`; regression in `ListSubscriptionResourcesAsync_throws_when_next_link_targets_different_subscription`.
- [ ] (candidate) `AwsResourceExplorerQueryString.ResolveForRegion` China partition (`cn-*`) untested — GovCloud branch proven; `arn:aws-cn:*` path has no regression test.
- [ ] (candidate) `GetOnlyHostedAzureArmReadClient` ARM HTTP failures throw via `EnsureSuccessStatusCode` without warning log — 401/403/429 responses give no structured operator signal before throw.
- [ ] (candidate) GCP `HostedGcpExtractorClient.SearchResourcesAsync` uses Google SDK async enumerator without explicit page cap — parity gap vs AWS/Azure `MaxPaginationRequests` guards.

---

## Zone: api-authority-admin-controllers

- **id:** api-authority-admin-controllers
- **status:** open
- **impact:** high
- **aliases:** authority controllers; admin controllers
- **paths:** ArchLucid.Api/Controllers/Authority/; ArchLucid.Api/Controllers/Admin/
- **test-filter:** FullyQualifiedName~AuthorityController|FullyQualifiedName~AdminController
- **hunts:** 15
- **bugs-found:** 24
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — export history whitespace runId 404 parity
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] Admin mutating endpoint lacks tenant binding on route parameters — (proven): `RunsController` request endpoints (2026-08-18); `AdminController.ArchiveRunsByIds` called global `ArchiveRunsByIdsAsync` without `GetByIdAsync(scope, …)` filter (2026-08-18); `AdminController.ArchiveRunsBatch` called global `ArchiveRunsCreatedBeforeAsync` without scoped cutoff filter (2026-08-22); `AdminDiagnosticsService` integration outbox dead-letter list/retry/suppress/curl called `IIntegrationEventOutboxRepository` without `scope.TenantId` (2026-08-23); bulk `RetryIntegrationOutboxDeadLettersAsync` still passed `request.TenantId` to `RetryMatchingDeadLettersAsync` (2026-08-24)
- [x] (proven) Unrecognized `ReplayMode` on authority replay fell through to `DecideAsync` + manifest persist — `AuthorityReplayService.ReplayAsync` only special-cased `ReconstructOnly`; unknown modes matched rebuild path (2026-08-24)
- [x] (proven) Invalid run id on authority graph/pin reads returned 400 while sibling `GetRun` returned 404 — `RunQueryController.GetInteractiveGraphSnapshot`, `RunsController.PinRun` (2026-08-24)
- [x] Authority read returns artifacts for a run in another workspace — fixed ComparisonsController scoped load (2026-08-17)
- [x] (valid-no-repro) Controller accepts a scope header that overrides the authenticated tenant — `ScopeIdentityBindingMiddleware` + `ScopeIdentityBindingIntegrationTests` (TB-072/TB-925) reject mismatched headers on Authority/Admin routes; `HttpScopeContextProvider` prefers claims over headers
- [x] (proven) `RunsController.GetDraftRequestAsyncResult` mapped `OperationState.Failed` to HTTP 400 `ValidationFailed` — background advisory-draft failure is an operational outcome, not bad client input; fixed 2026-08-25 to return 422 `BusinessRuleViolation` (`RunsControllerTests.GetDraftRequestAsyncResult_failed_operation_returns_422_not_400_validation`)
- [x] (proven) `DraftRequest` / `DraftRequestAsync` omitted `MaximumChatIntakeTextLength` guard present on sibling `ChatIntake` — **hit 2026-08-25:** 50_001+ char paste reached LLM parse on draft routes while chat-intake returned 400 (`RunsControllerTests.DraftRequest_returns_bad_request_when_description_exceeds_chat_intake_max_length`, `DraftRequestAsync_returns_bad_request_when_description_exceeds_chat_intake_max_length`).
- [x] (proven) `RewriteArchitectureOverview` omitted `MaximumChatIntakeTextLength` guard on `CurrentOverview` — **hit 2026-08-26:** 50_001+ char paste reached overview rewrite LLM while sibling draft/chat-intake returned 400 (`RunsControllerTests.RewriteArchitectureOverview_returns_bad_request_when_current_overview_exceeds_chat_intake_max_length`).
- [x] (proven) `ExplainStructuredBriefSuggestion` omitted `MaximumChatIntakeTextLength` on `SourceText` — **hit 2026-08-28:** `DraftIntakeValidation.ExceedsMaximumFreeTextIntentLength` guard on `SourceText`; regression in `RunsControllerTests.ExplainStructuredBriefSuggestion_returns_bad_request_when_source_text_exceeds_chat_intake_max_length`.
- [x] (proven) `GetRunRoiEstimate` whitespace `runId` returned 400 via `ArgumentException` while sibling `GetRun` returned 404 — **hit 2026-08-28:** `AuthorityRunIdentifier.TryParse` NotFound parity in `RunGraphQueryService`; regression in `RunGraphQueryServiceTests` and `RunQueryControllerTests`.
- [x] (proven) `RephraseClarificationAnswers` omitted per-item `ExtractedAnswer` max length — **hit 2026-08-28:** per-item `DraftIntakeValidation` guard; regression in `RunsControllerTests.RephraseClarificationAnswers_returns_bad_request_when_extracted_answer_exceeds_chat_intake_max_length`.
- [x] (proven) `GetRunStageTimeline` whitespace `runId` returned 400 while sibling `GetRun` / `GetRunRoiEstimate` returned 404 — **hit 2026-09-02 (#424):** removed whitespace `BadRequest` pre-check; rely on `AuthorityRunIdentifier.TryParse`; regression in `RunGraphQueryServiceTests` and `RunQueryControllerTests`.
- [x] (proven) `ExplainStructuredBriefSuggestion` omitted `MaximumChatIntakeTextLength` on `SuggestionText` — **hit 2026-09-02 (#424):** `DraftIntakeValidation` guard on `SuggestionText`; regression in `RunsControllerTests.ExplainStructuredBriefSuggestion_returns_bad_request_when_suggestion_text_exceeds_chat_intake_max_length`.
- [x] (proven) `RephraseClarificationAnswers` omitted `MaximumChatIntakeTextLength` on `QuestionPrompt` — **hit 2026-09-03 (#546):** per-item guard alongside `ExtractedAnswer`; regression in `RunsControllerTests.RephraseClarificationAnswers_returns_bad_request_when_question_prompt_exceeds_chat_intake_max_length`.
- [x] (proven) `GetInteractiveGraphSnapshot` / `RunGraphQueryService.GetInteractiveGraphSnapshotAsync` — whitespace `runId` returned 400 while sibling reads returned 404 — **hit 2026-09-03 (#546):** rely on `AuthorityRunIdentifier.TryParse`; regression in `RunGraphQueryServiceTests` and `RunQueryControllerTests`.
- [x] (proven) `RunsExportController.Export` / `ArchitectureExportController.ExportRunSummary` — whitespace `runId` returned 400 while export paths map invalid ids to 404 — **hit 2026-09-03 (#546):** `AuthorityRunIdentifier.TryParse` NotFound parity; regression in `RunsExportControllerTests` and `ArchitectureExportControllerTests`.
- [x] (proven) `CustomRolesAdminController.UpdateAsync` — omitted `IsValidUnicodeText` surrogate guard present on `CreateAsync` — **hit 2026-09-03 (#546):** reject lone surrogates before service call; regression in `CustomRolesAdminControllerTests`.
- [x] (proven) `ReviewClarificationQuestionsController.ApplyKnowledgeModelClarificationAnswers` — megabyte answer values reach persistence without per-answer max-length guard — **hit 2026-09-04 (#661):** over-limit answer values reached `ApplyAnswersAsync` while sibling `RephraseClarificationAnswers` enforced `DraftIntakeValidation.MaximumFreeTextIntentLength`; fixed with per-answer guard; regression in `ApplyKnowledgeModelClarificationAnswers_returns_bad_request_when_answer_exceeds_max_length`.
- [x] (proven) `RunQueryController.GetProvenanceNodeExplanation` — whitespace `runId` still returns 400 while sibling provenance reads return 404 — **hit 2026-09-04 (#661):** removed whitespace `runId` pre-check; rely on `AuthorityRunExistsInScopeAsync` / `AuthorityRunIdentifier.TryParse`; regression in `GetProvenanceNodeExplanation_returns_not_found_for_whitespace_run_id_like_GetArchitectureRunProvenance`.
- [x] (proven) `RunsController.ExecuteRun` / `ExecuteRunSelective` / `CommitRun` / `ReplayRun` — whitespace or non-GUID `runId` returned 400/`ArgumentException`/NRE while sibling `PinRun` returned 404 — **hit 2026-09-04 (#744):** `NotFoundWhenRunRouteIdInvalid` preflight on mutating authority routes; regression in `RunsControllerTests.ExecuteRun_returns_not_found_for_whitespace_run_id_like_PinRun` and sibling commit/replay/selective tests.
- [x] (invalid) `PostFindingFeedback` whitespace `findingId` → 400 — required-field validation on finding route param, not run-id read parity; whitespace is semantically empty finding id.
- [x] (invalid) `GetProvenanceNodeExplanation` whitespace `nodeId` → 400 — node id required-field guard before run scope check; distinct from run-id parity fixes.
- [x] (invalid) `ConfluencePublishingAdminController` body `RunId` whitespace → 400 — explicit required publish field, not `{runId}` route parity pattern.
- [x] (proven) `RunsController.ExecuteRunAsync` / `ReplayRunAsync` — whitespace `runId` returned 400 via `AuthorityRunProblemLadder` (`ParseRunId` `ArgumentException`) while sync `ExecuteRun`/`ReplayRun` returned 404 — **hit 2026-09-04 (#745):** `NotFoundWhenRunRouteIdInvalid` preflight; regression in `ExecuteRunAsync_returns_not_found_for_whitespace_run_id_like_ExecuteRun` and `ReplayRunAsync_returns_not_found_for_whitespace_run_id_like_ReplayRun`.
- [x] (proven) `RunsController.SubmitAgentResult` — whitespace `runId` returned 400 (`RunId is required`) while sibling `PinRun` returned 404 — **hit 2026-09-04 (#745):** `NotFoundWhenRunRouteIdInvalid` preflight; regression in `SubmitAgentResult_returns_not_found_for_whitespace_run_id_like_PinRun`.
- [x] (proven) `ExportsController.GetRunExportHistory` — whitespace `runId` threw from `GetRunDetailAsync` `ThrowIfNullOrWhiteSpace` instead of mapping to 404 like export siblings — **hit 2026-09-05 (#798):** `RunExportQueryFacade.GetRunExportHistoryAsync` now rejects invalid route ids via `AuthorityRunIdentifier.TryParse` before detail load; regressions in `GetRunExportHistoryAsync_returns_run_not_found_for_whitespace_run_id_without_calling_detail_query` and `GetRunExportHistory_returns_not_found_for_whitespace_run_id_like_export_siblings`.

2026-09-05 thorough hunt #798: proved export history whitespace runId 404 parity.

2026-09-04 thorough hunt #745: closed three stale invalid hypotheses from #744; proved async execute/replay ladder 400 parity and submit-result whitespace 404 gap; seeded export-history candidate.

2026-09-04 seed hunt #744: proved execute/commit/replay whitespace 404 parity gap; cheap-disproved finding-feedback, provenance-node, and Confluence publish body candidates.

2026-09-04 thorough hunt #661: proved knowledge-model clarification answer max-length gap and provenance-node whitespace 404 parity.

2026-09-03 seed hunt #546: proved rephrase `QuestionPrompt` max length, interactive-graph and export whitespace 404 parity, and custom-role update Unicode guard; seeded knowledge-model clarification answer length and provenance-node whitespace candidates.

2026-09-02 thorough hunt #424: closed three stale ledger candidates (already fixed 2026-08-28); proved stage-timeline whitespace 404 parity and explain `SuggestionText` max-length gap.

---

## Zone: api-governance-tenancy-controllers

- **id:** api-governance-tenancy-controllers
- **status:** open
- **impact:** high
- **aliases:** governance controllers; tenancy controllers
- **paths:** ArchLucid.Api/Controllers/Governance/; ArchLucid.Api/Controllers/Tenancy/
- **test-filter:** FullyQualifiedName~GovernanceController|FullyQualifiedName~TenancyController
- **hunts:** 247
- **bugs-found:** 482
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — waiver renew rationale case-insensitive idempotent retry
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) `PolicyPacksController.Publish` / `PolicyPacksAppService.TryPublishVersionAsync` — cross-tenant publish: caller scope tenant B + pack id owned by tenant A → HTTP 200 and version row upserted (reads already 404 on scope mismatch; publish omitted tenant/workspace/project check)
- [x] (invalid) Tenancy suspend endpoint affects a tenant id from the body not the principal — no suspend action under `ArchLucid.Api/Controllers/Tenancy/`
- [x] (invalid) List endpoint omits tenant predicate when workspace filter is empty — `PolicyPacksController.ListVisiblePacksAsync` always passes `scope.TenantId` into `ListByScopeAsync` (`WHERE TenantId = @TenantId`)
- [x] (proven) `PolicyPacksController.SimulateBulk` — pack id from another tenant scope → dry-run evaluates foreign pack content (only `IsDeleted` checked, not tenant/workspace/project vs `scope`) (2026-08-23)
- [x] (proven) `PolicyPacksController.Publish` omitted tenant/workspace/project scope check before `PublishVersionAsync` — cross-tenant publish returned 200 (ledger hit 2026-08-18; controller guard added 2026-08-24).
- [x] (proven) `PolicyPacksController.Assign` omitted pack scope check — foreign pack id with existing version created assignment rows in caller tenant scope (2026-08-24).
- [x] (proven) `PolicyPacksController.DuplicatePack` / `DeletePack` omitted workspace/project scope check — same-tenant foreign workspace pack id duplicated or soft-deleted via `TryDuplicatePackAsync` / `TrySoftDeletePackAsync` (tenant-only guard) — **hit 2026-08-25:** `PolicyPackWorkflowFacade` now applies `IsPackVisibleInScope` before mutate; regression in `PolicyPackWorkflowFacadeTests` and `PolicyPacksControllerDuplicateDeleteScopeTests`.
- [x] (proven) `PolicyPacksController.SetAssignmentEnabled` / `PolicyPackWorkspaceSelectionService.TrySetAssignmentEnabledAsync` — tenant-only assignment lookup let callers toggle `IsEnabled` on foreign workspace/project assignments — **hit 2026-08-26:** `PolicyPackAssignmentScope.IsVisibleInScope` guard; regression in `PolicyPackWorkspaceSelectionServiceScopeTests` and `PolicyPacksControllerSetAssignmentEnabledScopeTests`.
- [x] (proven) `PolicyPacksController.ArchiveAssignment` / `PolicyPackWorkflowFacade.TryArchiveAssignmentAsync` — archived assignments by id with tenant-only filter, ignoring workspace/project — **hit 2026-08-26:** assignment scope check before archive; regression in `PolicyPackWorkflowFacadeTests.TryArchiveAssignmentAsync_returns_false_when_assignment_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.GetRiskRegister` — optional `projectId` query returned another project's register within the same tenant — **hit 2026-08-26:** `GovernanceQueryProjectScope.TryResolve` rejects out-of-scope project ids; regression in `GovernanceStickinessFacadeScopeTests.GetRiskRegisterAsync_returns_empty_when_project_id_is_out_of_scope`.
- [x] (proven) `ManifestsController` evidence export/bundle paths — `LoadManifestWithEvidenceAsync` loaded `AgentEvidencePackage` by run id without verifying the run is in caller scope — **hit 2026-08-26:** skip evidence when scoped run lookup fails; regression in `ManifestsControllerEvidenceScopeTests.GetManifestBundle_omits_evidence_when_run_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController` finding dispositions — `RecordDisposition` / `ListDispositions` accepted any `findingId` in tenant without workspace/project binding — **hit 2026-08-26:** `IFindingInspectReadRepository` scope gate; regression in `GovernanceStickinessFacadeScopeTests` disposition tests.
- [x] (proven) `GovernanceStickinessController.GetDecisionRegister` / `GetFindingsRegistersBundle` — optional `projectId` query returned another project's registers within the same tenant — **hit 2026-08-26:** extended `GovernanceQueryProjectScope.TryResolve` to decision register and bundle reads; regression in `GovernanceStickinessFacadeScopeTests`.
- [x] (proven) `GovernanceStickinessController.CreateRiskException` — accepted `findingId` from another workspace/project without inspect scope gate — **hit 2026-08-26:** `EnsureFindingInScopeAsync` before create; regression in `GovernanceStickinessFacadeScopeTests.CreateRiskExceptionAsync_throws_when_finding_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.RevokeRiskException` / `RenewRiskException` — tenant-only id lookup let callers mutate foreign workspace/project waivers — **hit 2026-08-26:** `RiskExceptionScope.IsVisibleInScope` via `IRiskExceptionService.GetByIdAsync`; revoke maps missing scope to 404; regression in `GovernanceStickinessFacadeScopeTests.RevokeRiskExceptionAsync_throws_when_exception_is_out_of_scope`.
- [x] (proven) `TenantWorkspacesController.DeleteProjectAsync` / `RestoreProjectAsync` — route `workspaceId` from another workspace in the same tenant soft-deleted or restored foreign projects — **hit 2026-08-26:** require `workspaceId == scope.WorkspaceId`; regression in `TenantWorkspacesControllerTests.DeleteProjectAsync_returns_not_found_when_workspace_id_is_out_of_scope`.
- [x] (proven) `GovernancePostureController.GetPosture` — optional `projectId` query returned another project's posture within the same tenant — **hit 2026-08-26:** `GovernanceQueryProjectScope.TryResolve` returns empty summary for out-of-scope project ids; regression in `GovernancePostureControllerTests.GetPosture_returns_empty_summary_when_project_id_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.CreateRecurrenceSchedule` — accepted `sourceRunId` from another workspace/project when scoped `GetByIdAsync` returned null — **hit 2026-08-26:** require source run in caller scope before persist; regression in `GovernanceStickinessFacadeScopeTests.CreateRecurrenceScheduleAsync_throws_when_source_run_is_out_of_scope`.
- [x] (proven) `TenantWorkspacesController.ListAsync` / `ListRecycleBinAsync` — enumerated all tenant workspaces and foreign recycle-bin rows — **hit 2026-08-26:** filter to `scope.WorkspaceId`; regression in `TenantWorkspacesControllerTests.ListAsync_returns_only_current_workspace` and `ListRecycleBinAsync_returns_only_current_workspace_deleted_projects`.
- [x] (proven) `GovernanceController.GetDashboard` — `RecentChanges` used tenant-only `GetByTenantAsync`, leaking foreign workspace/project policy-pack change rows — **hit 2026-08-26:** filter change log entries to ambient workspace/project; regression in `GovernanceDashboardServiceTests.GetDashboard_FiltersRecentChangesToCurrentWorkspaceProject`.
- [x] (proven) `PreFinalizeChecklistService.BuildPolicyPackCoverageProofItemAsync` — GET checklist persisted `GovernanceScopeJson` via `_runRepository.UpdateAsync` on read — **hit 2026-08-26:** evaluate coverage without mutating the run row; regression in `PreFinalizeChecklistServiceTests.BuildAsync_does_not_persist_governance_scope_json_on_read`.
- [x] (proven) `ComplianceDriftTrendService.GetTrendAsync` / `GovernanceController.GetComplianceDriftTrend` — tenant-only drift trend included foreign workspace/project policy-pack changes and findings audit buckets — **hit 2026-08-26:** filter change-log rows and scope findings reader to ambient workspace/project; regression in `ComplianceDriftTrendServiceTests.GetTrendAsync_ExcludesForeignWorkspaceProjectChanges`.
- [x] (proven) `PreFinalizeChecklistService.BuildAsync` — foreign or missing scoped run returned `ReadyToFinalize: true` when gate allowed and findings were empty — **hit 2026-08-26:** require scoped run before building checklist; regression in `PreFinalizeChecklistServiceTests.BuildAsync_returns_not_ready_when_run_is_out_of_scope`.
- [x] (proven) `PreFinalizeChecklistService.EmptyResult` — non-GUID `runId` returned `ReadyToFinalize: true` — **hit 2026-08-26:** fail closed on invalid run id; regression in `PreFinalizeChecklistServiceTests.BuildAsync_returns_not_ready_for_non_guid_run_id`.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — accepted foreign `RunId` without scoped run lookup — **hit 2026-08-26:** require `IRunRepository.GetByIdAsync` before insert; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_rejects_out_of_scope_run_id`.
- [x] (proven) `GovernanceStickinessController.RecordDisposition` — accepted foreign `RunId` in body after finding scope gate — **hit 2026-08-26:** `EnsureRunInScopeWhenProvidedAsync` via scoped `IRunRepository`; regression in `GovernanceStickinessFacadeScopeTests.RecordDispositionAsync_throws_when_run_id_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.ListDispositions` — tenant-only trail query returned disposition history from foreign workspace/project for the same `findingId` — **hit 2026-08-26:** `ListHistoryAsync` filters to ambient workspace/project; regression in `GovernanceStickinessFacadeScopeTests.ListDispositionsAsync_excludes_foreign_workspace_events_for_same_finding_id`.
- [x] (proven) `GovernancePreCommitSimulationController.GetChecklist` — foreign `runId` returned HTTP 200 with blocking checklist instead of 404 — **hit 2026-08-26:** scoped `IRunRepository` preflight; regression in `GovernancePreCommitSimulationControllerTests.GetChecklist_returns_not_found_for_out_of_scope_run_id`.
- [x] (proven) `GovernanceController.GetApprovalRequests` / `GetPromotions` / `GetActivations` — foreign `runId` returned HTTP 200 `[]` without scoped run preflight — **hit 2026-08-26:** `RequireScopedRunAsync` before repository reads; regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `ManifestsController` export/bundle/summary-evidence — out-of-scope run returned HTTP 200 with full `GoldenManifest` (prior fix only omitted evidence) — **hit 2026-08-26:** `LoadManifestWithEvidenceAsync` returns 404 when scoped run lookup fails; regression in `ManifestsControllerEvidenceScopeTests.GetManifestBundle_returns_not_found_when_run_is_out_of_scope`.
- [x] (proven) `ManifestsController.GetManifest` / diagram / summary — plain manifest reads lacked run-scope gate — **hit 2026-08-26:** `GetManifestInScopeAsync`; regression in `ManifestsControllerEvidenceScopeTests.GetManifest_returns_not_found_when_run_is_out_of_scope`.
- [x] (proven) `FeaturedCompletedSampleService` — tenant-wide `Homepage.FeaturedCompletedSampleRunId` setting leaked cross-workspace selection and allowed foreign-workspace overwrite — **hit 2026-08-26:** workspace-scoped setting key + out-of-scope run projects as unconfigured; regression in `FeaturedCompletedSampleServiceTests`.
- [x] (proven) `GovernanceCoverageController.GetScopeCoverage` — `GetByIdsAsync` pack enrichment ignored workspace/project, leaking foreign `QualityDimension` metadata — **hit 2026-08-26:** filter pack lookup to ambient scope before mapping; regression in `GovernanceCoverageControllerScopeTests`.
- [x] (proven) `ManifestsController` compare endpoints — `LoadAndCompareManifestPairAsync` loaded manifests by version without run-scope gate — **hit 2026-08-26:** use `GetManifestInScopeAsync` for both sides; regression in `ManifestsControllerEvidenceScopeTests.CompareManifests_returns_not_found_when_manifest_run_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.GetDecisionsNeededSummary` / `GovernanceDigestDecisionNeededComposer.BuildSummaryAsync` — tenant-only `ListSinceUtcAsync` trail inflated `FindingsAwaitingEvidence` and `TotalDecisionItems` with foreign workspace events — **hit 2026-08-26:** `FilterTrailToScope` on workspace/project; regression in `GovernanceDigestDecisionNeededComposerTests.BuildSummaryAsync_excludes_foreign_workspace_disposition_trail_events`.
- [x] (proven) `GovernanceController.DryRunPolicyPack` / `PolicyPackDryRunService.EvaluateAsync` — route `policyPackId` evaluated without tenant/workspace/project visibility check — **hit 2026-08-26:** `EnsurePolicyPackInScopeAsync` throws `PolicyPackNotFoundException`; regression in `PolicyPackDryRunServiceTests.EvaluateAsync_throws_when_policy_pack_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController` realized-value attestation / `RealizedValueAttestationService` — tenant-wide `RealizedValue.Attestation` setting key leaked cross-workspace attestation reads and writes — **hit 2026-08-26:** workspace-scoped setting key via `ResolveAttestationSettingKey`; regression in `RealizedValueAttestationServiceTests`.
- [x] (proven) `GovernanceStickinessController.GetDecisionsNeededSummary` / `GovernanceDigestDecisionNeededComposer.BuildSummaryAsync` — tenant-wide `ListActiveAsync` waiver list inflated `WaiversExpiringWithin14Days` and `TotalDecisionItems` with foreign workspace waivers — **hit 2026-08-26:** `FilterWaiversToScope` on workspace/project; regression in `GovernanceDigestDecisionNeededComposerTests.BuildSummaryAsync_excludes_foreign_workspace_active_waivers`.
- [x] (proven) `GovernanceStickinessController.GetRiskRegister` / `ArchitectureRiskRegisterReader` — risk register SQL filtered findings by tenant/project only, returning foreign-workspace rows within the same tenant — **hit 2026-08-26:** `WorkspaceId` on disposition CTE, findings filter, and waiver join; service/facade pass ambient workspace; regression in `GovernanceStickinessFacadeScopeTests.GetRiskRegisterAsync_passes_caller_workspace_to_risk_register_service`.
- [x] (proven) `GovernanceStickinessController.ListRiskExceptions` / `GovernanceStickinessFacade.ListRiskExceptionsAsync` — tenant+project `ListActiveAsync` returned active waivers from foreign workspaces — **hit 2026-08-26:** `RiskExceptionScope.FilterActiveToScope`; regression in `GovernanceStickinessFacadeScopeTests.ListRiskExceptionsAsync_excludes_foreign_workspace_active_waivers`.
- [x] (proven) `GovernanceStickinessController.GetDecisionRegister` / `ArchitectureDecisionRegisterReader` — decision register SQL filtered golden manifests by tenant/project only, returning foreign-workspace decisions — **hit 2026-08-26:** `WorkspaceId` on manifest join; service/facade pass ambient workspace; regression in `GovernanceStickinessFacadeScopeTests.GetDecisionRegisterAsync_passes_caller_workspace_to_decision_register_service`.
- [x] (invalid) `TenantMeasuredRoiController` / `TenantMeasuredRoiService` — tenant-scoped process counters or audit rows — **cheap-disproof 2026-08-26:** endpoint intentionally composes replica-global `InstrumentationCounterSnapshot`, default-scope audit sample, and `ContosoRetailDemoIdentifiers.RunBaseline`; integration test `TenantMeasuredRoiEndpointTests` asserts demo run id; disclaimer documents non-tenant metering.
- [x] (proven) `TenantHomepageSettingsController.PutAsync` / `FeaturedCompletedSampleService.SetSelectedRunIdAsync` — foreign-workspace `SelectedRunId` in same tenant → HTTP 400 `ValidationFailed` ("not eligible") instead of 404 — **hit 2026-08-26:** scoped `GetByIdAsync` null throws `RunNotFoundException`; controller maps to `ProblemTypes.RunNotFound`; regression in `FeaturedCompletedSampleServiceTests` and `TenantHomepageSettingsControllerTests`.
- [x] (proven) `WeeklyDigestHealthReader.GetSnapshotAsync` / `TenantWeeklyDigestHealthController` — sponsor prefs enabled while exec digest disabled still reported sponsor setup gap and omitted sponsor fields — **hit 2026-08-26:** load `ITenantSponsorDigestPreferencesRepository`, split exec vs sponsor gap messages, expose sponsor mirror fields on snapshot/response; regression in `WeeklyDigestHealthReaderTests`.
- [x] (proven) `TenantSponsorDigestPreferencesController` persistence — POST enabled email + recipients but no weekly job consumed `ListEmailEnabledTenantIdsAsync` — **hit 2026-08-26:** `SponsorDigestWeeklyDeliveryScanner` + `SponsorDigestWeeklyArchLucidJob` + `SponsorDigestWeeklyHostedService` wired to sponsor prefs repo and sponsor unsubscribe URL; regression in `SponsorDigestWeeklyDeliveryScannerTests` and `SponsorDigestWeeklyArchLucidJobTests`.
- [x] (proven) `GovernancePreviewController.Preview` / `GovernancePreviewService.PreviewActivationAsync` — missing manifest version for scoped run → HTTP 400 `BadRequest` instead of 404 `ManifestNotFound` — **hit 2026-08-26:** `GoldenManifestVersionNotFoundException` + controller maps to `ProblemTypes.ManifestNotFound`; regression in `GovernancePreviewControllerUnitTests` and `GovernancePreviewServiceTests`.
- [x] (proven) `TenantTrialController.GetTrialStatusAsync` — `TrialStatus = Converted` with future `TrialExpiresUtc` → HTTP 200 with positive `daysRemaining` — **hit 2026-08-26:** always use `TrialLifecyclePolicy.ComputeDaysRemainingForStatusDisplay`; regression in `TenantTrialControllerTests.GetTrialStatusAsync_returns_null_days_remaining_when_converted`.
- [x] (invalid) `TenantPilotValueReportController.GetPilotValueReport` — inverted `fromUtc`/`toUtc` returns 200 empty metrics — **cheap-disproof 2026-08-26:** `PilotValueReportService.BuildAsync` intentionally returns `EmptyReport` for `to <= from`; covered by `PilotValueReportServiceTests.BuildAsync_empty_window_returns_zeros`.
- [x] (proven) `GovernanceResolutionController.Resolve` / `EffectiveGovernanceResolver.ResolveAsync` — tenant-level assignment for workspace-authored pack merged foreign workspace `ContentJson` — **hit 2026-08-26:** `PolicyPackVisibility.IsVisibleInScope` filters `GetByIdsAsync` enrichment; regression in `EffectiveGovernanceResolverTests.ResolveAsync_excludes_foreign_workspace_pack_on_tenant_level_assignment`.
- [x] (proven) `PolicyPacksController.GetEffectiveContent` / `GetPageBundle` / `GovernanceSetupController.GetSetupGuideBundle` — foreign-workspace pack JSON leak via `PolicyPackResolver.ResolveAsync` — **hit 2026-08-26:** same visibility filter in resolver; regression in `PolicyPackResolverTests.ResolveAsync_excludes_foreign_workspace_pack_on_tenant_level_assignment`.
- [x] (proven) `TenantErasureLegalHoldController.SetLegalHoldAsync` — missing tenant row returned HTTP 409 instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync`; regression in `TenantErasureLegalHoldControllerTests.SetLegalHoldAsync_returns_not_found_when_tenant_missing`.
- [x] (invalid) `TenantCostSettingsController.PutAsync` — both `eaDiscountPercentage` and `eaDiscountMultiplier` supplied → percentage wins silently with no 400 — **cheap-disproof 2026-08-26:** `TenantCostSettingsPutRequest` XML documents percentage precedence when both are set; not a validation defect.
- [x] (proven) `GovernanceController.GetApprovalRequestLineage` / `GetApprovalRequestRationale` — approval row with deleted/out-of-scope `RunId` returned HTTP 200 shell instead of 404 — **hit 2026-08-26:** `RequireScopedRunAsync` preflight on approval `RunId` before lineage/rationale service calls; regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `GovernanceController.Approve` / `Reject` — foreign-workspace `approvalRequestId` returned HTTP 400 instead of 404 — **hit 2026-08-26:** `approvalRepo.GetByIdAsync` preflight before workflow review; regression in `GovernanceControllerRunHistoryScopeTests.Approve_returns_not_found_when_approval_request_is_out_of_scope`.
- [x] (proven) `GovernanceController.BatchReviewApprovalRequests` — out-of-scope approval id returned per-item `BadRequest` instead of `ResourceNotFound` — **hit 2026-08-26:** scoped approval preflight in batch loop maps missing id to `ProblemTypes.ResourceNotFound`.
- [x] (proven) `GovernanceStickinessController.RenewRiskException` — foreign-workspace `riskExceptionId` returned HTTP 400 instead of 404 — **hit 2026-08-26:** map `InvalidOperationException` to `ProblemTypes.ResourceNotFound` (aligned with `RevokeRiskException`); regression in `GovernanceStickinessControllerTests.RenewRiskException_returns_not_found_when_exception_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `GovernanceStickinessFacade.RecordBulkDispositionAsync` — all out-of-scope `FindingIds` returned HTTP 200 `{ processedCount: 0 }` instead of 400 — **hit 2026-08-26:** throw when zero findings processed; controller maps `ArgumentException` to 400; regression in `GovernanceStickinessFacadeScopeTests` and `GovernanceStickinessControllerTests`.
- [x] (proven) `TenantErasureLegalHoldController.ApproveErasureAsync` — missing tenant row returned HTTP 409 instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync`; regression in `TenantErasureLegalHoldControllerTests.ApproveErasureAsync_returns_not_found_when_tenant_missing`.
- [x] (invalid) `GovernanceController.Reject` — foreign-workspace `approvalRequestId` 404 parity — **cheap-disproof 2026-08-26:** same `approvalRepo.GetByIdAsync` preflight added with approve in hunt #94.
- [x] (invalid) `TenantWorkspacesController` soft-delete restore foreign-workspace route — **cheap-disproof 2026-08-26:** `RestoreProjectAsync` already requires `workspaceId == scope.WorkspaceId` (same as delete); regression in `TenantWorkspacesControllerTests.RestoreProjectAsync_returns_not_found_when_workspace_id_is_out_of_scope`.
- [x] (proven) `TenantCustomerSuccessController.GetFunnelSnapshotAsync` / `GetStickinessSnapshotAsync` → `SqlOperatorStickinessSnapshotReader` — `ReadyForCommit` runs with manifest reference counted as committed — **hit 2026-08-26:** filter `LegacyRunStatus = @CommittedStatus` (aligned with `PilotScorecardBuilder` / `PilotValueReportService`); regression in `SqlOperatorStickinessSnapshotReaderTests.CommittedRunsWhereClause_uses_legacy_run_status_not_manifest_reference`.
- [x] (proven) `TenantWorkspaceBaselineArtifactsController.GetAsync` / `SqlAzureExtractorPackageRepository.GetWorkspaceBaselineArtifactsAsync` — workspace-wide `EXISTS` vs project-scoped `ScriptVersion` returned inconsistent `(true, null)` when only a sibling project had packages — **hit 2026-08-26:** filter baseline presence by `ProjectId` (aligned with script version and other in-scope probes); regression in `SqlAzureExtractorPackageRepositoryScopeIsolationSqlIntegrationTests`.
- [x] (proven) `GovernanceController.Promote` — foreign-workspace `approvalRequestId` on prod promotion returned HTTP 400 instead of 404 — **hit 2026-08-26:** scoped `approvalRepo.GetByIdAsync` preflight before `PromoteAsync` (aligned with `Approve`/`Reject`); regression in `GovernanceControllerRunHistoryScopeTests.Promote_returns_not_found_when_approval_request_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `CreateRiskException` — foreign-workspace `findingId` or body `runId` returned HTTP 400 `ValidationFailed` instead of 404 — **hit 2026-08-26:** scope misses throw `InvalidOperationException` / `RunNotFoundException`; controller maps to 404; regression in `GovernanceStickinessControllerTests` and `GovernanceStickinessFacadeScopeTests`.
- [x] (invalid) `GovernanceStickinessController.ListDispositions` — out-of-scope `findingId` returns HTTP 200 `[]` instead of 404 — **cheap-disproof 2026-08-26:** intentional hide pattern aligned with `ListRiskExceptions` / register empty responses for scope-filtered reads; `ListDispositionsAsync_returns_empty_when_finding_is_out_of_scope` documents behavior.
- [x] (proven) `TenantBaselineController.PutAsync` — `peoplePerReview` only with no captured `manualPrepHoursPerReview` persisted incomplete baseline (`people` set, `prep` null) — **hit 2026-08-26:** reject manual-field updates when merged prep is null; regression in `TenantBaselineControllerTests.PutAsync_returns_bad_request_when_people_per_review_set_without_manual_prep_hours`.
- [x] (proven) `ArchitectureDecisionRegisterReader.ListAsync` / `GovernanceStickinessController.GetDecisionRegister` — `TOP (@MaxRows)` before in-memory category/date/confidence filters returned empty register when matching decisions were older than the newest capped slice — **hit 2026-08-26:** push filters into SQL `WHERE` before `TOP`; regression in `ArchitectureDecisionRegisterReaderSqlIntegrationTests.ListAsync_applies_category_filter_before_top_limit`.
- [x] (invalid) `TenantExecDigestPreferencesController.PostExecDigestPreferences` + `ExecDigestWeeklyDeliveryScanner` — tenant-wide prefs but delivery composes digest for `GetFirstWorkspaceAsync` (oldest workspace), not caller workspace — **cheap-disproof 2026-08-26:** tenant-scoped background digest intentionally uses primary workspace (`GetFirstWorkspaceAsync` = oldest by `CreatedUtc`); aligned with `IExecDigestComposer` primary authority scope and sponsor/executive weekly scanners.
- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` — invalid `ianaTimeZoneId` persisted and scanner silently fell back to UTC — **hit 2026-08-26:** validate with `IanaTimeZonePreferenceValues.NormalizeOrNull` (aligned with `UserPreferencesController`); regression in `TenantExecDigestPreferencesControllerTests.PostExecDigestPreferences_returns_bad_request_when_iana_time_zone_invalid`.
- [x] (proven) `TenantCatalogMigrationStatusController.GetCatalogMigrationStatusAsync` — missing tenant returned HTTP 200 `{ inMigration: false }` instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync`; regression in `TenantCatalogMigrationStatusControllerTests.GetCatalogMigrationStatusAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` — invalid `ianaTimeZoneId` persisted and weekly scanner silently fell back to UTC — **hit 2026-08-26:** validate with `IanaTimeZonePreferenceValues.NormalizeOrNull` (exec digest parity); regression in `TenantSponsorDigestPreferencesControllerTests.PostSponsorDigestPreferences_returns_bad_request_when_iana_time_zone_invalid`.
- [x] (proven) `TenantHomepageSettingsController.ListEligibleSamplesAsync` / `FeaturedCompletedSampleEligibility.IsEligible` — `ReadyForCommit` runs with manifest listed as eligible completed samples — **hit 2026-08-26:** require `LegacyRunStatus = Committed` (aligned with stickiness funnel / pilot value report); regression in `FeaturedCompletedSampleServiceTests.ListEligibleCandidatesAsync_excludes_ready_for_commit_runs_with_manifest`.
- [x] (proven) `TenantCostSettingsController.PutAsync` — missing tenant row surfaced HTTP 500 (FK violation) instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync`; regression in `TenantCostSettingsControllerTests.PutAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernancePreviewController.Preview` / `GovernancePreviewService` — in-scope `runId` with manifest version belonging to another run returned HTTP 400 instead of 404 — **hit 2026-08-26:** throw `GoldenManifestVersionNotFoundException` on run mismatch (aligned with missing-version path); regression in `GovernancePreviewServiceTests.PreviewActivationAsync_WhenManifestBelongsToAnotherRun_ThrowsGoldenManifestVersionNotFoundException`.
- [x] (proven) `GovernanceController.Activate` / `GovernanceWorkflowActivateStage` — bogus or foreign `manifestVersion` persisted on activation without manifest-run binding check — **hit 2026-08-26:** resolve and validate manifest via `IUnifiedGoldenManifestReader` (preview parity); regression in `GovernanceWorkflowFacadeTests.ActivateAsync_throws_when_manifest_version_belongs_to_another_run`.
- [x] (proven) `TenantLlmCostReportingController.GetDashboard` — out-of-range `days` query silently clamped to 1–90 instead of HTTP 400 — **hit 2026-08-26:** controller validates `days` range (ROI bundle parity); regression in `TenantLlmCostReportingControllerTests.GetDashboard_returns_bad_request_when_days_out_of_range`.
- [x] (proven) `GovernanceController.Promote` — mutating POST lacked controller-level `RequireScopedRunAsync` preflight present on read paths — **hit 2026-08-26:** scoped run preflight before promote workflow; regression in `GovernanceControllerRunHistoryScopeTests.Promote_returns_not_found_when_run_is_out_of_scope`.
- [x] (proven) `TenantCostSettingsController.GetAsync` — missing tenant returned HTTP 200 platform defaults while `PutAsync` returned 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync` (PUT parity); regression in `TenantCostSettingsControllerTests.GetAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `TenantExecDigestPreferencesController.GetExecDigestPreferences` — missing tenant returned HTTP 200 `Unconfigured` while POST returned 404 — **hit 2026-08-26:** tenant preflight on GET; regression in `TenantExecDigestPreferencesControllerTests.GetExecDigestPreferences_returns_not_found_when_tenant_missing`.
- [x] (proven) `TenantSponsorDigestPreferencesController.GetSponsorDigestPreferences` — missing tenant returned HTTP 200 `Unconfigured` while POST returned 404 — **hit 2026-08-26:** tenant preflight on GET (exec digest parity); regression in `TenantSponsorDigestPreferencesControllerTests.GetSponsorDigestPreferences_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernanceController.SubmitApprovalRequest` / `GovernanceWorkflowSubmitStage.SubmitAsync` — approval submit accepted bogus or foreign `manifestVersion` without manifest-run binding — **hit 2026-08-26:** resolve and validate manifest via `IUnifiedGoldenManifestReader` (activate/preview parity); regression in `GovernanceWorkflowFacadeTests.SubmitApprovalRequestAsync_throws_when_manifest_version_belongs_to_another_run`.
- [x] (proven) `GovernanceDashboardRecentRunTokenAggregator.IsCommittedSummary` — `ReadyForCommit` runs with manifest version counted toward dashboard token totals — **hit 2026-08-26:** require `Status == Committed` (aligned with `PilotValueReportService`); regression in `GovernanceDashboardServiceTests.GetDashboard_ExcludesReadyForCommitRunsFromTokenAggregation`.
- [x] (proven) `CorePilotTeamChecklistController.PutAsync` — missing tenant row surfaced HTTP 500 (FK violation) instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync`; regression in `CorePilotTeamChecklistControllerTests.PutAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `TenantLlmCostReportingController.GetDashboard` — missing tenant returned HTTP 200 empty dashboard instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync`; regression in `TenantLlmCostReportingControllerTests.GetDashboard_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernancePreviewService.CompareEnvironmentsAsync` — activation rows loaded manifests by version without manifest-run binding — **hit 2026-08-26:** `LoadManifestForActivationAsync` rejects run mismatch (preview/activate parity); regression in `GovernancePreviewServiceTests.CompareEnvironmentsAsync_WhenActivationManifestRunMismatch_OmitsForeignManifest`.
- [x] (proven) `GovernanceWorkflowPromoteStage.PromoteAsync` — promotion persisted without manifest-run binding — **hit 2026-08-26:** resolve and validate manifest via `IUnifiedGoldenManifestReader` (submit/activate parity); regression in `GovernanceWorkflowFacadeTests.PromoteAsync_throws_when_manifest_version_belongs_to_another_run`.
- [x] (proven) `TenantBaselineController.PutAsync` — `baselineReviewCycleSourceNote`-only updates returned HTTP 200 without persisting when review-cycle hours already captured — **hit 2026-08-26:** `touchReviewSourceNote` path reuses `PersistTrialSignupBaselineReviewCycleAsync`; regression in `TenantBaselineControllerTests.PutAsync_persists_review_cycle_source_note_when_hours_already_captured`.
- [x] (proven) `TenantCustomerSuccessController.GetFunnelSnapshotAsync` / `SqlOperatorStickinessSnapshotReader.GetFunnelSnapshotAsync` — `FirstManifestUtc` MIN over all manifests on non-archived runs counted ReadyForCommit manifests — **hit 2026-08-26:** apply `FirstManifestUtcRunFilter` / committed-run predicate (parity with `CommittedRuns`); regression in `SqlOperatorStickinessSnapshotReaderTests.FirstManifestUtcRunFilter_uses_legacy_run_status_not_manifest_reference`.
- [x] (proven) `CorePilotTeamChecklistController.GetAsync` — missing tenant returned HTTP 200 checklist rows while PUT returned 404 — **hit 2026-08-26:** tenant preflight on GET (PUT parity); regression in `CorePilotTeamChecklistControllerTests.GetAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernancePreviewService.PreviewActivationAsync` — current activation manifest loaded by version without manifest-run binding — **hit 2026-08-26:** reuse `LoadManifestForActivationAsync` (compare-environments parity); regression in `GovernancePreviewServiceTests.PreviewActivationAsync_WhenCurrentActivationManifestRunMismatch_OmitsForeignManifest`.
- [x] (proven) `GovernanceSetupController.GetSetupGuideBundle` — disabled alert-routing subscriptions included via `ListByScopeAsync` — **hit 2026-08-26:** use `ListEnabledByScopeAsync`; regression in `GovernanceSetupControllerTests.GetSetupGuideBundle_lists_only_enabled_alert_routing_subscriptions`.
- [x] (proven) `GovernanceWorkflowPromoteStage.PromoteAsync` — non-prod promotion persisted foreign `approvalRequestId` without run/manifest/env linkage check — **hit 2026-08-26:** `ThrowIfApprovalPromotionLinkageInvalid` for optional approval id; regression in `GovernanceWorkflowFacadeTests.PromoteAsync_throws_when_non_prod_approval_request_run_mismatch`.
- [x] (proven) `TenantBaselineController.PutAsync` — `baselineReviewCycleSourceNote` without captured review-cycle hours returned HTTP 200 without persisting — **hit 2026-08-26:** reject source-note-only updates when review-cycle hours are not captured; regression in `TenantBaselineControllerTests.PutAsync_returns_bad_request_when_review_cycle_source_note_without_captured_hours`.
- [x] (proven) `TenantExecDigestPreferencesController` / `TenantSponsorDigestPreferencesController` POST — `emailEnabled: true` with zero deliverable recipients persisted — **hit 2026-08-26:** `DigestRecipientEmailsValidator` requires at least one recipient when email is enabled; regression in `TenantExecDigestPreferencesControllerTests` and `TenantSponsorDigestPreferencesControllerTests`.
- [x] (proven) Exec/sponsor digest POST — malformed or duplicate recipient emails accepted without server-side validation — **hit 2026-08-26:** `DigestRecipientEmailsValidator` validates format and deduplicates (UI parity); regression in `TenantExecDigestPreferencesControllerTests`.
- [x] (proven) `GovernanceWorkflowReviewStage` / `GovernanceSegregationRules` — API-key submitter + JWT reviewer with different display names bypassed self-approval block — **hit 2026-08-26:** mailbox bridge when reviewer carries JWT canonical key; regression in `GovernanceSegregationRulesTests.SameActor_api_key_submitter_email_matches_jwt_reviewer_mailbox_returns_true`.
- [x] (proven) `GovernanceController.Activate` / `SubmitApprovalRequest` — mutating POST lacked controller-level `RequireScopedRunAsync` preflight present on Promote — **hit 2026-08-26:** scoped run preflight before activate/submit workflow; regression in `GovernanceControllerRunHistoryScopeTests`.

- [x] (proven) `GovernanceController.Approve` / `Reject` / `BatchReviewApprovalRequests` — approval row with out-of-scope `RunId` finalized without scoped run preflight — **hit 2026-08-26:** `RequireScopedRunAsync(approval.RunId)` before workflow review (lineage parity); regression in `GovernanceControllerRunHistoryScopeTests.Approve_returns_not_found_when_approval_run_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.CreateRecurrenceSchedule` — out-of-scope `sourceRunId` returned HTTP 400 instead of 404 — **hit 2026-08-26:** facade throws `RunNotFoundException`; controller maps to `ProblemTypes.RunNotFound`; regression in `GovernanceStickinessControllerTests.CreateRecurrenceSchedule_returns_not_found_when_source_run_is_out_of_scope`.
- [x] (proven) `GovernanceController.Simulate` — missing `runId` or `content` dereferenced before validation (HTTP 500 risk) — **hit 2026-08-26:** explicit 400 guards before `RunId.Trim()`; regression in `GovernanceControllerSimulateTests.Simulate_returns_bad_request_when_run_id_missing`.
- [x] (proven) `TenantWeeklyDigestHealthController.GetAsync` — missing tenant returned HTTP 200 zeroed snapshot — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync`; regression in `TenantWeeklyDigestHealthControllerTests.GetAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `TenantHomepageSettingsController.GetAsync` / `ListEligibleSamplesAsync` — missing tenant returned HTTP 200 unconfigured/empty — **hit 2026-08-26:** tenant preflight on GET paths; regression in `TenantHomepageSettingsControllerTests.GetAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `TenantCustomerSuccessController` GET reads — ghost tenant returned HTTP 200 empty/`isCalculated: false` instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync` on health-score, next-actions, funnel-snapshot, and stickiness-snapshot; regression in `TenantCustomerSuccessControllerTests`.
- [x] (proven) `GovernanceStickinessController.ResolveFindingMergeConflict` — out-of-scope `runId` returned conflict-not-found instead of run-not-found — **hit 2026-08-26:** `EnsureRunInScopeWhenProvidedAsync` preflight in facade; controller maps `RunNotFoundException` to `ProblemTypes.RunNotFound`; regression in `GovernanceStickinessFacadeScopeTests` and `GovernanceStickinessControllerTests`.
- [x] (proven) `GovernanceStickinessController.UpsertRealizedValueAttestation` — negative `attestedIncidentsAvoided` or oversized note persisted without validation — **hit 2026-08-26:** `RealizedValueAttestationUpsertValidation` before persist; controller maps `ArgumentException` to 400; regression in `RealizedValueAttestationServiceTests` and `GovernanceStickinessControllerTests`.
- [x] (invalid) `GovernanceController.DryRunPolicyPack` / batch dry-run — foreign `policyPackId` evaluated without scope visibility check — **cheap-disproof 2026-08-26:** `PolicyPackDryRunService.EnsurePolicyPackInScopeAsync` already guards; regression in `PolicyPackDryRunServiceTests.EvaluateAsync_throws_when_policy_pack_is_out_of_scope`.
- [x] (invalid) `TenantUsageStatusController.GetAsync` — missing tenant returns HTTP 200 default status instead of 404 — **cheap-disproof 2026-08-26:** `TenantUsageStatusService.BuildAsync` returns null for missing tenant; controller returns 404; regression in `TenantUsageStatusControllerTests.GetUsageStatusAsync_returns_not_found_when_tenant_missing`.

- [x] (proven) `PolicyPacksController.Simulate` — missing `runId` or `content` dereferenced before validation (HTTP 500 risk) — **hit 2026-08-26:** explicit 400 guards before `SimulateAsync` (governance simulate parity); regression in `PolicyPacksControllerSimulateTests`.
- [x] (proven) `TenantHomepageSettingsController.PutAsync` — missing tenant returned HTTP 200 while GET returned 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync` (GET parity); regression in `TenantHomepageSettingsControllerTests.PutAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — ghost tenant accepted feedback while GET returned 404 — **hit 2026-08-26:** `EnsureTenantExistsAsync` preflight on POST (GET parity); regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_not_found_when_tenant_missing`.
- [x] (proven) `TenantIntegrationsOperationsController.GetAsync` — missing tenant returned HTTP 200 connector posture — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync`; regression in `TenantIntegrationsOperationsControllerTests.GetAsync_returns_not_found_when_tenant_missing`.
- [x] (valid-no-repro) `GovernanceController.GetDashboard` — ghost tenant returns HTTP 200 empty dashboard instead of 404 — **cheap-disproof 2026-08-26:** `ITenantRepository.GetByIdAsync` preflight on `GetDashboard`; regression in `GovernanceControllerDashboardTests.GetDashboard_returns_not_found_when_tenant_missing`.
- [x] (invalid) `GovernanceController.DryRunPolicyPack` — all out-of-scope `evaluateAgainstRunIds` return HTTP 200 with `runMissing` instead of 404 — **cheap-disproof 2026-08-26:** intentional batch `runMissing` semantics per `PolicyPackDryRunServiceTests`.
- [x] (invalid) `PolicyPacksController.SimulateBulk` — all out-of-scope `runIds` return HTTP 200 summary instead of 404 — **cheap-disproof 2026-08-26:** intentional `notFoundRunCount` batch semantics.
- [x] (valid-no-repro) `TenantTrialController.ConvertTrialAsync` — unrecognized `TargetTier` silently defaults to Standard instead of 400 — **cheap-disproof 2026-08-26:** `TryMapRequestTier` rejects unknown tiers; regression in `TenantTrialControllerTests.ConvertTrialAsync_returns_bad_request_when_target_tier_unrecognized`.
- [x] (proven) `GovernancePostureController.GetPosture` — ghost tenant returned HTTP 200 empty posture instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync` (dashboard/customer-success parity); regression in `GovernancePostureControllerTests.GetPosture_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernanceController.GetComplianceDriftTrend` — ghost tenant returned HTTP 200 empty trend instead of 404 — **hit 2026-08-26:** tenant preflight via `ITenantRepository.GetByIdAsync` (dashboard parity); regression in `GovernanceControllerDashboardTests.GetComplianceDriftTrend_returns_not_found_when_tenant_missing`.

- [x] (proven) `GovernanceResolutionController.Resolve` — ghost tenant returned HTTP 200 default resolution instead of 404 — **hit 2026-08-27:** tenant preflight via `ITenantRepository.GetByIdAsync` before resolver/audit (dashboard parity); regression in `GovernanceResolutionControllerTests.Resolve_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernanceCoverageController.GetScopeCoverage` — ghost tenant returned HTTP 200 empty coverage instead of 404 — **hit 2026-08-27:** tenant preflight via `ITenantRepository.GetByIdAsync` (dashboard/posture parity); regression in `GovernanceCoverageControllerScopeTests.GetScopeCoverage_returns_not_found_when_tenant_missing`.
- [x] (proven) `PolicyPacksController.List` — ghost tenant returned HTTP 200 empty catalog instead of 404 — **hit 2026-08-27:** tenant preflight via `ITenantRepository.GetByIdAsync` (posture/dashboard parity); regression in `PolicyPacksControllerListScopeTests`.
- [x] (proven) `PolicyPacksController.GetPageBundle` / `GetEffective` / `GetEffectiveContent` / `ListWorkspaceSelection` — ghost tenant returned HTTP 200 empty hub/effective reads while `List` already 404'd — **hit 2026-08-27:** shared `RequireTenantOrNotFoundAsync` preflight on read siblings (`PolicyPacksControllerListScopeTests`).
- [x] (proven) `PolicyPacksController.Create` — ghost tenant insert surfaced HTTP 500 (FK) instead of 404 — **hit 2026-08-27:** tenant preflight before `CreatePackAsync` (list parity); regression in `PolicyPacksControllerListScopeTests.Create_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernanceSetupController.GetSetupGuideBundle` — ghost tenant returned HTTP 200 empty bundle instead of 404 — **hit 2026-08-27:** tenant preflight via `ITenantRepository.GetByIdAsync` (posture/resolution parity); regression in `GovernanceSetupControllerTests.GetSetupGuideBundle_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernancePreviewController.Preview` — ghost tenant reached `PreviewActivationAsync` and returned `RunNotFound` or HTTP 200 instead of tenant 404 — **hit 2026-08-27:** tenant preflight via `RequireTenantOrNotFoundAsync` (compare-environments parity); regression in `GovernancePreviewControllerUnitTests.Preview_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernancePreviewController.CompareEnvironments` — ghost tenant returned HTTP 200 empty comparison instead of 404 while posture/resolution preflight tenant row — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight before `CompareEnvironmentsAsync` (`GovernancePreviewControllerUnitTests.CompareEnvironments_returns_not_found_when_tenant_missing`).
- [x] (proven) `GovernanceStickinessController` register reads (`GetRiskRegister`, `GetDecisionsNeededSummary`, `ListRiskExceptions`) — ghost tenant returned HTTP 200 empty registers instead of 404 — **hit 2026-08-27:** shared `RequireTenantOrNotFoundAsync` on read endpoints (`GovernanceStickinessControllerTests`).
- [x] (proven) `GovernanceStickinessController` sibling register reads (`GetAssignedToMeFindingsCount`, `GetReviewsAwaitingAction`, `GetFindingsRegistersBundle`, `GetDecisionRegister`) — ghost tenant returned HTTP 200 empty payloads instead of 404 while risk/decisions-needed/list-exceptions already preflighted — **hit 2026-08-27:** extended `RequireTenantOrNotFoundAsync` to remaining register reads; regression in `GovernanceStickinessControllerTests`.
- [x] (proven) `GovernanceCoverageController.PreviewCoverage` — ghost tenant returned HTTP 200 preview payload while `GetScopeCoverage` already 404 — **hit 2026-08-27:** tenant preflight via `ITenantRepository.GetByIdAsync` (GET parity); regression in `GovernanceCoverageControllerScopeTests.PreviewCoverage_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernanceStickinessController.ListRecurrenceSchedules` — ghost tenant returned HTTP 200 `[]` instead of 404 — **hit 2026-08-27:** shared `RequireTenantOrNotFoundAsync` preflight; regression in `GovernanceStickinessControllerTests.ListRecurrenceSchedules_returns_not_found_when_tenant_missing`.
- [x] (proven) `PolicyPacksController.Simulate` / `SimulateBulk` / `Validate` — ghost tenant returned run/pack-not-found or HTTP 200 validation payload instead of tenant 404 — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight on dry-run endpoints; regression in `PolicyPacksControllerListScopeTests`.
- [x] (proven) `GovernanceStickinessController` disposition/risk-exception/recurrence mutations (`RecordDisposition`, `RecordBulkDisposition`, `CreateRiskException`, `CreateRecurrenceSchedule`) — ghost tenant returned finding/run-not-found or FK instead of tenant 404 — **hit 2026-08-27:** shared `RequireTenantOrNotFoundAsync` on mutation endpoints (register read parity); regression in `GovernanceStickinessControllerTests`.
- [x] (proven) `PolicyPacksController.Publish` / `Assign` / `ArchiveAssignment` / `DeletePack` / `DuplicatePack` / `SetAssignmentEnabled` — ghost tenant returned pack-not-found or FK instead of tenant 404 — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight on mutation endpoints (list/create/simulate parity); regression in `PolicyPacksControllerListScopeTests`.
- [x] (proven) `GovernanceStickinessController` remaining mutations (`RevokeRiskException`, `RenewRiskException`, `UpdateRecurrenceSchedule`, `UpsertRealizedValueAttestation`, `ResolveFindingMergeConflict`) — ghost tenant proceeded without tenant 404 — **hit 2026-08-27:** shared `RequireTenantOrNotFoundAsync` on sibling mutation endpoints; regression in `GovernanceStickinessControllerTests`.
- [x] (proven) `PolicyPacksController` catalog mutations (`PromoteCatalogEntry`, `DemoteCatalogEntry`) and version reads (`ListVersions`, `GetVersion`) — ghost tenant returned catalog/pack-not-found instead of tenant 404 — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight (page-bundle/list parity); regression in `PolicyPacksControllerListScopeTests`.
- [x] (proven) `GovernanceStickinessController.GetRealizedValueAttestation` / `ListDispositions` — ghost tenant returned HTTP 200 empty/attestation payload — **hit 2026-08-27:** shared `RequireTenantOrNotFoundAsync` (register read parity); regression in `GovernanceStickinessControllerTests`.
- [x] (proven) `PolicyPacksController` catalog/list reads (`ListCatalog`, `GetCatalogEntry`, `ExplainPack`) — ghost tenant returned HTTP 200 empty/catalog-not-found instead of tenant 404 — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight (page-bundle/effective parity); regression in `PolicyPacksControllerListScopeTests`.
- [x] (invalid) `PolicyPacksController.ListWorkspaceSelection` — ghost tenant catalog/list read parity — **cheap-disproof 2026-08-27:** already calls `RequireTenantOrNotFoundAsync`; regression in `PolicyPacksControllerListScopeTests.ListWorkspaceSelection_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernanceController.GetApprovalRequestLineage` / `GetApprovalRequestRationale` — ghost tenant returned approval-not-found instead of tenant 404 — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight before approval lookup (dashboard parity); regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `GovernancePreCommitSimulationController.GetChecklist` / `Simulate` — ghost tenant proceeded to checklist/simulation without tenant preflight — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight (run-scope checklist parity); regression in `GovernancePreCommitSimulationControllerTests`.
- [x] (proven) `GovernanceController.Approve` / `Reject` / `SubmitApprovalRequest` / `BatchReviewApprovalRequests` — ghost tenant reached approval workflow without tenant 404 — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight before approval lookup/workflow (lineage parity); regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `GovernanceController.Promote` / `Activate` — ghost tenant reached promotion/activation workflow without tenant 404 — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight before scoped-run check (approval-mutation parity); regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `GovernanceController` policy-pack simulate/dry-run/draft/generate — ghost tenant proceeded without tenant preflight — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` on `Simulate`, `DryRunProposedPolicyPack`, `DryRunPolicyPack`, `DraftPolicyPackRule`, and `GeneratePolicyPack` (`PolicyPacksController` parity); regression in `GovernanceControllerSimulateTests`.
- [x] (proven) `GovernanceController.GetApprovalRequests` / `GetPromotions` / `GetActivations` — ghost tenant returned HTTP 200 `[]` with run-scope preflight only — **hit 2026-08-27:** tenant preflight before `RequireScopedRunAsync` (dashboard parity); regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `ManifestsController` manifest read/export/compare paths (`GetManifest`, diagram/summary/bundle, export/download, compare/summary/export/file) — ghost tenant with in-scope run returned HTTP 200 manifest payloads — **hit 2026-08-27:** `RequireTenantOrNotFoundAsync` preflight (governance read parity); regression in `ManifestsControllerEvidenceScopeTests`.
- [x] (invalid) `TenantMeasuredRoiController.GetAsync` — ghost tenant returns HTTP 200 measured ROI — **cheap-disproof 2026-08-27:** endpoint intentionally composes replica-global counters and demo disclaimer per ledger hunt #92; integration test `TenantMeasuredRoiEndpointTests`.
- [x] (invalid) `TenantPilotValueReportController.GetRoiSummaryPageBundle` — ghost tenant returns HTTP 200 ROI bundle — **cheap-disproof 2026-08-27:** `BuildAsync` null propagates to controller 404 (same as `GetPilotValueReport`); regression in `TenantPilotValueReportControllerTests.GetPilotValueReport_returns_problem_details_when_tenant_missing`.
- [x] (invalid) `GovernanceController.GetPolicyPackSchemaKeys` / `GetPolicyPackContentDocumentJsonSchema` — ghost tenant schema reads — **cheap-disproof 2026-08-27:** static schema keys with no tenant-scoped data access.
- [x] (invalid) `GovernanceStickinessController.PreviewRecurrenceScheduleRuns` — ghost tenant returns HTTP 200 cron preview — **cheap-disproof 2026-08-27:** dry-run cron math in `GovernanceStickinessFacade.PreviewRecurrenceScheduleRuns` with no tenant-scoped persistence or reads (aligned with static schema-key reads).
- [x] (invalid) `PolicyPacksController.GetRuleTemplates` — ghost tenant returns HTTP 200 template list — **cheap-disproof 2026-08-27:** `_workflow.ListRuleTemplates()` serves static starter templates with no tenant-scoped data access (schema-key parity).
- [x] (invalid) `TenantWorkspacesController` list/recycle-bin/delete/restore — ghost tenant workspace paths — **cheap-disproof 2026-08-27:** all four actions call `ITenantRepository.GetByIdAsync` before workspace/project work (`TenantWorkspacesController.cs`).
- [x] (invalid) `TenantTrialController.LinkEntraAsync` / `ConvertTrialAsync` — ghost tenant trial mutations — **cheap-disproof 2026-08-27:** both POST paths preflight `GetByIdAsync` before mutation (`TenantTrialController.cs`).
- [x] (invalid) `TenantBaselineController.PutAsync` / `TenantHomepageSettingsController.ListEligibleSamplesAsync` — ghost tenant PUT/list reads — **cheap-disproof 2026-08-27:** `GetByIdAsync` preflight on both endpoints (GET/PUT parity already proven for siblings).
- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `GovernanceStickinessFacade.CreateRiskExceptionAsync` — in-scope `findingId` with foreign-workspace body `runId` persisted waiver without scoped run preflight — **hit 2026-08-27:** `EnsureRunInScopeWhenProvidedAsync` before create (record-disposition parity); controller maps `RunNotFoundException` to 404; regression in `GovernanceStickinessFacadeScopeTests` and `GovernanceStickinessControllerTests`.
- [x] (proven) `GovernanceController.GetDashboard` — `maxPending` / `maxDecisions` / `maxChanges` ≤ 0 forwarded to service and surfaced HTTP 500 (`ArgumentOutOfRangeException`) instead of 400 — **hit 2026-08-27:** controller validates query bounds before `GetDashboardAsync` (LLM cost reporting / drift-trend parity); regression in `GovernanceControllerDashboardTests.GetDashboard_returns_bad_request_when_max_pending_is_zero`.
- [x] (proven) `GovernanceController.BatchReviewApprovalRequests` — non-empty `approvalRequestIds` array of whitespace-only strings returned HTTP 200 `{ results: [] }` instead of 400 — **hit 2026-08-27:** reject when trimmed/distinct id list is empty after `Count > 0` guard; regression in `GovernanceControllerRunHistoryScopeTests.BatchReviewApprovalRequests_returns_bad_request_when_all_ids_are_whitespace`.
- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `GovernanceStickinessFacade.CreateRiskExceptionAsync` — in-scope `runId` with body `manifestId` not bound to run `GoldenManifestId` persisted foreign manifest linkage — **hit 2026-08-27:** `EnsureManifestMatchesRunWhenProvidedAsync` before create (activate/submit manifest-binding parity); controller maps `GoldenManifestVersionNotFoundException` to 404; regression in `GovernanceStickinessFacadeScopeTests` and `GovernanceStickinessControllerTests`.
- [x] (proven) `GovernanceController.RequireScopedRunAsync` — padded `runId` strings (leading/trailing whitespace) failed `Guid.TryParse` and returned HTTP 404 though trimmed id was in scope — **hit 2026-08-27:** trim before parse (simulate/policy-pack dry-run parity); regression in `GovernanceControllerRunHistoryScopeTests.SubmitApprovalRequest_accepts_padded_run_id_when_run_is_in_scope`.
- [x] (proven) `GovernanceController.Promote` — out-of-scope `approval.RunId` with in-scope body `runId` returned HTTP 400 linkage mismatch instead of 404 — **hit 2026-08-27:** `RequireScopedRunAsync(approval.RunId)` after approval lookup (approve/reject parity); regression in `GovernanceControllerRunHistoryScopeTests.Promote_returns_not_found_when_approval_run_is_out_of_scope`.
- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `GovernanceStickinessFacade.CreateRiskExceptionAsync` — body `manifestId` without `runId` bypassed manifest-run binding gate — **hit 2026-08-27:** reject manifest-only requests (activate/submit binding parity); regression in `GovernanceStickinessFacadeScopeTests.CreateRiskExceptionAsync_throws_when_manifest_id_provided_without_run_id`.
- [x] (proven) `ManifestsController.GetManifestInScopeAsync` — padded `manifestVersion` route values failed lookup and returned HTTP 404 though trimmed version was in scope — **hit 2026-08-27:** trim before `GetByVersionAsync` (scoped-run trim parity); regression in `ManifestsControllerEvidenceScopeTests.GetManifest_accepts_padded_manifest_version_when_manifest_is_in_scope`.
- [x] (proven) `TenantPilotValueReportController.GetPilotValueReport` — `fromUtc` / `toUtc` before 1970 returned HTTP 200 report instead of 400 — **hit 2026-08-27:** reject pre-1970 query dates when specified (compliance-drift-trend parity); regression in `TenantPilotValueReportControllerTests.GetPilotValueReport_returns_bad_request_when_from_utc_before_1970`.
- [x] (proven) `GovernanceController.LogGovernanceApprovalRequestedAuditAsync` / `TryParseArchitectureRunIdForAudit` — padded `runId` on submit dropped `RunId` from audit event though scoped-run preflight accepted trimmed id — **hit 2026-08-27:** trim before audit parse (scoped-run trim parity); regression in `GovernanceControllerRunHistoryScopeTests.SubmitApprovalRequest_logs_trimmed_run_id_in_audit_when_run_id_is_padded`.
- [x] (proven) `GovernanceController.GetApprovalRequests` / `GetPromotions` / `GetActivations` / `SubmitApprovalRequest` / `Promote` / `Activate` — `RequireScopedRunAsync` trimmed internally but callers passed original padded `runId` to repositories/workflow, returning empty results despite scope preflight passing — **hit 2026-08-27:** return normalized run id from `RequireScopedRunAsync` and use downstream; regression in `GovernanceControllerRunHistoryScopeTests.GetApprovalRequests_returns_items_when_route_run_id_is_padded`.
- [x] (proven) `GovernanceWorkflowSubmitStage` / `GovernanceWorkflowActivateStage` / `GovernanceWorkflowPromoteStage` — padded body `manifestVersion` failed `GetByVersionAsync` lookup and returned HTTP 404 though trimmed version was in scope — **hit 2026-08-27:** trim before manifest lookup (manifest GET trim parity); regression in `GovernanceWorkflowServiceTests.SubmitApprovalRequest_accepts_padded_manifest_version_when_manifest_is_in_scope`.

- [x] (proven) `GovernancePreviewController.Preview` / `GovernancePreviewService.PreviewActivationAsync` — padded `runId` or `manifestVersion` returned HTTP 404 though trimmed values were in scope — **hit 2026-08-27:** trim before run/manifest lookup (workflow manifest trim parity); regression in `GovernancePreviewServiceTests.PreviewActivationAsync_accepts_padded_run_id_and_manifest_version_when_in_scope`.
- [x] (proven) `GovernanceController.Approve` / `Reject` / `GetApprovalRequestLineage` / `GetApprovalRequestRationale` / `Promote` — padded `approvalRequestId` route or body value returned HTTP 404 though approval existed — **hit 2026-08-27:** `NormalizeApprovalRequestId` before repository lookup (batch-review trim parity); regression in `GovernanceControllerRunHistoryScopeTests.Approve_returns_ok_when_approval_request_id_is_padded`.
- [x] (proven) `PolicyPacksController.SimulateBulk` — non-empty `runIds` array of whitespace-only strings returned HTTP 200 with zero evaluated runs instead of HTTP 400 — **hit 2026-08-27:** reject when trimmed id list is empty after `Count > 0` guard; regression in `PolicyPacksControllerSimulateBulkScopeTests.SimulateBulk_returns_bad_request_when_all_run_ids_are_whitespace`.
- [x] (proven) `GovernanceController.DryRunPolicyPack` — non-empty `evaluateAgainstRunIds` array of whitespace-only strings returned HTTP 200 empty page instead of HTTP 400 — **hit 2026-08-27:** reject when trimmed run id list is empty after `Count > 0` guard; regression in `GovernanceControllerSimulateTests.DryRunPolicyPack_returns_bad_request_when_all_evaluate_against_run_ids_are_whitespace`.
- [x] (proven) `ManifestsController.LoadManifestWithEvidenceAsync` / `GetManifestBundle` / `GetManifestSummaryEvidence` / export paths — padded `manifestVersion` route values failed lookup and returned HTTP 404 though trimmed version was in scope (`GetManifestInScopeAsync` already trimmed) — **hit 2026-08-27:** route evidence/export loads through `GetManifestInScopeAsync`; regression in `ManifestsControllerEvidenceScopeTests.GetManifestBundle_accepts_padded_manifest_version_when_manifest_is_in_scope`.

- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` — non-empty `findingIds` array of whitespace-only strings returned HTTP 400 only after facade iteration with generic message instead of upfront validation — **hit 2026-08-27:** reject when trimmed id list is empty after `Count > 0` guard (batch-review parity); regression in `GovernanceStickinessControllerTests.RecordBulkDisposition_returns_bad_request_when_all_finding_ids_are_whitespace`.
- [x] (invalid) `TenantPilotValueReportController.GetPilotValueReport` — inverted `fromUtc`/`toUtc` window returns HTTP 200 empty report instead of HTTP 400 — **cheap-disproof 2026-08-27:** duplicate of ledger row above — `PilotValueReportService.BuildAsync` intentionally returns `EmptyReport` for `to <= from`; covered by `PilotValueReportServiceTests.BuildAsync_empty_window_returns_zeros`.
- [x] (proven) `GovernanceController.DryRunPolicyPack` — more than 50 `evaluateAgainstRunIds` silently truncated to service max instead of HTTP 400 — **hit 2026-08-27:** reject when count exceeds 50 (`PolicyPacksController.SimulateBulk` cap parity); regression in `GovernanceControllerSimulateTests.DryRunPolicyPack_returns_bad_request_when_more_than_fifty_evaluate_against_run_ids`.
- [x] (invalid) `GovernanceStickinessController.PreviewRecurrenceScheduleRuns` — ghost tenant returns HTTP 200 preview payload while sibling mutations return tenant 404 — **cheap-disproof 2026-08-27:** re-verify confirms static cron preview with no tenant-scoped persistence (ledger hunt #133 row above).

- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` — more than 50 `findingIds` accepted and iterated in facade instead of HTTP 400 — **hit 2026-08-27:** reject when count exceeds 50 (`BatchReviewApprovalRequests` cap parity); regression in `GovernanceStickinessControllerTests.RecordBulkDisposition_returns_bad_request_when_more_than_fifty_finding_ids`.
- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `ListDispositions` / `ResolveFindingMergeConflict` — padded route `findingId` values failed scope lookup and returned HTTP 404 though trimmed id was in scope — **hit 2026-08-27:** `NormalizeFindingId` trim before facade/repository (scoped-run trim parity); regression in `GovernanceStickinessControllerTests.RecordDisposition_returns_ok_when_route_finding_id_is_padded`.
- [x] (proven) `GovernanceController.GetDashboard` — `maxPending` / `maxDecisions` / `maxChanges` lacked an upper bound and forwarded unbounded `TOP` values to repositories — **hit 2026-08-27:** reject when any query bound exceeds 50 (batch-cap parity; UI already requests 50); regression in `GovernanceControllerDashboardTests.GetDashboard_returns_bad_request_when_max_pending_exceeds_fifty`.
- [x] (proven) `GovernancePreCommitSimulationController.SimulateAsync` — out-of-scope `runId` bubbled `RunNotFoundException` from the gate instead of HTTP 404 while `GetChecklist` preflighted scoped runs — **hit 2026-08-27:** scoped `IRunRepository` preflight before simulation (checklist parity); regression in `GovernancePreCommitSimulationControllerTests.Simulate_returns_not_found_for_out_of_scope_run_id`.
- [x] (proven) `GovernancePreCommitSimulationController.SimulateAsync` — whitespace-only `runId` relied on parse-failure `BadRequest` instead of explicit empty-run validation — **hit 2026-08-27:** `IsNullOrWhiteSpace` guard before trim/parse (`GetChecklist` parity); regression in `GovernancePreCommitSimulationControllerTests.Simulate_returns_bad_request_when_run_id_is_whitespace`.

- [x] (proven) `GovernanceStickinessFacade.RecordBulkDispositionAsync` — padded `findingIds` values failed scope lookup and returned HTTP 400 after zero processed rows though trimmed ids were in scope — **hit 2026-08-27:** trim each id before scope check and disposition write (batch-review trim parity); regression in `GovernanceStickinessControllerTests.RecordBulkDisposition_returns_ok_when_finding_ids_are_padded`.
- [x] (proven) `GovernanceStickinessFacade.CreateRiskExceptionAsync` — padded body `findingId` failed scope lookup and returned HTTP 404 though trimmed id was in scope — **hit 2026-08-27:** normalize `findingId` before inspect scope gate and service create (route disposition trim parity); regression in `GovernanceStickinessControllerTests.CreateRiskException_returns_ok_when_finding_id_is_padded`.
- [x] (proven) `ManifestsController` diagram/summary/bundle/export — response `ManifestVersion` and export filenames echoed padded route strings after `GetManifestInScopeAsync` trimmed lookup — **hit 2026-08-27:** use `manifest.Metadata.ManifestVersion` (compare-fix sibling); regression in `ManifestsControllerTests`.
- [x] (proven) `GovernancePreCommitSimulationController.SimulateAsync` — negative `syntheticCount` reached `PreCommitGovernanceGate` and surfaced HTTP 500 — **hit 2026-08-27:** controller rejects `syntheticCount < 0` before gate call; regression in `GovernancePreCommitSimulationControllerTests`.
- [x] (proven) `GovernanceStickinessController` register reads (`GetRiskRegister`, `GetFindingsRegistersBundle`, `GetDecisionRegister`) — `maxRows <= 0` silently clamped to 1 via facade `Math.Clamp` instead of HTTP 400 parity with `GovernanceController.GetDashboard` — **hit 2026-08-27:** `ValidateRegisterMaxRows` on register GETs; regression in `GovernanceStickinessControllerTests`.
- [x] (proven) `GovernanceStickinessController` register reads — `maxRows > 500` silently clamped without controller upper-bound 400 (dashboard rejects `maxPending > 50` explicitly) — **hit 2026-08-27:** same `ValidateRegisterMaxRows` guard (LLM cost `days` parity); regression in `GovernanceStickinessControllerTests`.
- [x] (proven) `GovernanceStickinessController.GetReviewsAwaitingAction` / `ReviewsAwaitingActionQueryService.ListAsync` — recurrence item echoed foreign-workspace `sourceRunId` parsed from `architectureRequestId` without scoped run lookup — **hit 2026-08-28:** clear `SourceRunId` when parsed source run is out of scope; regression in `ReviewsAwaitingActionQueryServiceTests`.
- [x] (invalid) `GovernancePreCommitSimulationController.SimulateAsync` — unbounded `syntheticCount` reaches gate loop — **cheap-disproof 2026-08-28:** `PreCommitSyntheticSimulationRequest.SyntheticCount` has `[Range(0, 500)]`; `[ApiController]` model validation rejects values above 500 before action body handling.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — body `findingRef` for a foreign-workspace finding persisted without inspect-scope gate — **hit 2026-08-31 (#281):** `IFindingInspectReadRepository.GetInspectAsync` preflight when `FindingRef` provided; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_not_found_when_finding_ref_is_out_of_scope`.
- [x] (proven) `TenantWorkspacesController.DeleteProjectAsync` / `RestoreProjectAsync` — route `projectId` for a sibling project in the same workspace mutated without `scope.ProjectId` guard — **hit 2026-08-31 (#281):** require `projectId == scope.ProjectId` after workspace match; regression in `TenantWorkspacesControllerTests`.

2026-08-28 seed hunt #159: proved reviews-awaiting-action source-run scope gate; seeded product-feedback findingRef and workspace sibling-project mutation candidates; cheap-disproved pre-finalize simulate unbounded `syntheticCount` (`[Range(0, 500)]` on request model).

- [x] (proven) `GovernanceController.DryRunPolicyPack` — route `id = Guid.Empty` returned HTTP 404 policy-pack-not-found instead of HTTP 400 — **hit 2026-08-28:** reject empty guid before dry-run service lookup (policy-packs route parity); regression in `GovernanceControllerSimulateTests.DryRunPolicyPack_returns_bad_request_when_policy_pack_id_is_empty`.
- [x] (proven) `GovernanceStickinessController.UpdateRecurrenceSchedule` — route `scheduleId = Guid.Empty` returned HTTP 404 schedule-not-found instead of HTTP 400 — **hit 2026-08-28:** reject empty guid before repository lookup (create recurrence empty source-run parity); regression in `GovernanceStickinessControllerTests.UpdateRecurrenceSchedule_returns_bad_request_when_schedule_id_is_empty`.
- [x] (proven) `GovernanceStickinessController.RecordDisposition` — body `runId = Guid.Empty` bypassed `EnsureRunInScopeWhenProvidedAsync` and persisted disposition — **hit 2026-08-28:** controller rejects empty runId before facade (merge-conflict route empty-run parity); regression in `GovernanceStickinessControllerTests.RecordDisposition_returns_bad_request_when_run_id_is_empty`.
- [x] (proven) `GovernanceStickinessController.CreateRiskException` — body `runId = Guid.Empty` bypassed scoped-run preflight — **hit 2026-08-28:** controller rejects empty runId before facade; regression in `GovernanceStickinessControllerTests.CreateRiskException_returns_bad_request_when_run_id_is_empty`.
- [x] (proven) `GovernanceController.RequireScopedRunAsync` — empty/whitespace `runId` on submit/promote/activate/approval-history routes returned HTTP 404 `RunNotFound` instead of HTTP 400 — **hit 2026-08-28:** return `ValidationFailed` for missing run id (pre-commit checklist/simulate parity); regression in `GovernanceControllerRunHistoryScopeTests.SubmitApprovalRequest_returns_bad_request_when_run_id_is_empty`.
- [x] (proven) `TenantWorkspacesController.DeleteProjectAsync` / `RestoreProjectAsync` — route `workspaceId` or `projectId = Guid.Empty` returned HTTP 404 instead of HTTP 400 validation — **hit 2026-08-28:** reject empty route guids before workspace/project lookup (policy-packs route parity); regression in `TenantWorkspacesControllerTests`.

- [x] (proven) `GovernanceController.RequireScopedRunAsync` — malformed `runId` on approval-history routes returned HTTP 404 `RunNotFound` instead of HTTP 400 — **hit 2026-08-28:** return `ValidationFailed` when `Guid.TryParse` fails (pre-commit checklist parity); regression in `GovernanceControllerRunHistoryScopeTests.GetApprovalRequests_returns_bad_request_when_run_id_is_not_valid`.
- [x] (proven) `TenantHomepageSettingsController.PutAsync` — body `selectedRunId = Guid.Empty` returned HTTP 404 `RunNotFound` because empty is treated as a provided id — **hit 2026-08-28:** reject empty guid before featured-sample service lookup (stickiness empty body runId parity); regression in `TenantHomepageSettingsControllerTests.PutAsync_returns_bad_request_when_selected_run_id_is_empty`.
- [x] (proven) `GovernanceStickinessController.RecordDisposition` — whitespace-only route `findingId` returned HTTP 404 after trim to empty — **hit 2026-08-28:** reject blank finding id after `NormalizeFindingId` (bulk-disposition whitespace parity); regression in `GovernanceStickinessControllerTests.RecordDisposition_returns_bad_request_when_finding_id_is_whitespace`.
- [x] (proven) `PolicyPacksController` route `policyPackId` / `assignmentId` / `policyPackCatalogEntryId` = `Guid.Empty` — scoped repository lookup returned HTTP 404 instead of HTTP 400 validation — **hit 2026-08-28:** shared `BadRequestWhenRouteIdEmpty` on pack/assignment/catalog route reads and mutations plus promote/demote body guards (DryRunPolicyPack parity); regression in `PolicyPacksControllerListScopeTests`.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — body `runId = Guid.Empty` returned HTTP 404 `RunNotFound` because empty is treated as a provided id — **hit 2026-08-28:** reject empty guid before scoped run lookup (homepage/stickiness empty runId parity); regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_bad_request_when_run_id_is_empty`.

- [x] (proven) `GovernanceStickinessController.RevokeRiskException` / `RenewRiskException` — route `riskExceptionId = Guid.Empty` returned HTTP 404 or unhandled service error instead of HTTP 400 — **hit 2026-08-28:** controller rejects empty guid before facade lookup (update-recurrence scheduleId parity); regression in `GovernanceStickinessControllerTests`.
- [x] (proven) `GovernanceStickinessController.ResolveFindingMergeConflict` — route `runId = Guid.Empty` returned HTTP 404 merge-conflict-not-found because `EnsureRunInScopeWhenProvidedAsync` treats empty as omitted — **hit 2026-08-28:** controller rejects empty `runId` before facade (record-disposition body runId parity); regression in `GovernanceStickinessControllerTests.ResolveFindingMergeConflict_returns_bad_request_when_run_id_empty`.
- [x] (proven) `GovernanceStickinessController.ListDispositions` / `ResolveFindingMergeConflict` — whitespace-only route `findingId` returned HTTP 200 `[]` or HTTP 404 after trim to empty — **hit 2026-08-28:** reject blank finding id after `NormalizeFindingId` (record-disposition parity); regression in `GovernanceStickinessControllerTests`.
- [x] (proven) `GovernanceController.Simulate` / `PolicyPacksController.Simulate` — body `runId = "00000000-0000-0000-0000-000000000000"` passed whitespace guard and scoped lookup returned HTTP 404 instead of HTTP 400 — **hit 2026-08-28:** reject empty guid after trim/parse before dry-run service lookup (RequireScopedRunAsync malformed-run parity); regression in `GovernanceControllerSimulateTests` and `PolicyPacksControllerListScopeTests`.
- [x] (proven) `ManifestsController` read/export routes — whitespace-only `manifestVersion` returned HTTP 404 `ManifestNotFound` instead of HTTP 400 validation — **hit 2026-08-28:** `BadRequestWhenManifestVersionEmpty` on manifest read/export routes (compare leftVersion/rightVersion parity); regression in `ManifestsControllerTests`.

- [x] (proven) `GovernanceController.RequireScopedRunAsync` — body/route `runId = "00000000-0000-0000-0000-000000000000"` passed whitespace/malformed guards and scoped lookup returned HTTP 404 instead of HTTP 400 — **hit 2026-08-28:** reject `Guid.Empty` after parse before repository lookup (Simulate empty runId parity); regression in `GovernanceControllerRunHistoryScopeTests.GetApprovalRequests_returns_bad_request_when_run_id_is_empty_guid`.
- [x] (proven) `GovernanceController` approval singleton routes (`GetApprovalRequestLineage`, `GetApprovalRequestRationale`, `Approve`, `Reject`) — whitespace-only route `approvalRequestId` returned HTTP 404 after trim to empty — **hit 2026-08-28:** `BadRequestWhenApprovalRequestIdEmpty` after `NormalizeApprovalRequestId` (stickiness findingId whitespace parity); regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `GovernancePreCommitSimulationController` checklist/simulate — route/body `runId = "00000000-0000-0000-0000-000000000000"` returned HTTP 404 `RunNotFound` instead of HTTP 400 — **hit 2026-08-28:** reject empty guid after parse before scoped run preflight (Simulate parity); regression in `GovernancePreCommitSimulationControllerTests`.
- [x] (proven) `GovernancePreviewController.Preview` — body `runId = "00000000-0000-0000-0000-000000000000"` passed validator `NotEmpty` and service lookup returned HTTP 404 instead of HTTP 400 — **hit 2026-08-28:** reject empty guid after trim/parse before preview service lookup (Simulate parity); regression in `GovernancePreviewControllerUnitTests`.
- [x] (proven) `GovernanceController.Promote` — body whitespace-only `approvalRequestId` bypassed optional approval preflight and reached `PromoteAsync` with padded id — **hit 2026-08-28:** reject blank approval id when provided and pass normalized id to workflow (approval route whitespace parity); regression in `GovernanceControllerRunHistoryScopeTests`.

- [x] (proven) `GovernanceController.BatchReviewApprovalRequests` — stored approval with malformed `RunId` surfaced per-item `RunNotFound` instead of `ValidationFailed` from `RequireScopedRunAsync` — **hit 2026-08-28:** propagate scoped-run problem type/detail into batch item results (approve/reject parity); regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `GovernanceController.BatchReviewApprovalRequests` — JSON `decision: null` caused HTTP 500 on `Decision.Trim()` — **hit 2026-08-28:** null decision guard before trim; regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `GovernanceController.BatchReviewApprovalRequests` — JSON `approvalRequestIds: null` caused HTTP 500 on `.Count` — **hit 2026-08-28:** null list guard before count check; regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `GovernanceController.BatchReviewApprovalRequests` — mixed list with whitespace-only ids silently dropped instead of per-item validation failure — **hit 2026-08-28:** emit per-item `ValidationFailed` for whitespace ids while processing valid ids (all-whitespace list still returns HTTP 400); regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (invalid) `GovernanceController.Activate` — missing `Idempotency-Key` returns HTTP 400 but lacks dedicated regression beside promote/submit siblings — **cheap-disproof 2026-08-28:** `ReadGovernanceIdempotencyKey(true)` already rejects missing header before tenant/run preflight; test gap only, not wrong behavior.

- [x] (proven) `GovernanceController.DryRunProposedPolicyPack` — invalid, empty-GUID `targetRunId`, or `targetManifestId = Guid.Empty` reached dry-run service and returned HTTP 404 instead of HTTP 400 — **hit 2026-08-28:** controller validates target run/manifest ids before `EvaluateAsync` (Simulate parity); regression in `GovernanceControllerSimulateTests`.
- [x] (proven) `GovernanceController.DryRunPolicyPack` — `evaluateAgainstRunIds` containing malformed or empty-GUID strings returned HTTP 200 with `runMissing` deltas instead of HTTP 400 — **hit 2026-08-28:** validate each non-whitespace run id before `EvaluateAsync` (Simulate/DryRunProposedPolicyPack parity); regression in `GovernanceControllerSimulateTests`.
- [x] (invalid) `GovernanceController.Approve` / `Reject` — whitespace-only route `approvalRequestId` returns HTTP 400 via shared guard but lacks dedicated approve/reject regression tests — **cheap-disproof 2026-08-28:** `BadRequestWhenApprovalRequestIdEmpty` already guards both routes; added dedicated regression tests in `GovernanceControllerRunHistoryScopeTests`.
- [x] (proven) `PolicyPacksController.SimulateBulk` — `runIds` containing malformed or empty-GUID strings returned HTTP 200 with `notFoundRunCount` instead of HTTP 400 — **hit 2026-08-28:** validate each non-whitespace run id before `TrySimulateBulkAsync` (DryRunPolicyPack parity); regression in `PolicyPacksControllerSimulateBulkScopeTests`.
- [x] (invalid) `GovernanceController.GetApprovalRequests` / `GetPromotions` / `GetActivations` — padded `runId` accepted by `RequireScopedRunAsync` but repository query may not match when padding differs from stored normalization — **cheap-disproof 2026-08-28:** `RequireScopedRunAsync` trims and returns normalized id for downstream queries; regression in `GovernanceControllerRunHistoryScopeTests.GetApprovalRequests_returns_items_when_route_run_id_is_padded` (hunt #142).
- [x] (invalid) `GovernanceController.GetPromotions` / `GetActivations` — padded `runId` handled by shared `RequireScopedRunAsync` but lack dedicated padded-route regression tests — **cheap-disproof 2026-08-28:** shared `RequireScopedRunAsync` normalized id path already proven on `GetApprovalRequests`; added sibling regression tests in `GovernanceControllerRunHistoryScopeTests`.
- [x] (invalid) `PolicyPacksController.SimulateBulk` — more than 50 `runIds` where trailing entries are malformed may return HTTP 400 for count cap before per-id validation surfaces the malformed id — **cheap-disproof 2026-08-28:** intentional validation ordering (count cap before per-id GUID parse), aligned with `DryRunPolicyPack`; both return HTTP 400; regression in `PolicyPacksControllerSimulateBulkScopeTests`.
- [x] (invalid) `GovernanceController.BatchReviewApprovalRequests` — duplicate non-whitespace `approvalRequestIds` silently deduped with no per-item result row — **cheap-disproof 2026-08-31:** per-item `ValidationFailed` for exact duplicates since 2026-08-28; **hit 2026-08-31:** `OrdinalIgnoreCase` dedupe for case-variant duplicates; regression in `GovernanceControllerRunHistoryScopeTests`.
- [x] (invalid) `ManifestsController.CompareManifests` — padded `leftVersion` / `rightVersion` route segments may 404 despite `GetManifestInScopeAsync` trim parity — **cheap-disproof 2026-08-31:** `LoadAndCompareManifestPairAsync` routes through trimming `GetManifestInScopeAsync`; regression in `ManifestsControllerTests.CompareManifests_returns_ok_with_diff_when_query_params_are_padded`.
- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` — mixed in-scope/out-of-scope `findingIds` returned HTTP 200 partial success without per-item failure rows — **hit 2026-08-31 (#281):** validate all finding ids in scope before recording any; map scope misses to HTTP 404; regression in `GovernanceStickinessFacadeScopeTests.RecordBulkDispositionAsync_throws_when_any_finding_id_is_out_of_scope` and `GovernanceStickinessControllerTests.RecordBulkDisposition_returns_not_found_when_any_finding_is_out_of_scope`.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — whitespace-only body `findingRef` skipped inspect-scope gate and persisted `"   "` — **hit 2026-08-31 (#325):** normalize blank `findingRef` to null before gate/persist; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_omits_finding_ref_when_value_is_whitespace`.
- [x] (proven) `GovernanceCoverageController.PreviewCoverage` — null body used `ArgumentNullException.ThrowIfNull` (HTTP 500 risk) — **hit 2026-08-31 (#325):** nullable body + HTTP 400 `RequestBodyRequired`; regression in `GovernanceCoverageControllerScopeTests.PreviewCoverage_returns_bad_request_when_body_is_null`.
- [x] (proven) `GovernanceEnvironmentCatalogController.Get` / `Replace` — ghost tenant returned HTTP 200 defaults or reached replace without tenant 404 while sibling governance reads preflighted — **hit 2026-08-31 (#325):** `ITenantRepository.GetByIdAsync` preflight on GET/PUT; regression in `GovernanceEnvironmentCatalogControllerTests`.
- [x] (proven) `GovernanceStickinessFacade.UpdateRecurrenceScheduleAsync` — empty PUT body recomputed `NextRunUtc` from current clock even when cron/enabled unchanged — **hit 2026-08-31 (#325):** recompute next run only when `isEnabled` or `cronExpression` changes; regression in `GovernanceStickinessFacadeTests.UpdateRecurrenceScheduleAsync_preserves_next_run_when_request_has_no_schedule_changes`.
- [x] (proven) `TenantCustomerSuccessController` reads/mutations — foreign or missing `workspaceId` returned HTTP 200 empty/`isCalculated: false` or HTTP 204 product feedback while homepage/weekly-digest siblings 404 — **hit 2026-08-31 (#326):** `TenantWorkspaceScopePreflight` on all endpoints; regression in `TenantCustomerSuccessControllerTests.GetHealthScoreAsync_returns_not_found_when_workspace_missing`.
- [x] (invalid) `TenantWorkspacesController.ListAsync` — lists all active projects in caller workspace while delete/restore require `scope.ProjectId` — **cheap-disproof 2026-09-01 (#415):** `ListAsync_returns_only_current_workspace` filters to `scope.WorkspaceId` and lists projects within that workspace for the picker UI; delete/restore mutation guards are project-scoped by design.
- [x] (invalid) `GovernanceResolutionController.Resolve` — optional query `projectId` may return foreign-project resolution within same tenant without `GovernanceQueryProjectScope` gate — **cheap-disproof 2026-09-01 (#415):** `Resolve` has no `projectId` query parameter; resolution uses ambient JWT scope only (`GovernanceResolutionControllerTests.Resolve_returns_not_found_when_workspace_missing`).
- [x] (invalid) `TenantWorkspacesController.ListAsync` — lists all active projects in caller workspace while delete/restore require `scope.ProjectId` — **cheap-disproof 2026-09-01 (#416):** `ListAsync_returns_only_current_workspace` filters to `scope.WorkspaceId` and lists projects within that workspace for the picker UI; delete/restore mutation guards are project-scoped by design.
- [x] (invalid) `GovernanceResolutionController.Resolve` — optional query `projectId` may return foreign-project resolution within same tenant without `GovernanceQueryProjectScope` gate — **cheap-disproof 2026-09-01 (#416):** `Resolve` has no `projectId` query parameter; resolution uses ambient JWT scope only (`GovernanceResolutionControllerTests.Resolve_returns_not_found_when_workspace_missing`).

2026-08-31 seed hunt #325: proved product-feedback whitespace findingRef, coverage preview null body, environment-catalog ghost-tenant preflight, and recurrence empty-PUT next-run drift; seeded workspace list sibling-project disclosure candidate.

2026-08-31 seed hunt #326: proved customer-success workspace preflight; cheap-disproved resolution optional-project candidate.

- [x] (proven) `GovernanceEnvironmentCatalogController.Get` / `Replace` — scope JWT carried a tenant id with no backing `TenantRecord` → HTTP 200 catalog payload instead of HTTP 404 — **hit 2026-08-31 (#343):** `ITenantRepository.GetByIdAsync` preflight on both actions; regression in `GovernanceEnvironmentCatalogControllerTests.Get_returns_not_found_when_tenant_missing` and `Replace_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernancePostureController.GetPosture` / `GovernanceStickinessController` register reads — optional `projectId=00000000-0000-0000-0000-000000000000` returned HTTP 200 empty payload instead of HTTP 400 — **hit 2026-08-31 (#343):** `GovernanceQueryProjectScope.IsInvalidEmptyProjectQueryId` + `BadRequestWhenProjectQueryIdEmpty` on posture and stickiness register endpoints; regression in `GovernancePostureControllerTests.GetPosture_returns_bad_request_when_project_id_is_empty_guid` and `GovernanceStickinessControllerTests.GetRiskRegister_returns_bad_request_when_project_id_is_empty_guid`.
- [x] (proven) `CorePilotTeamChecklistController.PutAsync` — JSON body omitted `isCompleted` (e.g. `{ "stepIndex": 1 }`) → HTTP 204 and persisted `false` instead of HTTP 400 — **hit 2026-08-31 (#343):** `CorePilotChecklistPutRequest.IsCompleted` required; regression in `CorePilotTeamChecklistControllerTests.PutAsync_returns_bad_request_when_is_completed_omitted`.

- [x] (valid-no-repro) `GovernancePostureController.GetPosture` — valid tenant + foreign workspace id in scope JWT → HTTP 200 posture summary instead of HTTP 404 — **mechanism:** tenant-only `GetByIdAsync` preflight; siblings `GovernanceResolutionController` / `GovernanceSetupController` use `TenantWorkspaceScopePreflight` — **repro test:** `GovernancePostureControllerTests.GetPosture_returns_not_found_when_workspace_missing`.
- [x] (valid-no-repro) `GovernanceCoverageController.GetScopeCoverage` / `PreviewCoverage` — same ghost-workspace gap — **repro test:** `GovernanceCoverageControllerScopeTests.GetScopeCoverage_returns_not_found_when_workspace_missing` and `PreviewCoverage_returns_not_found_when_workspace_missing`.
- [x] (valid-no-repro) `TenantCustomerSuccessController.PostProductFeedbackAsync` — omitted `score` binds as `0` (neutral) instead of HTTP 400 — **repro test:** `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_bad_request_when_score_omitted`.

2026-08-31 seed hunt #333 (hit): proved environment-catalog ghost tenant, empty `projectId` query validation, and checklist `isCompleted` omission; seeded ghost-workspace posture/coverage and product-feedback score candidates.

2026-08-31 seed hunt #343 (hit): re-proved on master environment-catalog ghost tenant, empty `projectId` query validation, and checklist `isCompleted` omission; seeded ghost-workspace posture/coverage and product-feedback score candidates.

2026-08-31 seed hunt #341 (hit): re-proved on master environment-catalog ghost tenant, empty `projectId` query validation, and checklist `isCompleted` omission; seeded ghost-workspace posture/coverage and product-feedback score candidates.

2026-08-31 seed hunt #339 (hit): re-proved on master environment-catalog ghost tenant, empty `projectId` query validation, and checklist `isCompleted` omission; seeded ghost-workspace posture/coverage and product-feedback score candidates.

2026-08-31 seed hunt #337 (hit): re-proved on master environment-catalog ghost tenant, empty `projectId` query validation, and checklist `isCompleted` omission; seeded ghost-workspace posture/coverage and product-feedback score candidates.

2026-08-31 seed hunt #335 (hit): proved environment-catalog ghost tenant, empty `projectId` query validation, and checklist `isCompleted` omission; seeded ghost-workspace posture/coverage and product-feedback score candidates.

- [x] (proven) `GovernancePostureController.GetPosture` — valid tenant + foreign workspace id in scope JWT → HTTP 200 posture summary instead of HTTP 404 — **hit 2026-08-31 (#344):** `TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync` before posture read; regression in `GovernancePostureControllerTests.GetPosture_returns_not_found_when_workspace_missing`.
- [x] (proven) `GovernanceCoverageController.GetScopeCoverage` / `PreviewCoverage` — same ghost-workspace scope triple → HTTP 200 coverage payload instead of HTTP 404 — **hit 2026-08-31 (#344):** workspace preflight on both actions; regression in `GovernanceCoverageControllerScopeTests.GetScopeCoverage_returns_not_found_when_workspace_missing` and `PreviewCoverage_returns_not_found_when_workspace_missing`.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — JSON body omits `score` → HTTP 204 and persists `Score = 0` instead of HTTP 400 — **hit 2026-08-31 (#344):** `ProductFeedbackRequest.Score` nullable + `score is required` guard; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_bad_request_when_score_omitted`.

- [x] (valid-no-repro) `GovernanceEnvironmentCatalogController.Get` / `Replace` — ghost tenant (JWT tenant id with no `TenantRecord`) returns HTTP 200 default catalog instead of HTTP 404 while sibling governance reads preflight `ITenantRepository.GetByIdAsync`.
- [x] (valid-no-repro) `GovernancePostureController.GetPosture` / `GovernanceStickinessController` register reads — query `projectId=00000000-0000-0000-0000-000000000000` when ambient scope has a real project id → `GovernanceQueryProjectScope.TryResolve` returns false and surfaces HTTP 200 empty payload instead of HTTP 400 validation.
- [x] (valid-no-repro) `CorePilotTeamChecklistController.PutAsync` — JSON body omits `isCompleted` → model binder defaults `bool` to `false` and persists incomplete step instead of HTTP 400 (`ProductFeedbackRequest.Score` omission parity).

2026-08-31 seed hunt #344 (hit): re-proved on master ghost-workspace preflight on posture/coverage reads and product-feedback omitted score default; seeded environment-catalog ghost-tenant, empty projectId validation, and checklist `isCompleted` omission candidates.

2026-08-31 seed hunt #342 (hit): re-proved on master ghost-workspace preflight on posture/coverage reads and product-feedback omitted score default; seeded environment-catalog ghost-tenant, empty projectId validation, and checklist `isCompleted` omission candidates.

2026-08-31 seed hunt #340 (hit): re-proved on master ghost-workspace preflight on posture/coverage reads and product-feedback omitted score default; seeded environment-catalog ghost-tenant, empty projectId validation, and checklist `isCompleted` omission candidates.

2026-08-31 seed hunt #338 (hit): re-proved on master ghost-workspace preflight on posture/coverage reads and product-feedback omitted score default; seeded environment-catalog ghost-tenant, empty projectId validation, and checklist `isCompleted` omission candidates.

2026-08-31 seed hunt #336 (hit): re-proved on master ghost-workspace preflight on posture/coverage reads and product-feedback omitted score default; seeded environment-catalog ghost-tenant, empty projectId validation, and checklist `isCompleted` omission candidates.

2026-08-31 seed hunt #334 (hit): proved ghost-workspace preflight on posture/coverage reads and product-feedback omitted score default.

- [x] (proven) `GovernanceEnvironmentCatalogController.Get` / `Replace` — ghost tenant (JWT tenant id with no `TenantRecord`) returned HTTP 200 default catalog instead of HTTP 404 — **hit 2026-08-31 (#351):** `ITenantRepository.GetByIdAsync` preflight on GET/PUT; regression in `GovernanceEnvironmentCatalogControllerTests.Get_returns_not_found_when_tenant_missing` and `Replace_returns_not_found_when_tenant_missing`.
- [x] (proven) `GovernancePostureController.GetPosture` / `GovernanceStickinessController` register reads — query `projectId=00000000-0000-0000-0000-000000000000` when ambient scope has a real project id → HTTP 200 empty payload instead of HTTP 400 — **hit 2026-08-31 (#351):** `GovernanceQueryProjectScope.IsInvalidEmptyProjectQueryId` + `BadRequestWhenProjectQueryIdEmpty` on posture and stickiness register endpoints; regression in `GovernancePostureControllerTests.GetPosture_returns_bad_request_when_project_id_is_empty_guid` and `GovernanceStickinessControllerTests.GetRiskRegister_returns_bad_request_when_project_id_is_empty_guid`.
- [x] (proven) `CorePilotTeamChecklistController.PutAsync` — JSON body omits `isCompleted` → model binder defaults `bool` to `false` and persists incomplete step instead of HTTP 400 — **hit 2026-08-31 (#351):** `CorePilotChecklistPutRequest.IsCompleted` nullable + required guard; regression in `CorePilotTeamChecklistControllerTests.PutAsync_returns_bad_request_when_is_completed_omitted`.

- [x] (valid-no-repro) `GovernancePostureController.GetPosture` — valid tenant + foreign workspace id in scope JWT → HTTP 200 posture summary instead of HTTP 404 — **mechanism:** tenant-only `GetByIdAsync` preflight; siblings `GovernanceResolutionController` / `GovernanceSetupController` use `TenantWorkspaceScopePreflight` — **repro test:** `GovernancePostureControllerTests.GetPosture_returns_not_found_when_workspace_missing`.
- [x] (valid-no-repro) `GovernanceCoverageController.GetScopeCoverage` / `PreviewCoverage` — same ghost-workspace gap — **repro test:** `GovernanceCoverageControllerScopeTests.GetScopeCoverage_returns_not_found_when_workspace_missing` and `PreviewCoverage_returns_not_found_when_workspace_missing`.
- [x] (valid-no-repro) `TenantCustomerSuccessController.PostProductFeedbackAsync` — omitted `score` binds as `0` (neutral) instead of HTTP 400 — **repro test:** `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_bad_request_when_score_omitted`.

2026-08-31 thorough hunt #351 (hit): proved environment-catalog ghost tenant, empty `projectId` query validation, and checklist `isCompleted` omission on master; seeded ghost-workspace posture/coverage and product-feedback score candidates.

- [x] (proven) `GovernancePostureController.GetPosture` — valid tenant + foreign workspace id in scope JWT → HTTP 200 posture summary instead of HTTP 404 — **hit 2026-08-31 (#352):** `TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync` before posture read; regression in `GovernancePostureControllerTests.GetPosture_returns_not_found_when_workspace_missing`.
- [x] (proven) `GovernanceCoverageController.GetScopeCoverage` / `PreviewCoverage` — same ghost-workspace scope triple → HTTP 200 coverage payload instead of HTTP 404 — **hit 2026-08-31 (#352):** workspace preflight on both actions; regression in `GovernanceCoverageControllerScopeTests.GetScopeCoverage_returns_not_found_when_workspace_missing` and `PreviewCoverage_returns_not_found_when_workspace_missing`.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — JSON body omits `score` → HTTP 204 and persists `Score = 0` instead of HTTP 400 — **hit 2026-08-31 (#352):** `ProductFeedbackRequest.Score` nullable + `score is required` guard; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_bad_request_when_score_omitted`.

- [x] (valid-no-repro) `GovernanceEnvironmentCatalogController.Get` / `Replace` — ghost tenant (JWT tenant id with no `TenantRecord`) returns HTTP 200 default catalog instead of HTTP 404 while sibling governance reads preflight `ITenantRepository.GetByIdAsync`.
- [x] (valid-no-repro) `GovernancePostureController.GetPosture` / `GovernanceStickinessController` register reads — query `projectId=00000000-0000-0000-0000-000000000000` when ambient scope has a real project id → `GovernanceQueryProjectScope.TryResolve` returns false and surfaces HTTP 200 empty payload instead of HTTP 400 validation.
- [x] (valid-no-repro) `CorePilotTeamChecklistController.PutAsync` — JSON body omits `isCompleted` → model binder defaults `bool` to `false` and persists incomplete step instead of HTTP 400 (`ProductFeedbackRequest.Score` omission parity).

2026-08-31 thorough hunt #352 (hit): proved ghost-workspace preflight on posture/coverage reads and product-feedback omitted score default on master; seeded environment-catalog ghost-tenant, empty projectId validation, and checklist `isCompleted` omission candidates.

2026-08-31 combined PR #1031–#1043: integrated ghost-workspace posture/coverage reads, product-feedback score omission, environment-catalog ghost tenant, empty projectId query, and checklist isCompleted omission fixes.

2026-08-31 thorough hunt #354 (hit): proved ghost-workspace preflight on posture/coverage reads and product-feedback omitted score default on master.

2026-08-31 combined PR #1021–#1028: integrated seed hunts #377–#382 on master — environment-catalog ghost tenant, empty `projectId` query validation, checklist `isCompleted` omission (#381), ghost-workspace posture/coverage preflight, and product-feedback score omission (#382).
2026-08-31 combined PR #892–#930: integrated governance/tenancy scope-gate fixes from hunts #271–#308 on master (core hunt #279 already merged as #900).

2026-08-31 thorough hunt #308: re-proved on master the four #281 scope/dedupe defects (prior branches unmerged); cheap-disproved manifest-compare padded-version and batch silent-dedupe candidates again.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — whitespace-only body `findingRef` bypassed inspect gate and persisted padded blank `FindingRef` — **hit 2026-08-31 (#324):** normalize to null before gate/persist; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_omits_finding_ref_when_value_is_whitespace`.
- [x] (proven) `GovernanceCoverageController.PreviewCoverage` — null JSON body threw `ArgumentNullException` (HTTP 500 risk) instead of HTTP 400 — **hit 2026-08-31 (#324):** nullable body guard; regression in `GovernanceCoverageControllerScopeTests.PreviewCoverage_returns_bad_request_when_body_is_null`.
- [x] (invalid) `TenantWorkspacesController.ListAsync` / `ListRecycleBinAsync` — sibling architecture projects in the same workspace appear in list responses while delete/restore require `scope.ProjectId` — **cheap-disproof 2026-09-02 (#419):** `ListAsync_returns_only_current_workspace` filters to `scope.WorkspaceId` and lists all active projects in that workspace for the picker UI; project-scoped mutation guards are intentional.
- [x] (valid-no-repro) `GovernanceEnvironmentCatalogController.Get` / `Replace` — missing workspace preflight when scope workspace id is invalid for tenant — **cheap-disproof 2026-09-02 (#419):** `TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync` on GET/PUT; regression in `GovernanceEnvironmentCatalogControllerTests.Get_returns_not_found_when_workspace_missing`.
- [x] (valid-no-repro) `GovernanceStickinessController.UpdateRecurrenceSchedule` — empty PUT body recomputes `NextRunUtc` without any user-supplied field change — **cheap-disproof 2026-09-02 (#419):** fixed in facade; regression in `GovernanceStickinessFacadeTests.UpdateRecurrenceScheduleAsync_preserves_next_run_when_request_has_no_schedule_changes`.

2026-09-02 thorough hunt #419 (dry): cheap-disproved three stale candidates; scoped regression tests passed; no failing repro.

2026-08-31 seed hunt #324: proved product-feedback whitespace findingRef normalization and coverage preview null-body 400 parity; seeded workspace project list disclosure, environment-catalog workspace preflight, and recurrence empty-PUT drift candidates.

2026-08-31 thorough hunt #315: re-proved on master (fixes still unmerged) workspace sibling-project scope, product-feedback findingRef gate, batch-review case-variant duplicate ids, and bulk-disposition all-or-nothing scope validation.

2026-08-31 thorough hunt #313: re-proved on master (fixes still unmerged) workspace sibling-project scope, product-feedback findingRef gate, batch-review case-variant duplicate ids, and bulk-disposition all-or-nothing scope validation.

2026-08-31 thorough hunt #281: cheap-disproved stale batch-review silent-dedupe and manifest-compare padded-version candidates; proved workspace sibling-project scope, product-feedback findingRef gate, batch-review case-variant duplicate ids, and bulk-disposition all-or-nothing scope validation.

2026-08-28 thorough hunt #190 (dry): cheap-disproved promotions/activations padded-route test gap and simulate-bulk validation-order candidates; seeded batch-review duplicate-id silence and manifest-compare padded-version candidates.

2026-08-28 thorough hunt #186: proved batch-review mixed whitespace per-item validation; cheap-disproved activate idempotency test-gap candidate; zone candidate backlog cleared.

2026-08-28 seed hunt #185: proved batch-review scoped-run error parity and null decision/ids guards; seeded batch mixed-whitespace and activate idempotency candidates.

2026-08-28 thorough hunt #184: proved preview empty runId 400 and promote whitespace approvalRequestId 400; zone candidate backlog cleared.

2026-08-28 seed hunt #183: proved RequireScopedRunAsync empty runId 400, approval whitespace route id 400, and pre-commit empty runId 400; seeded preview empty runId and promote whitespace approvalRequestId candidates.

2026-08-28 thorough hunt #182: proved simulate empty runId string 400 and manifest whitespace version 400; zone candidate backlog cleared.

2026-08-28 seed hunt #181: proved risk-exception empty route id, merge-conflict empty runId, and disposition-sibling whitespace findingId guards; seeded simulate empty runId string and manifest whitespace version candidates.

2026-08-28 thorough hunt #180: proved policy-pack route empty-guid guards and product-feedback empty runId 400; zone candidate backlog cleared.

2026-08-28 seed hunt #179: proved invalid runId 400, homepage empty selectedRunId 400, and disposition whitespace findingId 400; seeded policy-pack route empty-guid and customer-success empty runId candidates.

2026-08-28 thorough hunt #178: proved RequireScopedRunAsync empty-run 400 parity and tenant workspace delete/restore empty route-id guards; zone candidate backlog cleared.

2026-08-28 seed hunt #177: proved dry-run empty pack id, update-recurrence empty schedule id, and disposition/risk-exception empty body runId guards; seeded RequireScopedRunAsync empty-run 404-vs-400 and tenant workspace empty route-id candidates.

2026-08-27 seed hunt #147: proved bulk-disposition and create-risk-exception findingId trim parity; seeded dashboard sibling-cap and manifest-compare metadata candidates.

2026-08-27 thorough hunt #142: proved preview/approval trim parity and simulate-bulk/dry-run whitespace validation; zone hunt-ready backlog cleared.

2026-08-27 seed hunt #141: proved governance workflow manifest-version trim parity; seeded preview/approval-id/whitespace-batch candidates.

2026-08-27 seed hunt #140: proved governance run-history reads pass trimmed run id to repositories.

2026-08-27 seed hunt #139: proved pilot-value-report pre-1970 date guard and governance approval audit run-id trim.

2026-08-27 seed hunt #138: proved risk-exception manifest-only binding gate and manifest version trim parity.

2026-08-27 seed hunt #137: proved governance scoped-run trim parity and promote approval-run scope preflight.

2026-08-27 seed hunt #136: proved create-risk-exception manifest-run binding gate.

2026-08-27 seed hunt #135: proved governance dashboard query validation and batch-review whitespace-id guards.

2026-08-27 seed hunt #134: proved create-risk-exception out-of-scope `runId` scope gate; promoted from disposition parity gap.

2026-08-27 seed hunt #133: seed-only — zone ghost-tenant parity exhausted; cheap-disproved dry-run recurrence preview, static rule templates, and remaining tenancy workspace/trial/baseline/homepage preflight siblings.

2026-08-27 seed hunt #132: proved manifest read/export/compare ghost-tenant 404 parity; cheap-disproved measured ROI, ROI bundle, and static schema-key candidates.

2026-08-27 thorough hunt #131: proved promote/activate, run-history reads, and governance policy-pack ghost-tenant 404 parity; zone candidate backlog cleared for this sweep.

2026-08-27 thorough hunt #130: proved approval submit/approve/reject/batch-review ghost-tenant 404 parity; seeded promote/activate, governance policy-pack dry-run, and run-history read ghost-tenant candidates.

2026-08-27 seed hunt #129: proved approval lineage/rationale and pre-finalize checklist/simulate ghost-tenant 404 parity; seeded governance approval-mutation ghost-tenant candidates.

2026-08-27 thorough hunt #128: proved catalog/list/explain policy-pack read ghost-tenant 404 parity; cheap-disproved `ListWorkspaceSelection` (already preflighted).

2026-08-27 thorough hunt #127: proved catalog promote/demote, version reads, and attestation/list-dispositions ghost-tenant 404 parity; seeded remaining catalog/read sibling candidates.

2026-08-27 thorough hunt #126: proved policy-pack publish/assign/archive/delete/duplicate/set-enabled and stickiness revoke/renew/update-recurrence/upsert-attestation/resolve-merge-conflict ghost-tenant 404 parity; seeded catalog-mutation and attestation/list-dispositions candidates.

2026-08-27 thorough hunt #125: proved policy-pack simulate/validate and stickiness disposition/risk-exception/recurrence mutation ghost-tenant 404 parity; seeded policy-pack mutation and stickiness sibling-mutation candidates.

2026-08-27 thorough hunt #124: proved preview/compare-environments and list-recurrence-schedules ghost-tenant 404 parity; cheap-disproved setup-guide candidate (already fixed on master).

2026-08-27 thorough hunt #122: proved preview compare-environments and stickiness register ghost-tenant 404 parity.

2026-08-27 seed hunt #123: proved stickiness sibling register reads and coverage preview ghost-tenant 404 parity; seeded preview/recurrence-list ghost-tenant candidates.

2026-08-27 thorough hunt #120: proved governance-resolution ghost tenant 404.

2026-08-27 thorough hunt #116: proved policy-packs list ghost tenant 404.

2026-08-26 thorough hunt #119: proved governance coverage ghost tenant 404.

2026-08-26 thorough hunt #112: proved compliance-drift-trend ghost tenant 404; cheap-disproved four stale seed candidates (dashboard tenant 404, dry-run batch semantics, simulate-bulk batch semantics, convert-trial tier validation); seeded posture/resolution/coverage/policy-packs list ghost-tenant parity candidates.

2026-08-26 thorough hunt #109: proved customer-success GET tenant 404, merge-conflict run-scope 404 parity, and realized-value attestation validation; cheap-disproved DryRunPolicyPack scope (already fixed) and usage-status tenant 404 (already guarded).

2026-08-26 seed hunt #108: proved approve/reject run-scope preflight, recurrence schedule 404 parity, governance simulate validation, weekly digest health tenant 404, and homepage settings GET tenant 404; seeded customer-success GET ghost tenant, merge-conflict run miss, realized-value attestation validation, and usage-status tenant parity candidates.

2026-08-26 thorough hunt #107: proved baseline source-note-without-hours 400, digest recipient validation (enabled-without-recipients, malformed, duplicate), SoD mailbox bridge for mixed API-key/JWT review, and activate/submit scoped-run preflight parity.

2026-08-26 seed hunt #106: proved funnel first-manifest committed filter, checklist GET tenant 404, preview activation manifest binding, setup-guide enabled subscriptions only, and non-prod promote approval linkage; seeded baseline note-without-hours, digest recipient validation, SoD bypass, and activate/submit scope-preflight candidates.

2026-08-26 thorough hunt #105: proved all five seeded candidates — checklist PUT tenant 404, LLM cost GET tenant 404, compare-environments manifest binding, promote manifest binding, and baseline source-note-only persistence.

2026-08-26 seed hunt #104: proved cost-settings GET tenant 404, exec/sponsor digest GET tenant 404, submit manifest-run binding, and dashboard ReadyForCommit token exclusion; seeded checklist PUT 404, LLM cost GET ghost tenant, compare-environments binding, promote binding, and baseline source-note candidates.

2026-08-26 thorough hunt #103: proved cost-settings tenant 404, preview/activate manifest-run binding, LLM cost days validation, and promote run-scope preflight.

2026-08-26 seed hunt #102: proved sponsor digest timezone validation and featured-sample committed-only eligibility; seeded cost-settings 404, preview manifest/run mismatch, activate manifest binding, LLM cost days validation, and promote run-scope candidates.

2026-08-26 thorough hunt #101: proved catalog migration tenant 404 and exec digest timezone validation; cheap-disproved exec digest primary-workspace candidate.

2026-08-26 thorough hunt #100: proved decision register filter-before-TOP SQL ordering.

2026-08-26 seed hunt #99: proved tenant baseline partial manual-prep validation; seeded decision-register filter order, exec digest, and catalog migration candidates.

2026-08-26 thorough hunt #98: proved finding disposition scope 404 parity; cheap-disproved list-dispositions empty-vs-404 candidate.

2026-08-26 seed hunt #97: proved governance promote approval scope 404; seeded disposition status-parity and list-empty candidates.

2026-08-26 thorough hunt #96: proved workspace baseline artifacts project-scope presence SQL.

2026-08-26 thorough hunt #95: proved stickiness funnel committed-run SQL filter; cheap-disproved workspace restore 404 parity candidate.

2026-08-26 seed hunt #94: proved governance approve/batch 404, renew risk-exception 404, bulk disposition all-fail 400, erasure approve 404.

2026-08-26 thorough hunt #93: proved governance approval lineage/rationale run-scope 404; cheap-disproved EA discount dual-field 400 expectation.

2026-08-26 thorough hunt #92: proved effective governance/resolver foreign-pack scope + erasure legal-hold 404.

2026-08-26 thorough hunt #90: proved weekly digest health sponsor-prefs gap + sponsor digest weekly delivery pipeline.

2026-08-26 seed hunt #88: proved risk-exception list workspace filter, decision register workspace SQL filter.

2026-08-26 seed hunt #87: proved realized-value attestation workspace setting isolation, decisions-needed waiver scope, architecture risk register workspace SQL filter.

2026-08-26 seed hunt #86: proved manifest compare run scope, decisions-needed trail scope, policy-pack dry-run pack scope.

2026-08-26 seed hunt #85: proved manifest body scope on read/export paths, featured-sample workspace setting isolation, governance coverage pack metadata scope.

2026-08-26 seed hunt #84: proved disposition run scope, disposition history workspace filter, pre-finalize checklist 404, governance run-history scoped preflight.

2026-08-26 seed hunt #83: proved pre-finalize checklist read-side persist, out-of-scope run finalize readiness, compliance drift trend scope, product-feedback run scope.

2026-08-26 seed hunt #82: proved posture project scope, recurrence source-run scope, tenant workspace list/recycle-bin scope, dashboard change-log scope.

2026-08-26 seed hunt #81: proved decision-register/bundle project scope, risk-exception finding and waiver scope, tenant workspace project mutate scope; shipped hunt #79 assignment/disposition/manifest fixes on the same branch.

2026-08-26 seed hunt #79: proved assignment enable/archive, risk-register project scope, manifest evidence scope, finding disposition scope.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateBuyerConfidenceSource` / `GovernanceStickinessController.GetDecisionRegister` — padded `buyerConfidenceSource` query (`" Evidence-backed "`) returned HTTP 400 unknown-label instead of HTTP 200 while SQL reader trims at query time — **hit 2026-09-03 (#541):** trim before known-label check and pass trimmed value to register filters; regression in `GovernanceStickinessHttpMapperTests.ValidateBuyerConfidenceSource_accepts_padded_known_label` and `GovernanceStickinessControllerTests.GetDecisionRegister_returns_ok_when_buyer_confidence_source_is_padded`.
- [x] (proven) `GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters` / `GovernanceStickinessController.GetDecisionRegister` — `minConfidence` below 0 or `maxConfidence` above 1 accepted without HTTP 400 (only inverted-range check existed) — **hit 2026-09-03 (#541):** `[0, 1]` bounds validation on both query params; regression in `GovernanceStickinessHttpMapperTests.ValidateDecisionRegisterFilters_rejects_out_of_range_confidence_bounds` and `GovernanceStickinessControllerTests.GetDecisionRegister_returns_bad_request_when_confidence_bounds_are_out_of_range`.

2026-09-03 seed hunt #541: proved decision-register padded buyer-confidence label trim parity and confidence bound validation; broke two-dry-hunt streak.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters` / `GovernanceStickinessController.GetDecisionRegister` — `recordedAfterUtc` / `recordedBeforeUtc` before 1970-01-01 returned HTTP 200 instead of HTTP 400 — **hit 2026-09-03 (#549):** pre-1970 guard aligned with `GovernanceController.GetComplianceDriftTrend` and `TenantPilotValueReportController`; regression in `GovernanceStickinessHttpMapperTests.ValidateDecisionRegisterFilters_rejects_recorded_after_before_1970` and `GovernanceStickinessControllerTests.GetDecisionRegister_returns_bad_request_when_recorded_after_utc_before_1970`.
- [x] (proven) `TenantErasureLegalHoldController.SetLegalHoldAsync` — `Reason` longer than `LegalHoldReason NVARCHAR(500)` reached SQL without HTTP 400 — **hit 2026-09-03 (#549):** controller max-length guard before `TrySetLegalHoldAsync`; regression in `TenantErasureLegalHoldControllerTests.SetLegalHoldAsync_returns_bad_request_when_reason_exceeds_max_length`.
- [x] (proven) `TenantErasureLegalHoldController.SetLegalHoldAsync` — whitespace-only `Reason` persisted without HTTP 400 — **hit 2026-09-03 (#549):** reject empty/whitespace reason and trim before persist; regression in `TenantErasureLegalHoldControllerTests.SetLegalHoldAsync_returns_bad_request_when_reason_is_whitespace`.

2026-09-03 seed hunt #549: proved decision-register pre-1970 date validation and legal-hold reason validation parity.

- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — `comment` longer than `dbo.ProductFeedback.CommentText NVARCHAR(2000)` reached SQL without HTTP 400 while `RunsController.PostFindingFeedbackAsync` already capped at 2000 — **hit 2026-09-03 (#550):** trim/normalize whitespace-only comment to null and reject over-length before `InsertProductFeedbackAsync`; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_bad_request_when_comment_exceeds_max_length`.

2026-09-03 seed hunt #550: proved product-feedback comment max-length validation parity with finding-feedback; seeded whitespace-only comment persistence candidate (closed in same fix).

- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` / `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` / `DigestRecipientEmailsValidator` — semicolon-joined recipient list longer than `RecipientEmails NVARCHAR(2000)` reached SQL without HTTP 400 (format/dedupe validated only) — **hit 2026-09-03 (#551):** reject serialized length > 2000 in shared validator before upsert; regression in `TenantExecDigestPreferencesControllerTests.PostExecDigestPreferences_returns_bad_request_when_recipient_emails_exceed_max_serialized_length` and `TenantSponsorDigestPreferencesControllerTests.PostSponsorDigestPreferences_returns_bad_request_when_recipient_emails_exceed_max_serialized_length`.
- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `RiskExceptionValidation` — `evidenceRef` (`NVARCHAR(500)`) and `ownerUserId` (`NVARCHAR(256)`) lacked max-length guards before `SqlRiskExceptionRepository.CreateAsync` (required/whitespace only) — **hit 2026-09-03 (#552):** reject over-length after trim in `RiskExceptionValidation`; trim `EvidenceRef` on persist; regression in `RiskExceptionValidationTests` and `GovernanceStickinessControllerTests.CreateRiskException_returns_bad_request_when_evidence_ref_exceeds_max_length`.

2026-09-03 thorough hunt #552: proved risk-exception ownerUserId/evidenceRef max-length validation before SQL insert.

- [x] (proven) `TenantBaselineController.PutAsync` — `baselineReviewCycleSourceNote` validated to 500 chars but `BaselineReviewCycleSource NVARCHAR(256)` persists `baseline_settings:` prefix (+18 chars), so 239–500 char notes reached SQL without HTTP 400 — **hit 2026-09-03 (#553):** cap at `BaselineReviewCycleSourceMarkers.MaxOperatorSettingsNoteLength` (238); regression in `TenantBaselineControllerTests.PutAsync_returns_bad_request_when_review_cycle_source_note_exceeds_persisted_max_length`.
- [x] (proven) `GovernanceEnvironmentCatalogController.Replace` / `GovernanceController.SubmitApprovalRequest` / `Promote` — custom catalog slugs validated to 64 chars but `dbo.GovernanceApprovalRequests.SourceEnvironment` / `TargetEnvironment` and promotion records remained `NVARCHAR(32)`, so 33–64 char slugs passed validation then failed SQL on workflow persist — **hit 2026-09-03 (#554):** DbUp 344 widens workflow environment columns to `NVARCHAR(64)`; shared `GovernanceEnvironmentSlug.MaxLength`; regression in `GovernanceWorkflowFacadeTests.SubmitApprovalRequestAsync_persists_forty_character_custom_environment_slugs`, `CreateGovernanceApprovalRequestValidatorTests`, `GovernanceEnvironmentCatalogServiceTests`, and `SqlGovernanceApprovalRequestRepositoryFreshTenantPrimingSqlIntegrationTests.CreateAsync_persists_environment_slugs_up_to_sixty_four_characters`.

2026-09-03 thorough hunt #554: proved workflow environment slug SQL column width parity with custom catalog slugs.

- [x] (proven) `PolicyPacksController.PromoteCatalogEntry` / `PolicyPackCatalogAdminService.TryPromoteFromSourcePackAsync` — tenant `PolicyPacks.Name` (`NVARCHAR(300)`) and `Description` (`NVARCHAR(MAX)`) lacked catalog snapshot guards before `PolicyPackCatalogEntry.DisplayName` (`NVARCHAR(256)`) / `Description` (`NVARCHAR(2000)`) upsert, so 257–300 char names or >2000 char descriptions passed promote and failed SQL (HTTP 500) — **hit 2026-09-03 (#555):** `PolicyPackCatalogPromotionValidation.ValidateSnapshotOrThrow` before catalog upsert; facade maps `ArgumentException` to HTTP 400; regression in `PolicyPackCatalogPromotionValidationTests`, `PolicyPackCatalogAdminServiceTests`, and `PolicyPacksControllerListScopeTests.PromoteCatalogEntry_returns_bad_request_when_snapshot_exceeds_catalog_limits`.

2026-09-03 seed hunt #555: proved policy pack catalog promote snapshot name/description max-length validation before SQL insert; seeded recurrence-schedule name/cron max-length candidate.

- [x] (proven) `GovernanceStickinessController.CreateRecurrenceSchedule` / `UpdateRecurrenceSchedule` / `RecurrenceScheduleValidation` — `Name` (`NVARCHAR(300)`) and `CronExpression` (`NVARCHAR(100)`) lacked max-length guards before `ArchitectureReviewRecurrenceSchedules` insert/update (cron format only) — **hit 2026-09-03 (#556):** `RecurrenceScheduleValidation` rejects over-length after trim in create/update facade paths; update controller maps `ArgumentException` to HTTP 400; regression in `RecurrenceScheduleValidationTests`, `GovernanceStickinessFacadeScopeTests.CreateRecurrenceScheduleAsync_throws_when_name_exceeds_sql_max_length`, and `GovernanceStickinessControllerTests` create/update bad-request cases.

2026-09-03 thorough hunt #556: proved recurrence schedule name and cron expression max-length validation before SQL persist.

- [x] (proven) `TenantTrialController.LinkEntraAsync` / `TenantTrialAbuseGuard.ValidateIdentityLinkAsync` — `entraOid` longer than `LinkedEntraOid NVARCHAR(128)` reached `SqlTrialIdentityUserRepository.TryLinkLocalIdentityToEntraAsync` without HTTP 400 (unhandled `ArgumentException` → HTTP 500) — **hit 2026-09-03 (#557):** reject over-length after trim in abuse guard before directory bind/link; shared `TrialIdentityUserFieldLimits.LinkedEntraOidMaxLength`; regression in `TenantTrialAbuseGuardTests` and `TenantTrialControllerTests.LinkEntraAsync_returns_bad_request_when_entra_oid_exceeds_max_length`.

2026-09-03 seed hunt #557: proved link-entra entraOid max-length validation before identity handoff; seeded preview cron and policy-pack version read parity candidates.

- [x] (invalid) `GovernanceStickinessController.PreviewRecurrenceScheduleRuns` — `cronExpression` longer than `NVARCHAR(100)` returns HTTP 200 `{ isValid: false }` instead of HTTP 400 parity with create/update — **cheap-disproof 2026-09-03 (#559):** dry-run preview intentionally returns validation outcome in body for unsupported cron (regression `PreviewRecurrenceScheduleRuns_marks_invalid_cron_without_daily_fallback`); no persistence path; over-length crons fail syntax check with same 200 contract.
- [x] (proven) `PolicyPacksController.GetVersion` / `PolicyPacksHttpMapper.ValidatePackVersion` — route `packVersion` longer than `NVARCHAR(50)` or non-SemVer returned HTTP 404 version-not-found while publish/assign return HTTP 400 — **hit 2026-09-03 (#559):** shared `PackVersionMaxLength` and SemVer guard in `ValidatePackVersion`; regression in `PolicyPacksHttpMapperTests` and `PolicyPacksControllerListScopeTests.GetVersion_returns_bad_request_when_pack_version_exceeds_max_length` / `GetVersion_returns_bad_request_when_pack_version_is_not_semver`.

2026-09-03 thorough hunt #559: cheap-disproved preview cron length parity; proved policy pack GetVersion SemVer and max-length validation parity with publish/assign.

- [x] (proven) `GovernanceStickinessController.RecordDisposition` — body `tradeOffAcknowledgment` dropped when rebuilding `RecordFindingDispositionRequest`, so Accepted dispositions with valid trade-off returned HTTP 400 ("Trade-off acknowledgment is required") — **hit 2026-09-03 (#560):** forward `TradeOffAcknowledgment` in normalized request; regression in `GovernanceStickinessControllerTests.RecordDisposition_returns_ok_when_trade_off_acknowledgment_provided`.

2026-09-03 seed hunt #560: promoted and proved RecordDisposition trade-off acknowledgment drop; seeded renew evidenceRef length and promote catalog version SemVer parity candidates.

2026-09-03 thorough hunt #561: proved renew waiver evidenceRef max-length validation parity and promote-catalog optional version SemVer/max-length validation parity.

- [x] (invalid) `GovernanceStickinessController.RenewRiskException` / `RiskExceptionValidation.ValidateRenew` — overlong body `evidenceRef` — **cheap-disproof 2026-09-03 (#562):** stale picker row; already proven in hunt #561 (`ValidateRenew_rejects_evidence_ref_over_max_length`).
- [x] (invalid) `PolicyPacksController.PromoteCatalogEntry` optional body `version` SemVer/max-length — **cheap-disproof 2026-09-03 (#562):** stale picker row; already proven in hunt #561 (`PromoteCatalogEntry_returns_bad_request_when_version_is_not_semver`).

- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `GovernanceStickinessFacade.RecordBulkDispositionAsync` — bulk `Accepted` omitted `TradeOffAcknowledgment` when rebuilding per-finding requests, so UI "Accept all" with shared rationale returned HTTP 400 after #560 single-item fix — **hit 2026-09-03 (#562):** optional `TradeOffAcknowledgment` on bulk contract; default to shared `Rationale` for Accepted; regression in `GovernanceStickinessFacadeScopeTests.RecordBulkDispositionAsync_forwards_trade_off_acknowledgment_for_accepted_disposition` and `GovernanceStickinessControllerTests.RecordBulkDisposition_returns_ok_when_accepted_and_shared_rationale_supplies_trade_off`.

2026-09-03 thorough hunt #562: cheap-disproved two stale #561 picker rows; proved bulk disposition Accepted trade-off acknowledgment forwarding.

- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `GovernanceStickinessHttpMapper.ValidateCreateRiskException` — omitted `runId` (`null`) passed HTTP validation while `Guid.Empty` returned HTTP 400 and disposition routes reject both null and empty — **hit 2026-09-03 (#563):** require non-null non-empty `runId` before facade (disposition `ValidateRunId` parity); regression in `GovernanceStickinessControllerTests.CreateRiskException_returns_bad_request_when_run_id_is_null`.

2026-09-03 seed hunt #563: promoted and proved CreateRiskException null runId validation parity; seeded product-feedback findingRef and bulk waive rationale candidates.

- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — `findingRef` longer than `NVARCHAR(512)` reached SQL without HTTP 400 while `comment` was capped at 2000 — **hit 2026-09-03 (#565):** reject overlong `FindingRef` before inspect/insert; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_bad_request_when_finding_ref_exceeds_max_length`.
- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `GovernanceFindingsBulkActions` — bulk `RejectedAsNotApplicable` with shared `rationale` shorter than 10 characters returned HTTP 400 while operator bulk UI only required non-empty reason — **hit 2026-09-03 (#565):** align bulk accept/waive UI with `DISPOSITION_RATIONALE_MIN_CHARS` (defer still non-empty only); API regression in `GovernanceStickinessControllerTests.RecordBulkDisposition_returns_bad_request_when_waive_rationale_shorter_than_minimum`; UI regression in `GovernanceFindingsBulkActions.test.tsx`.

2026-09-03 thorough hunt #565: proved product-feedback `findingRef` max-length validation and bulk waive rationale UI/API contract alignment.

- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `GovernanceStickinessFacade.RecordBulkDispositionAsync` / `GovernanceFindingsBulkActions` — bulk `Deferred` without `revisitDueUtc` auto-filled `now + 30 days` and returned HTTP 200 while single-item `FindingDispositionValidation` requires explicit revisit due — **hit 2026-09-03 (#566):** remove facade auto-fill; bulk UI sends `defaultDeferredRevisitDueUtc()` (+30 days); API regression in `GovernanceStickinessControllerTests.RecordBulkDisposition_returns_bad_request_when_deferred_without_revisit_due`; UI regression in `GovernanceFindingsBulkActions.test.tsx`.

2026-09-03 seed hunt #566: promoted and proved bulk defer `revisitDueUtc` validation parity with single-item disposition path.

- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `RecordBulkFindingDispositionRequest` / `GovernanceStickinessFacade.RecordBulkDispositionAsync` — bulk `NeedsEvidence` always returned HTTP 400 because contract omitted `EvidenceRequestText` while `FindingDispositionValidation` requires it — **hit 2026-09-03 (#567):** add shared `EvidenceRequestText` on bulk contract and forward in facade; regression in `GovernanceStickinessControllerTests.RecordBulkDisposition_returns_ok_when_needs_evidence_with_shared_evidence_request_text` and `GovernanceStickinessFacadeScopeTests.RecordBulkDispositionAsync_forwards_evidence_request_text_for_needs_evidence_disposition`.

- [x] (invalid) `CreateRiskException` `manifestId=Guid.Empty` skips manifest-run binding — optional field; empty guid means no manifest linkage; `runId` required at HTTP layer (#563).

- [x] (invalid) `RecordBulkDisposition` hardcoded `RunId=Guid.Empty` vs single-item run validation — bulk contract is finding-scoped; no `RunId` property by design.

- [x] (invalid) Digest `ianaTimeZoneId` longer than SQL `NVARCHAR(128)` — `IanaTimeZonePreferenceValues.NormalizeOrNull` rejects unknown ids before persist (#2962–#2963); valid IANA ids are well under 128 chars.

2026-09-03 seed hunt #567: promoted and proved bulk `NeedsEvidence` `EvidenceRequestText` contract parity; cheap-disproved manifestId empty-guid, bulk RunId, and digest timezone length candidates.

- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `RiskExceptionService.CreateAsync` — waiver create returned HTTP 200 when latest finding disposition was `Remediated` while renew already rejected via `RiskExceptionDispositionGuard` — **hit 2026-09-03 (#568):** call `EnsureWaiverAllowedForFindingAsync` on create (parity with renew); regression in `RiskExceptionServiceTests.CreateAsync_rejects_when_finding_latest_disposition_is_remediated` and `GovernanceStickinessControllerTests.CreateRiskException_returns_bad_request_when_finding_latest_disposition_is_remediated`.

2026-09-03 seed hunt #568: promoted and proved CreateRiskException remediated-disposition guard parity with renew.

- [x] (proven) `GovernanceStickinessController.RenewRiskException` / `RiskExceptionService.RenewAsync` — renewing a revoked in-scope waiver returned HTTP 404 because SQL zero-row renew mapped to `InvalidOperationException` instead of lifecycle conflict — **hit 2026-09-03 (#569):** reject `RiskExceptionStatus.Revoked` with `ConflictException` → HTTP 409; regression in `RiskExceptionServiceTests.RenewAsync_throws_conflict_when_risk_exception_status_is_revoked` and `GovernanceStickinessControllerTests.RenewRiskException_returns_conflict_when_waiver_is_revoked`.

2026-09-03 seed hunt #569: promoted and proved RenewRiskException revoked-waiver conflict status mapping.

- [x] (proven) `GovernanceStickinessController.RevokeRiskException` / `RiskExceptionService.RevokeAsync` — second revoke (or revoke `Expired` waiver) on in-scope waiver returned HTTP 204 and logged duplicate `RiskExceptionRevoked` audit while `RenewRiskException` on `Revoked` returns HTTP 409 (#569 lifecycle parity) — **hit 2026-09-03 (#570):** reject non-`Active` status with `ConflictException` → HTTP 409 before SQL revoke; regression in `RiskExceptionServiceTests.RevokeAsync_throws_conflict_when_risk_exception_status_is_revoked`, `RevokeAsync_throws_conflict_when_risk_exception_status_is_expired`, and `GovernanceStickinessControllerTests.RevokeRiskException_returns_conflict_when_waiver_is_already_revoked`.

- [x] (invalid) `GovernanceStickinessController.RenewRiskException` on finding with latest disposition `Remediated` — `RiskExceptionDispositionGuard.EnsureWaiverAllowedForFindingAsync` already runs in `RenewAsync` (same as create after #568); controller maps `ArgumentException` → HTTP 400; controller test gap only (`RenewRiskException_returns_bad_request_when_finding_latest_disposition_is_remediated` missing).

- [x] (invalid) `GovernanceStickinessController.ListRiskExceptions` optional out-of-scope `projectId` — `GovernanceQueryProjectScope.TryResolve` returns `[]` (intentional hide pattern, ledger #2957); `ValidateProjectQueryId` rejects `Guid.Empty` (ledger #351).

- [x] (invalid) `GovernanceController.BatchReviewApprovalRequests` padded `approvalRequestIds` — facade trims per id in loop (`rawApprovalRequestId.Trim()`); duplicate/whitespace cases covered in `GovernanceControllerRunHistoryScopeTests`.

- [x] (invalid) `GovernanceStickinessController` recurrence schedule create/update validation — name/cron max-length and cron format guards shipped #556; create requires `isEnabled` and non-empty `sourceRunId`.

- [x] (invalid) `TenantBaselineController` / `TenantWorkspacesController` / `TenantHomepageSettingsController` ghost-tenant and empty-guid route validation — tenant preflight and empty-guid guards on proven read/mutate paths (ledger hunts #102–#303, #3096).

2026-09-03 seed hunt #570: promoted and proved RevokeRiskException lifecycle conflict mapping for revoked/expired waivers.

- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `RecordDisposition` / `GovernanceStickinessFacade` — in-scope `findingId` with body `runId` from a different in-scope authority run returned HTTP 200 while inspect exposes the finding's authority `RunId` — **hit 2026-09-03 (#571):** `EnsureRunMatchesFindingAuthorityRun` compares inspect `RunId` before scoped run preflight; controller maps `ArgumentException` → HTTP 400; regression in `GovernanceStickinessFacadeScopeTests` and `GovernanceStickinessControllerTests`.

- [x] (invalid) `GovernanceStickinessController.CreateRiskException` / `RiskExceptionService.CreateAsync` — second active waiver for the same finding returns HTTP 200 (no uniqueness guard on `(TenantId, FindingId, Active)`) — duplicate of proven #572 row; create guard shipped there.

- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `RiskExceptionService.CreateAsync` — second non-expired active waiver for the same scoped finding returned HTTP 200 while inspect `HasActiveWaiver` and UI create path assume at most one — **hit 2026-09-03 (#572):** `GetActiveForScopeFindingAsync` guard (tenant/workspace/project/finding parity with inspect follow-up SQL) throws `ConflictException` → HTTP 409; regression in `RiskExceptionServiceTests.CreateAsync_throws_conflict_when_active_waiver_exists_for_finding` and `GovernanceStickinessControllerTests.CreateRiskException_returns_conflict_when_active_waiver_exists_for_finding`.

- [x] (proven) `RiskExceptionService.RenewAsync` — renewing an `Expired` waiver while another non-expired active waiver exists for the same scoped finding returned HTTP 200 (create guard from #572 does not apply to renew) — **hit 2026-09-03 (#573):** sibling `GetActiveForScopeFindingAsync` check throws `ConflictException` when `RiskExceptionId` differs; regression in `RiskExceptionServiceTests.RenewAsync_throws_conflict_when_another_active_waiver_exists_for_same_finding`.

- [x] (proven) `RiskExceptionService.CreateAsync` — stale `Status=Active` rows past `ExpiresAtUtc` were invisible to the duplicate guard until a background sweep ran, allowing a second create — **hit 2026-09-03 (#573):** `MarkExpiredAsync` + `AuditExpiredAsync` run before `GetActiveForScopeFindingAsync`; regression in `RiskExceptionServiceTests.CreateAsync_marks_expired_before_duplicate_active_guard`.

- [x] (proven) `RiskExceptionService.RenewAsync` / `GovernanceStickinessController.RenewRiskException` — renewing an `Expired` waiver without sweeping stale `Status=Active` rows past `ExpiresAtUtc` first left multiple `Active` rows in `ListActiveForTenantAsync` (which filters `Status` only) while sibling `GetActiveForScopeFindingAsync` ignored past-expiry rows — **hit 2026-09-03 (#574):** `MarkExpiredAsync` + `AuditExpiredAsync` before sibling guard (create #573 parity); regression in `RiskExceptionServiceTests.RenewAsync_marks_expired_before_sibling_active_guard`.

- [x] (invalid) `GovernanceStickinessController.RenewRiskException` — OpenAPI `ProducesResponseType` omits HTTP 409 while handler maps `ConflictException` (revoked/sibling/active-waiver paths); document drift only unless clients rely on generated stubs — **cheap-disproof 2026-09-03 (#575):** runtime maps `ConflictException` → HTTP 409; `RenewRiskException_returns_conflict_when_waiver_is_revoked` and `RenewRiskException_returns_conflict_when_another_active_waiver_exists_for_same_finding` cover behavior.

- [x] (invalid) `GovernanceStickinessController.ListRiskExceptions` — optional `projectId` query is validated for empty guid but not resolved through `GovernanceQueryProjectScope.TryResolve` like register reads (foreign project may return filtered empty list vs 400) — duplicate of ledger #3450; facade `ListRiskExceptionsAsync` already calls `TryResolve` and returns `[]` (intentional hide pattern #2957).

- [x] (valid-no-repro) `GovernanceStickinessController.RenewRiskException` on finding with latest disposition `Remediated` — `RiskExceptionDispositionGuard.EnsureWaiverAllowedForFindingAsync` rejects renew (create #568 parity); **repro test:** `RenewRiskException_returns_bad_request_when_finding_latest_disposition_is_remediated`.

- [x] (valid-no-repro) `GovernanceStickinessController.RenewRiskException` — sibling active waiver `ConflictException` from service #573 maps to HTTP 409 at controller; **repro test:** `RenewRiskException_returns_conflict_when_another_active_waiver_exists_for_same_finding`.

- [x] (invalid) `GovernanceStickinessController.RevokeRiskException` / `RenewRiskException` — OpenAPI metadata omits HTTP 404 for out-of-scope `riskExceptionId` while handlers map `InvalidOperationException` → 404 (swagger drift only).

- [x] (proven) `RiskExceptionService.RevokeAsync` / `GovernanceStickinessController.RevokeRiskException` — past-expiry `Status=Active` waivers revoked without `MarkExpiredAsync` sweep — **hit 2026-09-03 (#656):** create #573 and renew #574 call `MarkExpiredAsync` before lifecycle guards; revoke checked stale `Active` rows past `ExpiresAtUtc` and returned HTTP 204 instead of HTTP 409; fixed with sweep + re-read before revoke (create/renew parity); regression in `RevokeAsync_marks_expired_before_revoke_when_waiver_is_past_expiry`.

- [x] (invalid) `GovernanceStickinessFacade.TryResolveFindingMergeConflictAsync` — resolve path skips `RequireFindingInspectInScopeAsync` used by disposition/waiver mutations — **cheap-disproof 2026-09-04 (#658, #672):** intentional snapshot-scoped resolution on in-scope run via `FindingMergeConflictResolutionService` + scoped `IFindingsSnapshotRepository`; merge conflicts exist only on run snapshots; `TryResolveFindingMergeConflictAsync_returns_false_when_conflict_not_on_run_snapshot` documents `VerifyNoOtherCalls` on inspect repo.

- [x] (proven) `RiskExceptionValidation.Validate` / `GovernanceStickinessController.CreateRiskException` — sub-10-char waiver rationale accepted while disposition paths enforce `FindingDispositionValidation.MinimumRationaleLength` — **hit 2026-09-04 (#658):** bulk waive UI/API aligned in #565 but waiver create only required non-whitespace; fixed with `MinimumRationaleLength` check in `RiskExceptionValidation.Validate`; regression in `Validate_rejects_rationale_shorter_than_minimum_length` and `CreateRiskException_returns_bad_request_when_rationale_shorter_than_minimum_length`.

- [x] (proven) `TenantPilotValueReportController.GetPilotValueReport` / `PilotValueReportService.CollectCommittedRunsAsync` — omitted `fromUtc` defaulted to tenant creation and walked unbounded keyset pages for old tenants — **hit 2026-09-04 (#672):** clamp default window to `DefaultReportWindowMaxDays` (90, LLM cost / ROI bundle parity) and add `RunSummaryMaxPages` safety cap in `CollectCommittedRunsAsync`; regression in `BuildAsync_null_from_clamps_default_window_to_max_days` and `BuildAsync_collect_committed_runs_stops_at_keyset_max_page_cap`.

- [x] (proven) `ComplianceDriftTrendService.GetTrendAsync` / `GovernanceController.GetComplianceDriftTrend` — after #3200 in-memory scope filter, `GetByTenantInRangeAsync` still scanned entire tenant in SQL before filtering — **hit 2026-09-04 (#674):** `IPolicyPackChangeLogRepository.GetByScopeInRangeAsync` with workspace/project predicates; regression in `ComplianceDriftTrendServiceTests.GetTrendAsync_queries_change_log_by_scope_in_range_not_tenant_wide` and `PolicyPackChangeLogRepositoryContractTests.GetByScopeInRangeAsync_ReturnsAscending_ForScopeOnly_ExcludesEnds`.

- [x] (invalid) `GovernanceResolutionController.Resolve` — GET resolution path logs `GovernanceResolutionExecuted` audit on every read — **cheap-disproof 2026-09-04 (#674):** intentional operator traceability; controller comment documents "Always logs `GovernanceResolutionExecuted`".

- [x] (proven) `GovernanceMutationCorrectionService.ValidateFindingDispositionSubjectAsync` / keyboard disposition correction — trail row with `RunId = null` matched when body supplied `runId` via `(normalizedRunGuid is null || reviewEvent.RunId is null || …)` — **hit 2026-09-04 (#674):** require `reviewEvent.RunId == normalizedRunGuid`; regression in `GovernanceMutationCorrectionServiceTests.RecordAsync_rejects_keyboard_disposition_correction_when_trail_run_id_is_null`.

- [x] (proven) `ManifestsController.CompareManifests` / compare summary/export routes — `leftVersion` / `rightVersion` longer than `NVARCHAR(128)` returned HTTP 404 `ManifestNotFound` instead of HTTP 400 — **hit 2026-09-04 (#675):** `BadRequestWhenManifestVersionInvalid` on compare query params (read-route parity); regression in `ManifestsControllerTests.CompareManifests_returns_bad_request_when_left_version_exceeds_max_length` and `GetManifest_returns_bad_request_when_manifest_version_exceeds_max_length`.

- [x] (proven) `GovernanceController.BatchReviewApprovalRequests` / `GovernanceApprovalRequestsHttpMapper.ValidateBatchReviewRequest` — `ReviewComment` longer than 4000 chars accepted while single approve/reject validators cap at 4000 — **hit 2026-09-04 (#675):** shared `GovernanceRequestValidationRules.ReviewCommentMaxLength` guard in batch mapper; regression in `ValidateBatchReviewRequest_rejects_overlong_review_comment`.

- [x] (proven) `GovernanceController.Approve` / `Reject` + `ApproveGovernanceRequestValidator` / `RejectGovernanceRequestValidator` — auto-validation required body `ReviewedBy` while controllers use `actorContext.GetActor()` only — **hit 2026-09-04 (#675):** make `ReviewedBy` optional with max-length when provided; regression in `ApproveGovernanceRequestValidatorTests` and `RejectGovernanceRequestValidatorTests`.

- [x] (proven) `GovernanceController.Promote` + `CreateGovernancePromotionRequestValidator` — auto-validation required body `PromotedBy` while controller uses `actorContext.GetActor()` only — **hit 2026-09-04 (#675):** make `PromotedBy` optional with max-length when provided; regression in `CreateGovernancePromotionRequestValidatorTests.Validate_passes_when_promoted_by_omitted_because_controller_uses_actor_context`.

2026-09-04 seed hunt #675: promoted and proved manifest compare max-length validation, batch review comment cap, and approve/reject/promote actor-field validator parity.

- [x] (proven) `ManifestsController.GetManifestSummary` JSON format — omitted `maxRelationships` returned unbounded `relationships` array while explicit values >1000 returned HTTP 400 — **hit 2026-09-04 (#676):** default omitted query param to `ManifestSummaryLimits.MaxRelationships` (markdown path parity); regression in `ManifestsControllerTests.GetManifestSummary_json_caps_relationships_at_default_max_when_query_param_omitted`.

- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `GovernanceStickinessFacade.EnsureRunMatchesFindingAuthorityRun` — omitted `runId` persisted disposition with null trail run while finding inspect exposed authority `RunId` (create-waiver #563 parity) — **hit 2026-09-04 (#676):** require non-empty `runId` when finding is bound to authority run; regression in `GovernanceStickinessFacadeScopeTests.RecordDispositionAsync_throws_when_run_id_omitted_and_finding_has_authority_run`.

- [x] (proven) `GovernanceStickinessController.RenewRiskException` / `RiskExceptionValidation.ValidateRenew` — optional `rationale` shorter than 10 chars accepted on renew while create path enforces `FindingDispositionValidation.MinimumRationaleLength` — **hit 2026-09-04 (#676):** min-length guard when rationale provided; regression in `RiskExceptionValidationTests.ValidateRenew_rejects_rationale_shorter_than_minimum_length`.

- [x] (proven) `GovernanceController.RecordGovernanceMutationCorrection` / `GovernanceMutationCorrectionService.ValidateApprovalSubjectAsync` — correction on `Submitted` approval returned HTTP 400 `ValidationFailed` while waiver lifecycle conflicts map to HTTP 409 — **hit 2026-09-04 (#676):** throw `ConflictException` for approval status mismatch; controller maps to HTTP 409; regression in `GovernanceMutationCorrectionServiceTests.RecordAsync_throws_conflict_when_approval_request_is_not_yet_approved`.

2026-09-04 seed hunt #676: promoted and proved manifest summary default relationship cap, disposition authority-run binding, renew rationale min-length parity, and mutation-correction lifecycle conflict status mapping.

- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `GovernanceStickinessFacade.RecordBulkDispositionAsync` — bulk path hardcoded `RunId = Guid.Empty` while single-item disposition binds inspect authority `RunId` (#676 parity) and mutation correction requires exact trail run match (#674) — **hit 2026-09-04 (#677):** inspect each finding, apply `EnsureRunMatchesFindingAuthorityRun`, bind authority `RunId` on per-finding requests; regression in `GovernanceStickinessFacadeScopeTests.RecordBulkDispositionAsync_binds_authority_run_id_from_finding_inspect`.

- [x] (proven) `GovernanceMutationCorrectionService.ValidateFindingDispositionSubjectAsync` / `GovernanceMutationCorrectionKinds.BulkDisposition` — bulk disposition corrections returned HTTP 404 when trail stored authority `RunId` but bulk path omitted run binding — **hit 2026-09-04 (#677):** bulk binding fix restores correction path; regression in `GovernanceMutationCorrectionServiceTests.RecordAsync_appends_correction_for_bulk_disposition_when_trail_has_authority_run_id`.

- [x] (proven) `GovernanceStickinessControllerCore.ValidateFindingId` / stickiness disposition routes — overlong `findingId` (>64) returned HTTP 404 while `FindingInspectController` returns HTTP 400 — **hit 2026-09-04 (#677):** shared `GovernanceRequestValidationRules.FindingIdMaxLength` guard on single and bulk routes; regression in `GovernanceStickinessControllerTests.RecordDisposition_returns_bad_request_when_finding_id_exceeds_max_length` and `RecordBulkDisposition_returns_bad_request_when_finding_id_exceeds_max_length`.

- [x] (proven) `GovernanceMutationCorrectionService.ValidateActivationSubjectAsync` / `GovernanceController.RecordGovernanceMutationCorrection` — correction on superseded activation (`IsActive = false`) returned HTTP 200 while approval status mismatch maps to HTTP 409 (#676 lifecycle parity) — **hit 2026-09-04 (#677):** throw `ConflictException` when activation is not active; regression in `GovernanceMutationCorrectionServiceTests.RecordAsync_throws_conflict_when_environment_activation_is_superseded`.

2026-09-04 seed hunt #677: promoted and proved bulk disposition authority-run binding, bulk correction trail parity, findingId max-length validation, and superseded activation correction conflict mapping.

- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `GovernanceStickinessHttpMapper.ValidateCreateRiskException` — body `findingId` longer than 64 chars returned HTTP 404 while stickiness route and inspect paths return HTTP 400 (#677 route parity gap) — **hit 2026-09-04 (#678):** `GovernanceRequestValidationRules.FindingIdMaxLength` guard on waiver create; regression in `GovernanceStickinessHttpMapperTests.ValidateCreateRiskException_rejects_overlong_finding_id` and `GovernanceStickinessControllerTests.CreateRiskException_returns_bad_request_when_finding_id_exceeds_max_length`.

- [x] (proven) `GovernanceMutationCorrectionService.ValidateFindingDispositionSubjectAsync` / `GovernanceController.RecordGovernanceMutationCorrection` — disposition correction `subjectId` (findingId) longer than 64 chars returned HTTP 404 instead of HTTP 400 — **hit 2026-09-04 (#678):** reject overlong finding subject ids before trail lookup via `FindingDispositionValidation.MaxFindingIdLength`; regression in `GovernanceMutationCorrectionServiceTests.RecordAsync_rejects_disposition_correction_when_subject_id_exceeds_max_finding_id_length`.

- [x] (proven) `GovernanceMutationCorrectionService.RecordAsync` / `GovernanceController.RecordGovernanceMutationCorrection` — correction `rationale` shorter than 10 chars returned HTTP 200 while disposition paths enforce `MinimumRationaleLength` — **hit 2026-09-04 (#678):** min-length guard on all correction rationales; regression in `GovernanceMutationCorrectionServiceTests.RecordAsync_rejects_correction_when_rationale_is_shorter_than_minimum_length`.

- [x] (invalid) `ManifestsController.GetManifestSummary` JSON — unbounded `services`/`datastores` arrays when `relationships` default-capped at 1000 (#676 sibling) — **cheap-disproof 2026-09-04 (#679):** `#676` capped relationship fan-out only; markdown path lists all services/datastores by design; JSON exposes full `ServiceCount`/`DatastoreCount` with partial relationship array; no `maxServices` product constant.

- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — `findingRef` between 65 and 512 chars returned HTTP 404 after inspect miss while `#565` only capped SQL at 512 and stickiness/inspect enforce 64-char finding ids — **hit 2026-09-04 (#679):** reject `findingRef` over `FindingIdMaxLength` before inspect; regression in `TenantCustomerSuccessControllerTests.PostProductFeedbackAsync_returns_bad_request_when_finding_ref_exceeds_finding_id_max_length`.

- [x] (proven) `GovernanceMutationCorrectionService.RecordAsync` / `GovernanceController.RecordGovernanceMutationCorrection` — correction `rationale` longer than 4000 chars returned HTTP 200 while approve/reject/batch review cap at `ReviewCommentMaxLength` (#675) — **hit 2026-09-04 (#679):** `FindingDispositionValidation.MaximumRationaleLength` guard; regression in `GovernanceMutationCorrectionServiceTests.RecordAsync_rejects_correction_when_rationale_exceeds_maximum_length`.

2026-09-04 thorough hunt #679: cheap-disproved manifest summary services/datastores cap candidate; proved product-feedback findingRef inspect max-length and mutation-correction rationale max-length parity.

- [x] (proven) `FindingDispositionValidation.Validate` / `GovernanceStickinessController.RecordDisposition` — disposition `rationale` longer than 4000 chars returned HTTP 200 while mutation correction enforces `MaximumRationaleLength` (#679 sibling) — **hit 2026-09-04 (#680):** max-length guard on waive/accept rationale paths; regression in `FindingDispositionValidationTests.Validate_rejected_as_not_applicable_rejects_overlong_rationale`.

- [x] (proven) `FindingDispositionValidation.Validate` / `GovernanceStickinessController.RecordDisposition` — Accepted `tradeOffAcknowledgment` longer than 4000 chars returned HTTP 200 with concatenated notes — **hit 2026-09-04 (#680):** max-length guard on trade-off acknowledgment; regression in `FindingDispositionValidationTests.Validate_accepted_rejects_overlong_trade_off_acknowledgment`.

- [x] (proven) `RiskExceptionValidation.Validate` / `GovernanceStickinessController.CreateRiskException` — waiver create `rationale` longer than 4000 chars returned HTTP 200 while min-length enforced (#658) — **hit 2026-09-04 (#680):** `MaximumRationaleLength` guard on create; regression in `RiskExceptionValidationTests.Validate_rejects_rationale_over_maximum_length`.

- [x] (proven) `RiskExceptionValidation.ValidateRenew` / `GovernanceStickinessController.RenewRiskException` — optional renew `rationale` longer than 4000 chars returned HTTP 200 — **hit 2026-09-04 (#680):** max-length guard when rationale provided; regression in `RiskExceptionValidationTests.ValidateRenew_rejects_rationale_over_maximum_length`.

- [x] (invalid) `GovernanceMutationCorrectionService.ValidateApprovalSubjectAsync` — approve correction on `Promoted` approval returns HTTP 409 — **cheap-disproof 2026-09-04 (#680):** guard requires lifecycle head `Approved`/`Rejected` so corrections attach only before promote/activate advances the workflow; extending to `Promoted`/`Activated` needs explicit product scope.

2026-09-04 seed hunt #680: promoted and proved disposition and waiver rationale max-length parity; cheap-disproved promoted-approval correction lifecycle scope.

- [x] (proven) `FindingDispositionValidation.Validate` / `GovernanceStickinessController.RecordDisposition` — `NeedsEvidence` `evidenceRequestText` longer than 4000 chars returned HTTP 200 while required rationale paths cap at `MaximumRationaleLength` (#680 sibling) — **hit 2026-09-04 (#681):** max-length guard on evidence request text; regression in `FindingDispositionValidationTests.Validate_needs_evidence_rejects_overlong_evidence_request_text`.

- [x] (proven) `FindingDispositionValidation.Validate` / `GovernanceStickinessController.RecordDisposition` — optional `rationale` on `Deferred`/`NeedsEvidence`/`Remediated` longer than 4000 chars returned HTTP 200 while required rationale paths cap at `MaximumRationaleLength` (#680 sibling) — **hit 2026-09-04 (#681):** max-length guard when optional rationale provided; regression in `FindingDispositionValidationTests.Validate_deferred_rejects_overlong_optional_rationale`.

- [x] (invalid) `GovernanceStickinessFacade.CreateRiskExceptionAsync` — invalid waiver body on out-of-scope finding returns HTTP 404 instead of HTTP 400 — **cheap-disproof 2026-09-04 (#681):** `#678` fixed overlong `findingId` at HTTP layer; remaining out-of-scope inspect-first ordering is intentional scope gate before body validation.

2026-09-04 seed hunt #681: promoted and proved NeedsEvidence evidence-request-text and optional-rationale max-length parity; cheap-disproved CreateRiskException inspect-before-body validation order.

- [x] (proven) `GovernanceController.DraftPolicyPackRule` — `FreeTextIntent` longer than `DraftIntakeValidation.MaximumFreeTextIntentLength` reached `IPolicyPackDraftService` without HTTP 400 while draft intake and chat endpoints enforce the shared cap (#661 sibling) — **hit 2026-09-04 (#682):** shared advisory-text validation helper; regression in `GovernanceControllerSimulateTests.DraftPolicyPackRule_returns_bad_request_when_free_text_intent_exceeds_max_length`.

- [x] (proven) `GovernanceController.GeneratePolicyPack` — `Prompt` longer than `DraftIntakeValidation.MaximumFreeTextIntentLength` reached `IPolicyPackGeneratorService` without HTTP 400 while sibling advisory intake paths enforce the shared cap — **hit 2026-09-04 (#682):** shared advisory-text validation helper; regression in `GovernanceControllerSimulateTests.GeneratePolicyPack_returns_bad_request_when_prompt_exceeds_max_length`.

2026-09-04 seed hunt #682: promoted and proved policy-pack draft/generate advisory text max-length parity with `DraftIntakeValidation`.

- [x] (proven) `GovernanceApprovalRequestsHttpMapper.ValidateApprovalRequestId` / `GovernanceController.Approve` / `Reject` — route `approvalRequestId` longer than 64 chars returned HTTP 404 while stickiness finding routes return HTTP 400 (#677 parity) — **hit 2026-09-04 (#683):** `GovernanceRequestValidationRules.ApprovalRequestIdMaxLength` guard; regression in `GovernanceApprovalRequestsHttpMapperTests.ValidateApprovalRequestId_rejects_overlong_id` and `GovernanceControllerRunHistoryScopeTests.Approve_returns_bad_request_when_approval_request_id_exceeds_max_length`.

- [x] (proven) `GovernanceApprovalRequestsHttpMapper.ValidateBatchReviewRequest` / `GovernanceController.BatchReviewApprovalRequests` — batch `approvalRequestIds` entry longer than 64 chars returned per-item HTTP 404 instead of HTTP 400 — **hit 2026-09-04 (#683):** max-length guard on each normalized id; regression in `GovernanceApprovalRequestsHttpMapperTests.ValidateBatchReviewRequest_rejects_overlong_approval_request_id`.

- [x] (proven) `GovernanceMutationCorrectionService.RecordAsync` / `GovernanceController.RecordGovernanceMutationCorrection` — approval/promotion/activation correction `subjectId` longer than 64 chars returned HTTP 404 while disposition corrections return HTTP 400 (#678 sibling scoped disposition-only) — **hit 2026-09-04 (#683):** max-length guard on all correction subject ids before trail/workflow lookup; regression in `GovernanceMutationCorrectionServiceTests.RecordAsync_rejects_approval_correction_when_subject_id_exceeds_max_length`.

2026-09-04 seed hunt #683: promoted and proved approval request id max-length validation on approve/reject, batch review, and mutation correction paths.

- [x] (proven) `FindingDispositionValidation.Validate` / `GovernanceStickinessController.RecordDisposition` — overlong `findingId` reached persistence when application validation ran without HTTP route guards (#678 HTTP sibling) — **hit 2026-09-04 (#684):** `MaxFindingIdLength` guard in `Validate`; regression in `FindingDispositionValidationTests.Validate_rejects_overlong_finding_id`.

- [x] (proven) `RiskExceptionValidation.Validate` / `GovernanceStickinessController.CreateRiskException` — overlong `findingId` reached waiver validation when application layer ran without HTTP mapper guard (#678 HTTP sibling) — **hit 2026-09-04 (#684):** `FindingDispositionValidation.MaxFindingIdLength` guard on create; regression in `RiskExceptionValidationTests.Validate_rejects_overlong_finding_id`.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateDecisionRegisterFilters` / `GovernanceStickinessController.GetDecisionRegister` — `category` query longer than 200 chars returned HTTP 200 empty register instead of HTTP 400 — **hit 2026-09-04 (#684):** `GovernanceRequestValidationRules.DecisionRegisterCategoryMaxLength` guard; regression in `GovernanceStickinessHttpMapperTests.ValidateDecisionRegisterFilters_rejects_overlong_category`.

2026-09-04 seed hunt #684: promoted and proved application-layer finding-id max-length parity and decision-register category filter max-length validation.

- [x] (proven) `GovernanceStickinessFacade.PreviewRecurrenceScheduleRuns` / `GovernanceStickinessController.PreviewRecurrenceScheduleRuns` — overlong `cronExpression` returned HTTP 200 `isValid: false` while create/update enforce `RecurrenceScheduleValidation.CronExpressionMaxLength` with HTTP 400 (#657 create sibling) — **hit 2026-09-04 (#685):** shared cron max-length guard before preview evaluation; regression in `GovernanceStickinessFacadeTests.PreviewRecurrenceScheduleRuns_rejects_overlong_cron_expression` and `GovernanceStickinessControllerTests.PreviewRecurrenceScheduleRuns_returns_bad_request_when_cron_expression_exceeds_max_length`.

- [x] (proven) `GovernanceController.Approve` / `Reject` — overlong `reviewComment` reached approval workflow without controller-level HTTP 400 while batch review enforces `ReviewCommentMaxLength` via `GovernanceApprovalRequestsHttpMapper` (#675 sibling) — **hit 2026-09-04 (#685):** shared `ValidateReviewComment` helper on single approve/reject paths; regression in `GovernanceControllerRunHistoryScopeTests.Approve_returns_bad_request_when_review_comment_exceeds_max_length` and `Reject_returns_bad_request_when_review_comment_exceeds_max_length`.

2026-09-04 seed hunt #685: promoted and proved recurrence preview cron max-length parity and single approve/reject review-comment cap parity with batch review.

- [x] (proven) `GovernanceController.Promote` — optional body `approvalRequestId` longer than 64 chars returned HTTP 404 after repository miss while approve/reject routes return HTTP 400 (#683 sibling) — **hit 2026-09-04 (#686):** `ValidateOptionalApprovalRequestId` before promotion workflow; regression in `GovernanceControllerRunHistoryScopeTests.Promote_returns_bad_request_when_approval_request_id_exceeds_max_length`.

- [x] (proven) `GovernanceController.Promote` — overlong `notes` reached promotion workflow without controller-level HTTP 400 while FluentValidation caps at 4000 chars (#685 approve/reject sibling) — **hit 2026-09-04 (#686):** shared `ValidateOptionalGovernanceComment` on promote; regression in `GovernanceControllerRunHistoryScopeTests.Promote_returns_bad_request_when_notes_exceed_max_length`.

- [x] (proven) `GovernanceController.SubmitApprovalRequest` — overlong `requestComment` reached submit workflow without controller-level HTTP 400 while FluentValidation caps at 4000 chars (#685 approve/reject sibling) — **hit 2026-09-04 (#686):** shared `ValidateOptionalGovernanceComment` on submit; regression in `GovernanceControllerRunHistoryScopeTests.SubmitApprovalRequest_returns_bad_request_when_request_comment_exceeds_max_length`.

2026-09-04 seed hunt #686: promoted and proved promote approval-request-id max-length parity plus submit/promote governance comment max-length controller guards.

- [x] (proven) `GovernanceController.SubmitApprovalRequest` — overlong body `manifestVersion` reached submit workflow and returned HTTP 404 `ManifestNotFound` instead of HTTP 400 while `ManifestsController` rejects versions over 128 chars (#675 sibling) — **hit 2026-09-04 (#687):** shared `ValidateManifestVersion` before submit workflow; regression in `GovernanceControllerRunHistoryScopeTests.SubmitApprovalRequest_returns_bad_request_when_manifest_version_exceeds_max_length`.

- [x] (proven) `GovernanceController.Promote` — overlong body `manifestVersion` reached promotion workflow and returned HTTP 404 `ManifestNotFound` instead of HTTP 400 while manifest read routes enforce 128-char cap (#675 sibling) — **hit 2026-09-04 (#687):** shared `ValidateManifestVersion` before promote workflow; regression in `GovernanceControllerRunHistoryScopeTests.Promote_returns_bad_request_when_manifest_version_exceeds_max_length`.

- [x] (proven) `GovernanceController.Activate` — overlong body `manifestVersion` reached activation workflow and returned HTTP 404 `ManifestNotFound` instead of HTTP 400 while FluentValidation caps at 128 chars (#675 sibling) — **hit 2026-09-04 (#687):** shared `ValidateManifestVersion` before activate workflow; regression in `GovernanceControllerRunHistoryScopeTests.Activate_returns_bad_request_when_manifest_version_exceeds_max_length`.

2026-09-04 seed hunt #687: promoted and proved submit/promote/activate manifest version max-length controller guards (manifest read-route parity).

- [x] (proven) `GovernancePreviewController.Preview` — overlong body `manifestVersion` reached preview service and returned HTTP 404 `ManifestNotFound` instead of HTTP 400 (#687 submit/promote sibling) — **hit 2026-09-04 (#688):** shared `ValidateManifestVersion` before preview; regression in `GovernancePreviewControllerUnitTests.Preview_returns_bad_request_when_manifest_version_exceeds_max_length`.

- [x] (proven) `GovernanceController.SubmitApprovalRequest` / `Promote` / `Activate` — overlong body `runId` reached workflow lookup and returned HTTP 404 `RunNotFound` instead of HTTP 400 while FluentValidation caps at 64 chars (#687 manifest sibling) — **hit 2026-09-04 (#688):** shared `ValidateGovernanceRunId` before workflow; regression in `GovernanceControllerRunHistoryScopeTests` run-id max-length tests.

- [x] (proven) `GovernanceController.SubmitApprovalRequest` / `Promote` — overlong `sourceEnvironment` / `targetEnvironment` reached transition validation without controller-level slug cap (#554 catalog sibling) — **hit 2026-09-04 (#688):** shared `ValidateEnvironmentSlug` before workflow; regression in `GovernanceControllerRunHistoryScopeTests` environment max-length tests.

2026-09-04 seed hunt #688: promoted and proved preview manifest-version, workflow run-id, and environment-slug max-length controller guards.

- [x] (proven) `GovernanceController.Activate` — overlong body `environment` reached activation workflow without controller-level slug cap (#688 submit/promote sibling) — **hit 2026-09-04 (#689):** shared `ValidateEnvironmentSlug` before activate workflow; regression in `GovernanceControllerRunHistoryScopeTests.Activate_returns_bad_request_when_environment_exceeds_max_length`.

- [x] (proven) `GovernancePreviewController.Preview` — overlong body `environment` reached preview service without controller-level slug cap (#688 submit/promote sibling) — **hit 2026-09-04 (#689):** shared `ValidateEnvironmentSlug` before preview; regression in `GovernancePreviewControllerUnitTests.Preview_returns_bad_request_when_environment_exceeds_max_length`.

- [x] (proven) `GovernancePreviewController.CompareEnvironments` — overlong `sourceEnvironment` reached compare service without controller-level slug cap (#688 submit/promote sibling) — **hit 2026-09-04 (#689):** shared `ValidateEnvironmentSlug` before compare-environments; regression in `GovernancePreviewControllerUnitTests.CompareEnvironments_returns_bad_request_when_source_environment_exceeds_max_length`.

2026-09-04 seed hunt #689: promoted and proved activate/preview environment-slug max-length controller guards.

- [x] (proven) `GovernanceController.RecordGovernanceMutationCorrection` / `GovernanceMutationCorrectionsHttpMapper` — overlong body `runId`, `subjectId`, or `rationale` reached `IGovernanceMutationCorrectionService` without controller-level guards (#688 workflow sibling) — **hit 2026-09-04 (#690):** shared HTTP mapper rejects over-length and min-length fields before tenant/service calls; regression in `GovernanceMutationCorrectionsHttpMapperTests` and `GovernanceMutationCorrectionsControllerTests`.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateCreateRiskException` / `GovernanceStickinessController.CreateRiskException` — overlong `ownerUserId` or `evidenceRef` reached facade inspect/create without HTTP mapper guards (#552 application-layer sibling) — **hit 2026-09-04 (#690):** max-length guards on waiver create; regression in `GovernanceStickinessHttpMapperTests` and `GovernanceStickinessControllerTests.CreateRiskException_returns_bad_request_when_owner_user_id_exceeds_max_length_before_facade`.

- [x] (proven) `GovernancePreviewController.Preview` — overlong body `runId` lacked shared `ValidateGovernanceRunId` guard (#688 submit/promote sibling) — **hit 2026-09-04 (#690):** shared run-id max-length validation before preview service; regression in `GovernancePreviewControllerUnitTests.Preview_returns_bad_request_when_run_id_exceeds_max_length`.

- [x] (proven) `GovernanceController.GetApprovalRequests` / `GetPromotions` / `GetActivations` — route `runId` longer than 64 chars reached scoped run lookup without controller-level max-length guard (#688 workflow sibling) — **hit 2026-09-04 (#690):** shared `ValidateGovernanceRunId` before run-history facade; regression in `GovernanceControllerRunHistoryScopeTests` run-id max-length tests on all three list routes.

2026-09-04 seed hunt #690: promoted and proved mutation-correction HTTP validation, waiver owner/evidence HTTP guards, preview run-id cap, and run-history route run-id caps.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateCreateRiskException` / `GovernanceStickinessController.CreateRiskException` — overlong or too-short body `rationale` reached facade inspect/create without HTTP mapper guards (#658/#680 application-layer siblings) — **hit 2026-09-04 (#691):** min/max-length rationale guards before tenant/facade calls; regression in `GovernanceStickinessHttpMapperTests` and `GovernanceStickinessControllerTests.CreateRiskException_returns_bad_request_when_rationale_exceeds_max_length_before_facade`.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateRenewRiskException` / `GovernanceStickinessController.RenewRiskException` — overlong or too-short optional `rationale` / overlong `evidenceRef` reached `IRiskExceptionService.RenewAsync` without HTTP mapper guards (#561/#676/#680 application-layer siblings) — **hit 2026-09-04 (#691):** new HTTP mapper + controller wiring rejects invalid renew fields before facade; regression in `GovernanceStickinessHttpMapperTests` and strict-mock controller tests.

- [x] (proven) `GovernanceController.Simulate` — overlong body `runId` reached `IPolicyPackHttpFacade.SimulateAsync` without shared `ValidateGovernanceRunId` guard (#688 workflow sibling) — **hit 2026-09-04 (#691):** shared run-id max-length validation before simulate facade; regression in `GovernanceControllerSimulateTests.Simulate_returns_bad_request_when_run_id_exceeds_max_length`.

- [x] (proven) `GovernanceController.DryRunProposedPolicyPack` / `DryRunPolicyPack` — overlong `targetRunId` or `evaluateAgainstRunIds` entries reached dry-run services without controller-level max-length guard; `DryRunProposedPolicyPack` also ran tenant preflight before input validation — **hit 2026-09-04 (#691):** shared `ValidateGovernanceRunId` + fail-fast validation ordering before tenant/service calls; regression in `GovernanceControllerSimulateTests`.

- [x] (proven) `GovernancePreCommitSimulationController.GetChecklistAsync` / `SimulateAsync` — overlong route/body `runId` reached scoped `IRunRepository` lookup without shared 64-char cap (#688/#690 sibling) — **hit 2026-09-04 (#691):** shared `ValidateGovernanceRunId` before trim/parse; regression in `GovernancePreCommitSimulationControllerTests`.

2026-09-04 seed hunt #691: promoted and proved waiver create/renew HTTP rationale guards, simulate/dry-run run-id caps, and pre-commit simulation run-id caps.

- [x] (proven) `PolicyPacksController.Simulate` — overlong body `runId` reached `IPolicyPackHttpFacade.SimulateAsync` without shared `ValidateGovernanceRunId` guard (`GovernanceController.Simulate` #691 sibling) — **hit 2026-09-04 (#692):** shared run-id max-length validation before simulate facade; regression in `PolicyPacksControllerSimulateTests.Simulate_returns_bad_request_when_run_id_exceeds_max_length`.

- [x] (proven) `PolicyPacksController.SimulateBulk` — overlong `runIds` entry reached `SimulateBulkAsync` without per-id `ValidateGovernanceRunId` guard (`GovernanceController.DryRunPolicyPack` #691 sibling) — **hit 2026-09-04 (#692):** shared run-id max-length validation in bulk loop before facade; regression in `PolicyPacksControllerSimulateBulkScopeTests.SimulateBulk_returns_bad_request_when_run_id_exceeds_max_length`.

2026-09-04 seed hunt #692: promoted and proved PolicyPacks simulate and simulate-bulk run-id HTTP validation parity.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateRecordDisposition` / `GovernanceStickinessController.RecordDisposition` — overlong or too-short body `rationale`, `tradeOffAcknowledgment`, or `evidenceRequestText` reached `IFindingInspectReadRepository` without HTTP mapper guards (#680 application-layer sibling) — **hit 2026-09-04 (#693):** disposition body validation before tenant/facade inspect; regression in `GovernanceStickinessHttpMapperTests` and strict-mock `RecordDisposition_returns_bad_request_when_rationale_exceeds_max_length_before_finding_inspect`.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateBulkDisposition` / `GovernanceStickinessController.RecordBulkDisposition` — overlong shared `rationale` reached bulk inspect loop without HTTP mapper guards (#680 application-layer sibling) — **hit 2026-09-04 (#693):** bulk disposition body validation before tenant/facade; regression in `GovernanceStickinessHttpMapperTests` and `RecordBulkDisposition_returns_bad_request_when_rationale_exceeds_max_length_before_finding_inspect`.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateCreateRecurrenceSchedule` / `GovernanceStickinessController.CreateRecurrenceSchedule` — overlong `name` or `cronExpression` reached `IRunRepository.GetByIdAsync` without HTTP mapper guards (#556/#685 facade-only siblings) — **hit 2026-09-04 (#693):** schedule create HTTP validation before tenant/facade; regression with `runs.VerifyNoOtherCalls()` on overlong name.

- [x] (proven) `GovernanceStickinessController` waiver mutations (`CreateRiskException`, `RenewRiskException`, `RevokeRiskException`) — tenant preflight ran before HTTP/body validation so ghost tenant + invalid body returned HTTP 404 instead of 400 (#691 dry-run ordering sibling) — **hit 2026-09-04 (#693):** fail-fast validation before tenant lookup; regression in `CreateRiskException_returns_bad_request_when_rationale_exceeds_max_length_and_tenant_missing`.

- [x] (proven) `TenantHomepageSettingsController.PutAsync` — empty `selectedRunId` guard ran after tenant preflight so ghost tenant + `Guid.Empty` returned HTTP 404 instead of 400 — **hit 2026-09-04 (#693):** empty-run validation before scope preflight; regression in `PutAsync_returns_bad_request_when_selected_run_id_is_empty_and_tenant_missing`.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateUpdateRecurrenceSchedule` / `GovernanceStickinessController.UpdateRecurrenceSchedule` — overlong `name` or `cronExpression` reached tenant preflight without HTTP mapper guards (#693 create sibling) — **hit 2026-09-04 (#694):** update schedule HTTP validation before tenant/facade; regression in `GovernanceStickinessHttpMapperTests` and `UpdateRecurrenceSchedule_returns_bad_request_when_name_exceeds_max_length_and_tenant_missing`.

- [x] (proven) `GovernanceStickinessController.UpdateRecurrenceSchedule` — tenant preflight and route `scheduleId` validation ran after body checks so ghost tenant + empty `scheduleId` returned HTTP 404 instead of 400 (#693 waiver ordering sibling) — **hit 2026-09-04 (#694):** schedule body/id validation before tenant lookup; regression in `UpdateRecurrenceSchedule_returns_bad_request_when_schedule_id_empty_and_tenant_missing`.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateRecordDisposition` / `ValidateBulkDisposition` — deferred disposition without `revisitDueUtc` or with past `revisitDueUtc` reached tenant/facade without HTTP mapper guards (#566 application-layer sibling) — **hit 2026-09-04 (#694):** deferred revisit-due validation before tenant/facade; regression in `GovernanceStickinessHttpMapperTests` and `RecordDisposition_returns_bad_request_when_deferred_revisit_past_and_tenant_missing`.

- [x] (proven) `GovernanceStickinessController.ResolveFindingMergeConflict` — route `runId` validation ran after tenant preflight so ghost tenant + `Guid.Empty` returned HTTP 404 instead of 400 (#693 ordering sibling) — **hit 2026-09-04 (#694):** run-id validation before tenant lookup; regression in `ResolveFindingMergeConflict_returns_bad_request_when_run_id_empty_and_tenant_missing`.

2026-09-04 seed hunt #694: promoted and proved update-recurrence HTTP mapper, deferred revisit-due HTTP guards, and merge-conflict run-id fail-fast ordering.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateUpsertRealizedValueAttestation` / `GovernanceStickinessController.UpsertRealizedValueAttestation` — negative `attestedIncidentsAvoided` or overlong attestation notes reached tenant preflight without HTTP mapper guards (#693 waiver ordering sibling) — **hit 2026-09-04 (#695):** attestation upsert HTTP validation before tenant/facade; regression in `GovernanceStickinessHttpMapperTests` and `UpsertRealizedValueAttestation_returns_bad_request_when_attested_incidents_negative_and_tenant_missing`.

- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — tenant preflight ran before `runId`, `findingRef`, and `comment` validation so ghost tenant + invalid body returned HTTP 404 instead of 400 (#693 ordering sibling) — **hit 2026-09-04 (#695):** shared `ProductFeedbackHttpMapper` fail-fast validation before scope preflight; regression in `PostProductFeedbackAsync_returns_bad_request_when_run_id_is_empty_and_tenant_missing`.

2026-09-04 seed hunt #695: promoted and proved attestation upsert HTTP mapper and product-feedback validation ordering.

- [x] (proven) `TenantErasureLegalHoldHttpMapper.ValidateSetLegalHold` / `TenantErasureLegalHoldController.SetLegalHoldAsync` — tenant preflight ran before `UntilUtc` and `Reason` validation so ghost tenant + past `untilUtc` or overlong reason returned HTTP 404 instead of 400 (#549/#695 ordering sibling) — **hit 2026-09-04 (#696):** shared legal-hold HTTP validation before tenant lookup; regression in `TenantErasureLegalHoldControllerTests.SetLegalHoldAsync_returns_bad_request_when_until_utc_is_in_the_past_and_tenant_missing` and `SetLegalHoldAsync_returns_bad_request_when_reason_exceeds_max_length_and_tenant_missing`.

2026-09-04 seed hunt #696: promoted and proved erasure legal-hold fail-fast validation ordering.

- [x] (proven) `TenantWorkspacesController.DeleteProjectAsync` / `RestoreProjectAsync` — tenant preflight ran before route `workspaceId`/`projectId` empty-GUID checks so ghost tenant + `Guid.Empty` returned HTTP 404 instead of 400 (#3382 tenant-present parity gap; #695 ordering sibling) — **hit 2026-09-04 (#697):** reject empty route guids before tenant lookup; regression in `TenantWorkspacesControllerTests.DeleteProjectAsync_returns_bad_request_when_workspace_id_is_empty_and_tenant_missing` and `RestoreProjectAsync_returns_bad_request_when_project_id_is_empty_and_tenant_missing`.

2026-09-04 seed hunt #697: promoted and proved workspace project delete/restore fail-fast route-id validation ordering.

- [x] (proven) `GovernanceController.GetApprovalRequestLineage` / `GetApprovalRequestRationale` — tenant preflight ran before `approvalRequestId` normalization/validation so ghost tenant + whitespace route id returned HTTP 404 instead of 400 (Approve/Reject ordering sibling; #697 workspace route-id parity) — **hit 2026-09-04 (#698):** validate route approvalRequestId before tenant lookup; regression in `GovernanceControllerRunHistoryScopeTests.GetApprovalRequestLineage_returns_bad_request_when_approval_request_id_is_whitespace_and_tenant_missing` and `GetApprovalRequestRationale_returns_bad_request_when_approval_request_id_is_whitespace_and_tenant_missing`.

2026-09-04 seed hunt #698: promoted and proved approval lineage/rationale fail-fast route-id validation ordering.

- [x] (proven) `GovernanceController.GetApprovalRequests` / `GetPromotions` / `GetActivations` — tenant preflight ran before route `runId` GUID/empty-GUID validation so ghost tenant + malformed or empty run id returned HTTP 404 instead of 400 (#698 approvalRequestId ordering sibling; `ValidateGovernanceRunId` only checked whitespace/length) — **hit 2026-09-04 (#699):** `ValidateGovernanceRouteRunId` before tenant lookup on all three run-history reads; regression in `GovernanceControllerRunHistoryScopeTests.GetPromotions_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing`, `GetPromotions_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing`, `GetActivations_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing`, `GetActivations_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing`, and approval-request ghost-tenant parity tests.

2026-09-04 seed hunt #699: promoted and proved run-history route runId GUID validation ordering before tenant lookup.

- [x] (proven) `GovernanceController.SubmitApprovalRequest` / `Promote` / `Activate` — tenant preflight ran before body `runId` GUID/empty-GUID validation so ghost tenant + malformed or empty run id returned HTTP 404 instead of 400 (#699 route runId ordering sibling; `ValidateGovernanceRunId` only checked whitespace/length) — **hit 2026-09-04 (#700):** `ValidateGovernanceRouteRunId` before tenant lookup on all three mutation endpoints; regression in `GovernanceControllerRunHistoryScopeTests.SubmitApprovalRequest_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing`, `SubmitApprovalRequest_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing`, `Promote_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing`, `Promote_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing`, `Activate_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing`, and `Activate_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing`.

2026-09-04 seed hunt #700: promoted and proved governance mutation body runId GUID validation ordering before tenant lookup.

- [x] (proven) `GovernanceController.RecordGovernanceMutationCorrection` / `GovernanceMutationCorrectionsHttpMapper.ValidateRecordMutationCorrection` — tenant preflight ran before body `runId` GUID/empty-GUID validation so ghost tenant + malformed or empty run id returned HTTP 404 instead of 400 (#700 submit/promote/activate ordering sibling; `ValidateGovernanceRunId` only checked whitespace/length) — **hit 2026-09-04 (#701):** `ValidateGovernanceRouteRunId` in mutation-correction HTTP mapper before tenant lookup; regression in `GovernanceMutationCorrectionsControllerTests.RecordGovernanceMutationCorrection_returns_bad_request_when_run_id_is_empty_guid_and_tenant_missing`, `RecordGovernanceMutationCorrection_returns_bad_request_when_run_id_is_not_valid_and_tenant_missing`, and `GovernanceMutationCorrectionsHttpMapperTests`.

2026-09-04 seed hunt #701: promoted and proved mutation-correction body runId GUID validation ordering before tenant lookup.

- [x] (proven) `ManifestsController.GetManifestSummary` — tenant preflight ran before `maxRelationships` and `format` query validation so ghost tenant + out-of-range `maxRelationships` or unknown `format` returned HTTP 404 instead of 400 (#675 manifest-version ordering sibling; validation ran only after scoped manifest load) — **hit 2026-09-04 (#702):** validate summary query params before tenant lookup; regression in `ManifestsControllerTests.GetManifestSummary_returns_bad_request_when_max_relationships_is_zero_and_tenant_missing` and `GetManifestSummary_returns_bad_request_for_unknown_format_and_tenant_missing`.

2026-09-04 seed hunt #702: promoted and proved manifest summary query validation ordering before tenant lookup.

- [x] (proven) `GovernancePostureController.GetPosture` — tenant preflight ran before empty `projectId` query validation so ghost tenant + `projectId=00000000-0000-0000-0000-000000000000` returned HTTP 404 instead of 400 (#702 manifest summary query ordering sibling; stickiness register reads already validate projectId before tenant) — **hit 2026-09-04 (#703):** validate `projectId` before `TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync`; regression in `GovernancePostureControllerTests.GetPosture_returns_bad_request_when_project_id_is_empty_guid_and_tenant_missing`.

2026-09-04 seed hunt #703: promoted and proved posture empty projectId validation ordering before tenant lookup.

- [x] (proven) `GovernanceEnvironmentCatalogController.Replace` — tenant preflight ran before catalog body validation so ghost tenant + empty environments/transitions returned HTTP 404 instead of 400 (#703 posture projectId ordering sibling; `ReplaceCatalogAsync` validated only after `TenantWorkspaceScopePreflight`) — **hit 2026-09-04 (#704):** `GovernanceEnvironmentCatalogService.ValidateCatalogOrThrow` before tenant lookup; regression in `GovernanceEnvironmentCatalogControllerTests.Replace_returns_bad_request_when_catalog_is_invalid_and_tenant_missing`.

2026-09-04 seed hunt #704: promoted and proved environment catalog replace validation ordering before tenant lookup.

- [x] (proven) `TenantTrialController.ConvertTrialAsync` / `TenantTrialConversionStage.ConvertTrialAsync` — tenant lookup ran before `TryMapRequestTier` so ghost tenant + unrecognized `targetTier` returned HTTP 404 instead of 400 (#704 environment catalog ordering sibling; prior row closed valid-no-repro for tier semantics only) — **hit 2026-09-04 (#705):** validate target tier before tenant repository lookup; regression in `TenantTrialControllerTests.ConvertTrialAsync_returns_bad_request_when_target_tier_unrecognized_and_tenant_missing`.

2026-09-04 seed hunt #705: promoted and proved trial convert target-tier validation ordering before tenant lookup.

- [x] (proven) `TenantTrialController.LinkEntraAsync` / `TenantTrialFacade.LinkEntraAsync` — tenant lookup ran before `EntraOid` max-length validation in `TenantTrialAbuseGuard` so ghost tenant + overlong `entraOid` returned HTTP 404 instead of 400 (#705 convert tier ordering sibling) — **hit 2026-09-04 (#706):** shared `TrialEntraOidValidation.TryValidateLength` before tenant repository lookup; regression in `TenantTrialControllerTests.LinkEntraAsync_returns_bad_request_when_entra_oid_exceeds_max_length_and_tenant_missing`.

2026-09-04 seed hunt #706: promoted and proved link-entra entraOid max-length validation ordering before tenant lookup.

- [x] (invalid) `TenantTrialController.LinkEntraAsync` / `TenantTrialFacade.LinkEntraAsync` — empty `entraTenantId` or mismatched `localEmail`/`entraOid` pair returned HTTP 404 instead of 400 for ghost tenant (#706 entraOid ordering sibling) — **cheap-disproof 2026-09-04 (#707):** facade rejects `Guid.Empty` entra tenant id and email/oid pair mismatch before `GetByIdAsync`; regression in `TenantTrialControllerTests.LinkEntraAsync_returns_bad_request_when_entra_tenant_id_is_empty_and_tenant_missing` and `LinkEntraAsync_returns_bad_request_when_local_email_without_entra_oid_and_tenant_missing`.

- [x] (invalid) `ManifestsController.CompareManifests` — overlong `leftVersion`/`rightVersion` returned HTTP 404 instead of 400 for ghost tenant (#702 manifest summary query ordering sibling) — **cheap-disproof 2026-09-04 (#707):** `BadRequestWhenManifestVersionInvalid` runs before tenant lookup on compare load path; regression in `ManifestsControllerTests.CompareManifests_returns_bad_request_when_left_version_exceeds_max_length_and_tenant_missing`.

2026-09-04 seed hunt #707 (dry): reseeded link-entra and manifest-compare validation-ordering siblings; no new hunt-ready repro after cheap-disproof tests.

- [x] (proven) `TenantTrialController.LinkEntraAsync` / `TenantTrialFacade.LinkEntraAsync` — tenant lookup ran before `LocalEmail` max-length validation (`NormalizedEmail NVARCHAR(256)`) so ghost tenant + overlong `localEmail` returned HTTP 404 instead of 400 (#706 entraOid ordering sibling) — **hit 2026-09-04 (#718):** shared `TrialLocalEmailValidation.TryValidateLength` before tenant repository lookup; regression in `TenantTrialControllerTests.LinkEntraAsync_returns_bad_request_when_local_email_exceeds_max_length_and_tenant_missing`.

- [x] (invalid) `CorePilotTeamChecklistController.PutAsync` — ghost tenant + out-of-range `stepIndex` may return HTTP 404 instead of HTTP 400 (#718 link-entra ordering sibling; controller validates `stepIndex` before `TenantWorkspaceScopePreflight` — needs cheap-disproof) — **cheap-disproof 2026-09-04 (#719):** `stepIndex` guard runs before `TenantWorkspaceScopePreflight`; regression in `CorePilotTeamChecklistControllerTests.PutAsync_returns_bad_request_when_step_index_invalid_and_tenant_missing`.

- [x] (invalid) `TenantCostSettingsController.PutAsync` — ghost tenant + invalid `eaDiscountPercentage` may return HTTP 404 instead of HTTP 400 (#718 ordering sibling; `TryResolveEaDiscountMultiplier` runs before `GetByIdAsync` — needs cheap-disproof) — **cheap-disproof 2026-09-04 (#719):** EA discount validation runs before `GetByIdAsync`; regression in `TenantCostSettingsControllerTests.PutAsync_returns_bad_request_when_ea_discount_invalid_and_tenant_missing`.

- [x] (invalid) `TenantBaselineController.PutAsync` — ghost tenant + invalid `manualPrepHoursPerReview` may return HTTP 404 instead of HTTP 400 (#718 ordering sibling; numeric guards run before tenant lookup — needs cheap-disproof) — **cheap-disproof 2026-09-04 (#719):** manual-prep guard runs before `GetByIdAsync`; regression in `TenantBaselineControllerTests.PutAsync_returns_bad_request_when_manual_prep_hours_invalid_and_tenant_missing`.

2026-09-04 thorough hunt #719 (dry): cheap-disproved three #718 validation-ordering siblings; no new hunt-ready repro.

- [x] (invalid) `TenantBaselineController.PutAsync` — ghost tenant + `peoplePerReview` only may return HTTP 404 instead of HTTP 400 (#718 cross-field ordering sibling) — **cheap-disproof 2026-09-04 (#720):** cross-field prep guard requires `existing.BaselineManualPrepHoursPerReview`; ghost-tenant 404 is correct when validation depends on tenant state.

- [x] (invalid) `TenantBaselineController.PutAsync` — ghost tenant + `baselineReviewCycleSourceNote` without captured hours may return HTTP 404 instead of HTTP 400 (#718 ordering sibling) — **cheap-disproof 2026-09-04 (#720):** prerequisite-hours rule requires `existing.BaselineReviewCycleHours`; tenant-dependent validation.

- [x] (invalid) `TenantWorkspacesController.DeleteProjectAsync` — ghost tenant + default-project delete may return HTTP 404 instead of HTTP 400 (#697 ordering sibling) — **cheap-disproof 2026-09-04 (#720):** default-project guard requires workspace row from tenant lookup; tenant-dependent business rule.

- [x] (proven) `GovernanceController.DryRunProposedPolicyPack` / `PolicyPackGovernanceDryRunRequestValidator` — tenant preflight ran before FluentValidation body rules so ghost tenant + out-of-range `blockCommitMinimumSeverity` returned HTTP 404 instead of 400 (#691 run-id ordering sibling) — **hit 2026-09-04 (#720):** `PolicyPackGovernanceDryRunHttpMapper.Validate` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernanceControllerSimulateTests.DryRunProposedPolicyPack_returns_bad_request_when_block_commit_minimum_severity_out_of_range_and_tenant_missing`.

- [x] (proven) `PolicyPacksController.SimulateBulk` / `PolicyPackSimulateBulkRequestValidator` — `EnsureScopeAsync` ran before `blockCommitMinimumSeverity` bounds so ghost tenant + severity 99 returned HTTP 404 instead of 400 (single-simulate validator parity) — **hit 2026-09-04 (#720):** `PolicyPackSimulateBulkHttpMapper.Validate` before `_httpFacade.SimulateBulkAsync`; regression in `PolicyPacksControllerSimulateBulkScopeTests.SimulateBulk_returns_bad_request_when_block_commit_minimum_severity_out_of_range_and_tenant_missing`.

- [x] (invalid) `GovernanceController.DryRunProposedPolicyPack` — ghost tenant + empty/malformed `policyPackContentJson` or XOR target violation may still return HTTP 404 — **cheap-disproof 2026-09-04 (#720):** `PolicyPackGovernanceDryRunHttpMapper` runs full `PolicyPackGovernanceDryRunRequestValidator` before tenant preflight (same hit as severity ordering).

2026-09-04 seed hunt #720 (hit): proved proposed dry-run and simulate-bulk severity validation ordering; cheap-disproved three tenant-dependent cross-field ordering siblings.

- [x] (proven) `PolicyPacksController.Simulate` / `GovernanceController.Simulate` / `PolicyPackSimulateRequestValidator` — `IPolicyPackHttpFacade.SimulateAsync` called `EnsureScopeAsync` (tenant 404) before `blockCommitMinimumSeverity` 0–3 bounds, so ghost tenant + severity 99 returned HTTP 404 instead of 400 (#720 simulate-bulk sibling) — **hit 2026-09-04 (#721):** `PolicyPackSimulateHttpMapper.Validate` before facade on both controllers; regression in `PolicyPacksControllerSimulateTests.Simulate_returns_bad_request_when_block_commit_minimum_severity_out_of_range_and_tenant_missing` and `GovernanceControllerSimulateTests.Simulate_returns_bad_request_when_block_commit_minimum_severity_out_of_range_and_tenant_missing`.

- [x] (proven) `GovernancePreviewController.CompareEnvironments` / `CreateGovernanceEnvironmentComparisonRequestValidator` — tenant preflight ran before same-environment guard, so ghost tenant + `sourceEnvironment == targetEnvironment` returned HTTP 404 instead of 400 — **hit 2026-09-04 (#721):** `GovernanceEnvironmentComparisonHttpMapper.Validate` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernancePreviewControllerUnitTests.CompareEnvironments_returns_validation_failed_when_source_equals_target_and_tenant_missing`.

2026-09-04 seed hunt #721 (hit): proved single-simulate severity and compare-environments same-slug validation ordering; cheap-disproved DryRunPolicyPack proposedThresholds null path.

- [x] (proven) `GovernanceController.Promote` / `CreateGovernancePromotionRequestValidator` — tenant preflight ran before same-environment guard, so ghost tenant + `sourceEnvironment == targetEnvironment` returned HTTP 404 instead of 400 (#721 compare-environments sibling) — **hit 2026-09-04 (#722):** `GovernancePromotionHttpMapper.Validate` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernanceControllerRunHistoryScopeTests.Promote_returns_validation_failed_when_source_equals_target_and_tenant_missing`.

- [x] (proven) `GovernanceController.SubmitApprovalRequest` / `CreateGovernanceApprovalRequestValidator` — tenant preflight ran before same-environment guard, so ghost tenant + `sourceEnvironment == targetEnvironment` returned HTTP 404 instead of 400 (#722 promote sibling) — **hit 2026-09-04 (#723):** `GovernanceApprovalRequestHttpMapper.Validate` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernanceControllerRunHistoryScopeTests.SubmitApprovalRequest_returns_validation_failed_when_source_equals_target_and_tenant_missing`.

2026-09-04 thorough hunt #723 (hit): proved SubmitApprovalRequest same-environment validation ordering before tenant preflight.

- [x] (proven) `GovernanceController.Activate` / `CreateGovernanceActivationRequestValidator` — tenant preflight ran before environment enum guard (`dev`/`test`/`prod`), so ghost tenant + unrecognized `Environment` (e.g. `staging`) returned HTTP 404 instead of 400 — **hit 2026-09-04 (#724):** `GovernanceActivationHttpMapper.Validate` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernanceControllerRunHistoryScopeTests.Activate_returns_bad_request_when_environment_is_unrecognized_and_tenant_missing`.

- [x] (proven) `GovernancePreviewController.Preview` / `CreateGovernancePreviewRequestValidator` — tenant preflight ran before environment enum guard, so ghost tenant + unrecognized `Environment` returned HTTP 404 instead of 400 (#724 activate sibling) — **hit 2026-09-04 (#724):** `GovernancePreviewHttpMapper.Validate` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernancePreviewControllerUnitTests.Preview_returns_bad_request_when_environment_is_unrecognized_and_tenant_missing`.

2026-09-04 seed hunt #724 (hit): proved Activate and Preview environment enum validation ordering before tenant preflight.

- [x] (proven) `PolicyPacksController.Validate` / `PolicyPackHttpFacade.ValidateContentAsync` — tenant preflight ran before JSON deserialize of policy pack content, so ghost tenant + non-deserializable content (e.g. `complianceRuleIds` string instead of array) returned HTTP 404 instead of 400 — **hit 2026-09-04 (#725):** `PolicyPackValidateContentHttpMapper.Validate` before `_httpFacade.ValidateContentAsync`; regression in `PolicyPacksControllerListScopeTests.Validate_returns_bad_request_when_content_is_not_deserializable_and_tenant_missing`.

2026-09-04 seed hunt #725 (hit): proved PolicyPacks Validate content deserialization ordering before tenant preflight.

- [x] (proven) `GovernanceCoverageController.PreviewCoverage` / `CoveragePreviewMapper.ToInput` — tenant preflight ran before `descriptionText` / `securityIntakeAnswer` max-length guard (`DraftIntakeValidation.MaximumFreeTextIntentLength`), so ghost tenant + overlong intake text returned HTTP 404 instead of 400 — **hit 2026-09-04 (#726):** `CoveragePreviewHttpMapper.Validate` before `TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync`; regression in `GovernanceCoverageControllerScopeTests.PreviewCoverage_returns_bad_request_when_description_text_exceeds_max_length_and_tenant_missing`.

2026-09-04 seed hunt #726 (hit): proved Coverage preview free-text validation ordering before tenant preflight.

- [x] (proven) `GovernancePreCommitSimulationController.SimulateAsync` — tenant preflight ran before `syntheticSeverity` enum guard, so ghost tenant + unrecognized severity (e.g. numeric `99`) returned HTTP 404 instead of 400 (#726 coverage preview ordering sibling) — **hit 2026-09-04 (#727):** `PreCommitSyntheticSimulationHttpMapper.Validate` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernancePreCommitSimulationControllerTests.Simulate_returns_bad_request_when_synthetic_severity_is_unrecognized_and_tenant_missing`.

2026-09-04 seed hunt #727 (hit): proved pre-commit simulate syntheticSeverity validation ordering before tenant preflight.

- [x] (proven) `GovernanceCoverageController.PreviewCoverage` / `CoveragePreviewRequest.CloudProvider` — tenant preflight ran before `cloudProvider` enum guard, so ghost tenant + unrecognized provider (e.g. numeric `99`) returned HTTP 404 instead of 400 (#727 syntheticSeverity ordering sibling) — **hit 2026-09-04 (#728):** `CoveragePreviewHttpMapper.Validate` rejects undefined `CloudProvider` before `TenantWorkspaceScopePreflight.RequireTenantAndWorkspaceAsync`; regression in `GovernanceCoverageControllerScopeTests.PreviewCoverage_returns_bad_request_when_cloud_provider_is_unrecognized_and_tenant_missing`.

2026-09-04 seed hunt #728 (hit): proved Coverage preview cloudProvider enum validation ordering before tenant preflight.

- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `RecordBulkDisposition` / `GovernanceStickinessHttpMapper.ValidateRecordDisposition` — tenant preflight ran before `disposition` enum guard, so ghost tenant + unrecognized disposition (e.g. numeric `99`) returned HTTP 404 instead of 400 (#728 cloudProvider ordering sibling) — **hit 2026-09-04 (#729):** `ValidateDispositionEnum` before `RequireTenantAndWorkspaceOrNotFoundAsync` on single and bulk disposition paths; regression in `GovernanceStickinessControllerTests.RecordDisposition_returns_bad_request_when_disposition_is_unrecognized_and_tenant_missing`.

2026-09-04 seed hunt #729 (hit): proved finding disposition enum validation ordering before tenant preflight.

- [x] (proven) `GovernanceStickinessController.ResolveFindingMergeConflict` / `ResolveFindingMergeConflictRequest.Action` — tenant preflight ran before merge-conflict `action` enum guard, so ghost tenant + unrecognized action (e.g. numeric `99`) returned HTTP 404 instead of 400 (#729 disposition ordering sibling) — **hit 2026-09-04 (#730):** `GovernanceStickinessHttpMapper.ValidateResolveFindingMergeConflict` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernanceStickinessControllerTests.ResolveFindingMergeConflict_returns_bad_request_when_action_is_unrecognized_and_tenant_missing`.

2026-09-04 seed hunt #730 (hit): proved merge conflict resolve action enum validation ordering before tenant preflight.

- [x] (invalid) `GovernanceController.BatchReviewApprovalRequests` / `GovernanceApprovalRequestsHttpMapper.ValidateBatchReviewRequest` — ghost tenant + unrecognized `decision` may return HTTP 404 instead of 400 (#730 merge-conflict action ordering sibling) — **cheap-disproof 2026-09-04 (#731):** batch decision guard runs before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernanceControllerRunHistoryScopeTests.BatchReviewApprovalRequests_returns_bad_request_when_decision_is_unrecognized_and_tenant_missing`.

- [x] (invalid) `GovernanceController.RecordGovernanceMutationCorrection` / `GovernanceMutationCorrectionsHttpMapper.ValidateRecordMutationCorrection` — ghost tenant + unsupported `mutationKind` may return HTTP 404 instead of 400 (#701 runId ordering sibling) — **cheap-disproof 2026-09-04 (#731):** `GovernanceMutationCorrectionKinds.IsSupported` runs before tenant lookup; regression in `GovernanceMutationCorrectionsControllerTests.RecordGovernanceMutationCorrection_returns_bad_request_when_mutation_kind_is_unsupported_and_tenant_missing`.

- [x] (invalid) `GovernanceStickinessController.GetDecisionRegister` / `GovernanceStickinessHttpMapper.ValidateBuyerConfidenceSource` — ghost tenant + unknown `buyerConfidenceSource` may return HTTP 404 instead of 400 (#703 posture projectId ordering sibling) — **cheap-disproof 2026-09-04 (#731):** query filter validation runs before `RequireTenantAndWorkspaceOrNotFoundAsync`; regression in `GovernanceStickinessControllerTests.GetDecisionRegister_returns_bad_request_when_buyer_confidence_source_is_unknown_and_tenant_missing`.

- [x] (invalid) `GovernanceController.GetDashboard` — ghost tenant + `maxPending` ≤ 0 may return HTTP 404 instead of 400 (#3388 dashboard bounds sibling) — **cheap-disproof 2026-09-04 (#731):** query bound guards run before tenant lookup; regression in `GovernanceControllerDashboardTests.GetDashboard_returns_bad_request_when_max_pending_is_zero_and_tenant_missing`.

2026-09-04 seed hunt #731 (dry): cheap-disproved four #730 validation-ordering siblings; no new hunt-ready repro in zone.

- [x] (proven) `GovernanceStickinessController.CreateRecurrenceSchedule` / `UpdateRecurrenceSchedule` / `GovernanceStickinessHttpMapper` — tenant preflight ran before cron syntax validation, so ghost tenant + invalid `cronExpression` returned HTTP 404 instead of 400 (#731 disposition ordering sibling) — **hit 2026-09-04 (#751):** `ValidateCreateRecurrenceSchedule` / `ValidateUpdateRecurrenceSchedule` call `IsSupportedCronExpression` before `RequireTenantAndWorkspaceOrNotFoundAsync`; regressions in `CreateRecurrenceSchedule_returns_bad_request_when_cron_is_invalid_and_tenant_missing`, `UpdateRecurrenceSchedule_returns_bad_request_when_cron_is_invalid_and_tenant_missing`, and `ValidateCreateRecurrenceSchedule_rejects_invalid_cron_expression`.
- [x] (invalid) `GovernanceStickinessController.PreviewRecurrenceScheduleRuns` — invalid cron with no tenant context already returns 400; create/update parity now covered by #751 — **cheap-disproof 2026-09-04 (#752):** endpoint has no tenant preflight; overlong cron returns HTTP 400; unsupported cron returns HTTP 200 `{ isValid: false }` by design (ledger #559).
- [x] (invalid) `PolicyPacksHttpMapper.ValidatePromoteCatalogEntry` — ghost tenant + invalid semver `version` may return 404 instead of 400 — **cheap-disproof 2026-09-04 (#752):** `ValidatePromoteCatalogEntry` runs before facade scope mapping; regression in `PromoteCatalogEntry_returns_bad_request_when_version_is_not_semver_and_tenant_missing`.

2026-09-04 thorough hunt #752 (dry): cheap-disproved two #751 candidates; repaired stale `RecordDisposition` / `RecordBulkDisposition` tenant-missing regressions that used sub-minimum rationale after HTTP mapper min-length guards; no new hunt-ready repro in zone.

- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `RecordBulkDisposition` — `GovernanceIdempotencyKeySupport.ReadRequired` ran before `ValidateRequestBodyRequired` and `ValidateRecordDisposition` / `ValidateBulkDisposition`, so a caller with missing `Idempotency-Key` plus invalid disposition enum (e.g. numeric `99`) or missing body received HTTP 400 idempotency-header validation instead of disposition/body HTTP mapper errors — **hit 2026-09-04 (#755):** validate body, route `findingId`, and disposition HTTP mapper before `ReadRequired` (aligned with `GovernanceController.SubmitApprovalRequest`); regressions in `RecordDisposition_returns_bad_request_when_disposition_is_unrecognized_without_idempotency_key`, `RecordBulkDisposition_returns_bad_request_when_disposition_is_unrecognized_without_idempotency_key`, and `RecordDisposition_returns_bad_request_when_finding_id_is_whitespace_without_idempotency_key`.
- [x] (proven) `ManifestsController.GetManifestDiagramV2` / `ManifestDiagramService.NormalizeLayout` / `NormalizeGroupBy` / `NormalizeRelationshipLabels` — unrecognized `layout`, `groupBy`, or `relationshipLabels` query values silently fell back to defaults and returned HTTP 200 instead of HTTP 400 — **hit 2026-09-04 (#756):** `ManifestDiagramQueryValidation` rejects unknown query values before tenant preflight (GetManifestSummary format parity); regressions in `GetManifestDiagramV2_returns_bad_request_for_unknown_layout`, `GetManifestDiagramV2_returns_bad_request_for_unknown_relationship_labels`, `GetManifestDiagramV2_returns_bad_request_for_unknown_group_by`, and `GetManifestDiagramV2_returns_bad_request_for_unknown_layout_and_tenant_missing`.
- [x] (invalid) `GovernanceController.DryRunPolicyPack` — `pageSize` / `page` query params have no HTTP 400 bounds guard before `RequireTenantAndWorkspaceOrNotFoundAsync`; ghost tenant + `pageSize=0` returns HTTP 404 while in-scope callers get silent service-side clamp — **cheap-disproof 2026-09-04 (#756):** `pageSize=0` is intentionally server-clamped to 1 per PENDING_QUESTIONS Q38 (`DryRunPolicyPack_delegates_page_size_to_service_for_documented_server_side_clamp`); not a validation defect; regression in `DryRunPolicyPack_clamps_page_size_zero_before_tenant_preflight_is_not_a_validation_error`.

2026-09-04 thorough hunt #756 (hit): proved manifest diagram v2 silent query defaults; cheap-disproved dry-run paging clamp candidate.

- [x] (proven) `PolicyPacksController.SetAssignmentEnabled` / `SetPolicyPackAssignmentEnabledRequest` — JSON body omitted `isEnabled` → HTTP 204 and persisted `IsEnabled = false` instead of HTTP 400 — **hit 2026-09-04 (#757):** `required bool IsEnabled` (CorePilot checklist `isCompleted` omission parity); regression in `SetAssignmentEnabledRequest_deserialization_rejects_missing_is_enabled`.
- [x] (proven) `PolicyPacksController.Publish` / `PublishPolicyPackVersionRequest` — JSON body omitted `contentJson` → HTTP 200 and published `"{}"` empty pack via property initializer — **hit 2026-09-04 (#757):** `required string ContentJson` + FluentValidation `NotEmpty`; regression in `PublishPolicyPackVersionRequest_deserialization_rejects_missing_content_json`.
- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` / `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` / `ExecDigestPreferencesUpsertRequest` — omitted `emailEnabled` bound as `false` and could unintentionally disable digest when caller only updated recipients — **hit 2026-09-04 (#758):** `required bool EmailEnabled` on exec/sponsor upsert requests (checklist `isCompleted` / policy-pack `isEnabled` omission parity); regressions in `ExecDigestPreferencesUpsertRequest_deserialization_rejects_missing_email_enabled` and `SponsorDigestPreferencesUpsertRequest_deserialization_rejects_missing_email_enabled`.
- [x] (invalid) `TenantExecDigestPreferencesController.PostExecDigestPreferences` — omitted `dayOfWeek` / `hourOfDay` silently default to Monday 08:00 (`?? 1`, `?? 8`) instead of HTTP 400 validation — **cheap-disproof 2026-09-04 (#758):** defaults match `ExecDigestPreferencesResponse.Unconfigured` schedule fields; intentional partial-upsert semantics; regression in `PostExecDigestPreferences_applies_default_schedule_when_day_of_week_and_hour_omitted`.

2026-09-04 thorough hunt #758 (hit): proved digest preferences omitted `emailEnabled`; cheap-disproved silent schedule-default candidate.

- [x] (proven) `PolicyPacksController.Create` / `CreatePolicyPackRequest` — omitted `initialContentJson` published empty `{}` draft via property initializer — **hit 2026-09-04 (#759):** `required string InitialContentJson` + FluentValidation `NotEmpty` (publish `contentJson` #757 parity); regression in `CreatePolicyPackRequest_deserialization_rejects_missing_initial_content_json`.
- [x] (proven) `PolicyPacksController.Assign` / `AssignPolicyPackRequest` — omitted `isPinned` bound as `false` instead of HTTP 400 — **hit 2026-09-04 (#759):** `required bool IsPinned` (assignment `isEnabled` #757 parity); regression in `AssignPolicyPackRequest_deserialization_rejects_missing_is_pinned`.
- [x] (proven) `CorePilotTeamChecklistController.PutAsync` / `CorePilotChecklistPutRequest` — omitted `stepIndex` bound as `0` instead of HTTP 400 — **hit 2026-09-04 (#759):** `required int StepIndex` (`isCompleted` #343 parity); regression in `PutRequest_deserialization_rejects_missing_or_null_step_index`.
- [x] (proven) `TenantCostSettingsController.PutAsync` — partial PUT omitting EA fields reset stored `EaDiscountMultiplier` to `1.0` — **hit 2026-09-04 (#759):** preserve existing multiplier when both EA fields omitted; regression in `PutAsync_preserves_ea_discount_multiplier_when_ea_fields_omitted`.
- [x] (invalid) `TenantExecDigestPreferencesController` / `TenantSponsorDigestPreferencesController` — omitted `ianaTimeZoneId` coalesces to `"UTC"` on full upsert and may reset timezone when caller only updates recipients — **cheap-disproof 2026-09-04 (#760):** defaults match `ExecDigestPreferencesResponse.Unconfigured` / `SponsorDigestPreferencesResponse.Unconfigured` timezone field; intentional partial-upsert semantics (schedule-default #758 sibling); regressions in `PostExecDigestPreferences_applies_default_timezone_when_iana_time_zone_omitted` and `PostSponsorDigestPreferences_applies_default_timezone_when_iana_time_zone_omitted`.

2026-09-04 thorough hunt #760 (dry): cheap-disproved digest timezone omission candidate; no new hunt-ready repro in zone.

- [x] (proven) `TenantHomepageSettingsController.PutAsync` / `TenantHomepageSettingsPutRequest` — JSON body omitted `selectedRunId` (e.g. `{}`) cleared featured sample via `ClearSelectionAsync` instead of HTTP 400 — **hit 2026-09-04 (#773):** `required Guid? SelectedRunId` rejects omitted property while explicit `null` still clears selection (policy-pack `isEnabled` / checklist `stepIndex` omission parity); regressions in `PutRequest_deserialization_rejects_missing_selected_run_id` and `PutAsync_clears_selection_when_selected_run_id_is_explicitly_null`.
- [x] (proven) `TenantCostSettingsController.PutAsync` / `TenantCostSettingsPutRequest` — omitted `architectHourlyRateUsd` / `averageIncidentCostUsd` bound as `0` and returned misleading range validation instead of required-field 400 — **hit 2026-09-04 (#774):** `required decimal` on both rate fields (checklist `stepIndex` / policy-pack `isPinned` omission parity); regression in `PutRequest_deserialization_rejects_missing_rate_fields`.
- [x] (proven) `TenantBaselineController.PutAsync` — whitespace-only `baselineReviewCycleSourceNote` collapsed persisted operator note to marker-only `baseline_settings` — **hit 2026-09-04 (#774):** reject empty/whitespace source note before persist (`findingRef` whitespace #325 parity); regression in `PutAsync_returns_bad_request_when_review_cycle_source_note_is_whitespace`.

2026-09-04 thorough hunt #774: proved cost-settings rate-field omission and baseline whitespace source-note data loss.

- [x] (proven) `GovernanceStickinessController.UpsertRealizedValueAttestation` / `RealizedValueMetricsCalculator.SaveAttestationAsync` — partial PUT omitting attestation notes replaced the whole JSON blob and wiped sibling fields — **hit 2026-09-04 (#775):** merge omitted nullable fields from existing workspace attestation before upsert (cost-settings EA partial-PUT #759 parity); regression in `SaveAttestationAsync_preserves_existing_notes_when_partial_body_omits_them`.
- [x] (proven) `TenantBaselineController.PutAsync` — hours-only PUT called `FormatOperatorSettingsPersistence(null)` and collapsed existing `baseline_settings:note` to marker-only — **hit 2026-09-04 (#776):** preserve `existing.BaselineReviewCycleSource` when `baselineReviewCycleSourceNote` is omitted on hours update (partial-PUT merge parity); regression in `PutAsync_preserves_review_cycle_source_note_when_hours_only_update_omits_note`.
- [x] (proven) `TenantErasureLegalHoldController.SetLegalHoldAsync` / `TenantErasureLegalHoldRequest` — omitted `untilUtc` bound `default(DateTimeOffset)` and returned misleading future-date validation — **hit 2026-09-04 (#776):** `required DateTimeOffset UntilUtc` rejects omitted property at deserialization (checklist `stepIndex` omission parity); regression in `SetLegalHoldRequest_deserialization_rejects_missing_until_utc`.

2026-09-04 thorough hunt #776: proved baseline hours-only source-note wipe and legal-hold `untilUtc` omission.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateRenewRiskException` / `RiskExceptionValidation.ValidateRenew` — whitespace-only optional `rationale` / `evidenceRef` on renew passed validation and overwrote stored waiver text via `COALESCE(@Rationale, Rationale)` — **hit 2026-09-04 (#777):** reject empty/whitespace optional renew fields before persist (create-rationale #676 parity); regressions in `ValidateRenewRiskException_rejects_whitespace_only_rationale`, `ValidateRenewRiskException_rejects_whitespace_only_evidence_ref`, `ValidateRenew_rejects_whitespace_only_rationale`, and `ValidateRenew_rejects_whitespace_only_evidence_ref`.
- [x] (proven) `GovernanceStickinessController.ResolveFindingMergeConflict` / `ResolveFindingMergeConflictRequest.Action` — omitted `action` in JSON body bound to default `AcceptPrimary` and resolved without explicit operator choice — **hit 2026-09-04 (#777):** `required FindingMergeConflictResolutionAction Action` rejects omitted property at deserialization (checklist `stepIndex` omission parity); regression in `ResolveFindingMergeConflictRequest_deserialization_rejects_missing_action`.
- [x] (invalid) `GovernanceController.Promote` / `CreateGovernancePromotionRequest` — omitted `sourceEnvironment` / `targetEnvironment` bind to initializer defaults `dev`/`test` instead of HTTP 400 — **cheap-disproof 2026-09-04 (#778):** property-initializer defaults match canonical dev→test workflow (submit-approval sibling); validator `.NotEmpty()` accepts defaults; regression in `Validate_accepts_property_initializer_defaults_for_standard_dev_to_test_promotion`.
- [x] (invalid) `GovernanceController.Activate` / `CreateGovernanceActivationRequest` — omitted `environment` binds to initializer default `dev` instead of HTTP 400 — **cheap-disproof 2026-09-04 (#778):** property-initializer default matches standard dev activation path; regression in `Validate_accepts_property_initializer_default_environment_for_standard_dev_activation`.
- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` / `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` — disable-only POST (`emailEnabled: false` without `recipientEmails`) wiped stored recipients on full upsert while `TryDisableEmailAsync` preserved them — **hit 2026-09-04 (#778):** merge omitted `recipientEmails` from existing preferences before upsert (unsubscribe/disable parity); regressions in `PostExecDigestPreferences_preserves_recipients_when_disable_only_body_omits_recipient_emails` and `PostSponsorDigestPreferences_preserves_recipients_when_disable_only_body_omits_recipient_emails`.
- [x] (proven) `GovernanceStickinessController.UpsertRealizedValueAttestation` / `RealizedValueAttestationUpsertValidation` — whitespace-only `attestedReviewerTimeSavedNote` / `attestedRevenueOrRetentionImpact` passed HTTP validation and cleared stored notes via `NormalizeOptionalText` — **hit 2026-09-04 (#779):** reject empty/whitespace optional attestation notes before persist (renew-rationale #777 parity); regressions in `ValidateUpsertRealizedValueAttestation_rejects_whitespace_reviewer_note` and `SaveAttestationAsync_throws_when_note_is_whitespace_only`.
- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `GovernanceStickinessHttpMapper.ValidateCreateRiskException` — omitted `evidenceRef` passed HTTP validation and returned HTTP 404 for ghost tenant instead of 400 — **hit 2026-09-04 (#779):** require `evidenceRef` before tenant preflight (disposition enum #729 ordering parity); regressions in `ValidateCreateRiskException_requires_evidence_ref` and `CreateRiskException_returns_bad_request_when_evidence_ref_missing_and_tenant_missing`.
- [x] (proven) `GovernanceStickinessController.UpdateRecurrenceSchedule` / `GovernanceStickinessHttpMapper.ValidateUpdateRecurrenceSchedule` — whitespace-only optional `name` / `cronExpression` passed HTTP validation and facade ignored the fields (silent no-op) — **hit 2026-09-04 (#779):** reject empty/whitespace optional update fields before persist (renew-rationale #777 parity); regressions in `ValidateUpdateRecurrenceSchedule_rejects_whitespace_only_name` and `ValidateUpdateRecurrenceSchedule_rejects_whitespace_only_cron_expression`.

2026-09-04 seed hunt #779 (hit): proved attestation whitespace wipe, create-waiver evidenceRef ordering, and recurrence update whitespace no-op.

- [x] (proven) `GovernanceStickinessController.CreateRiskException` / `GovernanceStickinessHttpMapper.ValidateCreateRiskException` — past or over-max `expiresAtUtc` passed HTTP validation and returned HTTP 404 for ghost tenant instead of 400 — **hit 2026-09-04 (#780):** `ValidateRiskExceptionExpiry` before tenant preflight (evidenceRef #779 ordering parity); regressions in `ValidateCreateRiskException_rejects_past_expires_at_utc`, `ValidateCreateRiskException_rejects_expires_at_utc_beyond_max_duration`, and `CreateRiskException_returns_bad_request_when_expires_at_is_past_and_tenant_missing`.
- [x] (proven) `GovernanceStickinessController.RenewRiskException` / `GovernanceStickinessHttpMapper.ValidateRenewRiskException` — past `expiresAtUtc` passed HTTP validation and returned HTTP 404 for ghost tenant instead of 400 — **hit 2026-09-04 (#780):** shared `ValidateRiskExceptionExpiry` before tenant preflight (create expiry #780 sibling); regressions in `ValidateRenewRiskException_rejects_past_expires_at_utc` and `RenewRiskException_returns_bad_request_when_expires_at_is_past_and_tenant_missing`.
- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `GovernanceStickinessHttpMapper.ValidateRecordDisposition` — whitespace-only optional `rationale` on `Remediated` passed HTTP validation and stored null notes (silent no-op) — **hit 2026-09-04 (#780):** reject empty/whitespace optional disposition text before persist (attestation note #779 parity); regressions in `ValidateRecordDisposition_rejects_whitespace_only_optional_rationale` and `RecordDisposition_returns_bad_request_when_remediated_rationale_is_whitespace_only`.

2026-09-04 seed hunt #780 (hit): proved waiver expiry validation ordering and disposition optional-rationale whitespace no-op.

- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `GovernanceStickinessHttpMapper.ValidateRecordDisposition` — whitespace-only `evidenceRequestText` on non-`NeedsEvidence` dispositions passed HTTP validation and stored null notes (silent no-op) — **hit 2026-09-04 (#781):** reject non-null whitespace optional fields outside their disposition branch (optional-rationale #780 parity); regressions in `ValidateRecordDisposition_rejects_whitespace_only_optional_evidence_request_text` and `RecordDisposition_returns_bad_request_when_remediated_evidence_request_text_is_whitespace_only`.
- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `GovernanceStickinessHttpMapper.ValidateRecordDisposition` — whitespace-only `tradeOffAcknowledgment` on non-`Accepted` dispositions passed HTTP validation and was silently ignored — **hit 2026-09-04 (#781):** shared `ValidateOptionalDispositionFieldWhenNotApplicable` guard; regression in `ValidateRecordDisposition_rejects_whitespace_only_optional_trade_off_acknowledgment`.
- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `GovernanceStickinessHttpMapper.ValidateBulkDisposition` — whitespace-only `evidenceRequestText` on non-`NeedsEvidence` bulk dispositions passed HTTP validation and was silently dropped — **hit 2026-09-04 (#781):** same optional-field guard on bulk path; regression in `ValidateBulkDisposition_rejects_whitespace_only_optional_evidence_request_text`.
- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `GovernanceStickinessHttpMapper.ValidateBulkDisposition` — bulk `Accepted` with whitespace-only `tradeOffAcknowledgment` skipped validation and defaulted to shared `rationale` while single-item `Accepted` rejected whitespace — **hit 2026-09-04 (#781):** validate trade-off whenever field is non-null on bulk `Accepted`; regressions in `ValidateBulkDisposition_rejects_whitespace_only_trade_off_acknowledgment_on_accepted` and `RecordBulkDisposition_returns_bad_request_when_accepted_trade_off_is_whitespace_only`.

2026-09-04 seed hunt #781 (hit): proved disposition optional-field whitespace silent no-op on single and bulk paths.

- [x] (proven) `GovernanceStickinessController.RecordBulkDisposition` / `GovernanceStickinessHttpMapper.ValidateBulkDisposition` — whitespace-only `tradeOffAcknowledgment` on non-`Accepted` bulk dispositions passed HTTP validation and was silently ignored — **hit 2026-09-04 (#782):** `ValidateOptionalDispositionFieldWhenNotApplicable` parity with single-item path (#781); regression in `ValidateBulkDisposition_rejects_whitespace_only_optional_trade_off_acknowledgment`.

2026-09-04 seed hunt #782 (hit): proved bulk disposition optional trade-off whitespace no-op on non-`Accepted` path.

- [x] (proven) `GovernanceStickinessController.CreateRecurrenceSchedule` / `GovernanceStickinessHttpMapper.ValidateCreateRecurrenceSchedule` — whitespace-only `name` passed HTTP validation and silently defaulted to `"Recurring architecture review"` instead of HTTP 400 — **hit 2026-09-04 (#783):** reject empty/whitespace create fields (update recurrence #779 parity); regressions in `ValidateCreateRecurrenceSchedule_rejects_whitespace_only_name` and `CreateRecurrenceSchedule_returns_bad_request_when_name_is_whitespace_only`.
- [x] (proven) `GovernanceStickinessController.CreateRecurrenceSchedule` / `GovernanceStickinessHttpMapper.ValidateCreateRecurrenceSchedule` — whitespace-only `cronExpression` passed HTTP validation and silently defaulted to `"0 8 * * 1"` instead of HTTP 400 — **hit 2026-09-04 (#783):** same create-path whitespace guard (update cron #779 parity); regressions in `ValidateCreateRecurrenceSchedule_rejects_whitespace_only_cron_expression` and `CreateRecurrenceSchedule_returns_bad_request_when_cron_expression_is_whitespace_only`.

2026-09-04 seed hunt #783 (hit): proved create recurrence whitespace silent default on name and cronExpression.

- [x] (proven) `GovernanceController.Approve` / `Reject` / `BatchReviewApprovalRequests` / `SubmitApprovalRequest` / `Promote` / `GovernanceApprovalRequestsHttpMapper.ValidateOptionalGovernanceComment` — whitespace-only optional `reviewComment`, `requestComment`, or `notes` passed HTTP validation and persisted as whitespace text — **hit 2026-09-04 (#784):** reject empty/whitespace optional governance comments when explicitly provided (disposition optional-field #781 parity); regressions in `ValidateReviewComment_rejects_whitespace_only_comment`, `ValidateOptionalGovernanceComment_rejects_whitespace_only_notes`, `ValidateBatchReviewRequest_rejects_whitespace_only_review_comment`, and `Approve_returns_bad_request_when_review_comment_is_whitespace_only`.

2026-09-04 seed hunt #784 (hit): proved governance optional comment whitespace silent no-op on approve/reject/batch/submit/promote paths.

- [x] (proven) `ManifestsController.GetManifestDiagramV2` / `ManifestDiagramQueryValidation` — whitespace-only `layout`, `relationshipLabels`, or `groupBy` query values passed HTTP validation and silently defaulted via `ManifestDiagramService.Normalize*` instead of HTTP 400 — **hit 2026-09-04 (#785):** reject explicit empty/whitespace query values while preserving omitted-null defaults (unknown-value #756 parity); regressions in `ValidateLayout_rejects_whitespace_only_layout`, `ValidateRelationshipLabels_rejects_whitespace_only_value`, `ValidateGroupBy_rejects_whitespace_only_value`, and `GetManifestDiagramV2_returns_bad_request_for_whitespace_only_layout`.

2026-09-04 seed hunt #785 (hit): proved diagram v2 whitespace query silent default on layout, relationshipLabels, and groupBy.

- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `RecordBulkDisposition` / `GovernanceStickinessHttpMapper` — non-null `revisitDueUtc` on non-`Deferred` dispositions passed HTTP validation and was silently dropped by `FindingDispositionService` — **hit 2026-09-04 (#786):** `ValidateOptionalDispositionDateWhenNotApplicable` guard on single and bulk paths (optional-field #781 parity); regressions in `ValidateRecordDisposition_rejects_revisit_due_on_non_deferred_disposition`, `ValidateBulkDisposition_rejects_revisit_due_on_non_deferred_disposition`, and `RecordDisposition_returns_bad_request_when_revisit_due_on_non_deferred_disposition`.

2026-09-04 seed hunt #786 (hit): proved disposition optional revisitDueUtc silent drop on non-Deferred paths.

- [x] (proven) `GovernanceStickinessController.RecordDisposition` / `RecordBulkDisposition` / `GovernanceStickinessHttpMapper.ValidateOptionalDispositionFieldWhenNotApplicable` — non-null `evidenceRequestText` or `tradeOffAcknowledgment` on inapplicable dispositions passed HTTP validation when text was non-whitespace and was silently dropped by `FindingDispositionService` — **hit 2026-09-04 (#787):** reject any explicitly provided inapplicable optional string fields (whitespace #781 and revisitDueUtc #786 parity); regressions in `ValidateRecordDisposition_rejects_optional_evidence_request_text_on_non_needs_evidence_disposition`, `ValidateRecordDisposition_rejects_optional_trade_off_acknowledgment_on_non_accepted_disposition`, bulk mapper siblings, and `RecordDisposition_returns_bad_request_when_remediated_evidence_request_text_is_provided`.

2026-09-04 seed hunt #787 (hit): proved disposition inapplicable optional string silent drop beyond whitespace-only cases.

- [x] (proven) `PolicyPacksController.PromoteCatalogEntry` / `PolicyPacksHttpMapper.ValidatePromoteCatalogEntry` — whitespace-only optional `version` skipped `ValidatePackVersion` and promoted with a blank version label instead of HTTP 400 — **hit 2026-09-04 (#788):** validate optional version whenever field is non-null (create recurrence #783 parity); regressions in `ValidatePromoteCatalogEntry_rejects_whitespace_only_optional_version` and `PromoteCatalogEntry_returns_bad_request_when_version_is_whitespace_only`.

2026-09-04 seed hunt #788 (hit): proved promote-catalog whitespace optional version silent skip.

- [x] (proven) `GovernanceCoverageController.PreviewCoverage` / `CoveragePreviewHttpMapper.ValidateFreeTextLength` — whitespace-only optional `descriptionText` / `securityIntakeAnswer` passed HTTP validation and flowed through `CoveragePreviewMapper.ToInput` unchanged instead of HTTP 400 — **hit 2026-09-04 (#789):** reject non-null whitespace-only optional free-text fields before tenant preflight (governance comment #784 / promote-catalog #788 parity); regressions in `CoveragePreviewHttpMapperTests` and `GovernanceCoverageControllerScopeTests.PreviewCoverage_returns_bad_request_when_description_text_is_whitespace_only_and_tenant_missing` / `..._security_intake_answer_is_whitespace_only_and_tenant_missing`.

2026-09-04 seed hunt #789 (hit): proved coverage preview whitespace optional intake text silent pass.

- [x] (proven) `PolicyPacksController.Create` / `CreatePolicyPackRequestValidator` — whitespace-only optional `description` passed FluentValidation and flowed through `PolicyPackHttpFacade.CreatePackAsync` unchanged instead of HTTP 400 — **hit 2026-09-04 (#790):** reject explicit whitespace-only description while allowing omitted/default empty string (coverage preview #789 parity); regressions in `CreatePolicyPackRequestValidatorTests.Whitespace_only_description_fails` and `PolicyPacksControllerListScopeTests.Create_returns_bad_request_when_description_is_whitespace_only_and_tenant_missing`.

2026-09-04 seed hunt #790 (hit): proved create policy pack whitespace description silent pass.

- [x] (proven) `PolicyPacksController.Assign` / `AssignPolicyPackRequestValidator` — whitespace-only `scopeLevel` passed FluentValidation via `GovernanceScopeLevel.TryNormalize` and silently defaulted to `Project` instead of HTTP 400 — **hit 2026-09-04 (#791):** reject explicit whitespace-only scope level while preserving omitted/default `Project` (create pack description #790 parity); regressions in `AssignPolicyPackRequestValidatorTests.Validate_fails_when_scope_level_is_whitespace_only` and `PolicyPacksControllerListScopeTests.Assign_returns_bad_request_when_scope_level_is_whitespace_only_and_tenant_missing`.

2026-09-04 seed hunt #791 (hit): proved assign policy pack whitespace scopeLevel silent Project default.

- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` / `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` / `DigestRecipientEmailsValidator.TryNormalize` — explicit whitespace-only `recipientEmails` bypassed merge-from-existing (#778) and wiped stored recipients on disable-only upsert instead of HTTP 400 — **hit 2026-09-04 (#792):** reject non-null recipient lists whose entries are all empty/whitespace (assign scopeLevel #791 parity); regressions in `PostExecDigestPreferences_returns_bad_request_when_recipient_emails_are_whitespace_only` and `PostSponsorDigestPreferences_returns_bad_request_when_recipient_emails_are_whitespace_only`.

2026-09-04 seed hunt #792 (hit): proved digest whitespace recipientEmails silent wipe on disable-only upsert.

- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` / `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` — disable-only POST with explicit empty `recipientEmails` array (`[]`) wiped stored recipients instead of preserving them like omitted field (#778) — **hit 2026-09-04 (#793):** treat null or empty recipient list as omitted when `emailEnabled` is false before merge-from-existing (whitespace #792 parity); regressions in `PostExecDigestPreferences_preserves_recipients_when_disable_only_body_has_empty_recipient_emails_array` and `PostSponsorDigestPreferences_preserves_recipients_when_disable_only_body_has_empty_recipient_emails_array`.

2026-09-04 seed hunt #793 (hit): proved digest empty recipientEmails array silent wipe on disable-only upsert.

- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` / `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` — disable-only POST (`emailEnabled: false` without schedule fields) reset `dayOfWeek`, `hourOfDay`, and `ianaTimeZoneId` to defaults (`1`, `8`, `UTC`) instead of preserving stored schedule/timezone like `TryDisableEmailAsync` (#778/#793 recipient parity) — **hit 2026-09-05 (#794):** merge omitted schedule/timezone from existing preferences when disabling email; regressions in `PostExecDigestPreferences_preserves_schedule_and_timezone_when_disable_only_body_omits_schedule_fields` and `PostSponsorDigestPreferences_preserves_schedule_and_timezone_when_disable_only_body_omits_schedule_fields`.

2026-09-05 seed hunt #794 (hit): proved digest disable-only schedule/timezone silent reset.

- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` / `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` — enable-only POST (`emailEnabled: true` without schedule fields) after disable reset `dayOfWeek`, `hourOfDay`, and `ianaTimeZoneId` to defaults (`1`, `8`, `UTC`) instead of preserving stored schedule/timezone (#794 disable parity) — **hit 2026-09-05 (#816):** merge omitted schedule/timezone from existing preferences when re-enabling email; regressions in `PostExecDigestPreferences_preserves_schedule_and_timezone_when_enable_only_body_omits_schedule_fields` and `PostSponsorDigestPreferences_preserves_schedule_and_timezone_when_enable_only_body_omits_schedule_fields`.
- [x] (invalid) Digest preference POST disable-only with explicit default schedule fields clobbers custom schedule — **cheap-disproof 2026-09-05:** explicit `dayOfWeek`/`hourOfDay`/`ianaTimeZoneId` on disable apply client-supplied values by design (full-form semantics); #794 fixed only omitted-field merge.
- [x] (invalid) `TenantExecDigestPreferencesController` / `TenantSponsorDigestPreferencesController` lack workspace scope preflight — **cheap-disproof 2026-09-05:** digest prefs are tenant-wide (`GetByTenantAsync`); tenant-scoped weekly delivery intentionally uses primary workspace per ledger #489; unlike workspace-scoped homepage/health reads.

2026-09-05 seed hunt #816 (hit): proved digest enable-only schedule/timezone silent reset; cheap-disproved disable explicit-schedule clobber and digest workspace-preflight candidates.

- [x] (proven) `GovernanceStickinessController.RecordDisposition` — body `findingId` differing from route `findingId` returned HTTP 200 and recorded disposition for route finding only — **hit 2026-09-05 (#817):** `ValidateRecordDispositionRouteFindingId` rejects mismatch before facade call (#571 runId authority parity); regressions in `RecordDisposition_returns_bad_request_when_body_finding_id_differs_from_route` and `ValidateRecordDispositionRouteFindingId_rejects_body_finding_id_mismatch`.
- [x] (invalid) `GovernanceStickinessController.CreateRecurrenceSchedule` omitted `name`/`cronExpression` apply initializer defaults — **cheap-disproof 2026-09-05:** create semantics mirror cheap-disproved Promote/Activate environment defaults (#778); whitespace-only rejected (#783).
- [x] (invalid) `GovernancePreCommitSimulationController.SimulateAsync` omitted `syntheticSeverity` defaults to Warning — **cheap-disproof 2026-09-05:** dry-run initializer defaults intentional; enum ordering before tenant preflight fixed (#727).
- [x] (invalid) `GovernancePreviewController.Preview` omitted `environment` defaults to dev — **cheap-disproof 2026-09-05:** same intentional omission pattern as #778.

2026-09-05 seed hunt #817 (hit): proved RecordDisposition route/body findingId silent mismatch; cheap-disproved recurrence/pre-commit/preview omission-default candidates.

- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — in-scope `findingRef` with mismatched or omitted `runId` returned HTTP 204 and persisted cross-linked feedback — **hit 2026-09-05 (#818):** `ProductFeedbackHttpMapper.ValidateRunMatchesFindingAuthorityRun` enforces finding authority-run binding (#571 stickiness parity); regressions in `PostProductFeedbackAsync_returns_bad_request_when_run_id_does_not_match_finding_authority_run` and `PostProductFeedbackAsync_returns_bad_request_when_finding_ref_has_authority_run_and_run_id_omitted`.
- [x] (invalid) Digest enable-only POST with explicit empty `recipientEmails: []` wipes stored recipients — **cheap-disproof 2026-09-05:** `DigestRecipientEmailsValidator` rejects empty recipient list when `emailEnabled` is true (disable-only #793 parity does not apply to enable path).

2026-09-05 seed hunt #818 (hit): proved product-feedback finding authority-run binding gap; cheap-disproved digest enable empty-recipient wipe candidate.

- [x] (proven) `GovernanceStickinessFacade.ListDispositionsAsync` / `RecordDispositionAsync` / `GovernanceMutationCorrectionService.ValidateFindingDispositionSubjectAsync` / `FindingMergeConflictResolutionService` — route or subject `findingId` differing only by casing from inspect canonical id returned HTTP 200 `[]`, failed correction lookup, or missed merge-conflict member — **hit 2026-09-05 (#819):** resolve canonical `finding.FindingId` via inspect before trail/snapshot SQL (`ListDispositionsAsync_returns_history_when_finding_id_differs_only_by_casing`, `RecordAsync_appends_correction_for_keyboard_finding_disposition_when_subject_id_differs_only_by_casing`); merge-conflict lookup uses `OrdinalIgnoreCase`.

2026-09-05 seed hunt #819 (hit): proved finding-id case canonicalization gap on disposition history, mutation correction, and merge-conflict resolution paths.

- [x] (proven) `GovernanceStickinessFacade.CreateRiskExceptionAsync` / `RiskExceptionService.CreateAsync` — body `findingId` differing only by casing from inspect canonical id persisted keyboard casing so waiver joins and `RiskExceptionDispositionGuard` trail lookups missed the row — **hit 2026-09-05 (#820):** rewrite normalized request to `finding.FindingId` after inspect (#819 disposition parity); regression in `CreateRiskExceptionAsync_persists_canonical_finding_id_when_request_differs_only_by_casing`.
- [x] (proven) `TenantCustomerSuccessController.PostProductFeedbackAsync` — `findingRef` differing only by casing from inspect canonical id persisted keyboard casing after #818 authority-run binding — **hit 2026-09-05 (#821):** persist `finding.FindingId` after inspect (#819/#820 disposition/waiver parity); regression in `PostProductFeedbackAsync_persists_canonical_finding_ref_when_request_differs_only_by_casing`.

2026-09-05 thorough hunt #821 (hit): proved product-feedback findingRef case canonicalization gap promoted from #820 seed candidate.

- [x] (proven) `GovernanceStickinessHttpMapper.ValidateRecordDispositionRouteFindingId` / `GovernanceStickinessController.RecordDisposition` — route `findingId` and body `findingId` differing only by casing returned HTTP 400 while `ListDispositions` accepted case variants after #819 — **hit 2026-09-05 (#822):** `OrdinalIgnoreCase` route/body match (#817 logical-mismatch guard preserved); regressions in `ValidateRecordDispositionRouteFindingId_accepts_body_finding_id_when_differs_only_by_casing` and `RecordDisposition_returns_ok_when_body_finding_id_differs_only_by_casing_from_route`.
- [x] (proven) `FindingMergeConflictResolutionService.TryResolveAsync` — conflict lookup is case-insensitive (#819) but `memberFindingIds.Contains(..., Ordinal)` missed snapshot members when rationale ids differed only by casing from stored `FindingId` — **hit 2026-09-05 (#823):** `OrdinalIgnoreCase` member match; regression in `TryResolveAsync_resolves_when_rationale_member_ids_differ_only_by_casing_from_snapshot`.

2026-09-05 thorough hunt #823 (hit): proved merge-conflict member FindingId case mismatch promoted from #822 seed candidate.

- [x] (proven) `GovernanceMutationCorrectionService.RecordAsync` / `GovernanceController.RecordGovernanceMutationCorrection` — keyboard/bulk disposition correction `subjectId` differing only by casing from inspect canonical id persisted keyboard casing in DTO and audit JSON while #819 only canonicalized trail lookup — **hit 2026-09-05 (#824):** `ValidateFindingDispositionSubjectAsync` returns canonical `finding.FindingId` for persisted `SubjectId` (#819/#820 disposition/waiver parity); regression in `RecordAsync_appends_correction_for_keyboard_finding_disposition_when_subject_id_differs_only_by_casing`.

2026-09-05 seed hunt #824 (hit): reseeded finding-id case parity surfaces; proved mutation-correction subjectId canonicalization gap promoted from #819 partial fix.

- [x] (proven) `GovernanceStickinessController.RenewRiskException` / `RiskExceptionService.RenewAsync` — optional `rationale` / `evidenceRef` with outer padding passed validation via `Trim().Length` but persisted padded strings while create path trims before SQL — **hit 2026-09-05 (#825):** trim optional renew fields before `IRiskExceptionRepository.RenewAsync` (create parity); regression in `RenewAsync_trims_padded_rationale_and_evidence_ref_before_persist`.
- [x] (proven) `RiskExceptionService.RenewAsync` / `CreateAsync` sibling guard — legacy waiver row `FindingId` casing differs from post-#820 canonical inspect id so `GetActiveForScopeFindingAsync` exact match missed duplicate active waiver — **hit 2026-09-05 (#826):** case-insensitive active-waiver scan via `ListActiveForTenantAsync` + `OrdinalIgnoreCase`; regression in `CreateAsync_throws_conflict_when_active_waiver_finding_id_differs_only_by_casing`.
- [x] (proven) `RiskExceptionDispositionGuard.EnsureWaiverAllowedForFindingAsync` on renew — stored `existing.FindingId` without inspect canonicalization let remediated trail under canonical casing stay invisible when waiver row retained legacy casing — **hit 2026-09-05 (#826):** resolve inspect canonical id before disposition guard on create/renew; regression in `RenewAsync_rejects_when_remediated_trail_finding_id_differs_only_by_casing_from_stored_waiver`.

2026-09-05 thorough hunt #826 (hit): proved legacy waiver finding-id casing gaps for duplicate active guard and renew disposition guard seeded in #825.

- [x] (invalid) `DapperFindingInspectReadRepository.LoadDispositionJoinAsync` / `FindingInspectReadSql.FollowUpBatch` — inspect GET for canonical `finding-1` while legacy active waiver / disposition trail rows remain on `FINDING-1` — **cheap-disproof 2026-09-05 (#829):** SQL Server CI collation matches waiver/disposition rows that differ only by casing; #826 fixed C# `Ordinal` divergence on mutate paths, not an inspect SQL gap; regression in `GetInspectAsync_sets_HasActiveWaiver_when_legacy_waiver_finding_id_differs_only_by_casing`.
- [x] (invalid) `ArchitectureRiskRegisterReader.BuildListQuerySql` / `GovernanceStickinessController.GetRiskRegister` — same legacy waiver casing split (`FindingRecords` canonical `finding-1`, `RiskExceptions` row `FINDING-1`) — **cheap-disproof 2026-09-05 (#829):** `re.FindingId = fr.FindingId` join succeeds under SQL Server CI when legacy waiver casing differs; regression in `ListAsync_includes_waiver_expiry_when_legacy_waiver_finding_id_differs_only_by_casing`.
- [x] (invalid) `GovernanceStickinessController.CreateRiskException` / `RiskExceptionService.CreateAsync` — endpoint comment `idempotency-posture: operator-documented-safe-retry` but no `[IdempotencyFilter]` unlike `RecordDisposition` / `RecordBulkDisposition` — **cheap-disproof 2026-09-05 (#829):** baseline classifies `POST /v1/governance/risk-exceptions` as `operator-documented-safe-retry` (HTTP 409 on duplicate active waiver is documented posture); disposition routes use `explicit-idempotency-key`; regression in `Risk_exception_create_is_operator_documented_safe_retry_not_explicit_idempotency_key`.

2026-09-05 thorough hunt #829 (dry): cheap-disproved three post-#827 read-path waiver casing and create idempotency candidates; no failing repro.
- [x] (invalid) `FindingMergeConflictResolutionService.TryResolveAsync` removal filter — snapshot member rows differing only by casing left after AcceptPrimary/AcceptAlternate because `idsToRemove.Contains` uses ordinal `HashSet` — **cheap-disproof 2026-09-05 (#827):** `idsToRemove` collects each matched member's actual `Finding.FindingId` from snapshot rows; non-primary case variants are added in the member loop; existing regression `TryResolveAsync_resolves_when_rationale_member_ids_differ_only_by_casing_from_snapshot`.

2026-09-05 seed hunt #827 (seed-only): reseeded post-#826 read-path waiver/disposition parity and create idempotency candidates; cheap-disproved merge-conflict ordinal removal miss from #822 seed.

- [x] (proven) `PolicyPacksController.Assign` / `PolicyPackAssignStage.AssignAsync` — operator retry after HTTP timeout created a second `PolicyPackAssignment` (`AssignmentId = Guid.NewGuid()`, `assignmentRepository.CreateAsync`) for the same pack/version/scope because assign is `operator-documented-safe-retry` with no duplicate-assignment guard — effective governance could double-count the pack at the same scope tier — **hit 2026-09-05 (#833):** return existing non-archived assignment when pack/version/scope/pin/org-required/enabled match; regression in `PolicyPackAssignStageTests.AssignAsync_returns_existing_assignment_when_identical_pack_version_scope_retry`.
- [x] (invalid) `GovernanceStickinessController.RenewRiskException` / `RiskExceptionService.RenewAsync` — identical `ExpiresAtUtc`/`rationale` retry extends waiver expiry twice — **cheap-disproof 2026-09-05 (#833):** `SqlRiskExceptionRepository.RenewAsync` SETs `ExpiresAtUtc` (does not accumulate); identical retry is a no-op at persistence layer; duplicate `RiskExceptionRenewed` audit remains possible under `operator-documented-safe-retry` posture (#829 create sibling).
- [x] (invalid) `GovernanceController.RecordGovernanceMutationCorrection` / `GovernanceMutationCorrectionService.RecordAsync` — network retry allocates fresh `correctionId` and appends another audit row — **cheap-disproof 2026-09-05 (#833):** append-only correction log by design (`AUDIT_COVERAGE_MATRIX.md`); each correction is an immutable audit event, not a state mutation requiring `IdempotencyFilter` (#829 posture family).

2026-09-05 thorough hunt #833 (hit): proved policy-pack assign idempotent retry guard; cheap-disproved renew cumulative-expiry and mutation-correction duplicate-audit candidates.

- [x] (proven) `GovernanceStickinessController.ResolveFindingMergeConflict` / `GovernanceStickinessFacade.TryResolveFindingMergeConflictAsync` — route `findingId` differing only by casing from inspect canonical id resolved via case-insensitive snapshot lookup (#819) but audit `FindingMergeConflictResolved` JSON emitted keyboard route casing while disposition/waiver/mutation-correction paths persist canonical ids (#820/#824) — **hit 2026-09-05 (#832):** inspect canonical `FindingId` in audit payload after successful resolve; regression in `GovernanceStickinessFacadeScopeTests.TryResolveFindingMergeConflictAsync_logs_canonical_finding_id_when_route_differs_only_by_casing`.

2026-09-05 thorough hunt #832 (hit): proved merge-conflict resolve audit finding-id casing parity; three idempotency-posture retry candidates remain open.

- [x] (proven) `GovernanceStickinessController.RenewRiskException` / `RiskExceptionService.RenewAsync` — operator retry logs duplicate `RiskExceptionRenewed` audit without `IdempotencyFilter` (#570 revoke lifecycle parity lens; narrowed after #833 cheap-disproof of cumulative-expiry claim) — **hit 2026-09-05 (#834):** return existing active waiver without SQL renew or audit when `ExpiresAtUtc` and optional `rationale`/`evidenceRef` already match (policy-pack assign #833 parity); regression in `RenewAsync_skips_duplicate_audit_when_identical_operator_retry`.

2026-09-05 thorough hunt #834 (hit): proved renew idempotent retry guard for duplicate RiskExceptionRenewed audit; zone idempotency-posture retry candidates exhausted.

- [x] (proven) `PolicyPacksController.ArchiveAssignment` / `PolicyPackAssignStage.TryArchiveAssignmentAsync` — operator retry after successful archive returned HTTP 404 (`ResourceNotFound`) and skipped duplicate changelog because `ArchiveAsync` zero-row update mapped to failure (#833 assign retry parity) — **hit 2026-09-05 (#835):** return success when assignment row exists with `ArchivedUtc` set; regression in `TryArchiveAssignmentAsync_returns_true_when_assignment_already_archived`.
- [x] (proven) `GovernanceStickinessController.GetReviewsAwaitingAction` — conditional ETag omitted tenant/workspace/project fingerprint while sibling `GetDecisionsNeededSummary` and `PolicyPacksController.GetEffective` include scope — **hit 2026-09-05 (#835):** scope fingerprint in etag computation; regression in `GetReviewsAwaitingAction_returns_ok_when_scope_changes_despite_matching_empty_body_etag`.
- [x] (proven) `GovernanceController.GetDashboard` — conditional ETag fingerprint included query bounds only while `GovernanceDashboardService` scopes recent changes by workspace/project — **hit 2026-09-05 (#835):** include tenant/workspace/project in fingerprint; regression in `GetDashboard_returns_ok_when_workspace_changes_despite_matching_summary_etag`.
- [x] (proven) `GovernanceStickinessController.CreateRecurrenceSchedule` / `GovernanceStickinessFacade.CreateRecurrenceScheduleAsync` — operator retry allocates fresh `ScheduleId` and creates duplicate schedule rows + `ArchitectureReviewRecurrenceScheduleCreated` audit (`operator-documented-safe-retry`, no dedupe guard) — **hit 2026-09-05 (#836):** return existing schedule when `SourceRunId`, `CronExpression`, `IsEnabled`, and `Name` match; regression in `CreateRecurrenceScheduleAsync_returns_existing_schedule_when_identical_operator_retry`.
- [x] (proven) `TenantTrialController.ConvertTrialAsync` / `TenantTrialConversionStage.ConvertTrialAsync` — successful convert retry returns HTTP 409 because trial status is no longer `Active` (`operator-documented-safe-retry` posture) — **hit 2026-09-05 (#836):** return success without duplicate `MarkTrialConvertedAsync` or audit when already `Converted` with matching target tier; regressions in `ConvertTrialAsync_returns_no_content_when_already_converted_with_same_target_tier_retry` and `ConvertTrialAsync_skips_duplicate_audit_when_identical_operator_retry`.
- [x] (invalid) `TenantCustomerSuccessController.PostProductFeedbackAsync` — retry appends duplicate `ProductFeedback` rows (append-only telemetry lens; may be intentional) — **cheap-disproof 2026-09-05 (#836):** append-only product telemetry by design (mutation-correction #833 posture family); each submission is an immutable feedback event, not a state mutation requiring idempotent dedupe.

2026-09-05 thorough hunt #836 (hit): proved recurrence and trial-convert idempotent retry guards; cheap-disproved product-feedback duplicate-row candidate.

- [x] (proven) `GovernanceStickinessController.GetDecisionsNeededSummary` — conditional ETag fingerprint included `project` only while `GovernanceDigestDecisionNeededComposer.BuildSummaryAsync` scopes by tenant/workspace/project (#835 reviews-awaiting sibling) — **hit 2026-09-05 (#837):** include tenant/workspace in etag fingerprint; regression in `GetDecisionsNeededSummary_returns_ok_when_workspace_changes_despite_matching_empty_body_etag`.
- [x] (proven) `PolicyPacksController.DemoteCatalogEntry` / `PolicyPackWorkflowFacade.TryDemoteCatalogEntryAsync` / `DapperPolicyPackCatalogRepository.TryDemoteAsync` — operator retry after successful demote returned HTTP 404 and logged duplicate `PolicyPackCatalogDemoted` audit (#835 archive retry parity) — **hit 2026-09-05 (#837):** return success when catalog row already demoted; skip audit when entry was not promoted before demote; regression in `TryDemoteCatalogEntryAsync_skips_duplicate_audit_when_already_demoted_retry`.
- [x] (proven) `PolicyPacksController.Assign` / `PolicyPacksAppService.TryAssignAsync` — operator retry returns existing assignment (#833) but still logs duplicate `PolicyPackAssignmentCreated` audit (`operator-documented-safe-retry` posture) — **hit 2026-09-05 (#838):** skip audit when assignment id already existed in scope before assign; regression in `TryAssignAsync_skips_duplicate_audit_when_identical_operator_retry`.
- [x] (proven) `PolicyPacksController.ArchiveAssignment` / `PolicyPacksAppService.TryArchiveAssignmentAsync` — operator retry returns success (#835) but still logs duplicate `PolicyPackAssignmentArchived` audit — **hit 2026-09-05 (#838):** skip audit when assignment already archived before archive attempt; regression in `TryArchiveAssignmentAsync_skips_duplicate_audit_when_already_archived_retry`.
- [x] (proven) `PolicyPacksController.DeletePack` / `PolicyPacksAppService.TrySoftDeletePackAsync` — operator retry re-soft-deletes pack and logs duplicate `PolicyPackDeleted` audit — **hit 2026-09-05 (#838):** return success without update or audit when pack already deleted; regression in `TrySoftDeletePackAsync_skips_duplicate_audit_when_pack_already_deleted_retry`.
- [x] (proven) `TenantTrialController.LinkEntraAsync` / `TenantTrialIdentityHandoffStage.LinkEntraAsync` — operator retry with same `entraTenantId` logs duplicate `TenantEntraDirectoryBound` audit while SQL update is idempotent — **hit 2026-09-05 (#838):** skip directory-bound audit when tenant already bound to requested directory; regression in `LinkEntraAsync_skips_duplicate_directory_bound_audit_when_already_bound_retry`.

2026-09-05 thorough hunt #838 (hit): proved four idempotent-retry duplicate-audit gaps seeded in #837.

- [x] (proven) `PolicyPacksController.SetAssignmentEnabled` / `PolicyPackWorkflowFacade.TrySetAssignmentEnabledAsync` / `PolicyPackWorkspaceSelectionService.TrySetAssignmentEnabledAsync` — operator retry with the same `isEnabled` value returns HTTP 204 and logs duplicate `PolicyPackAssignmentEnabledChanged` audit (`operator-documented-safe-retry`; #838 assign/archive/delete audit-skip parity) — **hit 2026-09-05 (#839):** skip audit when assignment already at requested enabled state; regression in `TrySetAssignmentEnabledAsync_skips_duplicate_audit_when_value_unchanged_retry`.
- [x] (proven) `PolicyPacksController.SetAssignmentOrganizationRequired` / `PolicyPackWorkflowFacade.TrySetAssignmentOrganizationRequiredAsync` / `PolicyPackWorkspaceSelectionService.TrySetAssignmentOrganizationRequiredAsync` — identical `isOrganizationRequired` retry logs duplicate `PolicyPackAssignmentOrganizationRequiredChanged` audit while persistence is a no-op — **hit 2026-09-05 (#839):** skip audit when assignment already at requested organization-required state; regression in `TrySetAssignmentOrganizationRequiredAsync_skips_duplicate_audit_when_value_unchanged_retry`.
- [x] (proven) `PolicyPacksController.PromoteCatalogEntry` / `PolicyPackWorkflowFacade.TryPromoteCatalogEntryAsync` — operator retry for the same `sourcePolicyPackId` + version re-upserts via `UpsertPromotedFromSnapshotAsync` and logs duplicate `PolicyPackCatalogPromoted` audit (#837 demote skip-audit parity) — **hit 2026-09-05 (#839):** skip audit when promoted catalog row already exists for source pack and version; regression in `TryPromoteCatalogEntryAsync_skips_duplicate_audit_when_identical_promote_retry`.
- [x] (proven) `GovernanceStickinessController.UpdateRecurrenceSchedule` / `GovernanceStickinessFacade.UpdateRecurrenceScheduleAsync` — operator retry with empty PUT or unchanged `isEnabled`/`cronExpression`/`name` still calls `UpdateAsync` and logs duplicate `ArchitectureReviewRecurrenceScheduleUpdated` audit (#836 create dedupe parity) — **hit 2026-09-05 (#839):** return existing schedule without update or audit when request makes no effective changes; regressions in `UpdateRecurrenceScheduleAsync_preserves_next_run_when_request_has_no_schedule_changes` and `UpdateRecurrenceScheduleAsync_skips_duplicate_audit_when_request_has_no_changes_retry`.
- [x] (proven) `PolicyPacksController.Publish` / `PolicyPacksAppService.PublishVersionAsync` / `PolicyPackPublishStage.PublishVersionAsync` — operator retry with identical pack/version/contentJson re-upserts version, appends another `VersionPublished` change-log row, and logs duplicate `PolicyPackVersionPublished` audit (`UpsertPublishedVersionAsync` + unconditional `auditService.LogAsync` / `changeLogAppender.AppendAsync`) — **hit 2026-09-05 (#840):** skip audit, integration event, change log, pack update, and cache invalidation when version already published with identical content; regressions in `PublishVersionAsync_skips_duplicate_audit_when_identical_operator_retry` and `PublishVersion_skips_change_log_when_identical_operator_retry`.

2026-09-05 thorough hunt #840 (hit): proved publish idempotent-retry duplicate audit and change-log gap seeded in #839.

- [x] (proven) `TenantTrialController.LinkEntraAsync` / `TenantTrialIdentityHandoffStage.LinkEntraAsync` — operator retry with same `localEmail` + `entraOid` logs duplicate `TrialLocalIdentityLinkedToEntra` audit while `TryLinkLocalIdentityToEntraAsync` returns success without SQL update when OID already matches (#838 directory-bound skip-audit parity) — **hit 2026-09-05 (#841):** skip local-identity-linked audit when identity row already linked to requested OID; regression in `LinkEntraAsync_skips_duplicate_local_identity_linked_audit_when_already_linked_retry`.
- [x] (proven) `GovernanceEnvironmentCatalogController.Replace` / `IGovernanceEnvironmentCatalogService.ReplaceCatalogAsync` — operator retry with identical environments/transitions re-upserts catalog and logs duplicate `GovernanceEnvironmentCatalogReplaced` audit (`ReplaceCatalogAsync` + unconditional controller `auditService.LogAsync`) — **hit 2026-09-05 (#842):** skip audit when administrator-configured catalog content already matches normalized request; regression in `Replace_skips_duplicate_audit_when_identical_operator_retry`.
- [x] (proven) `TenantHomepageSettingsController.PutAsync` — operator retry with same `selectedRunId` re-upserts tenant setting and logs duplicate `TenantHomepageSettingsUpdated` audit (`SetSelectedRunIdAsync` + unconditional controller audit) — **hit 2026-09-05 (#842):** skip audit when featured sample already configured for requested run id (and skip clear audit when already unconfigured); regression in `PutAsync_skips_duplicate_audit_when_selected_run_id_unchanged_retry`.
- [x] (proven) `PolicyPacksController.DuplicatePack` / `PolicyPacksAppService.TryDuplicatePackAsync` — operator retry allocates fresh `PolicyPackId` and creates duplicate "(Copy)" pack rows + `PolicyPackDuplicated` audit (`operator-documented-safe-retry`, no dedupe guard) — **hit 2026-09-05 (#842):** return existing scope-visible copy with matching name, metadata, and content without create or audit; regression in `TryDuplicatePackAsync_returns_existing_copy_and_skips_duplicate_audit_on_identical_operator_retry`.

2026-09-05 thorough hunt #842 (hit): proved three idempotent-retry gaps seeded in #841 (environment catalog audit, homepage settings audit, duplicate-pack row creation).

- [x] (proven) `TenantExecDigestPreferencesController.PostExecDigestPreferences` — operator retry with identical emailEnabled/recipients/timezone/schedule re-upserts preferences and logs duplicate `ExecDigestPreferencesUpdated` audit (`operator-documented-safe-retry`, unconditional controller audit) — **hit 2026-09-05 (#843):** skip audit when configured preferences already match normalized request; regression in `PostExecDigestPreferences_skips_duplicate_audit_when_identical_operator_retry`.
- [x] (proven) `TenantSponsorDigestPreferencesController.PostSponsorDigestPreferences` — identical operator retry logs duplicate `SponsorDigestPreferencesUpdated` audit (#842 homepage/digest parity) — **hit 2026-09-05 (#843):** shared `DigestPreferencesIdempotentRetry.MatchesExisting` guard; regression in `PostSponsorDigestPreferences_skips_duplicate_audit_when_identical_operator_retry`.
- [x] (proven) `TenantCostSettingsController.PutAsync` — operator retry with identical rate/EA fields re-upserts settings and logs duplicate `TenantCostSettingsUpdated` audit (`UpsertAsync` + unconditional controller audit; #842 homepage parity) — **hit 2026-09-05 (#844):** skip audit when resolved EA multiplier and rate fields already match stored row; regression in `PutAsync_skips_duplicate_audit_when_identical_operator_retry`.
- [x] (proven) `PolicyPacksController.Create` / `PolicyPacksAppService.CreatePackAsync` — operator retry with same name/metadata/content allocates fresh `PolicyPackId` and logs duplicate `PolicyPackCreated` audit (`operator-documented-safe-retry`, #842 duplicate-pack parity) — **hit 2026-09-05 (#844):** return existing scope-visible pack with matching initial version content without create or audit; regression in `CreatePackAsync_returns_existing_pack_and_skips_duplicate_audit_on_identical_operator_retry`.
- [x] (invalid) `TenantWorkspacesController` project create (`ProjectCrud`) — operator retry may allocate duplicate project rows + audit — **cheap-disproof 2026-09-05 (#844):** zone has no project-create endpoint; `idempotency-posture` marks `RestoreProjectAsync` only; already-restored retry returns HTTP 404 via `NotFoundOrNotDeleted` before audit (no duplicate-audit path).

2026-09-05 thorough hunt #844 (hit): proved cost-settings and policy-pack create idempotent-retry gaps seeded in #843; cheap-disproved workspace project-create candidate (no create endpoint).

- [x] (proven) `CorePilotTeamChecklistController.PutAsync` — operator retry with identical `stepIndex`/`isCompleted` re-upserts checklist row and logs duplicate `CorePilotTeamChecklistUpdated` audit (`UpsertAsync` + unconditional controller audit; #844 cost-settings parity) — **hit 2026-09-05 (#845):** skip audit when listed step already matches requested completion state; regression in `PutAsync_skips_duplicate_audit_when_identical_operator_retry`.
- [x] (proven) `TenantBaselineController.PutAsync` — operator retry with unchanged manual-prep, review-cycle hours/source, or source-note-only updates logs duplicate `TrialBaselineManualPrepUpdated` / `TrialBaselineReviewCycleUpdated` audit (`UpdateBaselineAsync` / `PersistTrialSignupBaselineReviewCycleAsync` + unconditional audit) — **hit 2026-09-05 (#845):** skip audit when merged tenant baseline fields already match normalized request; regression in `PutAsync_skips_duplicate_audit_when_manual_prep_unchanged_retry`.
- [x] (proven) `TenantWorkspacesController.RestoreProjectAsync` — `operator-documented-safe-retry` retry after successful restore returns HTTP 404 (`NotFoundOrNotDeleted`) instead of idempotent HTTP 204 success (#844 restore audit path sibling) — **hit 2026-09-05 (#846):** `ArchitectureProjectRestoreResult.AlreadyActive` returns HTTP 204 without duplicate `ArchitectureProjectRestored` audit; regressions in `RestoreProjectAsync_returns_no_content_without_duplicate_audit_when_already_restored_retry` and `InMemoryArchitectureProjectRepositoryTests.Insert_list_soft_delete_restore_round_trip`.
- [x] (invalid) `GovernanceResolutionController.Resolve` — operator GET retries log duplicate `GovernanceResolutionExecuted` (and conflict) audit events on every identical resolution read — **cheap-disproof 2026-09-05 (#846):** controller remarks document intentional per-read audit for SIEM correlation; endpoint lacks `operator-documented-safe-retry` posture and is not a mutation retry gap.

2026-09-05 thorough hunt #846 (hit): proved restore idempotent-success gap seeded in #845; cheap-disproved governance-resolution read-audit candidate (intentional telemetry).

- [x] (proven) `TenantWorkspacesController.DeleteProjectAsync` — `operator-documented-safe-retry` sibling: already-soft-deleted retry returns HTTP 404 instead of idempotent HTTP 204 (`TrySoftDeleteAsync` false path; #846 restore parity) — **hit 2026-09-05 (#847):** `ArchitectureProjectSoftDeleteResult.AlreadyDeleted` returns HTTP 204 without duplicate `ArchitectureProjectSoftDeleted` audit; regression in `DeleteProjectAsync_returns_no_content_without_duplicate_audit_when_already_deleted_retry`.

2026-09-05 thorough hunt #847 (hit): proved soft-delete idempotent-success gap seeded in #846.

- [x] (proven) `TenantErasureLegalHoldController.ApproveErasureAsync` / `TenantErasureCommandService.TryApproveErasureAsync` — `operator-documented-safe-retry` retry after successful erasure approval returns HTTP 409 (`TenantErasureApprovedUtc` already set) instead of idempotent HTTP 204 (#836 trial-convert parity) — **hit 2026-09-05 (#848):** return success without duplicate `TenantErasureApproved` platform audit when already approved; regression in `TryApproveErasureAsync_returns_success_without_duplicate_audit_when_already_approved_retry`.
- [x] (proven) `TenantErasureLegalHoldController.SetLegalHoldAsync` / `TenantErasureCommandService.TrySetLegalHoldAsync` — identical `untilUtc`/`reason` operator retry re-upserts legal hold and logs duplicate `TenantErasureLegalHoldSet` platform audit (`TrySetTenantErasureLegalHoldAsync` + unconditional audit) — **hit 2026-09-05 (#848):** skip repository update and audit when tenant legal hold already matches normalized request; regression in `TrySetLegalHoldAsync_returns_success_without_duplicate_audit_when_identical_operator_retry`.

2026-09-05 seed hunt #848 (hit): reseeded post-#847 idempotent-retry exhaustion; proved erasure approve idempotent-success and legal-hold duplicate-audit gaps.

- [x] (proven) `GovernanceController.Reject` / `GovernanceWorkflowReviewStage.RejectAsync` — `operator-documented-safe-retry` retry after successful reject returns HTTP 409 (`GovernanceApprovalReviewConflictException`) instead of idempotent HTTP 200 (`#836` trial-convert parity) — **hit 2026-09-05 (#849):** return existing approval without transition, audit, baseline mutation, or integration event when status, `ReviewedByActorKey`, and `ReviewComment` already match; regression in `Reject_returns_existing_approval_without_duplicate_audit_when_identical_operator_retry`.
- [x] (proven) `GovernanceStickinessController.ResolveFindingMergeConflict` / `FindingMergeConflictResolutionService.TryResolveAsync` — `operator-documented-safe-retry` sibling: already-resolved retry returns HTTP 404 because conflict finding row was removed from snapshot on first success (#847 delete/restore parity) — **hit 2026-09-05 (#850):** retain resolved conflict tombstone (`FindingMergeConflictResolved`) and return `AlreadyResolved` without duplicate `FindingMergeConflictResolved` audit; regressions in `TryResolveAsync_returns_already_resolved_without_mutating_snapshot_on_operator_retry` and `TryResolveFindingMergeConflictAsync_returns_true_without_duplicate_audit_when_already_resolved_retry`.

2026-09-05 thorough hunt #850 (hit): proved merge-conflict resolve idempotent-success gap seeded in #849.

- [x] (proven) `GovernanceStickinessController.RevokeRiskException` / `RiskExceptionService.RevokeAsync` — `operator-documented-safe-retry` retry on already-revoked waiver returned HTTP 409 (`ConflictException` from #570 lifecycle guard) instead of idempotent HTTP 204 without duplicate `RiskExceptionRevoked` audit (#847 delete/restore parity) — **hit 2026-09-05 (#851):** return early when status is `Revoked`; regressions in `RevokeAsync_completes_without_duplicate_audit_when_already_revoked_retry` and `RevokeRiskException_returns_no_content_without_duplicate_audit_when_already_revoked_retry`.

- [x] (invalid) `GovernanceController.Approve` / `GovernanceWorkflowReviewStage.ApproveAsync` — `operator-documented-safe-retry` sibling shares `ReviewAsync` idempotent retry path fixed in #849 for reject but lacks dedicated approve regression coverage — **cheap-disproof 2026-09-05 (#852):** `Approve_returns_existing_approval_without_duplicate_audit_when_identical_operator_retry` confirms shared `ReviewAsync` idempotent path already covers approve.
- [x] (proven) `GovernanceController.BatchReviewApprovalRequests` / `GovernanceApprovalRequestsFacade.BatchReviewAsync` / `GovernanceWorkflowReviewStage.ReviewCommentsMatch` — per-item retry on already-finalized approval surfaced `Conflict` instead of idempotent success when `ReviewComment` differed only by casing (`Ordinal` match after trim; whitespace already trimmed) — **hit 2026-09-05 (#852):** case-insensitive comment comparison in `ReviewCommentsMatch` (approve/reject/batch share path); regressions in `Reject_returns_existing_approval_without_duplicate_audit_when_review_comment_differs_only_by_casing` and `Reject_returns_existing_approval_without_duplicate_audit_when_review_comment_differs_only_by_outer_whitespace`.
- [x] (proven) `GovernanceStickinessController.RenewRiskException` / `RiskExceptionService.RenewAsync` / `IsIdenticalRenewal` — operator retry on already-renewed waiver with `rationale` or `evidenceRef` differing only by casing re-ran `RenewAsync` and logged duplicate `RiskExceptionRenewed` audit (`Ordinal` match after trim; #852 review-comment parity) — **hit 2026-09-05 (#853):** case-insensitive optional text comparison in `IsIdenticalRenewal`; regressions in `RenewAsync_skips_duplicate_audit_when_rationale_differs_only_by_casing` and `RenewAsync_skips_duplicate_audit_when_evidence_ref_differs_only_by_casing`.

2026-09-05 thorough hunt #852 (hit): cheap-disproved approve regression-only candidate; proved governance review comment case-insensitive idempotent retry gap.

- [ ] (candidate) `TenantErasureLegalHoldController.SetLegalHoldAsync` / `TenantErasureCommandService.IsIdenticalLegalHoldRetry` — operator retry with `reason` differing only by casing may re-upsert legal hold and log duplicate `TenantErasureLegalHoldSet` audit (`StringComparison.Ordinal` on reason; #852 review-comment / #853 renew rationale parity).

2026-09-05 seed hunt #853 (hit): reseeded post-#852 idempotent-retry exhaustion; proved waiver renew rationale/evidenceRef case-insensitive idempotent retry gap; seeded legal-hold reason casing candidate.

2026-09-05 seed hunt #845 (hit): reseeded post-#844 idempotent-retry exhaustion; proved core-pilot checklist and tenant baseline duplicate-audit gaps; seeded restore idempotent-success and governance-resolution read-audit retry candidates.

2026-09-05 seed hunt #843 (hit): reseeded post-#842 idempotent-retry exhaustion; proved exec/sponsor digest preferences duplicate-audit gaps; seeded cost-settings, policy-pack create, and workspace project-create retry candidates.

2026-09-05 seed hunt #839 (hit): reseeded post-#838 idempotent-retry audit exhaustion; proved assignment toggle, catalog promote, and recurrence-update duplicate-audit gaps; seeded publish retry candidate.

2026-09-05 seed hunt #837 (hit): reseeded post-#836 idempotency exhaustion; proved decisions-needed etag scope gap and catalog demote idempotent retry; seeded assign/archive/delete/link-entra audit retry candidates.

2026-09-05 seed hunt #835 (hit): reseeded post-#834 exhaustion; proved archive idempotent retry and two conditional-GET scope etag gaps; seeded recurrence/trial/feedback retry candidates.

2026-09-05 seed hunt #830 (seed-only): reseeded post-#829 idempotency and canonicalization gaps; four new candidates on renew retry, mutation-correction duplicate audit, policy-pack assign retry, and merge-conflict audit finding-id casing.

2026-09-05 seed hunt #825 (hit): reseeded waiver renew/create parity; proved renew padded optional-text persistence gap; seeded legacy finding-id casing sibling/guard candidates.

2026-09-05 seed hunt #822 (hit): proved RecordDisposition route/body case-only mismatch; seeded merge-conflict member id casing candidate.

2026-09-05 seed hunt #820 (hit): proved CreateRiskException finding-id case canonicalization gap; seeded product-feedback findingRef casing candidate.

2026-09-04 seed hunt #787 (hit): proved disposition inapplicable optional string silent drop beyond whitespace-only cases.

2026-09-04 seed hunt #786 (hit): proved disposition optional revisitDueUtc silent drop on non-Deferred paths.

2026-09-04 seed hunt #785 (hit): proved diagram v2 whitespace query silent default on layout, relationshipLabels, and groupBy.

2026-09-04 seed hunt #784 (hit): proved governance optional comment whitespace silent no-op on approve/reject/batch/submit/promote paths.

2026-09-04 seed hunt #783 (hit): proved create recurrence whitespace silent default on name and cronExpression.

2026-09-04 seed hunt #782 (hit): proved bulk disposition optional trade-off whitespace no-op on non-`Accepted` path.

2026-09-04 thorough hunt #778: proved digest disable-only recipient wipe; cheap-disproved promotion/activation environment omission candidates.

2026-09-04 seed hunt #773: reseeded cost-settings rate-field omission and baseline whitespace source-note candidates; proved homepage `selectedRunId` omission clearing featured sample promoted from seed read.

2026-09-04 seed hunt #759 (hit): proved policy-pack create `initialContentJson`, assign `isPinned`, checklist `stepIndex` omission, and cost-settings EA discount wipe on partial PUT; seeded digest timezone omission candidate.

2026-09-04 seed hunt #757 (hit): proved policy pack assignment `isEnabled` omission and publish `contentJson` omission; seeded digest `emailEnabled` omission and silent schedule-default candidates.

2026-09-04 seed hunt #755 (hit): proved disposition `RecordDisposition` / `RecordBulkDisposition` idempotency-key validation ordering before body/route/disposition HTTP mapper guards; seeded diagram v2 silent query defaults and dry-run paging clamp candidates.

2026-09-04 thorough hunt #723 (hit): proved SubmitApprovalRequest same-environment validation ordering before tenant preflight.

2026-09-04 seed hunt #722 (hit): proved Promote same-environment validation ordering before tenant preflight; seeded SubmitApprovalRequest same-environment ordering candidate.

2026-09-04 thorough hunt #719 (dry): cheap-disproved three #718 validation-ordering siblings; no new hunt-ready repro.

2026-09-04 seed hunt #718 (hit): proved link-entra localEmail max-length validation ordering before tenant lookup; seeded checklist stepIndex, cost-settings EA discount, and baseline PUT ordering candidates.

2026-09-04 seed hunt #695: promoted and proved attestation upsert HTTP mapper and product-feedback validation ordering.

2026-09-04 seed hunt #694: promoted and proved update-recurrence HTTP mapper, deferred revisit-due HTTP guards, and merge-conflict run-id fail-fast ordering.

2026-09-04 seed hunt #693: promoted and proved disposition/recurrence HTTP mappers, waiver mutation validation ordering, and homepage empty-run ordering.

2026-09-04 seed hunt #692: promoted and proved PolicyPacks simulate and simulate-bulk run-id HTTP validation parity.

2026-09-04 seed hunt #685: promoted and proved recurrence preview cron max-length parity and single approve/reject review-comment cap parity with batch review.

2026-09-04 seed hunt #684: promoted and proved application-layer finding-id max-length parity and decision-register category filter max-length validation.

2026-09-04 thorough hunt #679: cheap-disproved manifest summary services/datastores cap candidate; proved product-feedback findingRef inspect max-length and mutation-correction rationale max-length parity.

2026-09-04 seed hunt #678: promoted and proved CreateRiskException body findingId max-length, mutation correction subjectId max-length, and correction rationale min-length parity.

2026-09-04 seed hunt #675: promoted and proved manifest compare max-length validation, batch review comment cap, and approve/reject/promote actor-field validator parity.

2026-09-04 seed hunt #674: proved compliance drift scoped SQL query and mutation correction run-id binding; cheap-disproved resolution audit-on-read.

2026-09-04 thorough hunt #672: proved pilot-value default window + keyset page cap; re-closed duplicate merge-conflict inspect-scope candidate.

2026-09-04 thorough hunt #658: proved waiver create rationale min-length parity; cheap-disproved merge-conflict inspect-scope gap; pilot-value paging cap seeded for #672.

- [x] (proven) `GovernanceStickinessController.CreateRecurrenceSchedule` / `GovernanceStickinessFacade.CreateRecurrenceScheduleAsync` — `ReadyForCommit` in-scope `sourceRunId` with manifest persisted recurring schedule — **hit 2026-09-03 (#657):** contract requires committed source run; create path only checked scope + existence; `RecurrenceScheduleValidation.ValidateCommittedSourceRunOrThrow` enforces `LegacyRunStatus = Committed` (featured-sample / stickiness funnel parity); regression in `CreateRecurrenceScheduleAsync_throws_when_source_run_is_not_committed` and controller/validation tests.

2026-09-03 seed hunt #657: promoted three candidates; proved recurrence committed-source-run guard.

2026-09-03 thorough hunt #656: cheap-disproved OpenAPI 404 swagger drift candidate; proved revoke MarkExpired sweep parity gap.

---

2026-09-01 thorough hunt #413 (dry): twelve stale hunt-ready rows closed as valid-no-repro on master after combined PR #1046 (`TenantWorkspaceScopePreflight`, catalog tenant preflight, empty `projectId` validation, checklist `isCompleted` guard, `required short Score` JSON rejection); eight regression tests passed; cheap-disproved workspace list and resolution optional-projectId candidates.

2026-09-01 thorough hunt #414 (dry): twelve stale hunt-ready rows closed as valid-no-repro on master after combined PR #1046 (`TenantWorkspaceScopePreflight`, catalog tenant preflight, empty `projectId` validation, checklist `isCompleted` guard, `required short Score` JSON rejection); eight regression tests passed; cheap-disproved workspace list and resolution optional-projectId candidates.

2026-09-01 thorough hunt #415 (dry): twelve stale hunt-ready rows closed as valid-no-repro on master after combined PR #1046; eight regression tests passed; cheap-disproved workspace list and resolution optional-projectId candidates.

2026-09-01 thorough hunt #416 (dry): twelve stale hunt-ready rows closed as valid-no-repro on master after combined PR #1046; eight regression tests passed; cheap-disproved workspace list and resolution optional-projectId candidates; ledger pushed to master to clear picker backlog.
## Zone: application-agents

- **id:** application-agents
- **status:** open
- **impact:** medium
- **aliases:** application agents; agent handlers wiring
- **paths:** ArchLucid.Application/Agents/
- **test-filter:** FullyQualifiedName~Application.Agents
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 12

### Hypotheses

- [x] (invalid) Agent invocation uses a default tenant when scope is missing — retired: `ExternalSubprocessorEngineAcknowledgmentService`, `EvidenceProposalPromoter`, and `AgentToolInvocationRecordWriter` throw when `TenantId` is empty
- [x] (invalid) Handler result is cached across tenants with the same run id — retired: no cross-run result cache in `ArchLucid.Application/Agents/` (only catalog cache invalidation)
- [x] (invalid) Agent registry resolves a handler without checking feature flags per tenant — retired: `RegisteredAgentHandlersInspector` lists DI handlers; execution routing lives outside this folder
- [x] (proven) Reasoning-only LLM cost slices report Unavailable basis when estimator returns null — `AgentExecutionTraceRunLlmCostAggregator.ComputeCore` early-return ignored reasoning token counts (fixed 2026-08-20)
- [x] (proven) Trace-derived tool forensics emit enum agent-type labels that disagree with structured ledger rows — `RunToolInvocationForensicsBuilder.BuildFromTraces` used `AgentType.ToString()` instead of `InferAgentTypeLabel(FormatToolName(...))`; regression in `Build_trace_derived_rows_use_tool_slug_agent_type_labels`
- [x] (proven) Engine provenance omits reasoning-only token totals — **hit 2026-08-23:** `ReviewRunEngineProvenanceAggregator.Aggregate` mapped only prompt/completion sums from the cost aggregator; o-series reasoning-only traces showed `EstimatedCostUsd` with null `TotalOutputTokens`; regression in `Aggregate_reasoning_only_traces_include_reasoning_tokens_in_output_total`

---

## Zone: application-governance-policy

- **id:** application-governance-policy
- **status:** open
- **impact:** medium
- **aliases:** policy packs; governance coverage; before-after diff
- **paths:** ArchLucid.Application/Governance/
- **test-filter:** FullyQualifiedName~PolicyPack|FullyQualifiedName~Governance
- **hunts:** 11
- **bugs-found:** 12
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — policy-pack governance dry-run skipped sealed manifest hash verification
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (invalid) Policy pack diff includes rules from a seeded pack in another tenant — retired: `PolicyPackBeforeAfterDiffComposer` and `PolicyPackBeforeAfterConfigurationSnapshotBuilder` operate on in-memory pack content and findings passed in; `DefaultPolicyPackSeeder` uses tenant-scoped repositories
- [x] (invalid) Coverage calculator counts a waived finding as still open — retired: no coverage calculator in `Governance/`; waiver expiry uses `GovernanceWaiverExpiryWindow` / `GovernanceDecisionsNeededSummaryCalculator` distinct-finding union, not open-finding counts
- [x] (invalid) Default policy pack activation skips required approval metadata — retired: `DefaultPolicyPackSeeder` platform bootstrap calls `CreatePackAsync` / `PublishVersionAsync` / `AssignAsync` by design for bundled defaults, not operator approval flow
- [x] (proven) Policy-pack before/after snapshot marks advisory findings as blocking commit — `PolicyPackBeforeAfterConfigurationSnapshotBuilder` used severity-only check instead of `PreCommitGateResult.BlockingFindingIds` (fixed 2026-08-20)
- [x] (proven) Governance dry-run skips pre-commit enforcement for PascalCase metadata keys — **hit 2026-08-21:** `PolicyPackGovernanceDryRunService` read `blockCommitOnCritical` / `blockCommitMinimumSeverity` via case-sensitive `metadata.TryGetValue`, so JSON-deserialized metadata with `BlockCommitOnCritical` never activated the gate
- [x] (proven) Focused pilot execute-time snapshot excludes pinned organization packs that preview and commit capture include — **hit 2026-08-23:** `EffectiveGovernanceSnapshotBuilder` used `IsAllowedPackDisplayName` instead of `IsPackAllowedInFocusedReview`, dropping pinned org and platform-overlay packs from execute-time `PackAssignments`
- [x] (proven) Waiver expiry reminder swallows provider send failures and counts the reminder as sent — **hit 2026-08-24:** `WaiverExpiryNotificationService.TrySendReminderAsync` reserved the ledger then caught `SendAsync` exceptions without rethrowing, so `RunTenantPassAsync` returned success while recipients received no mail and idempotency blocked resend; fixed by rethrowing after log (ExecDigest pattern)
- [x] (proven) Synthetic pre-commit simulation reports a missing or foreign scoped run as allowed — **hit 2026-08-24:** `PreCommitGovernanceGate.SimulateSyntheticFindingsInternalAsync` returned `Allowed()` when scoped `GetByIdAsync(runId)` returned null, so the CI simulation endpoint could report a pass without evaluating the requested synthetic Critical finding; simulation now throws `RunNotFoundException` while live evaluation semantics remain unchanged
- [x] (proven) Curated rule metadata key lookup is case-sensitive after JSON deserialization — **hit 2026-08-25:** `PolicyPackCuratedRuleKeyReader` used `metadata.TryGetValue` for `pack.curatedRules.v1`, so PascalCase `Pack.CuratedRules.V1` from deserialized pack content was ignored and authoring validation warned on tenant-authored rule keys; fixed via `PolicyPackContentMetadataReader`; regression in `ValidateAsync_when_curated_metadata_key_uses_PascalCase_accepts_matching_rule`
- [x] (proven) `PolicyPackAssignmentOutcomeRecorder` marked assignments `evaluated` when `findingsSnapshot` was null — **hit 2026-08-26:** pre-finalize coverage refresh with no snapshot row fell through to `Evaluated` even with zero matching findings, overstating pack evaluation proof; fixed by returning `Skipped` when snapshot is absent (`PolicyPackAssignmentOutcomeRecorderTests.ApplyOutcomes_marks_skipped_when_findings_snapshot_is_missing`)
- [x] (proven) `PolicyPackCoverageProofEvaluator` deserialized execute-time governance scope with default `JsonSerializer` options — **hit 2026-09-02:** camelCase `GovernanceScopeJson` from `ExecutedEffectiveGovernanceSnapshotJson` never bound `packAssignments`, so pre-finalize coverage proof always reported zero assignments and skipped advisories; fixed by using `TryDeserialize` and honoring recorded `EvaluationOutcome` values (`PolicyPackCoverageProofEvaluatorTests`)
- [x] (proven) `PreCommitGateEvaluator` counted muted findings toward severity thresholds while `PreFinalizeChecklistService.CountActiveFindings` excluded `IsMuted` — **hit 2026-09-03:** operators could mute a critical finding and see checklist "Critical findings resolved" clear while pre-commit gate still blocked finalize; fixed by filtering `IsMuted` in shared gate evaluator (`PreCommitGateEvaluatorTests.Evaluate_ignores_muted_findings_when_blocking_on_critical`, `PreCommitGovernanceGateTests.EvaluateAsync_allows_when_only_blocking_findings_are_muted`)
- [x] (invalid) Policy pack coverage proof ignores muted findings in outcome recorder mismatch — `PolicyPackCoverageProofEvaluator` and `PolicyPackAssignmentOutcomeRecorder` both filter `IsMuted` before matching; `PartiallyComplete` snapshots use the same incomplete branch as `Generating` (muted-only signals → `Skipped`, active signals → `Evaluated`; coverage proof agrees)
- [x] (invalid) Governance dry-run returns null for invalid run id format — `PolicyPackGovernanceDryRunService.EvaluateAsync` intentionally returns null for non-GUID `targetRunId` so the API surfaces the same 404 as an out-of-scope run (no id-format oracle)
- [x] (proven) `PolicyPackGovernanceDryRunService.EvaluateAsync` omits technology-consistency and evidence-linkage supplemental findings that `PreCommitGovernanceGate` appends on live evaluation — **hit 2026-09-04:** dry-run reported allowed on empty snapshot while enforcing technology-consistency would block; fixed via shared `PreCommitSupplementalFindingsAppender` (`PolicyPackGovernanceDryRunServiceTests.EvaluateAsync_blocks_when_technology_consistency_supplemental_findings_would_block_live_gate`)
- [x] (proven) `PolicyPackFindingMatcher.MatchesAssignment` returns false on rule-key miss without pack-token/`EngineType` fallback when `ComplianceRuleKeys` is populated — **hit 2026-09-04:** coverage proof marked pack-attributed findings unproven when `PolicyRuleId` did not match listed keys; fixed by falling through to pack-token/`EngineType` checks (`PolicyPackFindingMatcherTests`, `PolicyPackCoverageProofEvaluatorTests.Evaluate_treats_pack_engine_type_as_proven_when_compliance_rule_keys_miss`)
- [x] (proven) `PolicyPackGovernanceDryRunService.EvaluateAsync` proceeds without sealed manifest hash verification — **hit 2026-09-05:** Wave-23 suggestion 223 guard existed but was not wired; dry-run evaluated policy packs against runs with missing or tampered `ManifestHash`; fixed via `PolicyPackSimulateSealedManifestGuard` (`PolicyPackGovernanceDryRunServiceTests.EvaluateAsync_throws_when_run_golden_manifest_is_unsealed`)

2026-09-05 seed hunt #806 (hit): proved policy-pack dry-run sealed-manifest guard gap.

2026-09-04 thorough hunt #715 (hit): proved governance dry-run supplemental-finding parity gap and pack finding matcher fallback gap.

2026-09-02 seed hunt #8: reseeded pre-finalize coverage proof path; proved governance-scope JSON deserialization gap.

2026-08-26 thorough hunt #7: proved missing-snapshot pack outcome; retired muted-finding divergence and dry-run null-shape candidates.

---

## Zone: application-tenancy-lifecycle

- **id:** application-tenancy-lifecycle
- **status:** open
- **impact:** high
- **aliases:** tenant suspend; tenant migration; trial bootstrap
- **paths:** ArchLucid.Application/Tenancy/
- **test-filter:** FullyQualifiedName~Tenancy|FullyQualifiedName~TenantSuspend|FullyQualifiedName~TenantMigration
- **hunts:** 6
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — trial lifecycle scheduler ignored non-canonical TrialStatus casing
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Suspend leaves mutating API paths active for the tenant — retired: `TenantSuspendCommandService` persists suspend state; mutating-path enforcement lives in API middleware/filters outside this folder
- [x] (invalid) Migration copies rows without rewriting tenant id on child tables — retired: `TenantCatalogMigrationOrchestrator` coordinates suspend/projection refresh/verification; no catalog row-copy logic in `ArchLucid.Application/Tenancy/`
- [x] (invalid) Trial bootstrap creates resources under a host catalog tenant id — retired: `TrialTenantBootstrapService` scopes `AmbientScopeContext` to `result.TenantId` and uses `ContosoRetailDemoIds.ForTenant(result.TenantId)`
- [x] (proven) Migration verification passes without workspace/project scope on committed run candidate — `TenantMigrationVerificationProbe.RunAsync` omitted scope-id validation before scoped read probe (fixed 2026-08-20)
- [x] (proven) Projection refresh stage advances before `RefreshAsync` completes — `TenantCatalogMigrationOrchestrator.RunProjectionRefreshAsync` updated stage to `ProjectionRefresh` before calling refresh; failed refresh blocked retry and allowed `RunVerificationAsync` to skip incomplete refresh (fixed 2026-08-23)
- [x] (proven) Catalog migration starts for erasure-quarantined tenant without scope freeze — `StartAsync` inserted migration record before suspend and ignored `TrySuspendAsync` `InErasureQuarantine`; migration returned `Applied` while writes stayed unfrozen (fixed 2026-09-02)
- [x] (invalid) `TenantErasureCommandService.TryRestoreQuarantineAsync` leaves tenant suspended after offboard suspend — cheap-disproof 2026-09-03: `DapperTenantRepository.TryRestoreTenantErasureQuarantineAsync` and `InMemoryTenantRepository` `CopyTenant(clearErasureQuarantine: true)` clear `SuspendedUtc` on restore; application service delegates to repository
- [x] (proven) `TenantCatalogMigrationOrchestrator.CompleteAsync` unsuspends admin-pre-suspended tenant — **hit 2026-09-03 (#576):** `StartAsync` treated `AlreadyInDesiredState` as success and `CompleteAsync` always called `TryUnsuspendAsync`; fixed by capturing `StartedUtc` before scope-freeze suspend and only unsuspending when `SuspendedUtc >= StartedUtc`; regression in `TenantCatalogMigrationOrchestratorTests`
- [x] (invalid) `TenantTrialIdentityHandoffStage.LinkEntraAsync` binds Entra directory before local identity link without rollback when `TryLinkLocalIdentityToEntraAsync` fails — **cheap-disproof 2026-09-04 (#709):** documented idempotent retry in `docs/runbooks/TRIAL_TO_PAID_IDENTITY_MIGRATION.md` §Security; regression in `TenantTrialIdentityHandoffStageTests.LinkEntraAsync_when_local_identity_link_fails_leaves_entra_bound_for_idempotent_retry`.
- [x] (proven) `TrialLifecycleTransitionEngine.TryAdvanceTenantAsync` hard-purged offboarded trial tenants on `Deleted` transition without honoring erasure quarantine — **hit 2026-09-04 (#709):** scheduler advanced `ExportOnly` tenants with `OffboardedUtc` set to `Deleted` and called `ITenantHardPurgeService` despite active legal hold; fixed by skipping automation when `OffboardedUtc` is set (`TryAdvanceTenantAsync_when_tenant_is_offboarded_does_not_advance_or_purge`, `IsTrialLifecycleAutomationCandidate_excludes_offboarded_tenants`).
- [x] (proven) `TrialLifecyclePolicy.TryGetNextAdvancement` used Ordinal `TrialStatus` compares so lowercase or padded lifecycle labels never advanced — **hit 2026-09-05 (#808):** tenants with `active` trial status stalled past expiry while email and packaging layers already used `TrialLifecycleStatus.EqualsStatus`; fixed in policy and `ComputeDaysRemainingForStatusDisplay` (`TrialLifecyclePolicyTests`, `TrialLifecycleTransitionEngineTests`).

2026-09-05 seed hunt #808 (hit): proved non-canonical trial status casing blocked lifecycle advancement.

2026-09-04 thorough hunt #709: proved offboarded-trial purge bypass; cheap-disproved link-entra partial-bind rollback as documented idempotent retry.

---

## Zone: host-core-coordination

- **id:** host-core-coordination
- **status:** open
- **impact:** medium
- **aliases:** host coordination; export outbox; backfill
- **paths:** ArchLucid.Host.Core/Coordination/
- **test-filter:** FullyQualifiedName~Coordination|FullyQualifiedName~OutboxProcessor
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-04
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) `CosmosGraphSnapshotOutboxProcessor.ProcessEntryAsync` loads SQL with outbox `ScopeContext` but `CosmosGraphSnapshotRepository.SaveAsync` reads `IScopeContextProvider.GetCurrentScope()`; without `AmbientScopeContext.Push`, worker background drain tags Cosmos documents with dev-default tenant triple instead of the outbox entry scope — fixed 2026-08-20 (`CosmosGraphSnapshotOutboxProcessorTests.ProcessPendingBatchAsync_pushes_ambient_scope_before_cosmos_save`)
- [x] (invalid) Outbox processor pushes export blobs to a destination for the wrong tenant — `RunExportBlobPushOutboxProcessor` passes explicit `ScopeContext` into `IRunExportPackageBuilder.BuildAsync`; export path does not read ambient scope
- [x] (invalid) Backfill job replays events without idempotency keys — backfill lives under `ArchLucid.Persistence/Coordination/Backfill`, not this zone
- [x] (invalid) Coordination lease is not released and blocks all replicas — lease acquire/release is in SQL `DequeuePendingAsync`, not in `RecoverableOutboxProcessorBase` shell
- [x] (proven) `CosmosGraphSnapshotOutboxProcessor.VerifyOptions` mutates the bound `IOptions` instance (`configured.LeaseDurationSeconds = 60`) instead of returning a normalized copy like sibling processors; first drain permanently changes the DI-bound lease for later readers — fixed 2026-08-23 (`CosmosGraphSnapshotOutboxProcessorTests.ProcessPendingBatchAsync_clamps_short_lease_without_mutating_bound_options`)
- [x] (valid-no-repro) `PostCommitProjectionOutboxProcessor` dispatches `IacStubGeneration` without ambient scope so `FindingIacStubGenerator` reads dev-default tenant — ambient is pushed in `ProcessEntryAsync` before `DispatchWorkTypeAsync`; no repro on current code
- [ ] (candidate) `RetrievalIndexingOutboxProcessor` marks outbox processed when `GetRunDetailForRetrievalIndexingAsync` returns null or incomplete snapshots — permanent skip if worker drains before commit visibility on in-memory UoW (`AuthorityCommittedPipelineFinalizer` enqueues before `CommitAsync` when `SupportsExternalTransaction` is false); SQL transactional enqueue path likely safe; needs repro distinguishing race vs deleted run
- [ ] (candidate) `PostCommitProjectionOutboxProcessor` marks processed when `ProvenanceSnapshotMaterialization` detail exists but `TryMaterializeSnapshotAsync` no-ops on incomplete manifest/graph/trace — silent skip without warning log (retrieval logs skip); needs repro on committed run missing provenance snapshot after drain
- [x] (invalid) `RecoverableOutboxProcessorBase` parallel batch leaks `AmbientScopeContext` across entries — `BoundedBatchParallelism.ForEachAsync` isolates `AsyncLocal` per task; each `ProcessEntryAsync` pushes and disposes its own ambient scope (`RetrievalIndexingOutboxProcessorCorrelationTests.ProcessPendingBatchAsync_pushes_ambient_scope_before_indexing`)
- [x] (valid-no-repro) `CosmosGraphSnapshotOutboxProcessor.VerifyOptions` omits `OutboxProcessorOptionsVerifier` upper lease clamp — `DapperCosmosGraphSnapshotOutboxRepository.DequeuePendingAsync` clamps lease to 60–7200 seconds regardless of processor-passed value

---

## Zone: ui-operator-routes

- **id:** ui-operator-routes
- **status:** open
- **impact:** medium
- **aliases:** operator shell routes; operator pages
- **paths:** archlucid-ui/src/app/(operator)/
- **test-filter:** operator
- **hunts:** 11
- **bugs-found:** 12
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — compare deep-link auto-compare skipped when client-navigating to a new URL run pair; admin tenants shut-off confirm cleared before `router.replace` completed
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Architecture scorecard `usePilotScorecardPage.onSaveBaselines` PUT `/api/proxy/v1/pilots/scorecard/baselines` omitted `mergeRegistrationScopeForProxy` while reads use scoped `getPilotScorecard` — save lands on proxy dev-default tenant, refetch reads operator-selected tenant (save appears to no-op) — fixed 2026-08-20 (`use-pilot-scorecard-page.test.tsx`)
- [x] (proven) Baseline settings GET/PUT `/api/proxy/v1/tenant/baseline` omitted `mergeRegistrationScopeForProxy` — load/save hit proxy dev-default tenant instead of operator-selected scope (baseline appears not to stick after save) — fixed 2026-08-21 (`page.test.tsx` forwards operator scope headers when loading and saving tenant baseline)
- [x] (valid-no-repro) Stale react-query cache shows the previous tenant after scope switch — `usePilotScorecardQuery` scope-less key is a real gap on `/insights/architecture-scorecard`, but not reproved this hunt; sponsor/scorecard cache invalidation remains open if scope-switch stale data is reported
- [x] (invalid) Error boundary hides a 403 and renders an empty success state — no operator-route locus where a 403 is caught and replaced with empty success; compare/governance surfaces surface load failures explicitly
- [x] (proven) Billing wallet GET/PUT `/api/proxy/v1/billing/wallet` omitted `mergeRegistrationScopeForProxy` — load/save hit proxy dev-default tenant instead of operator-selected scope (wallet settings appear not to stick after save) — fixed 2026-08-22 (`OperatorBillingWalletPanel.test.tsx`)
- [x] (proven) Architecture intelligence `getJson`/`postJson` in `architecture-intelligence-client-api.ts` omitted `mergeRegistrationScopeForProxy` — product-run source-context load and reasoning POSTs hit proxy dev-default tenant instead of operator-selected scope (hydrated review context wrong or missing after scope switch) — fixed 2026-08-23 (`architecture-intelligence-client-api.test.tsx`)
- [x] (proven) `AdminEvidenceProposalsPageClient` GET `/api/proxy/v1/admin/evidence/proposals` and POST promote omitted `mergeRegistrationScopeForProxy` — list/promote hit proxy dev-default tenant instead of operator-selected scope (wrong tenant proposals shown or promote lands on wrong catalog) — fixed 2026-08-23 (`AdminEvidenceProposalsPageClient.test.tsx`)
- [x] (proven) `PlanningBridgePanel` POST `/api/proxy/v1/learning/planning/materialize` omitted `mergeRegistrationScopeForProxy` — draft plan materialization hit proxy dev-default tenant instead of operator-selected scope — **hit 2026-08-25:** fixed with scoped fetch init; regression in `PlanningBridgePanel.test.tsx`.
- [x] (proven) `ScimProvisioningSettingsPageClient.verifyConnection` GET `/api/proxy/scim/v2/ServiceProviderConfig` omitted `mergeRegistrationScopeForProxy` — **hit 2026-08-26:** token list/create/revoke were scoped but connectivity verification hit proxy dev-default tenant, so verify could fail or validate the wrong tenant SCIM endpoint after scope switch; fixed by wrapping verify fetch with `mergeRegistrationScopeForProxy` (`ScimProvisioningSettingsPageClient.test.tsx`).
- [x] (proven) `architecture-intelligence-api.ts` `getJson`/`postJson` omitted `mergeRegistrationScopeForProxy` while `architecture-intelligence-client-api.ts` was scoped — **hit 2026-09-02:** `RunDetailAiRefinePanel`, `ArchitectureDraftAiRefinePanel`, and `useArchitectureIntelligenceSourceContextQuery` still called unscoped lib helpers for product source-context GET and reasoning POST, so refine/publish and hydrated intake hit proxy dev-default tenant after scope switch; fixed by wrapping lib fetch with `mergeRegistrationScopeForProxy` (`architecture-intelligence-api.test.ts`).
- [x] (proven) `save-tenant-review-cycle-baseline.ts` GET/PUT `/api/proxy/v1/tenant/baseline` omitted `mergeRegistrationScopeForProxy` while `use-baseline-settings.ts` was scoped — **hit 2026-09-03:** new-run wizard baseline step (`useWizardBaselineMetricsActions`) read/persisted review-cycle hours on proxy dev-default tenant after scope switch; fixed by wrapping GET/PUT with `mergeRegistrationScopeForProxy` (`save-tenant-review-cycle-baseline.test.ts`).
- [x] (proven) `ProductLearningPageView` / `PlanningExportReadinessNote` export anchors used raw `/api/proxy` hrefs without `mergeRegistrationScopeForProxy` while dashboard loads used scoped `apiGet` — **hit 2026-09-04 (#714):** markdown/JSON export and open-in-tab actions hit proxy dev-default tenant after scope switch; fixed with scoped fetch downloads via `downloadScopedProxyFileGet` (`product-learning-report-download.test.ts`, `learning-planning-report-download.test.ts`).
- [x] (proven) `useCompareFormUrlSync` auto-compare effect used a one-shot ref — **hit 2026-09-05 (#811):** client navigation from one complete `priorRunId`/`laterRunId` pair to another skipped `runCompareForPair`; fixed by keying last auto-compared pair (`use-compare-form-url-sync.test.ts`).
- [x] (proven) `useAdminTenantsState` URL-sync effect cleared `pendingTenantAction` whenever URL params were empty — **hit 2026-09-05 (#811):** shut-off/turn-on confirm dialog vanished before `router.replace` wrote `tenantAction`/`tenantId`; fixed by clearing only on set→cleared URL transitions (`AdminTenantsPageClient.test.tsx`).
- [ ] (candidate) Operational-errors detail panel may survive a filter change that hides the selected row — needs locus + repro in `archlucid-ui/src/app/(operator)/`.
- [ ] (candidate) Ask page stale `thread` search param may block resume after navigation — needs locus + repro in `archlucid-ui/src/app/(operator)/`.

2026-09-05 seed hunt #811 (hit): proved compare URL auto-compare one-shot gap and admin tenants pending-action URL-sync race; seeded operational-errors filter/detail and ask thread-resume candidates.

2026-09-04 seed hunt #714 (hit): reseeded proxy-scope audit on tenant-scoped export anchors; proved product-learning and planning report download/open gaps.

2026-09-03 thorough hunt #580 (hit): proved wizard baseline helper scope gap on tenant baseline GET/PUT.

2026-09-02 seed hunt #8: reseeded proxy-scope audit; proved shared `architecture-intelligence-api` scope gap on refine/source-context paths.

2026-08-26 seed hunt #7: reseeded proxy-scope audit across operator routes; proved SCIM verify connectivity scope gap.

---

## Zone: ui-marketing-surfaces

- **id:** ui-marketing-surfaces
- **status:** open
- **impact:** low
- **aliases:** marketing pages; pricing; trust center UI
- **paths:** archlucid-ui/src/app/(marketing)/
- **test-filter:** marketing
- **hunts:** 12
- **bugs-found:** 20
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — sponsor digest success panel sign-in missing returnUrl; signup verify poll error flipped delivery-failure UI
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Marketing form submits PII to the wrong API environment — Quick Scan and pricing quote POST through `/api/proxy/v1/marketing/...` (`proxy-route-anonymous-marketing.test.ts`, `QuickScanClient.tsx`).
- [x] (invalid) Pricing page shows an internal-only plan tier to anonymous visitors — anonymous pricing loads public `loadPricingDoc()`; no internal tier leak found in seed read.
- [x] (proven) Trust Center evidence pack ZIP href used raw `/v1/marketing/trust-center/evidence-pack.zip` instead of `/api/proxy/...` — Next.js has no rewrite; anonymous download links 404. Fixed `TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF`; regression in `trust-center-marketing.test.ts`.
- [x] (proven) Sponsor digest deep-link `mapResponse` defaulted `signInUrl` to `/auth/sign-in` (no route) when API omitted the field — workspace sign-in CTA on `/digest/sponsor` links 404 instead of `/auth/signin` — fixed 2026-08-21 (`exec-digest-sponsor-deep-link-server.test.ts`)
- [x] (proven) Marketing showcase page used raw `decodeURIComponent(runId)` and `encodeURIComponent(runId)` for API fetch — malformed `%` segments throw `URIError` (500) and encoded run keys double-encode for `/v1/marketing/showcase/{runKey}` — fixed 2026-08-23 (`showcase-page.test.tsx`)
- [x] (proven) Sponsor digest `mapResponse` only defaulted missing `signInUrl`; API still returns `/auth/sign-in` (404) — fixed 2026-08-24; normalize legacy path to `/auth/signin` (`exec-digest-sponsor-deep-link-server.test.ts`).
- [x] (proven) `showcaseTitleForRunId` / `showcaseScenarioRibbonLabel` still called raw `decodeURIComponent` — malformed `%` in route segment throws during metadata/hero render — fixed 2026-08-24; use `decodeShowcaseRunId` (`showcase-page-copy.test.ts`, `showcase-page.test.tsx`).
- [x] (proven) Showcase API 200 with only `run` + `manifest` crashed render on `payload.artifacts.length` — fixed 2026-08-24; reject thin payloads in `fetchShowcasePayload` and guard snapshot (`ShowcaseWhatThisProves.test.tsx`, `showcase-page.test.tsx`).
- [x] (proven) `MarketingTrustCenterBuyerBody` / `AssuranceStatusPageHero` set `<time dateTime={reviewedLabel}>` when `lastReviewedUtc` is null or unparsable — **hit 2026-08-26:** `dateTime` received marketing copy instead of ISO-8601; fixed with `formatTrustCenterReviewDate` + `TrustCenterReviewTime` (`trust-center-review-date.test.ts`, `MarketingTrustCenterBuyerBody.test.tsx`).
- [x] (proven) Showcase `http_error`/`missing` served Claims Intake static demo for non-curated run ids — `not_found`/`invalid` gated on `hasCuratedShowcaseStaticPayload` but outage branches always called `getShowcaseStaticDemoPayload` — fixed 2026-08-26; show `DemoPreviewNotAvailable` for unknown slugs (`showcase-page.test.tsx`).
- [x] (proven) `QuickScanClient` capacity banner hardcodes `/auth/signin` without `returnUrl` — **hit 2026-08-27:** anonymous limit CTA did not return to `/quick-scan` after sign-in; fixed with `buildAuthSignInHref({ returnPath: "/quick-scan" })` (`quick-scan.test.tsx`).
- [x] (proven) `ShowcaseQuickNav` + thin API payload missing `manifest.manifestId` — **hit 2026-08-27:** `fetchShowcasePayload` accepted manifests without `manifestId`, risking `signedRecordDetailPath` trim crash when deep links enabled; reject as `invalid` (`showcase-page.test.tsx`).
- [x] (proven) `normalizeSignInUrl` in `exec-digest-sponsor-deep-link-server.ts` — API `signInUrl` with trailing-slash legacy `/auth/sign-in/` left hyphenated path unchanged (regex lookahead required end/query/hash immediately after `sign-in`) — **hit 2026-08-28:** optional trailing slash in replace pattern; regression in `exec-digest-sponsor-deep-link-server.test.ts`.
- [x] (proven) `useQuickScanClient` status `useEffect` — TanStack status refetch moves `capacityState` back to `Available` but stale amber capacity banner stayed visible — **hit 2026-09-02:** effect only set `capacityMessage` when non-null; fixed by always syncing from `resolveQuickScanCapacityMessage(status)` (`use-quick-scan-client.test.ts`).
- [x] (proven) `QuickScanClient` / `useQuickScanClient` POST handler — backend `403 QUICK_SCAN_CAPTCHA_REQUIRED` showed error with no Turnstile challenge — **hit 2026-09-02:** mount `TurnstileBotChallenge`, track `captchaChallengeRequired`, and send `botChallengeToken` on retry (`use-quick-scan-client.test.ts`, `quick-scan.test.tsx`).
- [x] (proven) Quick Scan `SampleOnly` auto-sample `useEffect` overwrites a real analysis when capacity status loads after submit — **hit 2026-08-27:** effect lacked `result === null` guard; aligned with optimistic `isQuickScanAiSubmitAllowed(null)` race (`use-quick-scan-client.test.ts`).

2026-09-02 thorough hunt #429: proved quick-scan capacity-banner recovery and progressive CAPTCHA Turnstile mount gaps.

- [x] (proven) `DemoPreviewSignInCallout` / `DemoPreviewEvaluationCta` hardcoded `/auth/signin` without `returnUrl` on embedded showcase demo body — **hit 2026-09-02 (#535):** gated showcase visitors who signed in from the bottom demo preview CTAs did not return to `/architecture/reviews/{runId}` unlike `ShowcaseQuickNav`; fixed by threading `signInReturnPath` from `DemoPreviewMarketingBody` and using `buildAuthSignInHref` (`DemoPreviewCallouts.test.tsx`).

2026-09-02 seed hunt #535: reseeded from showcase demo preview callouts; proved sign-in returnUrl parity gap vs `ShowcaseQuickNav`.

- [x] (proven) `DemoPreviewEvidenceGraphSection` / `DemoPreviewGovernanceSection` linked operator routes when `ShowcaseQuickNav` gated anonymous visitors — **hit 2026-09-03 (#548):** evidence graph and governance CTAs used `/insights/evidence-graph` and `/governance/approval-queue` without sign-in `returnUrl` while `canShowcaseAnonymousVisitorOpenOperatorDeepLinks` was false; fixed by threading `operatorDeepLinksAvailable` from `DemoPreviewMarketingBody` (`DemoPreviewArtifactSections.test.tsx`).
- [x] (proven) `ExecDigestSponsorDeepLinkIssuePage` hardcodes `/auth/signin` without `returnUrl` on token-missing shells — **hit 2026-09-04 (#662):** issue-page sign-in CTA omitted `returnUrl` to `/digest/sponsor` unlike Quick Scan and demo preview parity fixes; fixed with `buildAuthSignInHref({ returnPath: DIGEST_SPONSOR_CANONICAL_PATH })`; regression in `ExecDigestSponsorDeepLinkIssuePage.test.tsx`.
- [x] (valid-no-repro) `GetStartedPageClient` builds sign-in href manually instead of `buildAuthSignInHref` — **cheap-disproof 2026-09-04 (#662):** `buildSignInTrialHref` already encodes onboarding `returnUrl` and matches `buildAuthSignInHref({ returnPath: buildGuidedTrialHref() })`; parity risk only on future auth route changes, not a current wrong outcome.

2026-09-04 thorough hunt #662: proved sponsor digest issue-page sign-in returnUrl gap; cheap-disproved get-started sign-in helper parity as already equivalent.

- [x] (proven) `ExecDigestSponsorDeepLinkPanel` success view used raw `view.signInUrl` without `returnUrl` — **hit 2026-09-05 (#813):** workspace sign-in CTA on loaded sponsor digest did not return to `/digest/sponsor` after auth unlike issue-page parity fix; fixed with `buildAuthSignInHref({ returnPath: DIGEST_SPONSOR_CANONICAL_PATH })` (`ExecDigestSponsorDeepLinkPanel.test.tsx`).
- [x] (proven) `SignupVerifyClient.refreshTrialStatus` set `initialLoadFailed` on every poll error — **hit 2026-09-05 (#813):** background `STATUS_POLL_MS` fetch error replaced check-inbox UX with delivery-failure copy after a successful pending probe; fixed by limiting `initialLoadFailed` to the initial load (`SignupVerifyClient.test.tsx`).
- [ ] (candidate) `/see-it` keeps `source="live"` disclosure when `normalizeSeeItMarketingPayload` upgrades thin API JSON to static showcase payload — needs repro in `see-it/page.tsx` / `SeeItMarketingBody`.

2026-09-05 seed hunt #813 (hit): proved sponsor digest panel sign-in returnUrl gap and signup verify poll delivery-failure flip; seeded see-it live-vs-snapshot disclosure candidate.

2026-09-03 seed hunt #548: proved demo preview artifact operator deep-link gating gap; reseeded digest issue-page and get-started sign-in parity candidates.

2026-08-28 thorough hunt #7: proved sponsor digest signInUrl trailing-slash normalization; reseeded quick-scan capacity-banner and captcha candidates.
- [x] (proven) Static-first showcase slugs skip API but pass `renderMode="api"` and `banner={null}` when API base is configured — **hit 2026-08-27:** conflated API configured with served-from-API; static-first branch now always uses `renderMode="static"` and static banner (`showcase-page.test.tsx`).
- [x] (proven) Showcase `bad_json` hard-fails curated static-first run ids while `not_found`/`invalid` fall back to curated static payload — **hit 2026-08-27:** `bad_json` branch omitted curated fallback; aligned with sibling outage handling (`showcase-page.test.tsx`).

2026-08-26 seed hunt #5: reseeded four hunt-ready rows from marketing source read; proved showcase outage fallback asymmetry.

## Zone: capabilities-cost-mcp

- **id:** capabilities-cost-mcp
- **status:** cooling
- **impact:** medium
- **aliases:** capabilities cost; MCP server; cost estimation
- **paths:** ArchLucid.Capabilities.Cost/; ArchLucid.Mcp/
- **test-filter:** FullyQualifiedName~Capabilities.Cost|FullyQualifiedName~Mcp
- **hunts:** 2
- **bugs-found:** 1
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Cost estimate uses list price when tenant has a negotiated discount — zone paths surface graph cost findings and MCP retrieval only; no negotiated-discount or list-price estimation logic exists here.
- [x] (invalid) MCP tool invocation lacks tenant scope binding — `McpRetrievalToolsController.SearchAsync` binds `TenantId`/`WorkspaceId`/`ProjectId` from `IScopeContextProvider`; `RetrievalTools` rejects `Guid.Empty` tenant.
- [x] (invalid) Cost module returns zero for an unknown SKU instead of failing closed — `ArchLucid.Capabilities.Cost` has no SKU lookup; `PriceRowLookupAsync` returns retrieval hits (empty when none), not a zero cost.
- [x] (proven) `RetrievalTools.SearchAsync` applies `CorpusKindFilter` after a TopK-limited search, dropping corpus-specific hits ranked below the search cap — **hit 2026-08-23 hunt #28:** `PriceRowLookupAsync` with `TopK=3` returned empty when the sole `AzureRetailPrice` hit ranked 13th; fixed by over-fetching to the 25-hit cap before post-filtering and then taking the requested TopK.

2026-08-23 dry hunt #47: no open hypotheses; TopK over-fetch regression covered by `RetrievalToolsTests.PriceRowLookupAsync_returns_retail_hits_when_they_rank_below_requested_topk`.

---

## Zone: ui-operator-lib

- **id:** ui-operator-lib
- **status:** open
- **impact:** medium
- **aliases:** operator lib; operator scope; operator API client
- **paths:** archlucid-ui/src/lib/operator/
- **test-filter:** lib/operator
- **hunts:** 15
- **bugs-found:** 25
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-09-05
- **last-bug:** 2026-09-05 — stable-cache alerts-only persistence; lifecycle invalidation omitted userAttentionSummary; corePilotCommitContext survived scope switch
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (invalid) Operator API helper omits workspace scope on mutating requests — no mutating helpers under `operator/`; sole proxy GET uses `mergeRegistrationScopeForProxy` with full scope headers.
- [x] (proven) Cached operator context survives tenant switch — `hydrateOperatorShellStatusCaches` writes trial/homepage/stickiness/etc. to scope-agnostic TanStack keys; scope change did not clear them. Fixed via `clearOperatorShellStatusScopeAgnosticCaches` on `writeOperatorScopeToStorage` / `clearOperatorScopeStorage`.
- [x] (proven) Session stable shell cache survives tenant switch-back — `writeOperatorShellStableCache` kept prior-tenant snapshots in sessionStorage; switching away and back rehydrated stale trial/catalog/budget before bootstrap refetch. Fixed via `clearOperatorShellStableCache` on scope change (`operator-shell-status-scope-cache.test.ts`).
- [x] (invalid) Error mapper surfaces another tenant's problem detail in the toast — `operator-connectivity-error-present.ts` is stateless; no cross-request error cache in this directory.
- [x] (proven) Assigned-to-me findings compact presets missing from `OPERATOR_EMPTY_STATE_PRESET_KINDS` — three `GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_*_COMPACT` exports added without TB-1556 kind registration; `operator-empty-state-kind-presets.test.ts` failed on `GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT`. Fixed by registering `error` / `collection` / `filtered` kinds.
- [x] (proven) `mapStickinessSnapshot` threw when API sent `stickinessSnapshot.pilotFunnel: null` — fixed 2026-08-24; treat null funnel as absent (`operator-shell-status-client.test.ts`).
- [x] (proven) `hydrateOperatorShellStatusCaches` left stale TanStack data when later shell-status payloads omitted concerns — fixed 2026-08-24; remove queries when payload fields are null (`operator-shell-status-client.test.ts`).
- [x] (proven) `OPERATOR_RECENT_VIEWS_STORAGE_KEY` and `HAS_EXISTING_RUNS_CACHE_KEY` survived tenant/workspace switch — fixed 2026-08-24; clear on `notifyOperatorScopeChanged` (`operator-scope-storage.test.ts`).
- [x] (proven) `extractQuickDecisionFindingsFromRunDetail` discarded live OpenAPI string `humanReviewStatus` values such as `Pending`, leaving review badges without a status — fixed 2026-08-24 via reusable `normalizeFindingHumanReviewStatus` (`quick-decision-summary-derive.test.ts`).
- [x] (proven) `billingSubscriptionStatus` TanStack cache survived tenant switch — **hit 2026-08-25:** scope-agnostic key omitted from `OPERATOR_SHELL_STATUS_SCOPE_AGNOSTIC_QUERY_KEYS`; billing plan card could show prior tenant tier after switch (`operator-scope-storage.test.ts`).
- [x] (proven) `recentViewLabelFromPathname` mapped canonical `/governance/audit` to generic `"governance · audit"` instead of `"Audit trail"` — only legacy `/audit` was handled; Home recent-views chip showed wrong label after governance route migration (`operator-recent-views.test.ts`).
- [x] (proven) `deriveOperatorHomeWorkspaceMetrics` treated a paginated runs dashboard slice as workspace-wide aggregates — **hit 2026-08-26:** partial page now returns zeroed KPI aggregates while preserving workspace `totalCount` (`operator-home-workspace-metrics.test.ts`).
- [x] (proven) `deriveOperatorHomeWorkspaceMetrics` included archived runs in committed/active/findings totals — **hit 2026-08-27:** skip `isArchived` rows in aggregate loop (`operator-home-workspace-metrics.test.ts`).
- [x] (proven) `resolveOperatorBillingCurrentPlan` — stale frictionless-trial session flag hid paid tier after checkout when usage reported commercial tier off trial — **hit 2026-08-28:** resolve paid plan before frictionless session branch (stale Active trial parity); regression in `operator-billing-current-plan.test.ts`.
- [x] (invalid) `readHasSeenWelcomeOnboarding` — welcome dismissal may survive tenant switch (`hasSeenOnboarding` key not cleared in `notifyOperatorScopeChanged`) — **cheap-disproof 2026-08-28:** intentional browser-level user preference (not tenant-scoped data); scope change clears tenant caches only; regression in `operator-scope-storage.test.ts`.
- [x] (invalid) `readOperatorHomeDisclosureExpanded` — home disclosure prefs may survive tenant switch (global keys not cleared on scope change) — **cheap-disproof 2026-08-28:** intentional device-level collapse preference; not cleared on scope change by design; regression in `operator-scope-storage.test.ts`.
- [x] (invalid) `fetchOperatorAiQualitySnapshot` — unvalidated disposition string may crash badge helpers — **cheap-disproof 2026-08-28:** `dispositionLabel` / `dispositionClass` return unknown values without throwing; regression in `operator-ai-quality-snapshot.test.ts`.
- [x] (proven) `writeFrictionlessTrialSessionEnabled(false)` — frictionless session flag remained set after sign-in or checkout, leaving marketing banner visible for authenticated workspaces — **hit 2026-08-31:** `clearFrictionlessTrialSessionForAuthenticatedOperator` on auth callback, checkout success, and scope change; regression in `operator-frictionless-trial-session-cleanup.test.ts` and `operator-scope-storage.test.ts`.
- [x] (proven) `fetchLlmMonthlyDollarBudgetStatusCached` — AI budget percent on billing summary did not refresh after operator scope switch without full page reload — **hit 2026-08-31:** `OperatorBillingCurrentPlanSummary` held mount-time local state while TanStack cache cleared on scope change; switched to `useLlmMonthlyBudgetStatusQuery`; regression in `operator-shell-status-scope-cache.test.ts` and `operator-scope-storage.test.ts`.
- [x] (proven) `isOperatorHomeRunsDashboardServerSnapshotFresh` / `shouldSkipRunsDashboardClientFetchOnMount` — SSR runs snapshot treated fresh when `projectId` matched after tenant switch, skipping client refetch and leaving prior-tenant review rows on Overview — **hit 2026-08-31 (#329):** compare optional `scopeQueryKeySnapshot` on model against live scope key; SSR loader stamps scope; `useRunsDashboardPanel` subscribes to scope changes; regression in `operator-home-runs-dashboard-client-fetch.test.ts`.
- [x] (proven) `resolveOperatorBillingCurrentPlan` — non-empty `commercialTier` with omitted `isTrialUsage` and stale `trialStatus: Active` returned `tenant-trial` instead of `paid-plan` — **hit 2026-08-31 (#329):** treat commercial tier as paid unless `isTrialUsage === true` (usage omission parity with explicit `false`); regression in `operator-billing-current-plan.test.ts`.
- [x] (proven) `isOperatorHomeRunsDashboardServerSnapshotFresh` / `shouldSkipRunsDashboardClientFetchOnMount` — SSR runs snapshot treated fresh when `scopeQueryKeySnapshot` was omitted, reopening tenant-switch stale rows after #329 — **hit 2026-09-02 (#423):** reject snapshots missing scope stamp; regression in `operator-home-runs-dashboard-client-fetch.test.ts`.
- [x] (proven) `resolveOperatorBillingCurrentPlan` — active `hasSubscription` with empty `tierCode` / `commercialTier` and `isTrialUsage: false` returned `no-paid-plan` while invoice helpers reported a live subscription — **hit 2026-09-02 (#423):** `hasActiveSubscription` branch before trial fallback; regression in `operator-billing-current-plan.test.ts`.
- [x] (invalid) `mapHomepageSettings` — `isConfigured` / `isAvailable` require literal `true`; omitted/null API flags may hide configured homepage hero — **cheap-disproof 2026-09-03:** backend `FeaturedCompletedSampleSnapshot` always sets non-nullable `IsConfigured` / `IsAvailable` in `FeaturedCompletedSampleService.ProjectSnapshotAsync`; `=== true` coercion is defensive only.
- [x] (invalid) `runProjectMatchesEffectiveScope` — empty effective project id matches any run project during scope transitions — **cheap-disproof 2026-09-03:** intentional TB-077 guard; `operator-resource-scope.test.ts` documents empty-side match as by design.
- [x] (proven) `markOperatorHomeRunsSnapshotStale` — `OPERATOR_HOME_RUNS_STALE` session flag not cleared on `notifyOperatorScopeChanged` — **hit 2026-09-03 (#544):** lifecycle stale marker from tenant A consumed on tenant B Overview after switch, dropping refresh signal when returning to A; fixed via `clearOperatorHomeRunsSnapshotStale` on scope change (`operator-scope-storage.test.ts`).
- [x] (invalid) `parseOperatorScopeQueryKey` — scope ids containing `:` break three-part split parsing — **cheap-disproof 2026-09-03:** operator scope ids are UUIDs (hyphen-separated); colon delimiter is safe for `tenant:workspace:project` keys.
- [x] (invalid) `deriveOperatorHomeWorkspaceMetrics` — paginated slice with `totalCount > items.length` shows zero KPI aggregates — **cheap-disproof 2026-09-02:** intentional partial-page guard (`operator-home-workspace-metrics.test.ts`); zeroed aggregates avoid overstating workspace-wide totals.

- [x] (proven) `deriveAttentionSurfaceCounts` — archived committed/in-progress runs inflated `run-work-queue-committed` / `run-work-queue-in-progress` attention surface counts while Reviews hub excludes archived inventory — **hit 2026-09-04 (#666):** `partitionRunsIntoWorkQueueSections` counted archived rows; sibling `deriveOperatorHomeWorkspaceMetrics` already skips `isArchived`; fixed by filtering active runs before partition (`derive-attention-surface-counts.test.ts`).
- [x] (proven) `userAttentionSummary` TanStack cache survived tenant switch — **hit 2026-09-04 (#666):** scope-agnostic `operatorQueryKeys.userAttentionSummary` omitted from `OPERATOR_SHELL_STATUS_SCOPE_AGNOSTIC_QUERY_KEYS`; attention badges could show prior-tenant counts after scope change; fixed via scope-change cache clear (`operator-scope-storage.test.ts`).
- [x] (proven) `writeOperatorShellStableCache` — `alertsInboxSummary` persisted without `isStable*` gate unlike trial/catalog/budget snapshots; hydrate may seed stale open-count badges before shell-status refetch — **hit 2026-09-05 (#800):** alerts-only payload written when trial lifecycle unstable; fixed by requiring `hasStableSnapshot` before any session write (`operator-shell-stable-cache.test.ts`).
- [x] (proven) `invalidateOperatorHomeRunsCaches` — lifecycle invalidation omits `userAttentionSummary`; post-commit attention badges may stay stale until 30s `staleTime` expires — **hit 2026-09-05 (#800):** added `userAttentionSummary` invalidation alongside home runs caches (`operator-query-invalidation.test.ts`).
- [x] (proven) `corePilotCommitContext` — scope-agnostic TanStack key cleared on lifecycle invalidation but not `notifyOperatorScopeChanged`; tenant switch may show prior tenant commit context until refetch — **hit 2026-09-05 (#800):** added to `OPERATOR_SHELL_STATUS_SCOPE_AGNOSTIC_QUERY_KEYS` (`operator-scope-storage.test.ts`).

2026-09-05 thorough hunt #800: proved stable-cache alerts-only persistence, lifecycle userAttentionSummary invalidation gap, and corePilotCommitContext scope-cache leak.

2026-09-03 thorough hunt #544: proved OPERATOR_HOME_RUNS_STALE leaked across tenant switch; cheap-disproved homepage flag omission, empty project scope match, and colon-in-UUID scope parsing.

2026-09-02 seed hunt #423: proved SSR scope-stamp gap and billing subscription-without-tier plan card mismatch; seeded homepage flags, scope match, stale runs flag, and scope-id parsing candidates; cheap-disproved partial-page KPI zeroing.

2026-08-31 thorough hunt #329: proved Overview SSR runs snapshot scope invalidation and billing commercial-tier precedence when `isTrialUsage` is omitted; zone candidate backlog cleared after hunt #327 merge.

2026-08-31 thorough hunt #327: proved frictionless session cleanup on sign-in/checkout/scope change and billing summary AI budget refresh via shared query hook after scope cache invalidation.

2026-08-28 thorough hunt #191: proved billing paid-tier precedence over stale frictionless flag; cheap-disproved welcome/disclosure scope persistence and AI snapshot disposition crash; seeded frictionless session cleanup and LLM budget cache refresh candidates.

## Zone: quick-scan-distributed-concurrency

- **id:** quick-scan-distributed-concurrency
- **status:** open
- **impact:** high
- **aliases:** quick scan queue; anonymous concurrency; quick scan lease
- **paths:** ArchLucid.Application/Architecture/QuickScanDistributedConcurrencyService.cs; ArchLucid.Persistence/Architecture/QuickScanDistributedConcurrencyStore.cs
- **test-filter:** FullyQualifiedName~QuickScanDistributedConcurrency
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (hunt-ready) `QuickScanDistributedConcurrencyService` catches caller cancellation while waiting but abandons the queue entry with `CancellationToken.None`; if SQL abandon stalls during shutdown, the row remains Waiting until `QueueExpiresUtc` and consumes effective queue capacity.
- [ ] (hunt-ready) `QuickScanDistributedConcurrencyAdmissionResult.DisposeAsync` releases its lease without an execution or shutdown token; a host drain during disposal can leave the lease active until expiry and reject otherwise admissible scans.

---

## Zone: run-execute-ownership

- **id:** run-execute-ownership
- **status:** open
- **impact:** high
- **aliases:** run execute lease; execute ownership; orchestration ownership
- **paths:** ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.cs; ArchLucid.Application/Runs/Orchestration/RunExecuteOwnershipLeaseService.cs
- **test-filter:** FullyQualifiedName~RunExecuteOwnership|FullyQualifiedName~ArchitectureRunExecuteOrchestrator
- **hunts:** 1
- **bugs-found:** 0
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-25
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (valid-no-repro) `ArchitectureRunExecuteOrchestrator` releases an acquired ownership lease with `CancellationToken.None` after `ExecuteRunCoreAsync` is cancelled — intentional: passing the request token would skip release on client disconnect; host drain uses `ReleaseAllHeldByThisInstanceAsync` (TB-961); regression in `ArchitectureRunExecuteOrchestratorOwnershipTests.ExecuteRunAsync_when_agent_execute_cancelled_releases_lease_with_non_cancellable_token`.
- [x] (invalid) A cancellation after ownership acquisition but before durable execution state transition can expose different retry behavior between the direct API execute path and the background-job execute path — no shipped background execute path; `ArchitectureRunCommandService.ExecuteRunAsync` delegates solely to `ArchitectureRunExecuteOrchestrator` (API-sync per `ASYNC_ORCHESTRATION_FIRST_FORCE.md`).

---

## Zone: chatops-delivery

- **id:** chatops-delivery
- **status:** open
- **impact:** medium
- **aliases:** chatops webhook; authority commit notification; slack teams delivery
- **paths:** ArchLucid.Notifications/AuthorityRunCommittedChatOpsHook.cs; ArchLucid.Notifications/AuthorityRunCompletedChatOpsIntegrationEventHandler.cs
- **test-filter:** FullyQualifiedName~AuthorityRunCommittedChatOps|FullyQualifiedName~AuthorityRunCompletedChatOps
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (hunt-ready) `AuthorityRunCommittedChatOpsHook.DeliverIfEnabledAsync` catches a Slack/Teams 500 or network exception per target and returns success; the integration event is acknowledged, so Service Bus never retries and operators permanently miss the completion message.
- [ ] (hunt-ready) One target succeeding while a sibling target fails is not durably recorded; replay may duplicate the successful target or permanently suppress the failed target depending on handler acknowledgement semantics.

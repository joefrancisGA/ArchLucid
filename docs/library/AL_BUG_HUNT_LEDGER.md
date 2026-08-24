> **Scope:** Contributor-reference â€” curated `/al-bug` hunt zones. Not a buyer or operator document. Agents must not invent extra zones in the same invocation; update this file after each hunt.

# `/al-bug` hunt ledger

Curated zones covering the full product surface (API, persistence, UI, CLI, orchestration, billing, governance, auth, exports, background jobs, analyzers, pipeline engines, core libraries). The picker is `scripts/agent/al-bug-pick-zone.ps1` (explore/exploit + **impact** weight, not LLM ranking). Do **not** invent extra zones mid-hunt. Use `.\scripts\agent\al-bug-pick-zone.ps1 -Nominate` to find gaps.

**Updated:** 2026-08-17 (hypothesis quality bar: unseeded / candidate / hunt-ready / proven / invalid / valid-no-repro).

## How to use

1. Run `.\scripts\agent\al-bug-pick-zone.ps1 -Preview` (add `-Hint 'â€¦'` when the user named an area; add `-Refresh` to recompute git churn).
2. Hunt **only** the returned zone's `paths`. Treat `huntReadyHypotheses` as claims; treat `candidateHypotheses` as search lenses until a seed hunt. When `seedHunt` is true because all stored rows are closed, read the source again and generate fresh mechanism-backed hypotheses; an empty list is not a dry-run result.
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

---

## Zone: arm-terraform-source-ids

- **id:** arm-terraform-source-ids
- **status:** open
- **impact:** medium
- **aliases:** ARM resource ids; terraform source id; endpoint index
- **paths:** ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEdgeMapper.cs; ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEndpointIndex.cs
- **test-filter:** FullyQualifiedName~TopologyProposalRelationshipEdgeMapperTests|FullyQualifiedName~AgentTopologyProposalGraphMergeTests
- **hunts:** 51
- **bugs-found:** 52
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — `azurerm_storage_share` Terraform ids omitted from `LooksLikeTerraformServiceSourceId` (`storage_share` was only listed for datastore aliases)
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
- **hunts:** 5
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — hunt #37: AttemptIndex must rank before CreatedUtc in latest-per-task selector
- **related-pd-tb:** TB-2226
- **code-changed-since:** 0

### Hypotheses

- [x] Integrity check accepts a payload whose declared artifact hashes do not match committed bytes Î“Ã‡Ã¶ fixed as quality-gate mismatch: `QualityRejected` ignored when `RecordedQualityGateOutcome` was Accepted/Warned
- [x] Missing optional artifact is treated as a hash match Î“Ã‡Ã¶ retired: not applicable to commit quality-gate paths; superseded-retry trace selection was the real gap
- [x] Integrity failure is logged but commit still proceeds Î“Ã‡Ã¶ retired: inverse bug found; superseded rejected traces incorrectly blocked commit after successful auto-retry
- [x] Latest-per-task selector breaks on equal `CreatedUtc` and picks a superseded rejected schema-remediation attempt over a later accepted attempt Î“Ã‡Ã¶ fixed: tie-break on `AttemptIndex` then `TraceId` in `AgentExecutionTraceLatestPerTaskSelector`
- [x] (proven) `AgentExecutionTraceLatestPerTaskSelector` sorts `CreatedUtc` before `AttemptIndex`, so a superseded rejected attempt with a newer timestamp blocks commit after a higher `AttemptIndex` accepted retry — **hit 2026-08-23 hunt #37:** order by `AttemptIndex` then `CreatedUtc` then `TraceId`

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

---

## Zone: authority-pipeline-payload

- **id:** authority-pipeline-payload
- **status:** open
- **impact:** medium
- **aliases:** authority payload; pipeline work payload
- **paths:** ArchLucid.Application/Runs/Orchestration/AuthorityPipelineWorkPayload.cs
- **test-filter:** FullyQualifiedName~AuthorityPipelineWorkPayloadJsonTests|FullyQualifiedName~AuthorityPipelineWorkPayloadDocumentsNullElementTests
- **hunts:** 6
- **bugs-found:** 8
- **consecutive-dry-hunts:** 1
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — `IsValidForProcessing` rejected blank payload `projectId` before worker could overwrite from `dbo.Runs`
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

---

## Zone: technology-ledger-merge

- **id:** technology-ledger-merge
- **status:** open
- **impact:** medium
- **aliases:** technology ledger; ledger merge policy
- **paths:** ArchLucid.Application/Runs/Orchestration/TechnologyLedgerAgentProposalMergePolicy.cs
- **test-filter:** FullyQualifiedName~TechnologyLedger
- **hunts:** 2
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — same EvidenceRef duplicated when provider family differed
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Duplicate technology names from two agents both survive merge — **hit 2026-08-24:** merge only consulted `Chosen` rows; repeated Assumed proposals with same role/provider/name all inserted; regressions in `Resolve_skips_duplicate_assumed_when_no_chosen_exists` / `Resolve_skips_duplicate_assumed_when_chosen_provider_differs`
- [x] (proven) Merge policy ignores a seeded ledger row when the proposal uses a different casing — **hit 2026-08-24:** `TechnologyName` compared with ordinal case; `postgresql` vs `PostgreSQL` duplicated; regression in `Resolve_treats_technology_name_case_insensitively`
- [x] (proven) Topology re-seed with same `EvidenceRef` duplicated agent rows — **hit 2026-08-24:** merge ignored stable `agentTopologyProposal:*` refs; regression in `Resolve_skips_when_evidence_ref_already_present`
- [x] (proven) Same `EvidenceRef` duplicated when provider family differed — **hit 2026-08-24:** dedupe required matching `ProviderFamily` before evidence-ref check; regression in `Resolve_skips_when_evidence_ref_matches_across_provider_families`
- [x] (invalid) Ledger merge keeps an agent-proposed technology that the inventory already replaced — inventory/evidence rows are `Chosen`; same `ProviderFamily` proposals are already skipped via chosen-family gate; name-level dedupe now also matches authoritative `Chosen` rows

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

---

## Zone: email-otp-auth

- **id:** email-otp-auth
- **status:** open
- **impact:** high
- **aliases:** email otp; otp auth; email challenge
- **paths:** ArchLucid.Api/Controllers/Auth/EmailOtpAuthController.cs; ArchLucid.Application/Identity/EmailOtpAuthService.cs
- **test-filter:** FullyQualifiedName~EmailOtpAuthServiceTests|FullyQualifiedName~EmailOtpChallengeRepositoryConcurrencyTests
- **hunts:** 3
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — `ResolveNextStepAsync` treated challenge-linked invitation ids as accepted and returned newest membership instead of the accepted invitation workspace
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] A consumed or expired OTP still issues a session Î“Ã‡Ã¶ retired: `VerifyCodeAsync_rejects_expired_code`, `VerifyCodeAsync_rejects_reused_code`, and `TryCompleteAsync` completion paths reject expired/already-completed challenges
- [x] Challenge lookup is not tenant-scoped and can verify another tenant's code Î“Ã‡Ã¶ retired (invalid): OTP challenges are pre-tenant and keyed by normalized email; verification requires challenge id + code hash bound to that row
- [x] Concurrent verify requests both succeed on the same one-time challenge Î“Ã‡Ã¶ retired: `EmailOtpChallengeRepositoryConcurrencyTests.TryCompleteAsync_allows_only_one_successful_completion`
- [x] (proven) Mixed-case invitation email on the row blocks acceptance after OTP verify — **hit 2026-08-24:** `TryAcceptInvitationAsync` compared `invitation.Email` to normalized sign-in email with ordinal equality and `FindInvitationByIdAsync` filtered via `ListPendingByNormalizedEmailAsync`; legacy/display-case rows never accepted; fixed with `InvitationEmailMatchesVerifiedEmail` + `GetPendingByIdAsync`
- [x] (proven) Post-verify next step returns wrong workspace after invitation accept — **hit 2026-08-24:** `ResolveNextStepAsync` merged `acceptedInvitationId ?? challenge.InvitationId` and picked `activeMemberships[^1]`; re-invites to an older workspace returned the newest membership, and multi-workspace users with an expired linked invitation got `Complete` instead of `SelectWorkspace`; fixed by returning `AcceptedEmailOtpInvitation` tenant/workspace only when accept succeeds and separating challenge-linked pending invitation routing

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

---

## Zone: tenant-scoped-analyzer

- **id:** tenant-scoped-analyzer
- **status:** open
- **impact:** high
- **aliases:** ARCH006; tenant scoped query analyzer
- **paths:** ArchLucid.Analyzers/TenantScopedQueryScopeBindingAnalyzer.cs
- **test-filter:** FullyQualifiedName~TenantScopedQueryScopeBindingAnalyzerTests
- **hunts:** 3
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — non-const local and static readonly SQL variables bypassed ARCH006 static resolution
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

---

## Zone: sql-run-repository

- **id:** sql-run-repository
- **status:** open
- **impact:** high
- **aliases:** run repository; sql run scope
- **paths:** ArchLucid.Persistence/Repositories/SqlRunRepository.cs
- **test-filter:** FullyQualifiedName~SqlRunRepositoryScopeIsolationSqlIntegrationTests|FullyQualifiedName~RunRepositoryWorkspaceSystemNameSqlTests
- **hunts:** 4
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — ListByProject compared raw ProjectId while collision/committed lookups trim and ignore case
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

---

## Zone: finding-inspect-sql

- **id:** finding-inspect-sql
- **status:** open
- **impact:** high
- **aliases:** finding inspect; dapper inspect read
- **paths:** ArchLucid.Persistence/Findings/DapperFindingInspectReadRepository.cs; ArchLucid.Persistence/Findings/FindingInspectReadModelMapper.cs; ArchLucid.Persistence/Sql/FindingInspectReadSql.cs
- **test-filter:** FullyQualifiedName~FindingInspectReadModelMapperTests|FullyQualifiedName~FindingInspectReadSqlTests|FullyQualifiedName~DapperFindingInspectReadRepositoryTests|FullyQualifiedName~FindingInspectEndpointTests
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — FollowUpBatch merged child rows across reruns sharing the same scoped FindingId
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] Inspect read returns a finding whose tenant does not match the request scope Î“Ã‡Ã¶ fixed: main inspect + FindingRecords joins in FollowUpBatch require `fr.TenantId`/`WorkspaceId`/`ProjectId` (run-only predicates were insufficient when row tenant diverges)
- [x] Mapper drops evidence fields so inspect shows success with empty trail Î“Ã‡Ã¶ retired (invalid): mapper only parses enums; evidence is built in the repository from related nodes
- [x] Inspect query joins without tenant on the child table and leaks sibling-tenant rows — fixed: FollowUpBatch now scopes FindingRelatedNodes / rules / actions / AuditEvents / FindingReviewEvents / RiskExceptions to TenantId+WorkspaceId+ProjectId
- [x] (proven) `ResolveRuleFields` pairs `DecisionRuleId` from `AppliedRuleIdsJson` with unrelated `FindingTraceRulesApplied` SortOrder=0 text — fixed: keep `DecisionRuleName` aligned with the first applied rule id when JSON ids exist
- [x] (proven) FollowUpBatch merged related nodes / rule text / recommended actions across reruns sharing the same scoped `FindingId` — **hit 2026-08-24:** `@RunId` from the primary inspect row was unused on child-table sub-queries; main inspect `TOP 1` was non-deterministic; fixed with `r.RunId = @RunId`, `ORDER BY r.CreatedUtc DESC, r.RunId DESC`, and `aet.RunId = r.RunId`; regressions in `FollowUpBatch_scopes_related_nodes_to_main_inspect_run` and related shape tests

---

## Zone: llm-wallet

- **id:** llm-wallet
- **status:** open
- **impact:** high
- **aliases:** llm wallet; tenant wallet; billing wallet
- **paths:** ArchLucid.Api/Controllers/Billing/WalletController.cs; ArchLucid.Application/Budgeting/LlmTenantWalletService.cs; ArchLucid.Persistence/Data/Repositories/SqlLlmTenantWalletRepository.cs
- **test-filter:** FullyQualifiedName~LlmTenantWalletServiceTests
- **hunts:** 2
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — overage reconciliation credit dropped when optimistic retries exhausted (no re-queue)
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

---

## Zone: finding-disposition

- **id:** finding-disposition
- **status:** open
- **impact:** medium
- **aliases:** disposition; finding decision
- **paths:** ArchLucid.Application/Governance/FindingDisposition/FindingDispositionService.cs; ArchLucid.Application/Governance/FindingDisposition/FindingDispositionValidation.cs
- **test-filter:** FullyQualifiedName~FindingDispositionValidationTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Disposition writes succeed for a finding that belongs to another tenant — trail append uses `scope.TenantId`; no cross-tenant leak path in zone files.
- [x] (valid-no-repro) Validation accepts a closed finding as still actionable — disposition is append-only by design (`FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`); no finding-state gate in validation.
- [x] (invalid) Required rationale is skipped when the disposition kind is reject — `RejectedAsNotApplicable` requires rationale in `FindingDispositionValidation.Validate`.
- [x] (proven) Deferred disposition rejects empty rationale while operator UI gates (TB-2305) require rationale only for Accepted and RejectedAsNotApplicable — fixed by removing Deferred from `requiresRationale`.
- [x] (proven) Non-Accepted dispositions persist trade-off acknowledgment and cross-kind fields (`RevisitDueUtc`, `EvidenceRequestText`) on unrelated disposition kinds — fixed in `FindingDispositionService` note builder and record normalization.

---

## Zone: review-recurrence

- **id:** review-recurrence
- **status:** open
- **impact:** low
- **aliases:** recurrence; next run calculator
- **paths:** ArchLucid.Application/Governance/ArchitectureReviewRecurrenceNextRunCalculator.cs
- **test-filter:** FullyQualifiedName~ArchitectureReviewRecurrenceNextRunCalculatorTests
- **hunts:** 2
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — preview path skipped single-run normalization (reference-equality / Unspecified kind)
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (proven) Disabled recurrence still computes a next run — **hit 2026-08-24:** paused schedules persisted `NextRunUtc` anyway; `ComputeNextRunUtc(..., isScheduleEnabled: false)` returns null; controller only requires next when enabled; regression in `ComputeNextRunUtc_returns_null_when_schedule_disabled` / `CreateRecurrenceSchedule_persists_inactive_schedule`
- [x] (proven) Time-zone conversion shifts the cadence by a day around DST — **hit 2026-08-24:** `DateTimeKind.Unspecified` / `Local` references passed to Cronos without UTC normalization; regressions in `ComputeNextRunUtc_normalizes_unspecified_reference_kind_to_utc` / `ComputeNextRunUtc_returns_utc_kind_even_when_reference_is_local`
- [x] (proven) Next-run lands in the past so the scheduler fires immediately in a loop — **hit 2026-08-24:** wrapper returned `next <= fromUtc` without recomputing; `NormalizeNextRunUtc` advances once and stamps UTC; regression in `ComputeNextRunUtc_recomputes_when_first_occurrence_is_not_strictly_after_reference`
- [x] (invalid) Preview path already delegates to normalized `ComputeNextRunsUtc` after reference normalization fix — **disproven 2026-08-24:** only the reference instant was normalized; batch preview bypassed `NormalizeNextRunUtc`
- [x] (proven) Preview path skipped single-run normalization so the first preview instant could equal the reference or omit UTC kind — **hit 2026-08-24:** `ComputeNextRunsUtc` delegated to underlying batch expansion; route preview through the `ComputeNextRunUtc` loop; regressions in `ComputeNextRunsUtc_advances_first_preview_when_underlying_returns_reference_instant` / `ComputeNextRunsUtc_stamps_utc_kind_when_underlying_returns_unspecified_kind`

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
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Digest email includes findings from a tenant the recipient cannot access — dispatcher only renders pre-built `summaryMarkdown`; tenant scoping lives in the delivery scanner and export service.
- [x] (valid-no-repro) Dispatcher treats a send failure as success and skips retry — send failures throw; ledger reservation before send is intentional TB-089 idempotency (duplicate ACA retries blocked).
- [x] (invalid) Unsubscribed address still receives the weekly summary — unsubscribe filtering is not in the dispatcher; sponsor report path has no unsubscribe URL parameter (unlike exec digest).
- [x] (proven) Whitespace-only recipient lists reserve the weekly ledger and return success without sending any email — fixed by normalizing mailboxes before ledger reservation.
- [x] (proven) Template render failures after ledger reservation block weekly retry for the ISO week — fixed by rendering templates before `TryRecordSentAsync` while keeping ledger-before-send for outbound idempotency.

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
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Offline replay trusted manifest `verdict: pass` even when `observedStatusCode` was 200 on deny-status probes — fixed by deriving deny verdicts from observed status unless manifest marks skip.
- [x] (invalid) Probe uses the victim tenant's token instead of the attacker token — live mode applies alternate scope headers on a second client; same credential probes cross-tenant scope by design.
- [x] (proven) Live ship-gate reported overall PASS when cross-tenant probes were SKIP (primary sanity Pass + infra 5xx skips) — fixed by downgrading live overall to SKIP and non-zero exit when isolation was not verified.

- [x] (proven) exclude-run-id probes reported PASS on HTTP 5xx when the foreign runId was absent — fixed by skipping list-exclusion probes on server errors like deny-status probes.
- [x] (proven) Run-list probe missed foreign run ids when the API returned compact `N` guids but the CLI `--run-id` used dashed formatting — **hit 2026-08-24:** `TryFindRunIdInRunList` compared raw strings, so a leaked compact id was treated as absent and the cross-tenant list probe falsely passed; fixed by normalizing both sides to canonical `N` before comparison.
- [x] (proven) Cross-tenant artifacts probe targeted a non-canonical route — **hit 2026-08-24:** live probes called `GET /v1/artifacts/runs/{runId}` (export-only prefix) instead of `GET /v1/architecture/runs/{runId}/artifacts`, so a 404 on the wrong path reported PASS without exercising artifact isolation; fixed probe path to the product route.

---

## Zone: cli-draft-new

- **id:** cli-draft-new
- **status:** open
- **impact:** low
- **aliases:** draft new; cli draft
- **paths:** ArchLucid.Cli/Commands/DraftNewCommand.cs
- **test-filter:** FullyQualifiedName~DraftNewCommandCoreTests
- **hunts:** 2
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — admit response draft scope was not validated before MUST-question resolution
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Draft is created under a tenant other than the signed-in CLI tenant — **hit 2026-08-24:** misconfigured scope headers could create a draft in another tenant while the CLI continued; `CliScopeResponseValidator` fails closed after create/patch when configured scope disagrees with API body; regressions in `RunCoreAsync_draft_scope_mismatch_after_create_returns_operation_failed` / `RunCoreAsync_draft_scope_mismatch_after_patch_returns_operation_failed`
- [x] (proven) Command reports success when the API returned a hollow success — **hit 2026-08-24:** submit returned HTTP 200 with empty `runId` and the command still printed success; now fails with `OperationFailed`; regression in `RunCoreAsync_submit_without_run_id_returns_operation_failed`
- [x] (proven) MUST-question and late-step API failures omitted operator hints — **hit 2026-08-24:** `ResolveMustQuestionsAsync` and execute/admit failure paths did not call `CliOperatorHints`; regression in `RunCoreAsync_questions_load_failure_writes_operator_hint`
- [x] (proven) `AdmitDraftAsync` can return `admitted: true` with a draft under another tenant and the CLI continues — **hit 2026-08-24:** `DraftNewCommand` now validates `admission.Value.Draft` before MUST-question resolution (`RunCoreAsync_draft_scope_mismatch_after_admit_returns_operation_failed`).
- [x] (invalid) Existing draft id is overwritten without confirmation — command always POSTs a new draft; no overwrite path
- [ ] (hunt-ready) `RunCoreAsync` line 85 uses `!created.Success || created.Value is null`; Stryker's surviving `&&` mutant means tests do not prove that a failed response carrying a non-null value is rejected, so a concrete `Success=false`/non-null handler may continue with an invalid draft.
- [ ] (hunt-ready) `RunCoreAsync` line 145 uses `!patched.Success || patched.Value is null`; Stryker's surviving `&&` mutant means tests do not prove a failed patch with a body stops before admission.
- [ ] (hunt-ready) `RunCoreAsync` line 164 uses `!admission.Success || admission.Value is null`; Stryker's surviving `&&` mutant means tests do not prove a failed admit with a body stops before `Admitted` handling.
- [ ] (hunt-ready) `RunCoreAsync` line 206 uses `!submit.Success || submit.Value is null`; Stryker's surviving `&&` mutant means tests do not prove a failed submit with a populated response stops before run-id success output.

---

## Zone: cli-terraform-evidence

- **id:** cli-terraform-evidence
- **status:** open
- **impact:** medium
- **aliases:** terraform evidence; deployment evidence terraform
- **paths:** ArchLucid.Cli/Commands/DeploymentEvidenceTerraformReference.cs
- **test-filter:** FullyQualifiedName~DeploymentEvidenceTerraformReferenceTests
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Deployment evidence listed `terraform-pilot` before composition roots — fixed by reordering to hosted validate/apply sequence (composition, leaves, orchestrator legacy, pilot default profile).
- [x] (proven) Deployment evidence omitted `infra/terraform-pilot` while listing other metadata-only composition roots — fixed by adding pilot as the first expected apply-order entry.
- [x] (invalid) ARM resource id is stored in the wrong Terraform attribute (name vs id) — zone file is static apply-order text only; no ARM id parsing.
- [x] (invalid) Module-wrapped resource is skipped so evidence omits a live ARM id — no Terraform module parsing in this zone.
- [x] (invalid) Parser treats a comment containing `resource_id` as a real binding — no HCL parser in this zone.

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
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Topic markdown fetch follows an external URL instead of the in-app help route (retired: fetchHelpTopicMarkdown uses `/api/help/{slug}`)
- [x] Missing topic is rendered as a GitHub blob link (retired: not-found Î“Ã¥Ã† `/help`; doc-index has no github blob URLs)
- [x] Index lists topics the current role is not allowed to open (fixed: generate_doc_index no longer bleeds internal-runbook titles onto public slugs)
- [x] (proven) Fetched doc-index rows duplicate static quick links when the same URL appears under a different category or title — **hit 2026-08-23:** `mergeDocIndex` deduped only on `category|title|url`, so `/help/choose-your-next-step` rendered twice (Getting Started static + Go-to-Market fetched) and `/help/admin-diagnostics` showed both static and fetched titles.

---

## Zone: ui-webhooks-settings

- **id:** ui-webhooks-settings
- **status:** open
- **impact:** medium
- **aliases:** webhooks settings; outbound webhook ui
- **paths:** archlucid-ui/src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx; archlucid-ui/src/app/(operator)/integrations/webhooks/use-webhooks-settings.ts
- **test-filter:** WebhooksSettings
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] Signing secret from a previous workspace remains visible after scope switch
- [x] Save succeeds in the UI when the API returned 403 (retired: create throws on !ok; success callout only after await)
- [x] Dry-run control posts to the live endpoint from the settings form (retired: no dry-run on create form; Send test uses /test)
- [x] (proven) In-flight webhook test or save state survives operator scope switch — **hit 2026-08-21:** scope `useEffect` cleared form rows but not `testingId`/`isSaving`; stale async completions could disable tests or show save success in the new workspace.
- [x] (proven) Stale subscription list from a previous workspace overwrites rows after scope switch — **hit 2026-08-23:** `load()` in `use-webhooks-settings.ts` lacked `scopeGenerationRef` guards; an in-flight `listAlertRoutingSubscriptions` completion could call `setItems` with the prior workspace's subscriptions after the operator switched scope.

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
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — empty `sourceTexts` deep link showed "Scoped to run"; generic load-error without `from` used same misleading fallback
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] Page shows recommendations for a package outside the current workspace Î“Ã‡Ã¶ fixed: clear `runState` when inbound `runId` changes
- [x] Stale query data from the previous tenant remains after scope switch Î“Ã‡Ã¶ fixed: reset intake + reasoning on operator scope key change
- [x] Error state is omitted so a failed load looks like an empty architecture â€” (valid-no-repro): `ArchitectureIntelligenceProductContextLoadFailure` renders on HTTP failure; covered by `shows intake load failure with retry when deep-linked product context fails` in `ArchitectureIntelligencePageClient.buyer-polished.test.tsx`
- [x] (proven) Deep-linked run with empty `sourceTexts` and no `from` param shows "Scoped to run" without empty-intake notice — **hit 2026-08-24:** `inboundContextLine` branches on `productContextStatus === "empty"` / `"error"` before scoped fallback

---

## Zone: scim-users

- **id:** scim-users
- **status:** open
- **impact:** high
- **aliases:** scim; entra provisioning users
- **paths:** ArchLucid.Api/Controllers/Scim/ScimUsersController.cs
- **test-filter:** FullyQualifiedName~ScimUsers
- **hunts:** 2
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — DELETE decremented enterprise seat then leaked it when repository deactivate failed
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

---

## Zone: identity-provider-config

- **id:** identity-provider-config
- **status:** open
- **impact:** high
- **aliases:** identity provider; idp activation
- **paths:** ArchLucid.Api/Controllers/Admin/IdentityProviderConfigurationController.cs; ArchLucid.Api/Services/Admin/IdentityProviderActivationService.cs
- **test-filter:** FullyQualifiedName~IdentityProviderActivationServiceTests
- **hunts:** 3
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
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

---

## Zone: worker-host

- **id:** worker-host
- **status:** open
- **impact:** low
- **aliases:** worker program; worker host startup
- **paths:** ArchLucid.Worker/Program.cs
- **test-filter:** FullyQualifiedName~WorkerHostStartupTests|FullyQualifiedName~WorkerCompositionTests
- **hunts:** 2
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — Real mode + ManagedIdentity rejected ApiKey-less Azure OpenAI at worker startup validation and options bind
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) Worker host starts without a tenant-scope constraint on background jobs — **valid-no-repro:** background loops push `AmbientScopeContext` per job; `HttpScopeContextProvider` is stateless (not a Program.cs gap)
- [x] (invalid) Composition registers a singleton that caches the first request's tenant — `HttpScopeContextProvider` reads ambient/HTTP per call; no cached tenant state
- [x] (proven) Startup succeeds when a required hosted service failed to resolve — **hit 2026-08-24:** `DevelopmentCatalogResetService` required `ISchemaBootstrapper` while InMemory worker dev hosts skipped SQL registration; stub `InMemoryDevelopmentCatalogResetService` for non-SQL storage
- [x] (proven) Missing `Hosting:Role=Worker` let production validation use Combined — **hit 2026-08-24:** `ContainerJobsOffloadRules` skipped when role unset; `WorkerProcessHostingRoleConfiguration` defaults/rejects
- [x] (proven) Invalid configuration built full DI before fail-fast — **hit 2026-08-24:** `ValidateOrThrow` runs before `Build()` in Worker `Program.cs`
- [x] (proven) Real mode with `AzureOpenAI:AuthenticationMode=ManagedIdentity` fails worker startup — **hit 2026-08-24:** `AgentExecutionRules` required ApiKey despite MI; `AzureOpenAiOptionsValidator` rejected partial credentials without ApiKey; fixed via `AzureOpenAiConfigurationProbe.IsCompletionStackConfigured` and MI-aware options validation; regression in `Worker_host_starts_when_real_mode_uses_managed_identity_without_api_key`

---

## Zone: billing-webhooks

- **id:** billing-webhooks
- **status:** open
- **impact:** high
- **aliases:** stripe webhook; marketplace webhook; billing webhook replay
- **paths:** ArchLucid.Api/Controllers/Billing/BillingStripeWebhookController.cs; ArchLucid.Api/Controllers/Billing/BillingMarketplaceWebhookController.cs; ArchLucid.Application/Budgeting/LlmTenantWalletStripeWebhookProcessor.cs; ArchLucid.Persistence/Billing/MemoryCacheBillingWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~BillingStripeWebhook|FullyQualifiedName~BillingMarketplaceWebhook|FullyQualifiedName~LlmTenantWalletStripeWebhook|FullyQualifiedName~MemoryCacheBillingWebhookReplayGuard
- **hunts:** 3
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Replay guard treated event-id case variants as distinct keys — fixed by normalizing event ids to lowercase in cache keys.
- [x] (proven) `TryRegisterEventAsync` allowed duplicate concurrent registrations — fixed with atomic `ConcurrentDictionary` claims like ITSM replay guard.
- [x] (invalid) Tenant resolution lives in `AzureMarketplaceBillingProvider`; verified JWT claim precedence is intentional when `TenantIdClaimType` is configured.
- [x] (invalid) Stripe and Marketplace controllers return 400 BadRequest when provider rejects invalid signatures.
- [x] (proven) Ledger duplicate deliveries replayed while row still `Received` — **hit 2026-08-24:** `StripeBillingProvider` and `AzureMarketplaceBillingProvider` only rejected duplicates when prior status was `Processed`, so concurrent retries double-applied mutations during in-flight handling; fixed via `BillingWebhookLedgerReplayPolicy`.
- [x] (proven) Wallet `payment_intent.succeeded` acked without crediting on bad metadata — **hit 2026-08-24:** missing/invalid `tenant_id` on `llm_wallet_refill` intents was ignored and the event was marked `Processed`; fixed by validating metadata and throwing so the ledger records `Failed` and Stripe can retry.
- [x] (proven) Marketplace dedupe key used 32-bit `GetHashCode` — **hit 2026-08-24:** distinct `ChangeQuantity` payloads could collide and be falsely rejected; fixed with SHA-256 payload fingerprints in `BillingMarketplaceWebhookDedupeKey`.

---

## Zone: api-key-auth

- **id:** api-key-auth
- **status:** open
- **impact:** high
- **aliases:** API key auth; admin API key settings
- **paths:** ArchLucid.Api/Authentication/ApiKeyAuthenticationHandler.cs; ArchLucid.Api/Services/Admin/AdminApiKeySettingsService.cs; ArchLucid.Api/Controllers/Admin/AdminApiKeySettingsController.cs
- **test-filter:** FullyQualifiedName~ApiKeyAuthentication|FullyQualifiedName~AdminApiKeySettings
- **hunts:** 2
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — duplicate X-Api-Key headers joined by comma broke authentication
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

---

## Zone: scope-binding-middleware

- **id:** scope-binding-middleware
- **status:** open
- **impact:** high
- **aliases:** scope binding; tenant scope middleware; route tenant filter
- **paths:** ArchLucid.Api/Middleware/ScopeIdentityBindingMiddleware.cs; ArchLucid.Api/Middleware/ScopeResolutionGuardMiddleware.cs; ArchLucid.Api/Security/RouteTenantScopeBindingFilter.cs
- **test-filter:** FullyQualifiedName~ScopeIdentityBinding|FullyQualifiedName~ScopeResolutionGuard|FullyQualifiedName~RouteTenantScopeBinding
- **hunts:** 2
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — duplicate x-*-id headers bypassed header-only scope escalation guard
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

---

## Zone: saml-jwt-bearer

- **id:** saml-jwt-bearer
- **status:** open
- **impact:** high
- **aliases:** SAML; trial JWT; SCIM bearer; OIDC auth stack
- **paths:** ArchLucid.Api/Auth/; ArchLucid.Core/Auth/Saml/
- **test-filter:** FullyQualifiedName~Saml|FullyQualifiedName~LocalTrialJwt|FullyQualifiedName~ScimBearer
- **hunts:** 3
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** yes

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

---

## Zone: tenant-data-export

- **id:** tenant-data-export
- **status:** open
- **impact:** high
- **aliases:** tenant export; run export; export SSRF
- **paths:** ArchLucid.Application/Exports/; ArchLucid.Api/Controllers/Authority/ExportsController.cs; ArchLucid.Api/Controllers/Authority/ArchitectureExportController.cs; ArchLucid.Api/Controllers/Authority/RunsExportController.cs; ArchLucid.Core/Security/AllowedRunExportBlobDestinationUrlPolicy.cs
- **test-filter:** FullyQualifiedName~ArchitectureReviewExport|FullyQualifiedName~ExportsController|FullyQualifiedName~AllowedRunExportBlobDestinationUrlPolicy
- **hunts:** 4
- **bugs-found:** 7
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
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
- [ ] (hunt-ready) `ArtifactExportController.DownloadTerraformAdvisoryExport` and `CreateTerraformPr` load run detail but omit the committed-manifest guard used by `PushRunExportToBlob`; an in-progress run with `GoldenManifest == null` may return export bytes or create a PR.
- [ ] (hunt-ready) `RunQueryController.ExportRunFindingsCsv` checks run existence and manifest pointer consistency but not `IsCommitted`; a Created/ReadyForCommit run may export findings while sibling buyer export services reject it.

---

## Zone: host-core-jobs

- **id:** host-core-jobs
- **status:** open
- **impact:** medium
- **aliases:** background jobs; hosted services; durable job queue
- **paths:** ArchLucid.Host.Core/Jobs/; ArchLucid.Host.Core/Hosted/
- **test-filter:** FullyQualifiedName~ArchLucidJob|FullyQualifiedName~BackgroundJob|FullyQualifiedName~Hosted
- **hunts:** 6
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23 — stale-running watchdog skipped MaxRetries=0 jobs and did not re-notify the durable queue after reclaim
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
- [ ] (hunt-ready) `IntegrationEventDlqRetryBackgroundWork.RunSinglePassAsync` reads `DateTime.UtcNow` directly while `IntegrationEventDlqRetryPolicy` accepts an explicit UTC instant; an NTP clock step during a pass can requeue rows before backoff or leave eligible rows delayed instead of using an injected `TimeProvider`.

---

## Zone: itsm-inbound-webhooks

- **id:** itsm-inbound-webhooks
- **status:** open
- **impact:** high
- **aliases:** ITSM webhook; ServiceNow inbound; connector secret
- **paths:** ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs; ArchLucid.Application/Integrations/Itsm/; ArchLucid.Persistence/Integrations/MemoryCacheItsmInboundWebhookReplayGuard.cs
- **test-filter:** FullyQualifiedName~ItsmInboundWebhook
- **hunts:** 5
- **bugs-found:** 7
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
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

---

## Zone: ui-auth-proxy

- **id:** ui-auth-proxy
- **status:** open
- **impact:** high
- **aliases:** UI auth; API proxy; edge proxy
- **paths:** archlucid-ui/src/lib/auth/; archlucid-ui/src/app/api/proxy/; archlucid-ui/src/proxy.ts
- **test-filter:** lib/auth|proxy-route|proxy.ts
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (candidate) Proxy forwards operator cookies or auth headers to a marketing-only upstream path - invalid: server bearer stripped on allowlisted marketing paths; cookies are not copied upstream
- [x] (candidate) Return-destination helper accepts an external URL that bypasses host-gate - invalid: `isSafeReturnPath` rejects external URLs; host-gate runs on next navigation
- [x] (proven) Anonymous marketing proxy path can reach a mutating operator API route via literal `..` segments - fixed: reject `..`/`.` proxy segments before upstream fetch
- [x] (proven) `buildProxyUpstreamPath` — `%2e%2e` proxy segments decode to `..` during URL normalization and reach `architecture/draft/*` while literal `..` segments are rejected
- [x] (proven) Double-encoded `%252e%252e` proxy segments bypass the `%2e` substring guard and still reach operator draft routes from anonymous marketing paths
- [x] (proven) Post-sign-in return URLs accept embedded protocol-relative segments — **hit 2026-08-21:** `isSafeReturnPath` only rejected leading `//` and percent-decoded three passes, so `/x%2F%2Fevil.example` and quadruple-encoded `//` payloads passed through `signInHasReturnDestination`.
- [x] (proven) Nine-level `%2e%2e` proxy segments bypass the eight-pass decode guard and still normalize onto `architecture/draft/*` while `isAnonymousMarketingProxyPath` skips bearer auth — **hit 2026-08-23:** reject proxy segments and return paths that remain percent-encoded after the decode guard.

---

## Zone: security-analyzers

- **id:** security-analyzers
- **status:** open
- **impact:** high
- **aliases:** require authorization analyzer; tenant identity boundary; mutating controller audit
- **paths:** ArchLucid.Analyzers/RequireAuthorizationAnalyzer.cs; ArchLucid.Analyzers/TenantIdentityBoundaryAnalyzer.cs; ArchLucid.Analyzers/MutatingControllerAuditAnalyzer.cs
- **test-filter:** FullyQualifiedName~RequireAuthorizationAnalyzer|FullyQualifiedName~TenantIdentityBoundaryAnalyzer|FullyQualifiedName~MutatingControllerAuditAnalyzer
- **hunts:** 3
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — AL0001 false-positive when `[Authorize]` is on implemented interface methods or interface type
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
- **hunts:** 4
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Analysis compares runs from different tenants when scope keys collide — rollup/compare loads runs via `IRunDetailQueryService` + `ScopeContext`; manifest reads are tenant-scoped; export records key on globally unique run GUIDs
- [x] (candidate) Quality delta treats a failed run as higher quality than a succeeded run — **fixed 2026-08-18:** missing knowledge model substituted empty model, zeroing uncovered-mandatory "after" counts
- [x] (proven) Compare summary omits manifest datastore/relationship diffs that exist in the source run — **fixed 2026-08-23:** `MarkdownEndToEndReplayComparisonSummaryFormatter` only listed services/controls while `EndToEndReplayComparisonExportService` already surfaced datastores and relationships
- [x] (proven) `CompletionStateDiffers` false when both runs completed at different times — **hit 2026-08-23:** `BuildRunDiff` only set the flag for null-vs-non-null `CompletedUtc`; export showed "Completion State Differs: No" while `ChangedFields` listed `CompletedUtc`
- [x] (proven) Compare quality delta populated on report but omitted from markdown/HTML/DOCX/PDF exports — **hit 2026-08-24:** `AddCompareQualityDeltaAsync` set `CompareQualityDelta` but export formatters never surfaced the stratified counts
- [x] (proven) Manifest diff skipped when `CurrentManifestVersion` asymmetric — **hit 2026-08-24:** `BuildAsync` gated `IManifestDiffService.Compare` on both runs having non-empty version metadata even when both manifest bodies were loaded

---

## Zone: application-billing-logic

- **id:** application-billing-logic
- **status:** open
- **impact:** high
- **aliases:** marketplace billing; checkout mutation; billing application layer
- **paths:** ArchLucid.Application/Billing/
- **test-filter:** FullyQualifiedName~Marketplace|FullyQualifiedName~BillingCheckout|FullyQualifiedName~TenantLlmCostReporting
- **hunts:** 3
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
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

---

## Zone: application-pilots

- **id:** application-pilots
- **status:** open
- **impact:** medium
- **aliases:** buyer proof pack; board pack; pilot artifacts
- **paths:** ArchLucid.Application/Pilots/
- **test-filter:** FullyQualifiedName~BuyerProofPack|FullyQualifiedName~BoardPack
- **hunts:** 3
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — snapshot muted severity buckets; unresolved PilotStrict pass; scorecard ready-for-commit counted as committed; buyer proof summary omitted governed coverage
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Proof pack includes findings from a workspace outside the pilot scope — `GetRunDetailAsync` and `ValueReportBuilder.BuildAsync` both honor current `ScopeContext`; no cross-workspace join in pack builders (`PilotReportCardService.EnsureScopeMatches` pattern elsewhere).
- [x] (candidate) PDF builder silently drops a section when source data is missing — **partial 2026-08-18:** snapshot fallback populated severity counts but left governed-coverage and top-finding unset (buyer proof / first-value surfaces)
- [x] (invalid) Pack builder uses cached tenant data after a scope switch — `BuyerProofPackBuilder` / `BoardPackPdfBuilder` do not use `IMemoryCache`; only `PilotOutcomeSummaryService` caches and keys include workspace id.
- [x] (proven) `PilotRunDeltaComputer` agent-results path counts operator-muted findings in severity buckets and can select a muted row as top finding while snapshot fallback and `FirstValueReportBuilder.FormatSponsorTopFindings` exclude `IsMuted` — buyer proof ZIP deltas JSON overstated suppressed findings (hunt 2026-08-23).
- [x] (proven) Snapshot fallback severity buckets include `IsMuted` findings — **hit 2026-08-24:** `AggregateFindingsBySeverity(IReadOnlyList<Finding>)` omitted mute filter while governed coverage and top-finding paths filtered; regression in `ComputeAsync_WhenSnapshotFallbackIncludesMutedFindings_ExcludesThemFromSeverityBuckets`.
- [x] (proven) Unresolved PilotStrict trace query reported satisfied sponsor evidence — **hit 2026-08-24:** `PilotProofPackageCompletenessMapper` treated `AgentOutputPilotStrictSignalsResolved=false` as pass; fixed with explicit resolved check plus gate soft-gap (`Build_UnresolvedPilotStrictSignals_FlagsEvidenceUnsatisfied`).
- [x] (proven) `PilotScorecardBuilder` counted `ReadyForCommit` runs with manifest ids as committed — **hit 2026-08-24:** predicate used manifest version/id only; fixed to require `LegacyRunStatus == Committed` (`PilotScorecardBuilderTests.BuildAsync_ReadyForCommitRunWithManifest_IsNotCountedAsCommitted`).
- [x] (proven) Buyer proof `artifact-and-proof-summary.md` omitted governed-finding coverage — **hit 2026-08-24:** `BuyerProofPackArtifactSummaryBuilder` ignored `governedFindingCoverage` in deltas JSON (`BuyerProofPackArtifactSummaryBuilderTests.Build_WhenGovernedFindingCoveragePresent_EmitsGovernedCoverageSection`).

---

## Zone: agent-runtime-evaluation

- **id:** agent-runtime-evaluation
- **status:** open
- **impact:** medium
- **aliases:** agent evaluation; evaluation runner
- **paths:** ArchLucid.AgentRuntime/Evaluation/
- **test-filter:** FullyQualifiedName~Evaluation
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Evaluation runner scores a failed trace as passed — warn-only gate records parse failures without rejecting; pilot strict rejects unparsed output (`AgentOutputTraceQualityEvaluatorTests`).
- [x] (invalid) Runner uses a golden fixture from a different tenant's catalog — reference cases load from a single configured JSON path, not tenant-scoped catalogs (`AgentOutputReferenceCaseCatalog`).
- [x] (invalid) Batch evaluation swallows per-item failures and reports aggregate success — `AgentOutputEvaluationRecorder` evaluates each latest-per-task trace independently via `Task.WhenAll`.
- [x] (proven) Architecture finding confidence enrichment uses the first trace per agent type — **hit 2026-08-18:** `AgentArchitectureFindingConfidenceEnricher` keyed traces by `AgentType` instead of `TaskId`, so multiple tasks of the same agent type inherited the wrong schema/reference signals.
- [x] (proven) Findings snapshot confidence enrichment uses superseded or wrong trace — **hit 2026-08-19:** `FindingsSnapshotEvaluationConfidenceEnricher` grouped raw traces by `AgentType` and took `First()`, ignoring `AgentExecutionTraceLatestPerTaskSelector` and mis-scoring retried tasks.
- [x] (proven) PilotStrict sponsor evidence gate evaluates superseded auto-retry traces — **hit 2026-08-21:** `RunAgentOutputPilotEvidenceAggregator.WouldPilotStrictBlockSponsorEvidenceAsync` iterated all persisted traces; a rejected first attempt blocked sponsor evidence even when the latest retry passed PilotStrict.
- [x] (proven) Confidence enrichment ignores PilotStrict faithfulness rejection — **hit 2026-08-23:** `ComputeQualityGateAcceptedForConfidenceAsync` and both confidence enrichers evaluated traces without run evidence/faithfulness, so `schemaPassed` stayed true on outputs PilotStrict would reject for low agent-result faithfulness support.

---

## Zone: decisioning

- **id:** decisioning
- **status:** open
- **impact:** medium
- **aliases:** decisioning engine; findings merge; advisory alerts
- **paths:** ArchLucid.Decisioning/
- **test-filter:** FullyQualifiedName~Decisioning|FullyQualifiedName~FindingsMerge
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (valid-no-repro) Merge keeps conflicting findings from two agents without deduplication — `FindingSnapshotConfluentMerger` dedupes payload-equal partitions and emits `finding-merge-conflict` for payload-unequal keys; `FindingsOrchestratorTests.GenerateFindingsSnapshotAsync_payload_conflict_is_confluent`.
- [x] (proven) Advisory alert fires for a finding outside the run scope — **hit 2026-08-18:** `AlertEvaluator` / `AlertMetricSnapshotBuilder` did not filter `RecommendationRecords` by `context.RunId`.
- [x] (proven) Comparison security improvements emit false `SecurityRegression` advisory signals — **hit 2026-08-19:** `ImprovementSignalAnalyzer` treated any `SecurityDelta` status change as regression, including NonCompliant→Compliant and newly added controls.
- [x] (valid-no-repro) Compliance gate passes when required evidence nodes are absent — `GraphComplianceEvaluator` flags uncovered required nodes; golden path tests confirm.
- [x] (proven) `SecurityDeltaRegressionClassifier` treats negated compliant phrases as good status — **hit 2026-08-23:** substring match on `compliant` ranked `Not Compliant` and `Non Compliant` as rank 2, so Compliant→Not Compliant deltas emitted no `SecurityRegression` signal.
- [x] (proven) `SecurityDeltaRegressionClassifier` substring tokens (`on`, `pass`, `off`) matched inside unrelated words — **hit 2026-08-24:** `Information only` ranked as compliant and `Bypass` as pass, emitting false `SecurityRegression` signals; fixed with whole-token matching.

---

## Zone: persistence-identity

- **id:** persistence-identity
- **status:** open
- **impact:** high
- **aliases:** identity repository; authentication identity dapper
- **paths:** ArchLucid.Persistence/Identity/
- **test-filter:** FullyQualifiedName~AuthenticationIdentity|FullyQualifiedName~IdentityRepository
- **hunts:** 3
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** no

### Hypotheses

- [x] (invalid) Identity lookup by email returns a user from another tenant — `IAuthenticationIdentityRepository` has no email lookup; sign-in domain routing uses global domain keys by design.
- [x] (invalid) Link/unlink writes succeed without scoping to the caller tenant — persistence repos are record-oriented; caller tenant enforcement lives in application services.
- [x] (valid-no-repro) Cached identity read returns stale data after a tenant-scoped upsert — `CachingSecondaryReferenceDataRepositoryTests` proves eviction after upsert/insert for tenant IdP config and sign-in domains.
- [x] (proven) `InMemoryAuthenticationIdentityRepository.ReEnableAsync` reclaimed a disabled external key while another active identity already held it — **hit 2026-08-23:** in-memory store ignored the SQL filtered unique index (`UX_AuthenticationIdentities_ExternalKey WHERE DisabledUtc IS NULL`) and dual-activated the same external key.
- [x] (proven) `InMemoryTenantSignInEmailDomainRepository.FindByNormalizedDomainAsync` / `ListByTenantIdAsync` return soft-removed domains (`RemovedUtc` set) that `DapperTenantSignInEmailDomainRepository` excludes via `RemovedUtc IS NULL` — **hit 2026-08-23:** in-memory reads ignored soft-delete filter on all three query methods; dev/test routing could resurrect removed sign-in domains.
- [x] (proven) `DapperAuthenticationIdentityRepository.ReEnableAsync` threw on filtered unique-index violation — **hit 2026-08-24:** re-enabling a disabled identity while another active row held the same external key surfaced `SqlException` 2601/2627 instead of returning `false` like `InMemoryAuthenticationIdentityRepository`.
- [x] (proven) `InMemoryPlatformTenantAuthRecoveryGrantRepository.RevokeAsync` was not idempotent — **hit 2026-08-24:** second revoke returned `true` while Dapper only updates rows with `RevokedUtc IS NULL`, masking double-revoke regressions in dev/test.
- [x] (proven) `InMemoryTenantSignInEmailDomainRepository.UpdateAsync` could reassign domains across tenants — **hit 2026-08-24:** update keyed only by `NormalizedDomain`, unlike Dapper's `(TenantId, NormalizedDomain)` predicate, so a mismatched tenant id silently hijacked sign-in routing in memory hosts.

---

## Zone: retrieval

- **id:** retrieval
- **status:** open
- **impact:** medium
- **aliases:** retrieval indexing; embedding; pricing retrieval
- **paths:** ArchLucid.Retrieval/
- **test-filter:** FullyQualifiedName~Retrieval|FullyQualifiedName~Indexing
- **hunts:** 4
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — embedding cache ignored model identity; Azure Search delete truncated at 1000 chunks; iterative retrieval exceeded TopK; malformed policy-pack ContentJson threw
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

---

## Zone: ui-oidc

- **id:** ui-oidc
- **status:** open
- **impact:** high
- **aliases:** oidc authority; sign-in routing; OIDC host
- **paths:** archlucid-ui/src/lib/oidc/
- **test-filter:** oidc-authority|oidc
- **hunts:** 11
- **bugs-found:** 14
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** no

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
- [x] (proven) Stale refresh `finally` clears the replacement session's in-flight guard — **hit 2026-08-23 hunt #42:** `ensureAccessTokenFresh` always set `refreshInFlight = null` in `finally`, so when a prior-session refresh completed after `clearOidcSession` and a replacement refresh had started, the stale `finally` nulled the guard and parallel API callers fired a duplicate IdP refresh (`invalid_grant` risk); fixed by clearing `refreshInFlight` only when it still references the completing promise.
- [x] (proven) Negative `expires_in` from token response writes a past expiry and breaks the session — **hit 2026-08-23:** `persistTokenResponse` stored `Date.now() + negative expires_in`, so a malformed IdP payload left the access token immediately expired and could tight-loop refresh; fixed by falling back to the default lifetime for negative values while still honoring zero.
- [x] (proven) Missing `access_token` in token response persists the literal string `"undefined"` — **hit 2026-08-23:** `sessionStorage.setItem` coerced `undefined` to `"undefined"`, so `isLikelySignedIn` returned true and API calls sent `Bearer undefined`; fixed by rejecting empty or non-string access tokens before writing session keys.
- [x] (proven) Malformed OIDC discovery document missing endpoints is cached permanently — **hit 2026-08-24:** `loadDiscoveryDocument` cached any HTTP 200 JSON body, so a partial discovery payload blocked sign-in, refresh, and logout discovery until a full page reload; fixed by validating required endpoints and evicting invalid documents from the cache.
- [x] (proven) Token endpoint OAuth error returned with HTTP 200 is treated as a token response — **hit 2026-08-24:** `postTokenForm` only parsed OAuth `error` bodies when `response.ok` was false, so `invalid_grant` in a 200 body threw on missing `access_token` and `ensureAccessTokenFresh` kept a stale refresh token instead of clearing the session; fixed by rejecting OAuth error JSON before returning token responses.
- [x] (proven) String `expires_in` from token response falls back to default lifetime — **hit 2026-08-24:** `resolveExpiresInSeconds` used `Number.isFinite` on the raw value, so IdPs that serialize `expires_in` as a JSON string were treated as non-finite and given the 3600s default; fixed by coercing with `Number()` before validation.

---

## Zone: archlucid-core

- **id:** archlucid-core
- **status:** open
- **impact:** high
- **aliases:** core domain; security policies; tenancy models
- **paths:** ArchLucid.Core/
- **test-filter:** FullyQualifiedName~ArchLucid.Core
- **hunts:** 7
- **bugs-found:** 10
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — IPv6 ULA SSRF bypass; PascalCase alert routing metadata; FindingJsonConverter severity downgrade; Marketplace PlanId casing
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] (proven) URL allow-list policy accepts a credential-bearing redirect target — **hit 2026-08-18:** outbound HTTPS URL policies allowed `https://user:pass@host` because only scheme/host were validated; embedded userinfo now rejected.
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

---

## Zone: archlucid-contracts

- **id:** archlucid-contracts
- **status:** open
- **impact:** low
- **aliases:** API contracts; DTO serialization; OpenAPI models
- **paths:** ArchLucid.Contracts/
- **test-filter:** FullyQualifiedName~Contracts
- **hunts:** 5
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
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
- [ ] (hunt-ready) `ArchLucid.Contracts/Common/AgentType.cs` is one-based while generated `Gen.AgentType` is zero-based; `GenNumericEnumBridgeJson` can round-trip contract `Topology` ordinal `1` into generated `Cost`, producing the wrong agent type in CLI mapping.
- [ ] (hunt-ready) Global API enum conversion still permits out-of-range numeric `StructuralExecutionMode`, `FindingEnforcementTier`, `FindingHumanReviewStatus`, and `FindingTreatment`; unlike protected sibling enums, these types have no defined-value converter, so ordinal `99` may reach downstream switches.
- [ ] (hunt-ready) `FindingJsonConverter` reads `humanReviewStatus` only when the token is a string; persisted JSON with numeric `1` leaves the default `NotRequired`, silently downgrading pending review state on round trip.
- [ ] (hunt-ready) `AgentResultClaimListJsonConverter` flattens structured claim text but ignores an entry-level `evidenceRefs` array, so `{"detail":"Subnet missing","evidenceRefs":["pol-123"]}` loses its evidence linkage.

---

## Zone: context-ingestion

- **id:** context-ingestion
- **status:** open
- **impact:** medium
- **aliases:** context ingestion; connector stages; canonicalization
- **paths:** ArchLucid.ContextIngestion/
- **test-filter:** FullyQualifiedName~ContextIngestion|FullyQualifiedName~Canonicalization
- **hunts:** 4
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
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

---

## Zone: knowledge-graph-provenance

- **id:** knowledge-graph-provenance
- **status:** open
- **impact:** medium
- **aliases:** knowledge graph; provenance; lineage
- **paths:** ArchLucid.KnowledgeGraph/; ArchLucid.Provenance/
- **test-filter:** FullyQualifiedName~KnowledgeGraph|FullyQualifiedName~Provenance
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
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

---

## Zone: notifications-pipeline

- **id:** notifications-pipeline
- **status:** open
- **impact:** medium
- **aliases:** notifications; email dispatchers beyond weekly summary
- **paths:** ArchLucid.Notifications/; ArchLucid.Application/Notifications/; ArchLucid.Api/Controllers/Advisory/DigestSubscriptionsController.cs
- **test-filter:** FullyQualifiedName~Notifications|FullyQualifiedName~EmailDispatcher|FullyQualifiedName~DigestSubscriptionsController
- **hunts:** 5
- **bugs-found:** 11
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
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

---

## Zone: artifact-synthesis

- **id:** artifact-synthesis
- **status:** open
- **impact:** medium
- **aliases:** artifact synthesis; docx generator; packaging sanitization
- **paths:** ArchLucid.ArtifactSynthesis/
- **test-filter:** FullyQualifiedName~ArtifactSynthesis|FullyQualifiedName~Docx
- **hunts:** 2
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — reference markdown dropped constraints; unresolved issues omitted finding ids; bundle validator skipped hash verify; filename sanitizer missed unicode slash homoglyphs
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Generated document embeds unsanitized user HTML/script — `LlmArtifactFreeTextSanitizer` and `WordDocumentBuilder` emit plain OpenXML text nodes (control/bidi strip only); DOCX does not execute embedded markup as script
- [x] (invalid) Packager includes artifacts from a run outside the requested scope — `ArtifactPackagingService` only zips the `artifacts` list passed by the caller; no cross-run artifact selection locus in this zone
- [x] (invalid) Validation passes when required manifest hash is missing — `ExportManifestBuilder` intentionally writes empty `committedManifestHash` when `RunExportReadmeContext.ManifestHash` is absent; `ArtifactBundleValidator` does not model manifest-hash enforcement (see `ArtifactPackagingServiceExportManifestTests`)
- [x] (proven) `ReferenceArchitectureMarkdownGenerator` hardcoded `## Constraints` as `Not specified.` — **hit 2026-08-24:** committed `MandatoryConstraints` / `Preferences` dropped while `ArchitectureNarrativeArtifactGenerator` emitted them; regression in `ReferenceArchitectureMarkdownGenerator_GenerateAsync_emits_committed_constraints_not_not_specified`
- [x] (proven) `UnresolvedIssuesArtifactGenerator` dropped `SupportingFindingIds` — **hit 2026-08-24:** JSON projection omitted finding provenance; regression in `GenerateAsync_preserves_supporting_finding_ids`
- [x] (proven) `ArtifactBundleValidator` fail-open on content-hash mismatch — **hit 2026-08-24:** required non-empty hash but never compared to `ArtifactHashing.ComputeHash`; regression in `Validate_when_content_hash_mismatch_throws`
- [x] (proven) `FileNameSanitizer` allowed Unicode slash homoglyphs in export paths — **hit 2026-08-24:** fullwidth solidus U+FF0F survived sanitization; regression in `FileNameSanitizer_replaces_invalid_windows_characters` (`..／..／manifest.json`)

---

## Zone: host-composition

- **id:** host-composition
- **status:** open
- **impact:** medium
- **aliases:** host composition; DI registration; startup modules
- **paths:** ArchLucid.Host.Composition/
- **test-filter:** FullyQualifiedName~Host.Composition|FullyQualifiedName~ServiceCollectionExtensions
- **hunts:** 5
- **bugs-found:** 7
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — data archival health check stayed registered when offloaded; SCIM rotation reminder on Api role; LLM budget reclaim without leader election; value report async poll failed across replicas
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

---

## Zone: cloud-extractors

- **id:** cloud-extractors
- **status:** open
- **impact:** high
- **aliases:** aws extractor; gcp extractor; azure extractor
- **paths:** ArchLucid.Integrations.AwsExtractor/; ArchLucid.Integrations.GcpExtractor/; ArchLucid.Integrations.AzureExtractor/
- **test-filter:** FullyQualifiedName~AwsExtractor|FullyQualifiedName~GcpExtractor|FullyQualifiedName~AzureExtractor
- **hunts:** 6
- **bugs-found:** 9
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — AWS STS AssumeRoleWithWebIdentity always used commercial `us-east-1` instead of connection region
- **related-pd-tb:** none
- **code-changed-since:** no

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

---

## Zone: api-authority-admin-controllers

- **id:** api-authority-admin-controllers
- **status:** open
- **impact:** high
- **aliases:** authority controllers; admin controllers
- **paths:** ArchLucid.Api/Controllers/Authority/; ArchLucid.Api/Controllers/Admin/
- **test-filter:** FullyQualifiedName~AuthorityController|FullyQualifiedName~AdminController
- **hunts:** 6
- **bugs-found:** 9
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — bulk outbox dead-letter retry ignored caller tenant scope; unrecognized replay mode ran destructive rebuild; invalid run id returned 400 on graph/pin reads
- **related-pd-tb:** none
- **code-changed-since:** yes

### Hypotheses

- [x] Admin mutating endpoint lacks tenant binding on route parameters — (proven): `RunsController` request endpoints (2026-08-18); `AdminController.ArchiveRunsByIds` called global `ArchiveRunsByIdsAsync` without `GetByIdAsync(scope, …)` filter (2026-08-18); `AdminController.ArchiveRunsBatch` called global `ArchiveRunsCreatedBeforeAsync` without scoped cutoff filter (2026-08-22); `AdminDiagnosticsService` integration outbox dead-letter list/retry/suppress/curl called `IIntegrationEventOutboxRepository` without `scope.TenantId` (2026-08-23); bulk `RetryIntegrationOutboxDeadLettersAsync` still passed `request.TenantId` to `RetryMatchingDeadLettersAsync` (2026-08-24)
- [x] (proven) Unrecognized `ReplayMode` on authority replay fell through to `DecideAsync` + manifest persist — `AuthorityReplayService.ReplayAsync` only special-cased `ReconstructOnly`; unknown modes matched rebuild path (2026-08-24)
- [x] (proven) Invalid run id on authority graph/pin reads returned 400 while sibling `GetRun` returned 404 — `RunQueryController.GetInteractiveGraphSnapshot`, `RunsController.PinRun` (2026-08-24)
- [x] Authority read returns artifacts for a run in another workspace — fixed ComparisonsController scoped load (2026-08-17)
- [x] (valid-no-repro) Controller accepts a scope header that overrides the authenticated tenant — `ScopeIdentityBindingMiddleware` + `ScopeIdentityBindingIntegrationTests` (TB-072/TB-925) reject mismatched headers on Authority/Admin routes; `HttpScopeContextProvider` prefers claims over headers

---

## Zone: api-governance-tenancy-controllers

- **id:** api-governance-tenancy-controllers
- **status:** open
- **impact:** high
- **aliases:** governance controllers; tenancy controllers
- **paths:** ArchLucid.Api/Controllers/Governance/; ArchLucid.Api/Controllers/Tenancy/
- **test-filter:** FullyQualifiedName~GovernanceController|FullyQualifiedName~TenancyController
- **hunts:** 3
- **bugs-found:** 3
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) `PolicyPacksController.Publish` / `PolicyPacksAppService.TryPublishVersionAsync` — cross-tenant publish: caller scope tenant B + pack id owned by tenant A → HTTP 200 and version row upserted (reads already 404 on scope mismatch; publish omitted tenant/workspace/project check)
- [x] (invalid) Tenancy suspend endpoint affects a tenant id from the body not the principal — no suspend action under `ArchLucid.Api/Controllers/Tenancy/`
- [x] (invalid) List endpoint omits tenant predicate when workspace filter is empty — `PolicyPacksController.ListVisiblePacksAsync` always passes `scope.TenantId` into `ListByScopeAsync` (`WHERE TenantId = @TenantId`)
- [x] (proven) `PolicyPacksController.SimulateBulk` — pack id from another tenant scope → dry-run evaluates foreign pack content (only `IsDeleted` checked, not tenant/workspace/project vs `scope`) (2026-08-23)
- [x] (proven) `PolicyPacksController.Publish` omitted tenant/workspace/project scope check before `PublishVersionAsync` — cross-tenant publish returned 200 (ledger hit 2026-08-18; controller guard added 2026-08-24).
- [x] (proven) `PolicyPacksController.Assign` omitted pack scope check — foreign pack id with existing version created assignment rows in caller tenant scope (2026-08-24).

---

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
- **hunts:** 4
- **bugs-found:** 4
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24 — waiver expiry reminder swallowed provider send failures and returned success while the ledger blocked retry
- **related-pd-tb:** none
- **code-changed-since:** 0

### Hypotheses

- [x] (invalid) Policy pack diff includes rules from a seeded pack in another tenant — retired: `PolicyPackBeforeAfterDiffComposer` and `PolicyPackBeforeAfterConfigurationSnapshotBuilder` operate on in-memory pack content and findings passed in; `DefaultPolicyPackSeeder` uses tenant-scoped repositories
- [x] (invalid) Coverage calculator counts a waived finding as still open — retired: no coverage calculator in `Governance/`; waiver expiry uses `GovernanceWaiverExpiryWindow` / `GovernanceDecisionsNeededSummaryCalculator` distinct-finding union, not open-finding counts
- [x] (invalid) Default policy pack activation skips required approval metadata — retired: `DefaultPolicyPackSeeder` platform bootstrap calls `CreatePackAsync` / `PublishVersionAsync` / `AssignAsync` by design for bundled defaults, not operator approval flow
- [ ] (hunt-ready) `PreCommitGovernanceGate.SimulateSyntheticFindingsInternalAsync` returns `Allowed()` when scoped `GetByIdAsync(runId)` returns null before applying synthetic Critical findings; a foreign-tenant or missing run id can receive an HTTP success that reports the simulated gate as allowed.
- [x] (proven) Policy-pack before/after snapshot marks advisory findings as blocking commit — `PolicyPackBeforeAfterConfigurationSnapshotBuilder` used severity-only check instead of `PreCommitGateResult.BlockingFindingIds` (fixed 2026-08-20)
- [x] (proven) Governance dry-run skips pre-commit enforcement for PascalCase metadata keys — **hit 2026-08-21:** `PolicyPackGovernanceDryRunService` read `blockCommitOnCritical` / `blockCommitMinimumSeverity` via case-sensitive `metadata.TryGetValue`, so JSON-deserialized metadata with `BlockCommitOnCritical` never activated the gate
- [x] (proven) Focused pilot execute-time snapshot excludes pinned organization packs that preview and commit capture include — **hit 2026-08-23:** `EffectiveGovernanceSnapshotBuilder` used `IsAllowedPackDisplayName` instead of `IsPackAllowedInFocusedReview`, dropping pinned org and platform-overlay packs from execute-time `PackAssignments`
- [x] (proven) Waiver expiry reminder swallows provider send failures and counts the reminder as sent — **hit 2026-08-24:** `WaiverExpiryNotificationService.TrySendReminderAsync` reserved the ledger then caught `SendAsync` exceptions without rethrowing, so `RunTenantPassAsync` returned success while recipients received no mail and idempotency blocked resend; fixed by rethrowing after log (ExecDigest pattern)

---

## Zone: application-tenancy-lifecycle

- **id:** application-tenancy-lifecycle
- **status:** open
- **impact:** high
- **aliases:** tenant suspend; tenant migration; trial bootstrap
- **paths:** ArchLucid.Application/Tenancy/
- **test-filter:** FullyQualifiedName~Tenancy|FullyQualifiedName~TenantSuspend|FullyQualifiedName~TenantMigration
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (invalid) Suspend leaves mutating API paths active for the tenant — retired: `TenantSuspendCommandService` persists suspend state; mutating-path enforcement lives in API middleware/filters outside this folder
- [x] (invalid) Migration copies rows without rewriting tenant id on child tables — retired: `TenantCatalogMigrationOrchestrator` coordinates suspend/projection refresh/verification; no catalog row-copy logic in `ArchLucid.Application/Tenancy/`
- [x] (invalid) Trial bootstrap creates resources under a host catalog tenant id — retired: `TrialTenantBootstrapService` scopes `AmbientScopeContext` to `result.TenantId` and uses `ContosoRetailDemoIds.ForTenant(result.TenantId)`
- [x] (proven) Migration verification passes without workspace/project scope on committed run candidate — `TenantMigrationVerificationProbe.RunAsync` omitted scope-id validation before scoped read probe (fixed 2026-08-20)
- [x] (proven) Projection refresh stage advances before `RefreshAsync` completes — `TenantCatalogMigrationOrchestrator.RunProjectionRefreshAsync` updated stage to `ProjectionRefresh` before calling refresh; failed refresh blocked retry and allowed `RunVerificationAsync` to skip incomplete refresh (fixed 2026-08-23)

---

## Zone: host-core-coordination

- **id:** host-core-coordination
- **status:** open
- **impact:** medium
- **aliases:** host coordination; export outbox; backfill
- **paths:** ArchLucid.Host.Core/Coordination/
- **test-filter:** FullyQualifiedName~Coordination|FullyQualifiedName~OutboxProcessor
- **hunts:** 2
- **bugs-found:** 2
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) `CosmosGraphSnapshotOutboxProcessor.ProcessEntryAsync` loads SQL with outbox `ScopeContext` but `CosmosGraphSnapshotRepository.SaveAsync` reads `IScopeContextProvider.GetCurrentScope()`; without `AmbientScopeContext.Push`, worker background drain tags Cosmos documents with dev-default tenant triple instead of the outbox entry scope — fixed 2026-08-20 (`CosmosGraphSnapshotOutboxProcessorTests.ProcessPendingBatchAsync_pushes_ambient_scope_before_cosmos_save`)
- [x] (invalid) Outbox processor pushes export blobs to a destination for the wrong tenant — `RunExportBlobPushOutboxProcessor` passes explicit `ScopeContext` into `IRunExportPackageBuilder.BuildAsync`; export path does not read ambient scope
- [x] (invalid) Backfill job replays events without idempotency keys — backfill lives under `ArchLucid.Persistence/Coordination/Backfill`, not this zone
- [x] (invalid) Coordination lease is not released and blocks all replicas — lease acquire/release is in SQL `DequeuePendingAsync`, not in `RecoverableOutboxProcessorBase` shell
- [x] (proven) `CosmosGraphSnapshotOutboxProcessor.VerifyOptions` mutates the bound `IOptions` instance (`configured.LeaseDurationSeconds = 60`) instead of returning a normalized copy like sibling processors; first drain permanently changes the DI-bound lease for later readers — fixed 2026-08-23 (`CosmosGraphSnapshotOutboxProcessorTests.ProcessPendingBatchAsync_clamps_short_lease_without_mutating_bound_options`)
- [x] (valid-no-repro) `PostCommitProjectionOutboxProcessor` dispatches `IacStubGeneration` without ambient scope so `FindingIacStubGenerator` reads dev-default tenant — ambient is pushed in `ProcessEntryAsync` before `DispatchWorkTypeAsync`; no repro on current code

---

## Zone: ui-operator-routes

- **id:** ui-operator-routes
- **status:** open
- **impact:** medium
- **aliases:** operator shell routes; operator pages
- **paths:** archlucid-ui/src/app/(operator)/
- **test-filter:** operator
- **hunts:** 5
- **bugs-found:** 5
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-23
- **last-bug:** 2026-08-23
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [x] (proven) Architecture scorecard `usePilotScorecardPage.onSaveBaselines` PUT `/api/proxy/v1/pilots/scorecard/baselines` omitted `mergeRegistrationScopeForProxy` while reads use scoped `getPilotScorecard` — save lands on proxy dev-default tenant, refetch reads operator-selected tenant (save appears to no-op) — fixed 2026-08-20 (`use-pilot-scorecard-page.test.tsx`)
- [x] (proven) Baseline settings GET/PUT `/api/proxy/v1/tenant/baseline` omitted `mergeRegistrationScopeForProxy` — load/save hit proxy dev-default tenant instead of operator-selected scope (baseline appears not to stick after save) — fixed 2026-08-21 (`page.test.tsx` forwards operator scope headers when loading and saving tenant baseline)
- [x] (valid-no-repro) Stale react-query cache shows the previous tenant after scope switch — `usePilotScorecardQuery` scope-less key is a real gap on `/insights/architecture-scorecard`, but not reproved this hunt; sponsor/scorecard cache invalidation remains open if scope-switch stale data is reported
- [x] (invalid) Error boundary hides a 403 and renders an empty success state — no operator-route locus where a 403 is caught and replaced with empty success; compare/governance surfaces surface load failures explicitly
- [x] (proven) Billing wallet GET/PUT `/api/proxy/v1/billing/wallet` omitted `mergeRegistrationScopeForProxy` — load/save hit proxy dev-default tenant instead of operator-selected scope (wallet settings appear not to stick after save) — fixed 2026-08-22 (`OperatorBillingWalletPanel.test.tsx`)
- [x] (proven) Architecture intelligence `getJson`/`postJson` in `architecture-intelligence-client-api.ts` omitted `mergeRegistrationScopeForProxy` — product-run source-context load and reasoning POSTs hit proxy dev-default tenant instead of operator-selected scope (hydrated review context wrong or missing after scope switch) — fixed 2026-08-23 (`architecture-intelligence-client-api.test.tsx`)
- [x] (proven) `AdminEvidenceProposalsPageClient` GET `/api/proxy/v1/admin/evidence/proposals` and POST promote omitted `mergeRegistrationScopeForProxy` — list/promote hit proxy dev-default tenant instead of operator-selected scope (wrong tenant proposals shown or promote lands on wrong catalog) — fixed 2026-08-23 (`AdminEvidenceProposalsPageClient.test.tsx`)

---

## Zone: ui-marketing-surfaces

- **id:** ui-marketing-surfaces
- **status:** open
- **impact:** low
- **aliases:** marketing pages; pricing; trust center UI
- **paths:** archlucid-ui/src/app/(marketing)/
- **test-filter:** marketing
- **hunts:** 4
- **bugs-found:** 6
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
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

---

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
- **hunts:** 5
- **bugs-found:** 8
- **consecutive-dry-hunts:** 0
- **last-hunt:** 2026-08-24
- **last-bug:** 2026-08-24
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

---

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
- **hunts:** 0
- **bugs-found:** 0
- **consecutive-dry-hunts:** 0
- **last-hunt:** never
- **last-bug:** never
- **related-pd-tb:** none
- **code-changed-since:** unknown

### Hypotheses

- [ ] (hunt-ready) `ArchitectureRunExecuteOrchestrator` releases an acquired ownership lease with `CancellationToken.None` after `ExecuteRunCoreAsync` is cancelled; a hanging release during host drain can retain ownership until TTL and make a second execute return conflict.
- [ ] (hunt-ready) A cancellation after ownership acquisition but before durable execution state transition can expose different retry behavior between the direct API execute path and the background-job execute path.

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

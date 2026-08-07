> **Scope:** Maps saved Mermaid zoom-in diagrams to ADRs and library docs they illustrate.
> **Spine doc:** [`../START_HERE.md`](../START_HERE.md) · **Diagrams:** [`architecture_diagrams/README.md`](architecture_diagrams/README.md) · **C4 sync:** [`C4_MERMAID_SYNC.md`](C4_MERMAID_SYNC.md)

# Diagram ↔ ADR overlay

Use this table when updating a diagram or ADR so narrative and pictures stay aligned.

| Diagram stem | Primary ADRs | Library / security anchors |
|--------------|--------------|----------------------------|
| `archlucid-system-overview` | [0020](adrs/0020-azure-primary-platform-permanent.md) | `ARCHITECTURE_CONTAINERS.md`, poster |
| `archlucid-review-happy-path` | [0030](adrs/0030-coordinator-authority-pipeline-unification.md) | `ARCHITECTURE_FLOWS.md` Flow A |
| `archlucid-authority-pipeline` | [0030](adrs/0030-coordinator-authority-pipeline-unification.md), [0038](adrs/0038-run-durability-multi-store-outbox-production-secrets.md) | `CANONICAL_PIPELINE.md` |
| `archlucid-authority-vs-coordinator` | [0030](adrs/0030-coordinator-authority-pipeline-unification.md) | `ARCHITECTURE_FLOWS.md` Flow A1 |
| `archlucid-async-outbox-path` | [0038](adrs/0038-run-durability-multi-store-outbox-production-secrets.md), [0004](adrs/0004-transactional-outbox-retrieval-indexing.md) | `ORCHESTRATOR_RETRIES.md` |
| `archlucid-export-replay` | — | `ARCHITECTURE_FLOWS.md` Flow B |
| `archlucid-comparison-drift` | — | `ARCHITECTURE_FLOWS.md` Flow C; comparison snapshot contract |
| `archlucid-dotnet-project-graph` | — | `ARCHITECTURE_CONTAINERS.md` |
| `archlucid-governance-policy-packs` | — | Decisioning / policy pack docs |
| `archlucid-retrieval-rag` | [0004](adrs/0004-transactional-outbox-retrieval-indexing.md) | Retrieval / RAG quality docs |
| `archlucid-artifact-synthesis` | — | Artifact synthesis / consulting DOCX |
| `archlucid-security-model` | [0034](adrs/0034-segregation-of-duties-entra-oid-actor-keys.md), [0061](adrs/0061-ddos-protection-posture-v1.md) | Security day-one |
| `archlucid-tenant-isolation` | [0037](adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | `TENANT_ISOLATION_DEFENSE_IN_DEPTH.md` — **no SQL RLS** |
| `archlucid-azure-topology` | [0020](adrs/0020-azure-primary-platform-permanent.md), [0018](adrs/0018-background-workloads-container-apps-jobs.md) | Terraform / ops runbooks |
| `archlucid-operator-ui-shell` | [0059](adrs/0059-spa-bff-http-only-session-plan.md) | `operator-shell.md` |
| `archlucid-first-run-pilot` | — | Onboarding / pilot UX docs |
| `archlucid-integrations-itsm` | — | `INTEGRATION_EVENTS_AND_WEBHOOKS.md` |
| `archlucid-stage-*` | [0038](adrs/0038-run-durability-multi-store-outbox-production-secrets.md) | OTel spans `authority.*` |
| `archlucid-failure-resilience` | [0038](adrs/0038-run-durability-multi-store-outbox-production-secrets.md) | `ORCHESTRATOR_RETRIES.md` |
| `archlucid-failover-continuity` | [0020](adrs/0020-azure-primary-platform-permanent.md) | Tenant SQL topology runbook |
| `archlucid-threat-ask-rag` | [0037](adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | RAG tenancy / Ask controls |
| `archlucid-threat-webhooks` | — | INV-015 webhook spine |
| `archlucid-data-model-er` | — | `DATA_MODEL.md` / `ArchLucid.sql` |
| `archlucid-config-precedence` | — | `CONFIGURATION_REFERENCE.md`, config bridge sunset |
| `archlucid-authn-route-matrix` | [0037](adrs/0037-tenant-isolation-without-rls-defense-in-depth.md), [0041](adrs/0041-fail-closed-scope-derivation.md) | Tenant identity contract |
| `archlucid-pilot-day0-day1` | — | `CORE_PILOT.md`, first-run path |
| `archlucid-finops-cost` | — | `CAPACITY_AND_COST_PLAYBOOK.md` |
| `archlucid-observability-map` | — | `BACKGROUND_JOB_CORRELATION.md` |
| `archlucid-dr-failover-drill` | [0020](adrs/0020-azure-primary-platform-permanent.md) | `DATABASE_FAILOVER` runbook |
| `archlucid-policy-pack-sdlc` | — | `POLICY_PACK_CONTENT_BACKLOG.md` |
| `archlucid-api-surface-heatmap` | — | `API_CONTRACTS.md`, `OPERATOR_ATLAS.md` |
| `archlucid-evidence-intake` | — | Evidence intake operator guide |
| `archlucid-golden-manifest-anatomy` | — | Manifest / package sections |
| `archlucid-decision-trace-replay` | — | Decision trace walkthrough |
| `archlucid-billing-trial-marketplace` | [0015](adrs/0015-trial-tier-authentication-model.md), [0016](adrs/0016-billing-provider-abstraction.md) | V1_SCOPE commerce |
| `archlucid-scim-users-roles` | [0032](adrs/0032-scim-v2-service-provider.md) | SCIM_PROVISIONING |
| `archlucid-digest-alert-subscriptions` | — | Digests / integration events |
| `archlucid-hot-path-performance` | — | UI import-policy / list inventory |
| `archlucid-storage-provider-modes` | [0011](adrs/0011-inmemory-vs-sql-storage-provider.md), [0037](adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | Storage + topology |
| `archlucid-compliance-claim-honesty` | TB-135/136 Done; G-REAL-05 / G-ASSURANCE-02 open | Trust-center honesty |
| `archlucid-agent-task-simulator-matrix` | [0030](adrs/0030-coordinator-authority-pipeline-unification.md) | TB-1007 authority vs AgentTask |
| `archlucid-cloud-extractors` | — | Cloud connections / evidence intake |
| `archlucid-knowledge-graph-model` | [0036](adrs/0036-graph-rag-embedding-strategy.md) | KnowledgeGraph library |
| `archlucid-findings-taxonomy` | — | Findings / advisory |
| `archlucid-artifact-generator-registry` | — | ArtifactSynthesis |
| `archlucid-comparison-types-catalog` | — | COMPARISON_REPLAY |
| `archlucid-ask-thread-lifecycle` | — | ASK_RAG_THREAT_MODEL |
| `archlucid-hosted-services-inventory` | [0001](adrs/0001-hosting-roles-api-worker-combined.md), [0018](adrs/0018-background-workloads-container-apps-jobs.md) | Worker hosted services |
| `archlucid-demo-public-surfaces` | [0027](adrs/0027-demo-preview-cached-anonymous-commit-page.md) | Demo controllers |
| `archlucid-cli-command-map` | — | CLI_USAGE |
| `archlucid-terraform-root-order` | [0020](adrs/0020-azure-primary-platform-permanent.md) | DEPLOYMENT_TERRAFORM |
| `archlucid-llm-provider-adapters` | — | LLM / AgentExecution |
| `archlucid-secrets-keyvault-resolution` | [0038](adrs/0038-run-durability-multi-store-outbox-production-secrets.md) | CONFIGURATION_KEY_VAULT |
| `archlucid-kill-switches-circuit-breakers` | — | AOAI circuit breaker / Marketplace GA |
| `archlucid-outbound-webhook-delivery` | [0004](adrs/0004-transactional-outbox-retrieval-indexing.md) | INTEGRATION_EVENTS_AND_WEBHOOKS |
| `archlucid-audit-event-catalog` | — | AuditEventTypes |
| `archlucid-dbup-schema-migration` | — | SQL_SCRIPTS / DbUp |
| `archlucid-cache-layers` | — | HotPathCache / LLM cache |
| `archlucid-blob-content-addressed-layout` | [0011](adrs/0011-inmemory-vs-sql-storage-provider.md) | Artifact blob paths |
| `archlucid-notification-channel-matrix` | — | MICROSOFT_TEAMS_NOTIFICATIONS |
| `archlucid-rate-limiting-throttling` | [0061](adrs/0061-ddos-protection-posture-v1.md) | RateLimitingDefaults |
| `archlucid-private-link-network` | [0020](adrs/0020-azure-primary-platform-permanent.md) | terraform-private / PRIVATE_ENDPOINT_SETUP |
| `archlucid-container-deploy-units` | [0001](adrs/0001-hosting-roles-api-worker-combined.md), [0018](adrs/0018-background-workloads-container-apps-jobs.md) | Dockerfiles / ACA |
| `archlucid-ci-product-pipeline` | — | `.github/workflows/ci.yml` |
| `archlucid-golden-cohort-eval` | — | tests/golden-cohort |
| `archlucid-workspace-project-hierarchy` | [0037](adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | ScopeContext / soft-delete |
| `archlucid-entra-role-claims` | [0034](adrs/0034-segregation-of-duties-entra-oid-actor-keys.md) | terraform-entra / role claims |
| `archlucid-correlation-tracing` | — | CorrelationIdMiddleware |
| `archlucid-content-safety-ingress` | — | ContentSafety / prompt-injection |
| `archlucid-health-checks-catalog` | — | /health/live ready |
| `archlucid-hosting-roles-split` | [0001](adrs/0001-hosting-roles-api-worker-combined.md) | HostingRoleResolver |
| `archlucid-mutating-idempotency-keys` | — | ArchitectureRunIdempotency |
| `archlucid-soft-delete-retention-purge` | — | ArchitectureProjectRetention |
| `archlucid-manifest-commit-sod` | [0034](adrs/0034-segregation-of-duties-entra-oid-actor-keys.md) | GovernanceSegregationRules |
| `archlucid-export-package-formats` | — | ExportFormat / packaging |
| `archlucid-openapi-audience-versioning` | — | OpenApiAudience |
| `archlucid-sql-open-resilience` | — | SqlOpenResilienceDefaults |
| `archlucid-billing-provider-adapters` | [0016](adrs/0016-billing-provider-abstraction.md) | IBillingProvider |
| `archlucid-ui-bff-proxy-session` | [0059](adrs/0059-spa-bff-http-only-session-plan.md) | api/proxy BFF |
| `archlucid-agent-allowed-tools-dispatch` | — | AgentTaskAllowedToolsDispatchGuard |
| `archlucid-technology-ledger-lifecycle` | — | TechnologyLedger |

## Update rule

1. If an ADR decision changes (especially **0037** / **0038**), update the matching `.mmd` and handbook chapter in the same change set when practical.
2. Re-render SVG/PNG (parent/agent with mermaid-cli) and regenerate handbook DOCX when shipping the change.
3. Keep [`C4_MERMAID_SYNC.md`](C4_MERMAID_SYNC.md) honest when container names or SQL topology wording drifts from `docs/c4/workspace.dsl`.

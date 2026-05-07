> **Scope:** Canonical Azure production profile for multi-tenant ArchLucid SaaS — summary only; advanced roots remain documented separately.

# Azure production profile (ArchLucid multi-tenant SaaS)

**Objective:** Give platform engineers **one** default production posture aligned with recorded 2026-05-07 decisions (**multi-tenant production SaaS** first).

**Assumptions:** Hosting targets Azure; Terraform is the infrastructure language of record; no SMB/445 public exposure (see workspace security rule).

## Default path (apply order)

1. **Profile orchestration:** start from [`infra/terraform-pilot/README.md`](../../infra/terraform-pilot/README.md) — `terraform plan`/`apply` for sequencing outputs (this root validates ordering; it does not emit resources).
2. **Private foundation:** [`infra/terraform-private`](../../infra/terraform-private) for VNet, private endpoints, and DNS **before** data planes that require private link.
3. **Secrets:** [`infra/terraform-keyvault`](../../infra/terraform-keyvault) with managed identity–first access patterns.
4. **Data plane:** [`infra/terraform-sql-failover`](../../infra/terraform-sql-failover) for Azure SQL (+ optional failover group); [`infra/terraform-storage`](../../infra/terraform-storage) for blob/queue workloads per product needs.
5. **Messaging (optional):** [`infra/terraform-servicebus`](../../infra/terraform-servicebus) when integration consumers are enabled.
6. **Identity:** [`infra/terraform-entra`](../../infra/terraform-entra) for app registrations and consent surfaces that match `ArchLucid.Api` + UI hosts.
7. **Workloads:** [`infra/terraform-container-apps`](../../infra/terraform-container-apps) for API, worker, and UI (+ managed identities to SQL, Key Vault, storage).
8. **Edge:** [`infra/terraform-edge`](../../infra/terraform-edge) for Front Door / WAF patterns **after** backends exist — keep TLS termination and routing explicit.
9. **Observability:** [`infra/terraform-monitoring`](../../infra/terraform-monitoring) for Log Analytics, dashboards, and alert rules.

**Optional / fork-specific:** APIM (`infra/terraform`), OpenAI budget hooks (`infra/terraform-openai`), Logic Apps hosts (`infra/terraform-logicapps`) — opt-in when the product configuration requires them.

## Security, scale, cost

- **Security:** Private endpoints for SQL and Key Vault where supported; deny-by-default NSGs; workload identity over long-lived secrets; no public file-share (SMB) paths for authoritative data.
- **Scalability:** Container Apps for horizontal scale of API/worker; SQL tier and read scale follow workload sizing — pilot profile documents FinOps knobs in `terraform-pilot` variables.
- **Reliability:** SQL failover group optional; health/readiness must reflect real dependencies (see release checklist).
- **Cost:** Pilot profile FinOps defaults (budget signals, sampling) live in `terraform-pilot` variables — adjust per tenant scale.

## Where this doc lives in the map

- Stack order spine: [REFERENCE_SAAS_STACK_ORDER.md](REFERENCE_SAAS_STACK_ORDER.md)
- First deploy narrative: [FIRST_AZURE_DEPLOYMENT.md](FIRST_AZURE_DEPLOYMENT.md)

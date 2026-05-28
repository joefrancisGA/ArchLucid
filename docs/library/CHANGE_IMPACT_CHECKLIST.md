> **Scope:** Contributor checklist for follow-through by change type. Use this before opening a PR; detailed rules remain in the linked canonical docs.

# Change Impact Checklist

Start with the row that matches your change. Check the follow-through items that apply; do not duplicate canonical source-of-truth rules here.

| Change type | Required follow-through |
| --- | --- |
| API route or DTO | Update controller/action tests, OpenAPI snapshot, generated clients when needed, [`API_CONTRACTS.md`](API_CONTRACTS.md), and [`BREAKING_CHANGES.md`](../../BREAKING_CHANGES.md) if behavior changes. |
| SQL schema or persistence | Add a DbUp migration under `ArchLucid.Persistence/Migrations/`; keep DDL consolidated through [`SQL_SCRIPTS.md`](SQL_SCRIPTS.md); update repository tests and [`CI_MIGRATION_CHECKLIST.md`](CI_MIGRATION_CHECKLIST.md) assumptions. |
| Config key | Add the key to the typed options / startup validation path, [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md), config lint/admin diagnostics where applicable, and redaction-safe support bundle summaries. |
| Operator UI route | Update route/page tests, nav config, progressive disclosure rules, accessibility coverage, and [`ROUTE_TIER_POLICY_NAV_MATRIX.md`](ROUTE_TIER_POLICY_NAV_MATRIX.md) if there is an API/nav boundary. |
| Commercial tier | Update `[RequiresCommercialTenantTier]` usage, route-tier-policy-nav registry, [`PRODUCT_PACKAGING.md`](PRODUCT_PACKAGING.md), and [`COMMERCIAL_TIER_CODE_ALIGNMENT.md`](COMMERCIAL_TIER_CODE_ALIGNMENT.md). |
| Audit event | Update event constants, emitters, tests, [`AUDIT_EVENT_MODEL.md`](AUDIT_EVENT_MODEL.md), and [`AUDIT_COVERAGE_MATRIX.md`](AUDIT_COVERAGE_MATRIX.md). |
| Retrieval or agent behavior | Update agent/runtime tests, quality gates, forensic UI/docs, [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md), and [`AGENT_TRACE_FORENSICS.md`](AGENT_TRACE_FORENSICS.md). |
| Pricing, trust, or procurement copy | Update the canonical source first, then dependent summaries. Use [`TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md), [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md), and procurement pack guards. |
| V1 scope boundary | Update [`V1_SCOPE.md`](V1_SCOPE.md) first. If the work is deferred, update [`V1_DEFERRED.md`](V1_DEFERRED.md); if it changes buyer integration commitments, update [`INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md). |

Always consider whether the change also needs tests, docs, runbook updates, observability, security review, accessibility evidence, generated artifacts, and changelog notes. Keep REST route names, DTO names, and database entity names stable unless the breaking-change path is explicit.

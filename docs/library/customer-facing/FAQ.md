> **Scope:** Customer-facing — ArchLucid FAQ (getting started, security, integrations, pricing pointer, product); V1-accurate; no live pricing numbers (link only).

# Frequently asked questions

## Getting started

**What is ArchLucid?**  
ArchLucid is an architecture authority platform: multi-agent analysis, manifest lifecycle, governance workflows, and audit trails for enterprise architecture decisions.

**How do I try it locally?**  
Follow **[day-one-developer.md](../../onboarding/day-one-developer.md)** — build, fast tests, optional SQL, run **ArchLucid.Api** and **archlucid-ui**.

**Do I need Azure OpenAI?**  
Not for all paths: simulator/deterministic modes exist for engineering. Real LLM analysis uses Azure OpenAI per deployment configuration (see **[FIRST_REAL_VALUE.md](../FIRST_REAL_VALUE.md)**).

**Where is V1 scope documented?**  
**[V1_SCOPE.md](../V1_SCOPE.md)** — in-scope features, gates, and deferred items.

## Security and data

**How do I report a security vulnerability?**  
Email **security@archlucid.net**; do not file public issues for undisclosed vulnerabilities. See **[SECURITY.md](../contributor-reference/SECURITY.md)**.

**Where does tenant data live?**  
Production-style deployments use Azure-native storage and SQL with **row-level security**; see **[../../security/MULTI_TENANT_RLS.md](../../security/MULTI_TENANT_RLS.md)**.

**Can I get a support bundle for troubleshooting?**  
Yes — architects and admins can generate a support bundle via CLI (see [Pilot guide](PILOT_GUIDE.md) / [Architect / evaluator quickstart](OPERATOR_QUICKSTART.md)). Include **API `GET /version`**, **`X-Correlation-ID`**, and policy-safe logs when opening issues.

## Integration

**What APIs exist?**  
Versioned REST under **`/v1/*`** with OpenAPI; AsyncAPI where published for workers. Contracts live under **`ArchLucid.Contracts`**.

**Is SCIM supported?**  
SCIM 2.0 is **in V1 scope**; validate against your IdP and staging tenant per **[V1_SCOPE.md](../V1_SCOPE.md)**.

**Can I connect ITSM in V1?**  
Yes. First-party **Jira**, **ServiceNow**, **Microsoft Teams**, and **Slack** connectors are **V1 GA** (owner scope 2026-07-03). Configure them under **Integrations** in the architect workspace — see **[INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md)**. OAuth 2.0 upgrades (**TB-600**) tighten enterprise auth; they do not remove the V1 GA connector commitment. **CloudEvents** outbound webhooks and customer-operated **recipes** remain **V1.1** buyer-contract paths for teams that prefer a self-operated bridge.

## Pricing

**Where is pricing explained?**  
Commercial philosophy and packaging context: **[../../go-to-market/PRICING_PHILOSOPHY.md](../../go-to-market/PRICING_PHILOSOPHY.md)** — no quoted dollar amounts in this FAQ; sales-led quotes apply.

## Product

**What is an architecture review?**  
A **review** ingests your request and context, runs agents (topology, cost, compliance, critic, etc.), and can **finalize** an **architecture package** with governance controls. **API paths and CLI commands** still use **`run`** / **`runId`** and **`commit`** for backward compatibility — see **[`CONCEPT_VOCABULARY.md`](../CONCEPT_VOCABULARY.md)** (review vs. `run` as product noun; **Reviewer-enforced rules** subsection).

**What is an architecture package?**  
The durable, versioned record of findings, decisions, evidence, and exports for one architecture review — produced after successful authority pipeline stages and optional governance approval. Older docs and API payloads may still say **golden manifest** or **committed manifest**.

**Who is a pilot for?**  
Organizations evaluating ArchLucid under controlled staging/production-like setups — see **[PILOT_GUIDE.md](PILOT_GUIDE.md)** and **[OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md)**.

**How do I get help as a pilot?**  
Email **support@archlucid.net** for product/support questions during pilots; keep security issues on **security@archlucid.net**. See **[SECURITY.md](../contributor-reference/SECURITY.md)**.

**Is there accessibility support?**  
Report accessibility barriers to **accessibility@archlucid.net** (see **[SECURITY.md](../contributor-reference/SECURITY.md)**).

> **Scope:** Internal / sales-led draft — **owner-reviewable** before customer send. Not a legal order form.

# AI & Cloud Architecture Readiness Review — offer pack (TB-133)

**Primary service-led motion** aligned with [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) and [`GUIDED_PILOT.md`](GUIDED_PILOT.md).

## One-page offer

ArchLucid delivers a **time-boxed architecture review** that produces a **committed, sponsor-safe proof package** on Azure workloads. The engagement uses the ArchLucid proof engine (agents + governance policy packs + audit trail) with explicit **non-certification** boundaries.

## Buyer prerequisites

- Azure architecture evidence (topology, identity, data flows) the buyer may share under contract
- Executive sponsor and technical lead for a 30-minute findings review
- Agreement that outputs are **architecture-review evidence**, not regulator attestation

## Week 1 / week 2 outcomes

| Week | Buyer-visible outcomes |
| --- | --- |
| **Week 1** | Scoped architecture request, first committed review, limitations + execution mode labeled |
| **Week 2** | Sponsor proof packet, governance summary, quote-to-proof readiness checklist, commercial closeout next step |

## Proof outputs (from platform)

- Committed review package and `pilot proof-packet` folder
- `governance-outcome-summary`, `audit-evidence-summary`, `policy-pack-freshness`
- `quote-to-proof-readiness` and `commercial-closeout` artifacts
- Optional: procurement deal-ready classification when buyer procurement is in scope

## Exclusions (do not promise)

- SOC 2 CPA attestation, third-party pen-test publication, public reference logo
- Live Marketplace / Stripe self-serve unless explicitly enabled for the tenant
- V1.1 connectors (Jira, ServiceNow, Teams, Slack) unless separately contracted
- Multi-tenant load-test SLA or production AI certification

## Pricing bands (owner-reviewable)

| Motion | Indicative list | Notes |
| --- | --- | --- |
| Guided pilot | See PRICING_PHILOSOPHY §4 | Credited toward Professional/Enterprise on conversion |
| Professional tier | Link PRICING_PHILOSOPHY | After PASS proof + tier-fit validation |
| Custom enterprise | Negotiated | Order form + procurement pack |

## Order-form path

1. PASS proof disposition on quote-to-proof readiness
2. Agree tier via [`tier_fit_validation_matrix.v1.json`](../scripts/ci/data/tier_fit_validation_matrix.v1.json)
3. Execute [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md)

## Next step after proof

Use `commercial-closeout.json` **recommendedNextAction** — typically schedule sponsor review, then quote request for Team/Professional expansion.

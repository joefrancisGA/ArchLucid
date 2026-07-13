> **Scope:** Page-hit frequency and owner page scores for ArchLucid UI routes.
> Base URL: `http://localhost:3000`. See [`ui_routes.md`](ui_routes.md).

# ArchLucid UI route traffic estimates

**Base URL:** `http://localhost:3000`

Source: Next.js App Router pages under archlucid-ui/src/app/ (126 page.tsx
files) plus registered help topics in product-documentation-registry.ts.

Method: Heuristic ordering and percentage estimates for a typical authenticated
operator tenant in steady-state production use. Percentages are relative shares
of all page hits (not unique users). Dynamic segments such as [runId] represent
the route pattern across all instances.

Page scores: comma-separated 0-100 scores. Position 1 is Evidence (traceability,
provenance, sponsor-safe citations). Additional dimensions reserved. Default 0
until the owner assigns a value. Row Weight is Hit% × Evidence score.
Row Deficit is Hit% × (100 − Evidence score).
OVERALL WEIGHT SCORE is that sum expressed as a percentage of the maximum
possible (Hit% × 100 per row).

Not included: API route handlers (/api/*), legacy redirects/rewrites (see
ui_routes.md), or off-site marketing traffic.

## Core Web Vitals field telemetry (TB-692)

The operator shell emits `WebVitalsMetric` custom events to Application Insights
when `NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING` is configured. Metrics: **LCP**,
**CLS**, **INP**, **TTFB**, **FCP**. Dimensions include normalized `route`
(dynamic IDs collapsed), `tenantTier`, and `effectiveConnectionType`.

Example Kusto (p75 LCP by route, last 7 days):

```kusto
customEvents
| where timestamp > ago(7d)
| where name == "WebVitalsMetric"
| extend metricName = tostring(customDimensions.metricName)
| extend route = tostring(customDimensions.route)
| extend value = todouble(customDimensions.value)
| where metricName == "LCP"
| summarize p75Lcp = percentile(value, 75) by route
| order by p75Lcp desc
```

Priority routes to watch (this doc's master table): `/welcome`, `/reviews`,
`/reviews/[runId]`, `/governance/findings`.

---

**OVERALL WEIGHT SCORE:** 0.00%

## Master table (score 0 first; then Deficit desc; ties A→Z by path)

| ID | Path | Hit% | Scores | Weight | Deficit | Section | Notes |
|----|------|------|--------|--------|---------|---------|-------|
| RE | `/reviews` | 12% | 0 | 0 | 1200 | Core review | None |
| RRE | `/reviews/[runId]` | 10% | 0 | 0 | 1000 | Core review | None |
| RRF | `/reviews/[runId]/findings/[findingId]` | 9% | 0 | 0 | 900 | Core review | None |
| DSH | `/dashboard` | 8% | 0 | 0 | 800 | Core review | None |
| ACB | `/auth/callback` | 5% | 0 | 0 | 500 | Auth | None |
| ASI | `/auth/signin` | 5% | 0 | 0 | 500 | Auth | None |
| ASK | `/ask` | 4% | 0 | 0 | 400 | Core review | None |
| HOM | `/` | 3% | 0 | 0 | 300 | Core review | None |
| AL | `/alerts` | 3% | 0 | 0 | 300 | Alerts/gov | None |
| GFN | `/governance/findings` | 2% | 0 | 0 | 200 | Alerts/gov | None |
| GDX | `/governance/dashboard` | 1.5% | 0 | 0 | 150 | Alerts/gov | None |
| SCX | `/scorecard` | 1.5% | 0 | 0 | 150 | Planning | None |
| GOV | `/governance` | 1% | 0 | 0 | 100 | Alerts/gov | None |
| HEL | `/help` | 1% | 0 | 0 | 100 | Help hub | None |
| PLA | `/planning` | 0.8% | 0 | 0 | 80 | Planning | None |
| SET | `/settings` | 0.8% | 0 | 0 | 80 | Settings | None |
| SXX | `/search` | 0.7% | 0 | 0 | 70 | Planning | None |
| DI | `/digests` | 0.6% | 0 | 0 | 60 | Digests | None |
| GRA | `/graph` | 0.6% | 0 | 0 | 60 | Planning | None |
| PPP | `/planning/plans/[planId]` | 0.6% | 0 | 0 | 60 | Planning | None |
| AUD | `/audit` | 0.5% | 0 | 0 | 50 | Planning | None |
| HXX | `/health` | 0.5% | 0 | 0 | 50 | Planning | None |
| RNX | `/reviews/new` | 0.5% | 0 | 0 | 50 | Core review | None |
| GPP | `/governance/policy-packs` | 0.4% | 0 | 0 | 40 | Alerts/gov | None |
| RR | `/reviews/[runId]/findings/[findingId]/inspect` | 0.4% | 0 | 0 | 40 | Core review | None |
| GDO | `/governance/decision-register` | 0.3% | 0 | 0 | 30 | Alerts/gov | None |
| GPI | `/governance/policy-packs/[id]` | 0.3% | 0 | 0 | 30 | Alerts/gov | None |
| GRO | `/governance/risk-exceptions` | 0.3% | 0 | 0 | 30 | Alerts/gov | None |
| CXX | `/compare` | 0.25% | 0 | 0 | 25 | Planning | None |
| P | `/pricing` | 0.25% | 0 | 0 | 25 | Marketing | None |
| RRP | `/reviews/[runId]/provenance` | 0.25% | 0 | 0 | 25 | Core review | None |
| SBE | `/settings/billing` | 0.25% | 0 | 0 | 25 | Settings | None |
| SCE | `/settings/cloud-connections` | 0.25% | 0 | 0 | 25 | Settings | None |
| ALE | `/alert-routing` | 0.2% | 0 | 0 | 20 | Alerts/gov | None |
| GRX | `/governance/recurrence-schedules` | 0.2% | 0 | 0 | 20 | Alerts/gov | None |
| HGX | `/help/getting-started` | 0.2% | 0 | 0 | 20 | Help topic | None |
| LOG | `/login` | 0.2% | 0 | 0 | 20 | Auth | None |
| PXX | `/patterns` | 0.2% | 0 | 0 | 20 | Planning | None |
| SAE | `/settings/api-keys` | 0.2% | 0 | 0 | 20 | Settings | None |
| SRX | `/settings/roles` | 0.2% | 0 | 0 | 20 | Settings | None |
| SIG | `/signup` | 0.2% | 0 | 0 | 20 | Marketing | None |
| VXX | `/value-report` | 0.2% | 0 | 0 | 20 | Planning | None |
| FI | `/help/first-review` | 0.18% | 0 | 0 | 18 | Help topic | None |
| AHX | `/admin/health` | 0.15% | 0 | 0 | 15 | Admin | None |
| AUX | `/admin/users` | 0.15% | 0 | 0 | 15 | Admin | None |
| ADV | `/advisory` | 0.15% | 0 | 0 | 15 | Advisory | None |
| GRS | `/governance-resolution` | 0.15% | 0 | 0 | 15 | Alerts/gov | None |
| GAI | `/governance/approval-requests/[id]/lineage` | 0.15% | 0 | 0 | 15 | Alerts/gov | None |
| HCE | `/help/cloud-connections` | 0.15% | 0 | 0 | 15 | Help topic | None |
| MMX | `/manifests/[manifestId]` | 0.15% | 0 | 0 | 15 | Planning | None |
| SAX | `/settings/alerts` | 0.15% | 0 | 0 | 15 | Settings | None |
| STX | `/settings/tenant` | 0.15% | 0 | 0 | 15 | Settings | None |
| ASX | `/admin/support` | 0.12% | 0 | 0 | 12 | Admin | None |
| ATX | `/admin/tenant-health` | 0.12% | 0 | 0 | 12 | Admin | None |
| FXX | `/faq` | 0.12% | 0 | 0 | 12 | Marketing | None |
| HHX | `/help/how-it-works` | 0.12% | 0 | 0 | 12 | Help topic | None |
| HTX | `/help/troubleshooting` | 0.12% | 0 | 0 | 12 | Help topic | None |
| IIX | `/integrations/itsm` | 0.12% | 0 | 0 | 12 | Integrations | None |
| SBX | `/settings/baseline` | 0.12% | 0 | 0 | 12 | Settings | None |
| SIX | `/settings/identity-providers` | 0.12% | 0 | 0 | 12 | Settings | None |
| ACX | `/admin/configuration` | 0.1% | 0 | 0 | 10 | Admin | None |
| ARX | `/admin/rag-health` | 0.1% | 0 | 0 | 10 | Admin | None |
| EXX | `/evolution-review` | 0.1% | 0 | 0 | 10 | Planning | None |
| ESX | `/executive/scorecard` | 0.1% | 0 | 0 | 10 | Executive | None |
| GFX | `/governance/first-30-days` | 0.1% | 0 | 0 | 10 | Alerts/gov | None |
| HA | `/help/alerts` | 0.1% | 0 | 0 | 10 | Help topic | None |
| HFX | `/help/findings` | 0.1% | 0 | 0 | 10 | Help topic | None |
| IJX | `/integrations/jira` | 0.1% | 0 | 0 | 10 | Integrations | None |
| ISN | `/integrations/slack` | 0.1% | 0 | 0 | 10 | Integrations | None |
| ITX | `/integrations/teams` | 0.1% | 0 | 0 | 10 | Integrations | None |
| ONB | `/onboarding` | 0.1% | 0 | 0 | 10 | Onboarding | None |
| REP | `/replay` | 0.1% | 0 | 0 | 10 | Planning | None |
| SEC | `/security-trust` | 0.1% | 0 | 0 | 10 | Marketing | None |
| SC | `/settings/cost-reporting` | 0.1% | 0 | 0 | 10 | Settings | None |
| SDX | `/settings/developer` | 0.1% | 0 | 0 | 10 | Settings | None |
| SEX | `/settings/exec-digest` | 0.1% | 0 | 0 | 10 | Settings | None |
| TXX | `/trust` | 0.1% | 0 | 0 | 10 | Marketing | None |
| VRX | `/value-report/roi` | 0.1% | 0 | 0 | 10 | Planning | None |
| AAX | `/admin/ai-usage-cost` | 0.08% | 0 | 0 | 8 | Admin | None |
| AII | `/admin/integrations/itsm` | 0.08% | 0 | 0 | 8 | Admin | None |
| DXX | `/demo` | 0.08% | 0 | 0 | 8 | Marketing | None |
| GO | `/help/governance-approval` | 0.08% | 0 | 0 | 8 | Help topic | None |
| HR | `/help/review-guide` | 0.08% | 0 | 0 | 8 | Help topic | None |
| ISX | `/integrations/servicenow` | 0.08% | 0 | 0 | 8 | Integrations | None |
| OSX | `/onboarding/start` | 0.08% | 0 | 0 | 8 | Onboarding | None |
| SRI | `/settings/roles/invite-reviewer` | 0.08% | 0 | 0 | 8 | Settings | None |
| SVX | `/signup/verify` | 0.08% | 0 | 0 | 8 | Marketing | None |
| GET | `/getting-started` | 0.07% | 0 | 0 | 7 | Onboarding | None |
| HBX | `/help/billing-and-plans` | 0.07% | 0 | 0 | 7 | Help topic | None |
| HP | `/help/pilot-guide` | 0.07% | 0 | 0 | 7 | Help topic | None |
| IOX | `/integrations/operations` | 0.07% | 0 | 0 | 7 | Integrations | None |
| IWX | `/integrations/webhooks` | 0.07% | 0 | 0 | 7 | Integrations | None |
| SE | `/settings/extract-upload` | 0.07% | 0 | 0 | 7 | Settings | None |
| SIS | `/settings/identity/sso-wizard` | 0.07% | 0 | 0 | 7 | Settings | None |
| SSX | `/settings/scim-provisioning` | 0.07% | 0 | 0 | 7 | Settings | None |
| DPX | `/demo/preview` | 0.06% | 0 | 0 | 6 | Marketing | None |
| HCA | `/help/cloud-connections/azure` | 0.06% | 0 | 0 | 6 | Help alias | None |
| HOE | `/help/operator-auth-roles` | 0.06% | 0 | 0 | 6 | Help topic | None |
| OXX | `/onboard` | 0.06% | 0 | 0 | 6 | Onboarding | None |
| PRC | `/product-learning` | 0.06% | 0 | 0 | 6 | Onboarding | None |
| ACA | `/admin/cloud-connections/aws` | 0.05% | 0 | 0 | 5 | Admin | None |
| AEX | `/admin/evidence-proposals` | 0.05% | 0 | 0 | 5 | Admin | None |
| AFX | `/admin/fleet-llm-cogs` | 0.05% | 0 | 0 | 5 | Admin | None |
| APX | `/admin/pricing-quote-aging` | 0.05% | 0 | 0 | 5 | Admin | None |
| ATD | `/admin/trial-funnel` | 0.05% | 0 | 0 | 5 | Admin | None |
| AD | `/advisory-scheduling` | 0.05% | 0 | 0 | 5 | Advisory | None |
| DIG | `/digest-subscriptions` | 0.05% | 0 | 0 | 5 | Digests | None |
| GXX | `/get-started` | 0.05% | 0 | 0 | 5 | Marketing | None |
| HSX | `/help/scope` | 0.05% | 0 | 0 | 5 | Help topic | None |
| HSE | `/help/security-trust` | 0.05% | 0 | 0 | 5 | Help topic | None |
| HUX | `/help/users-and-roles` | 0.05% | 0 | 0 | 5 | Help alias | None |
| IIO | `/integrations/itsm/oauth/callback` | 0.05% | 0 | 0 | 5 | Integrations | None |
| OAX | `/operate/architecture-graph` | 0.05% | 0 | 0 | 5 | Advisory | None |
| QXX | `/quick-scan` | 0.05% | 0 | 0 | 5 | Marketing | None |
| RXX | `/recommendation-learning` | 0.05% | 0 | 0 | 5 | Onboarding | None |
| SRH | `/showcase/[runId]` | 0.05% | 0 | 0 | 5 | Marketing | None |
| TRY | `/try` | 0.05% | 0 | 0 | 5 | Marketing | None |
| VPX | `/value-report/pilot` | 0.05% | 0 | 0 | 5 | Planning | None |
| H | `/help/audit-trail` | 0.04% | 0 | 0 | 4 | Help topic | None |
| HCX | `/help/cli-usage` | 0.04% | 0 | 0 | 4 | Help topic | None |
| HDX | `/help/developer-troubleshooting` | 0.04% | 0 | 0 | 4 | Help topic | None |
| F | `/help/first-value-20-minutes` | 0.04% | 0 | 0 | 4 | Help topic | None |
| PRO | `/help/procurement` | 0.04% | 0 | 0 | 4 | Help topic | None |
| LXX | `/live-demo` | 0.04% | 0 | 0 | 4 | Marketing | None |
| OID | `/operate/integration-events/dlq` | 0.04% | 0 | 0 | 4 | Advisory | None |
| PO | `/policy-packs` | 0.04% | 0 | 0 | 4 | Alerts/gov | None |
| SEE | `/see-it` | 0.04% | 0 | 0 | 4 | Marketing | None |
| STR | `/settings/tenant/recycle-bin` | 0.04% | 0 | 0 | 4 | Settings | None |
| SRN | `/snapshot/[runId]` | 0.04% | 0 | 0 | 4 | Planning | None |
| WXX | `/welcome` | 0.04% | 0 | 0 | 4 | Marketing | None |
| WHY | `/why` | 0.04% | 0 | 0 | 4 | Marketing | None |
| WH | `/why-archlucid` | 0.04% | 0 | 0 | 4 | Learning | None |
| WSX | `/workspace/security-trust` | 0.04% | 0 | 0 | 4 | Learning | None |
| ASU | `/auth/session-expired` | 0.03% | 0 | 0 | 3 | Auth | None |
| DEX | `/demo/explain` | 0.03% | 0 | 0 | 3 | Learning | None |
| CON | `/help/configuration-reference` | 0.03% | 0 | 0 | 3 | Help topic | None |
| COR | `/help/core-pilot` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HEX | `/help/enterprise-onboarding` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HEE | `/help/evaluator-workbook` | 0.03% | 0 | 0 | 3 | Help topic | None |
| EVI | `/help/evidence-intake` | 0.03% | 0 | 0 | 3 | Help topic | None |
| EV | `/help/evidence-trail` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HFE | `/help/first-hour-operator-path` | 0.03% | 0 | 0 | 3 | Help topic | None |
| FIR | `/help/first-pilot-path` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HG | `/help/governance-api-contracts` | 0.03% | 0 | 0 | 3 | Help topic | None |
| PI | `/help/pilot-roi-model` | 0.03% | 0 | 0 | 3 | Help topic | None |
| HRX | `/help/repeat-review-loop` | 0.03% | 0 | 0 | 3 | Help topic | None |
| REV | `/help/review-packages` | 0.03% | 0 | 0 | 3 | Help topic | None |
| 4XX | `/403` | 0.02% | 0 | 0 | 2 | Auth | None |
| AXX | `/accessibility` | 0.02% | 0 | 0 | 2 | Marketing | None |
| COM | `/compliance-journey` | 0.02% | 0 | 0 | 2 | Marketing | None |
| EXA | `/example-roi-bulletin` | 0.02% | 0 | 0 | 2 | Marketing | None |
| HAX | `/help/accelerator-chooser` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HAE | `/help/admin-diagnostics` | 0.02% | 0 | 0 | 2 | Help topic | None |
| CO | `/help/comparison-replay` | 0.02% | 0 | 0 | 2 | Help topic | None |
| EXE | `/help/executive-summary` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HPX | `/help/path-chooser` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HPE | `/help/pilot-feedback` | 0.02% | 0 | 0 | 2 | Help topic | None |
| PIL | `/help/pilot-nav-profile` | 0.02% | 0 | 0 | 2 | Help topic | None |
| POL | `/help/policy-pack-delta-demo` | 0.02% | 0 | 0 | 2 | Help topic | None |
| PRE | `/help/pre-commit-ci-gate` | 0.02% | 0 | 0 | 2 | Help topic | None |
| HS | `/help/specialty-walkthroughs` | 0.02% | 0 | 0 | 2 | Help topic | None |
| PRB | `/privacy` | 0.02% | 0 | 0 | 2 | Marketing | None |
| QUI | `/quick-start` | 0.02% | 0 | 0 | 2 | Marketing | None |

---

## Frequency rationale

| Area | Share | Rationale |
|------|-------|-----------|
| Reviews + findings | ~40% | Core value loop |
| Dashboard + home | ~11% | Daily landing pages |
| Auth | ~10% | Session sign-in + callback |
| Ask | ~4% | Repeat AI queries per session |
| Alerts / governance | ~9% | Second major workflow |
| Help (aggregate) | ~3% | Onboarding and unfamiliar flows |
| Settings | ~2.5% | Cloud connections and billing |
| Admin | <1% | Superadmin-only |
| Marketing | <2% | Pre-login visitor traffic |

---

## Maintenance

When routes or help topics change: update ui_routes.md, refresh help slugs from
product-documentation-registry.ts, and re-rank if telemetry shifts. Set page
scores only when the owner provides values; leave 0 otherwise.

**Related docs:**

- [`ui_routes.md`](ui_routes.md) â€” route catalog and demo tiers
- [`NAV_CONFIG_CONTRACT.md`](../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md)
- [`PRODUCT_DOCUMENTATION_PRESENTATION.md`](../library/PRODUCT_DOCUMENTATION_PRESENTATION.md)

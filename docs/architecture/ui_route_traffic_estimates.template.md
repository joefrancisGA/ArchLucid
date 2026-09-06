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
provenance, sponsor-safe citations). Position 2 is UX quality, scored against
docs/library/UI_UX_SCORING_RUBRIC.md. Default 0 until the owner assigns a value. Row Weight is Hit% × UX score.
Row Deficit is Hit% × (100 − UX score).
OVERALL WEIGHT SCORE is that sum expressed as a percentage of the maximum
possible (Hit% × 100 per row). OVERALL EVIDENCE SCORE is the same computation
over Scores position 1.

Master table sort key: rows with UX score 0 (unscored) appear before scored rows; within each group, sort by Deficit (descending); ties A→Z by path. Weight column is Hit% × UX score. Deficit column is Hit% × (100 − UX score). OVERALL WEIGHT SCORE is the sum of row Weight values expressed as a percentage of the maximum possible (Hit% × 100 per row). ID column: unique shorthand of at most three capital letters per row.

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

**OVERALL EVIDENCE SCORE:** 0.00%

## Master table (UX score 0 first; then Deficit desc; ties A→Z by path)

| ID | Path | Hit% | Scores | Weight | Deficit | Section | Done | Notes |
|----|------|------|--------|--------|---------|---------|------|-------|
| RE | `/reviews` | 12% | 0 | 0 | 1200 | Core review | No | None |
| RRE | `/reviews/[runId]` | 10% | 0 | 0 | 1000 | Core review | No | None |
| RRF | `/reviews/[runId]/findings/[findingId]` | 9% | 0 | 0 | 900 | Core review | No | None |
| DSH | `/dashboard` | 8% | 0 | 0 | 800 | Core review | No | None |
| ACB | `/auth/callback` | 5% | 0 | 0 | 500 | Auth | No | None |
| ASI | `/auth/signin` | 5% | 0 | 0 | 500 | Auth | No | None |
| ASK | `/ask` | 4% | 0 | 0 | 400 | Core review | No | None |
| HOM | `/` | 3% | 0 | 0 | 300 | Core review | No | None |
| AL | `/alerts` | 3% | 0 | 0 | 300 | Alerts/gov | No | None |
| GFN | `/governance/findings` | 2% | 0 | 0 | 200 | Alerts/gov | No | None |
| GDX | `/governance/dashboard` | 1.5% | 0 | 0 | 150 | Alerts/gov | No | None |
| SCX | `/scorecard` | 1.5% | 0 | 0 | 150 | Planning | No | None |
| GOV | `/governance` | 1% | 0 | 0 | 100 | Alerts/gov | No | None |
| HEL | `/help` | 1% | 0 | 0 | 100 | Help hub | No | None |
| PLA | `/planning` | 0.8% | 0 | 0 | 80 | Planning | No | None |
| SET | `/settings` | 0.8% | 0 | 0 | 80 | Settings | No | None |
| SXX | `/search` | 0.7% | 0 | 0 | 70 | Planning | No | None |
| DI | `/digests` | 0.6% | 0 | 0 | 60 | Digests | No | None |
| GRA | `/graph` | 0.6% | 0 | 0 | 60 | Planning | No | None |
| PPP | `/planning/plans/[planId]` | 0.6% | 0 | 0 | 60 | Planning | No | None |
| AUD | `/audit` | 0.5% | 0 | 0 | 50 | Planning | No | None |
| HXX | `/health` | 0.5% | 0 | 0 | 50 | Planning | No | None |
| RNX | `/reviews/new` | 0.5% | 0 | 0 | 50 | Core review | No | None |
| GPP | `/governance/policy-packs` | 0.4% | 0 | 0 | 40 | Alerts/gov | No | None |
| RR | `/reviews/[runId]/findings/[findingId]/inspect` | 0.4% | 0 | 0 | 40 | Core review | No | None |
| GDO | `/governance/decision-register` | 0.3% | 0 | 0 | 30 | Alerts/gov | No | None |
| GPI | `/governance/policy-packs/[id]` | 0.3% | 0 | 0 | 30 | Alerts/gov | No | None |
| GRO | `/governance/risk-exceptions` | 0.3% | 0 | 0 | 30 | Alerts/gov | No | None |
| CXX | `/compare` | 0.25% | 0 | 0 | 25 | Planning | No | None |
| P | `/pricing` | 0.25% | 0 | 0 | 25 | Marketing | No | None |
| RRP | `/reviews/[runId]/provenance` | 0.25% | 0 | 0 | 25 | Core review | No | None |
| SBE | `/settings/billing` | 0.25% | 0 | 0 | 25 | Settings | No | None |
| SCE | `/settings/cloud-connections` | 0.25% | 0 | 0 | 25 | Settings | No | None |
| ALE | `/alert-routing` | 0.2% | 0 | 0 | 20 | Alerts/gov | No | None |
| GRX | `/governance/recurrence-schedules` | 0.2% | 0 | 0 | 20 | Alerts/gov | No | None |
| HGX | `/help/getting-started` | 0.2% | 0 | 0 | 20 | Help topic | No | None |
| LOG | `/login` | 0.2% | 0 | 0 | 20 | Auth | No | None |
| PXX | `/patterns` | 0.2% | 0 | 0 | 20 | Planning | No | None |
| SAE | `/settings/api-keys` | 0.2% | 0 | 0 | 20 | Settings | No | None |
| SRX | `/settings/roles` | 0.2% | 0 | 0 | 20 | Settings | No | None |
| SIG | `/signup` | 0.2% | 0 | 0 | 20 | Marketing | No | None |
| VXX | `/value-report` | 0.2% | 0 | 0 | 20 | Planning | No | None |
| FI | `/help/first-review` | 0.18% | 0 | 0 | 18 | Help topic | No | None |
| AHX | `/admin/health` | 0.15% | 0 | 0 | 15 | Admin | No | None |
| AUX | `/admin/users` | 0.15% | 0 | 0 | 15 | Admin | No | None |
| ADV | `/advisory` | 0.15% | 0 | 0 | 15 | Advisory | No | None |
| EDX | `/executive/dashboard` | 0.15% | 0 | 0 | 15 | Executive | No | None |
| ERX | `/executive/reviews` | 0.15% | 0 | 0 | 15 | Executive | No | None |
| GRS | `/governance-resolution` | 0.15% | 0 | 0 | 15 | Alerts/gov | No | None |
| GAI | `/governance/approval-requests/[id]/lineage` | 0.15% | 0 | 0 | 15 | Alerts/gov | No | None |
| HCE | `/help/cloud-connections` | 0.15% | 0 | 0 | 15 | Help topic | No | None |
| MMX | `/manifests/[manifestId]` | 0.15% | 0 | 0 | 15 | Planning | No | None |
| RRX | `/reports/resource-coverage` | 0.15% | 0 | 0 | 15 | Planning | No | None |
| SAX | `/settings/alerts` | 0.15% | 0 | 0 | 15 | Settings | No | None |
| STX | `/settings/tenant` | 0.15% | 0 | 0 | 15 | Settings | No | None |
| ASX | `/admin/support` | 0.12% | 0 | 0 | 12 | Admin | No | None |
| ATX | `/admin/tenant-health` | 0.12% | 0 | 0 | 12 | Admin | No | None |
| ERR | `/executive/reviews/[runId]` | 0.12% | 0 | 0 | 12 | Executive | No | None |
| FXX | `/faq` | 0.12% | 0 | 0 | 12 | Marketing | No | None |
| HHX | `/help/how-it-works` | 0.12% | 0 | 0 | 12 | Help topic | No | None |
| HTX | `/help/troubleshooting` | 0.12% | 0 | 0 | 12 | Help topic | No | None |
| IIX | `/integrations/itsm` | 0.12% | 0 | 0 | 12 | Integrations | No | None |
| SBX | `/settings/baseline` | 0.12% | 0 | 0 | 12 | Settings | No | None |
| SIX | `/settings/identity-providers` | 0.12% | 0 | 0 | 12 | Settings | No | None |
| ACX | `/admin/configuration` | 0.1% | 0 | 0 | 10 | Admin | No | None |
| ARX | `/admin/rag-health` | 0.1% | 0 | 0 | 10 | Admin | No | None |
| EXX | `/evolution-review` | 0.1% | 0 | 0 | 10 | Planning | No | None |
| ESX | `/executive/scorecard` | 0.1% | 0 | 0 | 10 | Executive | No | None |
| GFX | `/governance/first-30-days` | 0.1% | 0 | 0 | 10 | Alerts/gov | No | None |
| HA | `/help/alerts` | 0.1% | 0 | 0 | 10 | Help topic | No | None |
| HFX | `/help/findings` | 0.1% | 0 | 0 | 10 | Help topic | No | None |
| IJX | `/integrations/jira` | 0.1% | 0 | 0 | 10 | Integrations | No | None |
| ISN | `/integrations/slack` | 0.1% | 0 | 0 | 10 | Integrations | No | None |
| ITX | `/integrations/teams` | 0.1% | 0 | 0 | 10 | Integrations | No | None |
| ONB | `/onboarding` | 0.1% | 0 | 0 | 10 | Onboarding | No | None |
| REP | `/replay` | 0.1% | 0 | 0 | 10 | Planning | No | None |
| SEC | `/security-trust` | 0.1% | 0 | 0 | 10 | Marketing | No | None |
| SC | `/settings/cost-reporting` | 0.1% | 0 | 0 | 10 | Settings | No | None |
| SDX | `/settings/developer` | 0.1% | 0 | 0 | 10 | Settings | No | None |
| SEX | `/settings/exec-digest` | 0.1% | 0 | 0 | 10 | Settings | No | None |
| TXX | `/trust` | 0.1% | 0 | 0 | 10 | Marketing | No | None |
| VRX | `/value-report/roi` | 0.1% | 0 | 0 | 10 | Planning | No | None |
| AAX | `/admin/ai-usage-cost` | 0.08% | 0 | 0 | 8 | Admin | No | None |
| AII | `/admin/integrations/itsm` | 0.08% | 0 | 0 | 8 | Admin | No | None |
| DXX | `/demo` | 0.08% | 0 | 0 | 8 | Marketing | No | None |
| GO | `/help/governance-approval` | 0.08% | 0 | 0 | 8 | Help topic | No | None |
| HR | `/help/review-guide` | 0.08% | 0 | 0 | 8 | Help topic | No | None |
| ISX | `/integrations/servicenow` | 0.08% | 0 | 0 | 8 | Integrations | No | None |
| OSX | `/onboarding/start` | 0.08% | 0 | 0 | 8 | Onboarding | No | None |
| SRI | `/settings/roles/invite-reviewer` | 0.08% | 0 | 0 | 8 | Settings | No | None |
| SVX | `/signup/verify` | 0.08% | 0 | 0 | 8 | Marketing | No | None |
| GET | `/getting-started` | 0.07% | 0 | 0 | 7 | Onboarding | No | None |
| HBX | `/help/billing-and-plans` | 0.07% | 0 | 0 | 7 | Help topic | No | None |
| HP | `/help/pilot-guide` | 0.07% | 0 | 0 | 7 | Help topic | No | None |
| IOX | `/integrations/operations` | 0.07% | 0 | 0 | 7 | Integrations | No | None |
| IWX | `/integrations/webhooks` | 0.07% | 0 | 0 | 7 | Integrations | No | None |
| SE | `/settings/extract-upload` | 0.07% | 0 | 0 | 7 | Settings | No | None |
| SIS | `/settings/identity/sso-wizard` | 0.07% | 0 | 0 | 7 | Settings | No | None |
| SSX | `/settings/scim-provisioning` | 0.07% | 0 | 0 | 7 | Settings | No | None |
| DPX | `/demo/preview` | 0.06% | 0 | 0 | 6 | Marketing | No | None |
| HE | `/help/azure-permissions` | 0.06% | 0 | 0 | 6 | Help topic | No | None |
| HC | `/help/cloud-connections-azure` | 0.06% | 0 | 0 | 6 | Help topic | No | None |
| HCA | `/help/cloud-connections/azure` | 0.06% | 0 | 0 | 6 | Help alias | No | None |
| HGE | `/help/glossary` | 0.06% | 0 | 0 | 6 | Help topic | No | None |
| HOE | `/help/operator-auth-roles` | 0.06% | 0 | 0 | 6 | Help topic | No | None |
| OXX | `/onboard` | 0.06% | 0 | 0 | 6 | Onboarding | No | None |
| PRC | `/product-learning` | 0.06% | 0 | 0 | 6 | Onboarding | No | None |
| ACA | `/admin/cloud-connections/aws` | 0.05% | 0 | 0 | 5 | Admin | No | None |
| AEX | `/admin/evidence-proposals` | 0.05% | 0 | 0 | 5 | Admin | No | None |
| AFX | `/admin/fleet-llm-cogs` | 0.05% | 0 | 0 | 5 | Admin | No | None |
| APX | `/admin/pricing-quote-aging` | 0.05% | 0 | 0 | 5 | Admin | No | None |
| ATD | `/admin/trial-funnel` | 0.05% | 0 | 0 | 5 | Admin | No | None |
| AD | `/advisory-scheduling` | 0.05% | 0 | 0 | 5 | Advisory | No | None |
| DIG | `/digest-subscriptions` | 0.05% | 0 | 0 | 5 | Digests | No | None |
| ER | `/executive/reviews/[runId]/findings/[findingId]` | 0.05% | 0 | 0 | 5 | Executive | No | None |
| GXX | `/get-started` | 0.05% | 0 | 0 | 5 | Marketing | No | None |
| PRI | `/help/privacy-policy` | 0.05% | 0 | 0 | 5 | Help topic | No | None |
| HSX | `/help/scope` | 0.05% | 0 | 0 | 5 | Help topic | No | None |
| HSE | `/help/security-trust` | 0.05% | 0 | 0 | 5 | Help topic | No | None |
| HSA | `/help/security/azure-permissions` | 0.05% | 0 | 0 | 5 | Help alias | No | None |
| HUX | `/help/users-and-roles` | 0.05% | 0 | 0 | 5 | Help alias | No | None |
| IIO | `/integrations/itsm/oauth/callback` | 0.05% | 0 | 0 | 5 | Integrations | No | None |
| OAX | `/operate/architecture-graph` | 0.05% | 0 | 0 | 5 | Advisory | No | None |
| QXX | `/quick-scan` | 0.05% | 0 | 0 | 5 | Marketing | No | None |
| RXX | `/recommendation-learning` | 0.05% | 0 | 0 | 5 | Onboarding | No | None |
| SRH | `/showcase/[runId]` | 0.05% | 0 | 0 | 5 | Marketing | No | None |
| TRY | `/try` | 0.05% | 0 | 0 | 5 | Marketing | No | None |
| VPX | `/value-report/pilot` | 0.05% | 0 | 0 | 5 | Planning | No | None |
| H | `/help/audit-trail` | 0.04% | 0 | 0 | 4 | Help topic | No | None |
| HCX | `/help/cli-usage` | 0.04% | 0 | 0 | 4 | Help topic | No | None |
| HDX | `/help/developer-troubleshooting` | 0.04% | 0 | 0 | 4 | Help topic | No | None |
| F | `/help/first-value-20-minutes` | 0.04% | 0 | 0 | 4 | Help topic | No | None |
| HKX | `/help/knowledge-graph` | 0.04% | 0 | 0 | 4 | Help topic | No | None |
| PRO | `/help/procurement` | 0.04% | 0 | 0 | 4 | Help topic | No | None |
| HWX | `/help/workload-identity-federation` | 0.04% | 0 | 0 | 4 | Help topic | No | None |
| LXX | `/live-demo` | 0.04% | 0 | 0 | 4 | Marketing | No | None |
| OID | `/operate/integration-events/dlq` | 0.04% | 0 | 0 | 4 | Advisory | No | None |
| PO | `/policy-packs` | 0.04% | 0 | 0 | 4 | Alerts/gov | No | None |
| SEE | `/see-it` | 0.04% | 0 | 0 | 4 | Marketing | No | None |
| STR | `/settings/tenant/recycle-bin` | 0.04% | 0 | 0 | 4 | Settings | No | None |
| SRN | `/snapshot/[runId]` | 0.04% | 0 | 0 | 4 | Planning | No | None |
| WXX | `/welcome` | 0.04% | 0 | 0 | 4 | Marketing | No | None |
| WHY | `/why` | 0.04% | 0 | 0 | 4 | Marketing | No | None |
| WH | `/why-archlucid` | 0.04% | 0 | 0 | 4 | Learning | No | None |
| WSX | `/workspace/security-trust` | 0.04% | 0 | 0 | 4 | Learning | No | None |
| ASU | `/auth/session-expired` | 0.03% | 0 | 0 | 3 | Auth | No | None |
| DEX | `/demo/explain` | 0.03% | 0 | 0 | 3 | Learning | No | None |
| CON | `/help/configuration-reference` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| COR | `/help/core-pilot` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| HEX | `/help/enterprise-onboarding` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| HEE | `/help/evaluator-workbook` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| EVI | `/help/evidence-intake` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| EV | `/help/evidence-trail` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| HFE | `/help/first-hour-operator-path` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| HF | `/help/first-pilot-operator-runbook` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| FIR | `/help/first-pilot-path` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| HG | `/help/governance-api-contracts` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| HOX | `/help/observability` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| PI | `/help/pilot-roi-model` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| HRX | `/help/repeat-review-loop` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| REV | `/help/review-packages` | 0.03% | 0 | 0 | 3 | Help topic | No | None |
| HSW | `/help/security/workload-identity-federation` | 0.03% | 0 | 0 | 3 | Help alias | No | None |
| 4XX | `/403` | 0.02% | 0 | 0 | 2 | Auth | No | None |
| AXX | `/accessibility` | 0.02% | 0 | 0 | 2 | Marketing | No | None |
| COM | `/compliance-journey` | 0.02% | 0 | 0 | 2 | Marketing | No | None |
| EXA | `/example-roi-bulletin` | 0.02% | 0 | 0 | 2 | Marketing | No | None |
| HAX | `/help/accelerator-chooser` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| HAE | `/help/admin-diagnostics` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| CO | `/help/comparison-replay` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| EX | `/help/example-roi-bulletin` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| EXE | `/help/executive-summary` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| HO | `/help/operator-shell` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| HPX | `/help/path-chooser` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| HPE | `/help/pilot-feedback` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| PIL | `/help/pilot-nav-profile` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| POL | `/help/policy-pack-delta-demo` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| PRE | `/help/pre-commit-ci-gate` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| PR | `/help/projection-cache-replicas` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| HRE | `/help/resilience-exercises` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| HS | `/help/specialty-walkthroughs` | 0.02% | 0 | 0 | 2 | Help topic | No | None |
| PRB | `/privacy` | 0.02% | 0 | 0 | 2 | Marketing | No | None |
| QUI | `/quick-start` | 0.02% | 0 | 0 | 2 | Marketing | No | None |

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

- [`ui_routes.md`](ui_routes.md) — route catalog and demo tiers
- [`NAV_CONFIG_CONTRACT.md`](../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md)
- [`PRODUCT_DOCUMENTATION_PRESENTATION.md`](../library/PRODUCT_DOCUMENTATION_PRESENTATION.md)

> **Scope:** Auto-generated offline faithfulness report from golden fixtures; does not claim live-model validation.

# RAG faithfulness report

- **Cases evaluated:** 36
- **Positive readiness cases:** 23
- **Positive readiness support ratio:** 0.9783
- **Negative-control cases:** 13
- **Negative-control support ratio:** 0.0385
- **Combined diagnostic support ratio:** 0.6389
- **Floor (minSupportRatio):** 0.8000

## Interpretation

- **Positive readiness support ratio** is the buyer-safe quality-posture number for normal supported-output fixtures.
- **Negative-control support ratio** is diagnostic detector coverage for deliberately missing citations, wrong corpus, or unsupported ROI/cost claims.
- **Combined diagnostic support ratio** preserves the historical all-case view for release engineering, but should not be quoted as the readiness-only score.

## Per-category breakdown

| Category | Cases | Mean support ratio |
| --- | ---: | ---: |
| ai-governance | 3 | 0.8333 |
| azure-saas-readiness | 8 | 1.0000 |
| deferred-scope-claim | 2 | 0.0000 |
| demo-vs-customer | 4 | 1.0000 |
| healthcare-regulatory | 3 | 1.0000 |
| missing-citation | 5 | 0.0000 |
| platform-doc | 1 | 1.0000 |
| prior-manifest | 1 | 1.0000 |
| roi-cost-supported | 3 | 1.0000 |
| roi-cost-unsupported | 3 | 0.0000 |
| wrong-corpus | 3 | 0.1667 |

## Per-case results

| Case | Cohort | Category | Retrieved | Supported | Ratio | Missing citations | Wrong corpus | Unsupported ROI/cost |
|------|--------|----------|-----------|-----------|-------|-------------------|--------------|----------------------|
| faithfulness-policy-cited | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| faithfulness-partial-citation | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| faithfulness-uncited | negative-control | missing-citation | 1 | 0 | 0.0000 | fabricated-1 | - | - |
| azure-saas-readiness-citation-required | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| ai-governance-wrong-corpus-detected | negative-control | wrong-corpus | 2 | 0 | 0.0000 | ai-gov-human-review-required, ai-gov-audit-log-retention | ai-gov-human-review-required | - |
| healthcare-claims-policy-review-citation-required | positive-readiness | healthcare-regulatory | 2 | 2 | 1.0000 | - | - | - |
| roi-cost-claim-unsupported | negative-control | roi-cost-unsupported | 1 | 0 | 0.0000 | azure-app-service-p1v3 | - | unsupported-roi-cost-claim |
| azure-saas-private-endpoint-cited | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| azure-saas-missing-waf-citation | negative-control | missing-citation | 1 | 0 | 0.0000 | azure-waf-policy-01 | - | - |
| ai-governance-model-card-cited | positive-readiness | ai-governance | 2 | 2 | 1.0000 | - | - | - |
| ai-governance-partial-human-review | positive-readiness | ai-governance | 2 | 1 | 0.5000 | ai-eval-golden-cohort | - | - |
| healthcare-baa-required-cited | positive-readiness | healthcare-regulatory | 2 | 2 | 1.0000 | - | - | - |
| healthcare-wrong-corpus-clinical | negative-control | wrong-corpus | 2 | 0 | 0.0000 | clinical-trial-consent, claims-prior-auth | clinical-trial-consent | - |
| roi-cost-supported-with-baseline | positive-readiness | roi-cost-supported | 2 | 2 | 1.0000 | - | - | - |
| roi-cost-hours-supported | positive-readiness | roi-cost-supported | 1 | 1 | 1.0000 | - | - | - |
| roi-cost-unsupported-savings-percent | negative-control | roi-cost-unsupported | 1 | 0 | 0.0000 | azure-sql-hyperscale | - | unsupported-roi-cost-claim |
| demo-derived-evidence-labeled | positive-readiness | demo-vs-customer | 1 | 1 | 1.0000 | - | - | - |
| customer-provided-evidence-cited | positive-readiness | demo-vs-customer | 1 | 1 | 1.0000 | - | - | - |
| wrong-corpus-pricing-in-policy-pack | negative-control | wrong-corpus | 2 | 1 | 0.5000 | azure-retail-app-service-price | azure-retail-app-service-price | - |
| missing-citation-multi-hit | negative-control | missing-citation | 3 | 0 | 0.0000 | azure-monitor-alerts, azure-log-analytics, azure-action-groups | - | - |
| azure-saas-identity-cited | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| ai-governance-content-safety-cited | positive-readiness | ai-governance | 2 | 2 | 1.0000 | - | - | - |
| healthcare-audit-retention-cited | positive-readiness | healthcare-regulatory | 1 | 1 | 1.0000 | - | - | - |
| roi-cost-supported-multi-token | positive-readiness | roi-cost-supported | 2 | 2 | 1.0000 | - | - | - |
| roi-cost-unsupported-annualized | negative-control | roi-cost-unsupported | 1 | 0 | 0.0000 | customer-review-hours | - | unsupported-roi-cost-claim |
| deferred-scope-soc2-cpa-claim | negative-control | deferred-scope-claim | 1 | 0 | 0.0000 | soc2-roadmap-v1 | - | - |
| deferred-scope-pen-test-claim | negative-control | deferred-scope-claim | 1 | 0 | 0.0000 | owner-pentest-2026q2 | - | - |
| missing-evidence-ref-roi-headline | negative-control | missing-citation | 1 | 0 | 0.0000 | buyer-roi-baseline-id | - | missing-evidence-ref |
| ask-policy-pack-kv-cited | positive-readiness | azure-saas-readiness | 1 | 1 | 1.0000 | - | - | - |
| ask-platform-adr-cited | positive-readiness | platform-doc | 1 | 1 | 1.0000 | - | - | - |
| ask-prior-decision-cited | positive-readiness | prior-manifest | 1 | 1 | 1.0000 | - | - | - |
| ask-azure-retail-cost-cited | positive-readiness | azure-saas-readiness | 1 | 1 | 1.0000 | - | - | - |
| ask-demo-derived-cited | positive-readiness | demo-vs-customer | 1 | 1 | 1.0000 | - | - | - |
| ask-customer-network-cited | positive-readiness | demo-vs-customer | 1 | 1 | 1.0000 | - | - | - |
| ask-multi-corpus-cited | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | azure-frontdoor-waf-standard | - |
| ask-missing-citation-negative | negative-control | missing-citation | 1 | 0 | 0.0000 | adr-0031-cross-tenant | - | - |

## RAG-V2 ablation (TB-595)

Offline golden-cohort passes that simulate `Retrieval:Advanced` feature flags toggled off by
filtering retrieval hits attributed to Graph-RAG neighbor expansion, HyDE, or query rewrite.
**Positive Δ vs all-on** is the change in positive readiness when the flag is disabled.
Negative Δ means the feature contributed cited hits on fixtures; positive Δ means attributed
hits were uncited or unhelpful for the agent output under test.

| Profile | Positive readiness | Δ vs all-on | Combined diagnostic | Δ vs all-on | Hits filtered | Cases affected |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| All on (blended baseline) | 0.9783 | +0.0000 | 0.6389 | +0.0000 | 0 | 0 |
| EnableGraphRag=false | 0.9783 | +0.0000 | 0.6528 | +0.0139 | 8 | 8 |
| EnableHyde=false | 1.0000 | +0.0217 | 0.6528 | +0.0139 | 6 | 6 |
| EnableQueryRewrite=false | 0.9783 | +0.0000 | 0.6389 | +0.0000 | 6 | 6 |
| All advanced off | 1.0000 | +0.0217 | 0.6667 | +0.0278 | 19 | 19 |

> **Scope:** Auto-generated offline faithfulness report from golden fixtures; does not claim live-model validation.

# RAG faithfulness report

- **Cases evaluated:** 25
- **Positive readiness cases:** 16
- **Positive readiness support ratio:** 0.9688
- **Negative-control cases:** 9
- **Negative-control support ratio:** 0.6667
- **Combined diagnostic support ratio:** 0.8600
- **Floor (minSupportRatio):** 0.8000

## Interpretation

- **Positive readiness support ratio** is the buyer-safe quality-posture number for normal supported-output fixtures.
- **Negative-control support ratio** is diagnostic detector coverage for deliberately missing citations, wrong corpus, or unsupported ROI/cost claims.
- **Combined diagnostic support ratio** preserves the historical all-case view for release engineering, but should not be quoted as the readiness-only score.

## Per-category breakdown

| Category | Cases | Mean support ratio |
| --- | ---: | ---: |
| ai-governance | 3 | 0.8333 |
| azure-saas-readiness | 5 | 1.0000 |
| demo-vs-customer | 2 | 1.0000 |
| healthcare-regulatory | 3 | 1.0000 |
| missing-citation | 3 | 0.0000 |
| roi-cost-supported | 3 | 1.0000 |
| roi-cost-unsupported | 3 | 1.0000 |
| wrong-corpus | 3 | 1.0000 |

## Per-case results

| Case | Cohort | Category | Retrieved | Supported | Ratio | Missing citations | Wrong corpus | Unsupported ROI/cost |
|------|--------|----------|-----------|-----------|-------|-------------------|--------------|----------------------|
| faithfulness-policy-cited | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| faithfulness-partial-citation | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| faithfulness-uncited | negative-control | missing-citation | 1 | 0 | 0.0000 | fabricated-1 | - | - |
| azure-saas-readiness-citation-required | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| ai-governance-wrong-corpus-detected | negative-control | wrong-corpus | 2 | 2 | 1.0000 | - | ai-gov-human-review-required | - |
| healthcare-claims-policy-review-citation-required | positive-readiness | healthcare-regulatory | 2 | 2 | 1.0000 | - | - | - |
| roi-cost-claim-unsupported | negative-control | roi-cost-unsupported | 1 | 1 | 1.0000 | - | - | unsupported-roi-cost-claim |
| azure-saas-private-endpoint-cited | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| azure-saas-missing-waf-citation | negative-control | missing-citation | 1 | 0 | 0.0000 | azure-waf-policy-01 | - | - |
| ai-governance-model-card-cited | positive-readiness | ai-governance | 2 | 2 | 1.0000 | - | - | - |
| ai-governance-partial-human-review | positive-readiness | ai-governance | 2 | 1 | 0.5000 | ai-eval-golden-cohort | - | - |
| healthcare-baa-required-cited | positive-readiness | healthcare-regulatory | 2 | 2 | 1.0000 | - | - | - |
| healthcare-wrong-corpus-clinical | negative-control | wrong-corpus | 2 | 2 | 1.0000 | - | clinical-trial-consent | - |
| roi-cost-supported-with-baseline | positive-readiness | roi-cost-supported | 2 | 2 | 1.0000 | - | - | - |
| roi-cost-hours-supported | positive-readiness | roi-cost-supported | 1 | 1 | 1.0000 | - | - | - |
| roi-cost-unsupported-savings-percent | negative-control | roi-cost-unsupported | 1 | 1 | 1.0000 | - | - | - |
| demo-derived-evidence-labeled | positive-readiness | demo-vs-customer | 1 | 1 | 1.0000 | - | - | - |
| customer-provided-evidence-cited | positive-readiness | demo-vs-customer | 1 | 1 | 1.0000 | - | - | - |
| wrong-corpus-pricing-in-policy-pack | negative-control | wrong-corpus | 2 | 2 | 1.0000 | - | azure-retail-app-service-price | - |
| missing-citation-multi-hit | negative-control | missing-citation | 3 | 0 | 0.0000 | azure-monitor-alerts, azure-log-analytics, azure-action-groups | - | - |
| azure-saas-identity-cited | positive-readiness | azure-saas-readiness | 2 | 2 | 1.0000 | - | - | - |
| ai-governance-content-safety-cited | positive-readiness | ai-governance | 2 | 2 | 1.0000 | - | - | - |
| healthcare-audit-retention-cited | positive-readiness | healthcare-regulatory | 1 | 1 | 1.0000 | - | - | - |
| roi-cost-supported-multi-token | positive-readiness | roi-cost-supported | 2 | 2 | 1.0000 | - | - | - |
| roi-cost-unsupported-annualized | negative-control | roi-cost-unsupported | 1 | 1 | 1.0000 | - | - | - |

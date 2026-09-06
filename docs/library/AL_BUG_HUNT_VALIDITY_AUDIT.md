> **Scope:** Contributor-reference — validity audit of `(proven)` hunt hypotheses. Not a buyer or operator document.

# `/al-bug` proven-row validity audit

**Sample size:** 100 rows (of 4061 tagged proven in ledger)
**RNG seed:** 20260906

## Class totals (heuristic)

| Class | Count |
| --- | ---: |
| realistic | 2 |
| synthetic-coercion | 1 |
| synthetic-negation | 6 |
| synthetic-redaction | 7 |
| unclear | 84 |

**Estimated synthetic fraction (sample):** 14%

## By zone (sample)

| Zone | Count |
| --- | ---: |
| archlucid-core | 50 |
| api-governance-tenancy-controllers | 25 |
| technology-ledger-merge | 2 |
| api-authority-admin-controllers | 2 |
| tenant-scoped-analyzer | 2 |
| archlucid-contracts | 2 |
| context-ingestion | 2 |
| tenant-data-export | 2 |
| application-tenancy-lifecycle | 1 |
| extraction-router | 1 |
| notifications-pipeline | 1 |
| auth-return-path | 1 |
| application-governance-policy | 1 |
| ui-architecture-intelligence | 1 |
| cli-draft-new | 1 |
| arm-terraform-source-ids | 1 |
| ui-marketing-surfaces | 1 |
| artifact-synthesis | 1 |
| api-key-auth | 1 |
| agent-runtime-evaluation | 1 |
| application-analysis | 1 |

## Evidence note (2026-09-06)

ABQ-01/02 redactor probe: fictional keys like `beefAccessKey` were redacted while real ARM keys such as `adminPassword` and `storageAccountAccessKey` were not — synthetic redaction hunts masked a fail-open defect class.

## Unclear rows (owner review)

- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsAdviceStyleNegation` — `daren't ensure` prefix gap — **hit 2026-09-06 (#995):** configure-only advice `daren't` prefix guard; missed `workloads daren't ensure encr…
- `archlucid-core`: `RequestConstraintTokenMatcher.IsAdviceStyleNegation` — mid-sentence `doesn't maintain to` gap — **hit 2026-09-06 (#1049):** mid-sentence `doesn't maintain` only; missed `teams doesn't maintain to use…
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsSuffixNegatedAdviceFragment` — `hasn't maintain` suffix gap — **hit 2026-09-06 (#1093):** haven't/aren't-only advice suffix guard; missed `enable encryption hasn't…
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsSuffixNegatedAdviceFragment` — imperative-path `shouldn't maintain` suffix gap — **hit 2026-09-05 (#924):** #912 added `should not maintain` suffix only; missed im…
- `archlucid-core`: `RequestConstraintTokenMatcher.ContainsMidSentenceNegation` — `ought not require` negation gap — **hit 2026-09-05 (#902):** #901 added modal `will`/`would not require` only; missed prohibitive `ought …
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsSuffixNegatedAdviceFragment` — `hadn't require` suffix gap — **hit 2026-09-06 (#1094):** hasn't/haven't-only advice suffix guard; missed `enable encryption hadn't …
- `archlucid-core`: `RequestConstraintTokenMatcher.IsAdviceStyleNegation` — mid-sentence `shan't ensure to` gap — **hit 2026-09-06 (#1065):** mid-sentence `shan't ensure` only; missed `teams shan't ensure to use {token}`…
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsSuffixNegatedAdviceFragment` — `may not configure` suffix gap — **hit 2026-09-06 (#1099):** mayn't/might not-only advice suffix guard; missed `enable encryption ma…
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsSuffixNegatedAdviceFragment` — `weren't maintain` suffix gap — **hit 2026-09-06 (#1095):** hadn't/hasn't-only advice suffix guard; missed `enable encryption weren'…
- `archlucid-core`: `MarketingAttributionBucketMapper.MapCoarsePlatform` — `linked-in` / `linked_in` delimiter variants map to `unknown` — **hit 2026-09-05 (#877):** #876 fixed medium delimiter parity only; hyphen/unders…


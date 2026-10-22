> **Scope:** Contributor-reference — validity audit of `(proven)` hunt hypotheses. Not a buyer or operator document.

# `/al-bug` proven-row validity audit

**Population:** all 4061 rows tagged proven in the ledger (classified in full, not sampled)
**RNG seed (examples only):** 20260906

## Class totals (full population)

| Class | Count | Share |
| --- | ---: | ---: |
| unclassified | 1706 | 42.0% |
| negation-treadmill | 1647 | 40.6% |
| redaction-treadmill | 629 | 15.5% |
| coercion-treadmill | 43 | 1.1% |
| substantive | 34 | 0.8% |
| parity-treadmill | 2 | 0.0% |
| **treadmill total** | **2321** | **57.2%** |

**Treadmill share of proven rows:** 57.2% (2321 of 4061).
A treadmill row re-proves the same guard against a new surface form, so it inflates
`bugs-found` without retiring a defect class. Scoring must not read these as yield.

## Treadmill concentration by zone (full population)

| Zone | Proven rows | Treadmill | Share |
| --- | ---: | ---: | ---: |
| archlucid-core | 2806 | 2321 | 82.7% |
| api-governance-tenancy-controllers | 453 | 0 | 0.0% |
| context-ingestion | 150 | 0 | 0.0% |
| arm-terraform-source-ids | 47 | 0 | 0.0% |
| application-analysis | 35 | 0 | 0.0% |
| notifications-pipeline | 29 | 0 | 0.0% |
| archlucid-contracts | 25 | 0 | 0.0% |
| ui-operator-lib | 24 | 0 | 0.0% |
| api-authority-admin-controllers | 22 | 0 | 0.0% |
| ui-marketing-surfaces | 21 | 0 | 0.0% |
| tenant-data-export | 20 | 0 | 0.0% |
| ui-oidc | 18 | 0 | 0.0% |
| security-analyzers | 17 | 0 | 0.0% |
| itsm-inbound-webhooks | 15 | 0 | 0.0% |
| decisioning | 14 | 0 | 0.0% |

## Evidence note (2026-09-06)

ABQ-01/02 redactor probe: fictional keys like `beefAccessKey` were redacted while real ARM keys such as `adminPassword` and `storageAccountAccessKey` were not — synthetic redaction hunts masked a fail-open defect class.

## Example rows by class (seeded sample)

### negation-treadmill

- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsAdviceStyleNegation` — `daren't ensure` prefix gap — **hit 2026-09-06 (#995):** configure-only advice `daren't` prefix guard; missed `workloads daren't ensure encr…
- `archlucid-core`: `RequestConstraintTokenMatcher.IsAdviceStyleNegation` — mid-sentence `doesn't maintain to` gap — **hit 2026-09-06 (#1049):** mid-sentence `doesn't maintain` only; missed `teams doesn't maintain to use…
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsSuffixNegatedAdviceFragment` — `hasn't maintain` suffix gap — **hit 2026-09-06 (#1093):** haven't/aren't-only advice suffix guard; missed `enable encryption hasn't…
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsSuffixNegatedAdviceFragment` — imperative-path `shouldn't maintain` suffix gap — **hit 2026-09-05 (#924):** #912 added `should not maintain` suffix only; missed im…

### redaction-treadmill

- `archlucid-core`: `ConfigurationSensitiveConfigPathMatcher` / `AzureExtractorSensitivePropertyRedactor` — `SuperAccessKey` not redacted — **hit 2026-09-06 (#1022):** same compound access-key class; fixed with explicit …
- `archlucid-core`: `ConfigurationSensitiveConfigPathMatcher` / `AzureExtractorSensitivePropertyRedactor` — `ProcessAccessKey` not redacted — **hit 2026-09-06 (#978):** same compound access-key class; fixed with explicit…
- `archlucid-core`: `ConfigurationSensitiveConfigPathMatcher` / `AzureExtractorSensitivePropertyRedactor` — `ModelAccessKey` not redacted — **hit 2026-09-06 (#959):** same compound access-key class; fixed with explicit c…
- `archlucid-core`: `ConfigurationSensitiveConfigPathMatcher` / `AzureExtractorSensitivePropertyRedactor` — `OriginAccessKey` not redacted — **hit 2026-09-06 (#968):** same compound access-key class; fixed with explicit …

### coercion-treadmill

- `archlucid-core`: `RunAuthorityPipelineDeadLetterDetection.TryReadSupportedSchemaVersion` — boolean / `on` synonym `schemaVersion` JSON tokens rejected — **hit 2026-09-03 (#619):** `{"schemaVersion":true,"failureClass"…

### parity-treadmill

- `archlucid-core`: `MarketingAttributionBucketMapper.MapCoarsePlatform` — `linked-in` / `linked_in` delimiter variants map to `unknown` — **hit 2026-09-05 (#877):** #876 fixed medium delimiter parity only; hyphen/unders…

### substantive

- `api-governance-tenancy-controllers`: `ComplianceDriftTrendService.GetTrendAsync` / `GovernanceController.GetComplianceDriftTrend` — tenant-only drift trend included foreign workspace/project policy-pack changes and findings audit buckets…
- `cli-draft-new`: `ResolveMustQuestionsAsync` skip/answer paths omit `CliScopeResponseValidator` after `SkipDraftQuestionAsync` / `AnswerDraftQuestionAsync` return a draft body — **hit 2026-09-04 (#772):** create/patch…

### unclassified

- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsNegatedAdviceFragment` — `ain't adopt` prefix gap — **hit 2026-09-06 (#978):** enable/implement-only advice `ain't` guard; missed mid-sentence `ain't adopt` before…
- `archlucid-core`: `GcpCloudBillingCatalogClient.TryReadTieredRateUsd` — omitted zero `nanos` property rejected units-only `unitPrice` — **hit 2026-09-02 (#501):** `"unitPrice": { "units": 1 }` returned null while expli…
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsNegatedAdviceFragment` — `mayn't enable` prefix gap — **hit 2026-09-06 (#979):** use/have-only advice `mayn't` guard; missed mid-sentence `mayn't enable` before `e…
- `archlucid-core`: `GenericArchitectureAdvicePatterns.IsNegatedAdviceFragment` — `shall not have` prefix gap — **hit 2026-09-06 (#960):** suffix guards only; missed mid-sentence `shall not have` before `encryption at re…


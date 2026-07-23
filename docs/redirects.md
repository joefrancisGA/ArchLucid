> **Scope:** Canonical redirect map for the documentation audit — former paths, where content lives now, and why the old file was removed. Use this instead of keeping redirect stub markdown files in the tree; update inbound links to the **canonical** column when you touch a caller.

> **Spine doc:** [`START_HERE.md`](START_HERE.md).

# Documentation redirects

**Last reviewed:** 2026-07-23

Human readers and agents should follow **canonical** paths below. This file is the only redirect surface — do not recreate thin "moved" stub files.

## How to use

| Situation | Action |
|-----------|--------|
| You have a bookmark or external link to a **former** path | Look up the row; open **canonical** instead |
| You are editing markdown that links to a former path | Change the link to **canonical** |
| Terraform / CI / UI embeds a doc path by string | Prefer **canonical**; if the string is load-bearing, update the embed in the same change |
| A former path is not listed | Add a row when you delete or merge a doc during the audit |

---

## 2026-07-20 audit merges (content deleted)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/ONBOARDING_GOLDEN_CHANGE_PATH_2026_04_17.md` | [`docs/library/GOLDEN_CHANGE_PATH.md`](library/GOLDEN_CHANGE_PATH.md) | Engineer "extend safely" checklists |
| `docs/archive/ONBOARDING_HAPPY_PATH_2026_04_17.md` | [`docs/onboarding/day-one-developer.md`](onboarding/day-one-developer.md#following-the-request-past-create-execute--commit--retrieval--ask) | Single-request lifecycle narrative |
| `docs/archive/ONBOARDING_GOLDEN_PATH_2026_04_17.md` | [`docs/library/GOLDEN_PATH.md`](library/GOLDEN_PATH.md) | Environment maturity sequencing (Zero → Azure) |
| `docs/integrations/SSO_AUTH0_CONFIGURATION.md` | [`docs/integrations/IDP_PROVISIONING.md`](integrations/IDP_PROVISIONING.md) | Auth0 SSO (§2) |
| `docs/integrations/SSO_OKTA_CONFIGURATION.md` | [`docs/integrations/IDP_PROVISIONING.md`](integrations/IDP_PROVISIONING.md) | Okta SSO (§3) |
| `docs/archive/ONBOARDING_CONTRIBUTOR_ONBOARDING_2026_04_17.md` | [`docs/onboarding/day-one-developer.md`](onboarding/day-one-developer.md) | Duplicate contributor stub — no unique content |
| `docs/archive/FIRST_5_DOCS.md` | [`docs/START_HERE.md`](START_HERE.md) | Legacy five-doc spine bookmark stub |
| `docs/archive/FIRST_FIVE_DOCS.md` | [`docs/START_HERE.md`](START_HERE.md) | Alternate spelling of `FIRST_5_DOCS` stub |
| `docs/READ_THIS_FIRST.md` | [`docs/START_HERE.md`](START_HERE.md) | Deprecated Y/N routing stub (2026-04-27) |
| `docs/archive/READ_THIS_FIRST.md` | [`docs/START_HERE.md`](START_HERE.md) | Archive duplicate of root decision-tree stub |
| `docs/archive/FIRST_RUN_WIZARD.md` | [`docs/library/FIRST_RUN_WIZARD.md`](library/FIRST_RUN_WIZARD.md) | Legacy wizard design-note bookmark stub |
| `docs/archive/FIRST_RUN_WALKTHROUGH.md` | [`docs/library/FIRST_RUN_WALKTHROUGH.md`](library/FIRST_RUN_WALKTHROUGH.md) | Legacy first-run walkthrough bookmark stub |
| `docs/archive/FIRST_FIVE_DOCS_SUPERSEDED_2026_04_22.md` | [`docs/START_HERE.md`](START_HERE.md) | Archived pre-spine reading-order table |
| `docs/archive/NAVIGATOR.md` | [`docs/START_HERE.md`](START_HERE.md) | Legacy task-navigator bookmark stub |
| `docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md` | [`docs/library/OBSERVABILITY.md`](library/OBSERVABILITY.md#authority-pipeline-remediation-runbook) | Authority pipeline Grafana/Prometheus remediation |
| `docs/runbooks/GRAFANA_DASHBOARD_BINDING_GUIDE.md` | [`docs/runbooks/OBSERVABILITY_DASHBOARD_BINDING.md`](runbooks/OBSERVABILITY_DASHBOARD_BINDING.md) | Grafana import / datasource binding |

---

## 2026-04-23 SaaS-framing moves (`docs/library/` → `docs/engineering/`)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/library/BUILD.md` | [`docs/engineering/BUILD.md`](engineering/BUILD.md) | Build & test hygiene (contributor) |
| `docs/library/CONTAINERIZATION.md` | [`docs/engineering/CONTAINERIZATION.md`](engineering/CONTAINERIZATION.md) | Docker / compose |
| `docs/library/DEVCONTAINER.md` | [`docs/engineering/DEVCONTAINER.md`](engineering/DEVCONTAINER.md) | Dev container |
| `docs/library/DEPLOYMENT.md` | [`docs/engineering/DEPLOYMENT.md`](engineering/DEPLOYMENT.md) | Deploy & rollback umbrella |
| `docs/archive/INSTALL_ORDER.md` | [`docs/engineering/INSTALL_ORDER.md`](engineering/INSTALL_ORDER.md) | Contributor install order |
| `docs/archive/FIRST_30_MINUTES.md` | [`docs/engineering/FIRST_30_MINUTES.md`](engineering/FIRST_30_MINUTES.md) | Contributor first 30 minutes |

---

## Customer-facing body moves (`docs/library/` → `docs/library/customer-facing/`)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/library/OPERATOR_QUICKSTART.md` | [`docs/library/customer-facing/OPERATOR_QUICKSTART.md`](library/customer-facing/OPERATOR_QUICKSTART.md) | Command-first operator quickstart |
| `docs/library/PILOT_GUIDE.md` | [`docs/library/customer-facing/PILOT_GUIDE.md`](library/customer-facing/PILOT_GUIDE.md) | Pilot onboarding |

---

## Other former paths

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/TROUBLESHOOTING.md` | [`docs/runbooks/TROUBLESHOOTING.md`](runbooks/TROUBLESHOOTING.md) | Root entry stub removed |
| `docs/library/CORE_PILOT.md` | [`docs/CORE_PILOT.md`](CORE_PILOT.md) | Customer first-session guide (repo-root canonical) |
| `docs/integrations/AZURE_DEVOPS_PR_DECORATION.md` | [`docs/integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md`](integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) (pipeline) · [`docs/integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md`](integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) (server-side) | Pick integration path |

---

## 2026-07-20 deployment doc consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/STAGING_DEPLOYMENT_VALIDATION.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#part-a--staging) | Staging post-deploy validation |
| `docs/deployment/STAGING_DEPLOYMENT_CHECKLIST.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#part-a--staging) | Staging operator checklist |
| `docs/deployment/STAGING_PRE_DEPLOY_VERIFICATION.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#a1-pre-deploy-verification-before-terraform-apply-or-cd) | Staging pre-deploy gates |
| `docs/runbooks/CANARY_DEPLOYMENT.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#part-c--canary-promotion-container-apps) | Canary / revision traffic split |
| `docs/runbooks/STAGING_TRIAL_VALIDATION_CHECKLIST.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#a5-staging-trial-funnel-validation-pre-rc-sign-off) | Staging trial funnel pre-RC checklist (phases 1–7) |
| `docs/runbooks/STRIPE_OPERATOR_CHECKLIST.md` | [`docs/go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md#operator-completion-checklist) | Stripe Team tier operator strike list |
| `docs/runbooks/STRIPE_STAGING_E2E_VERIFICATION.md` | [`docs/go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md#staging-end-to-end-verification-stripe-test-mode) | Staging Stripe TEST verification + SQL |

---

## 2026-07-21 commerce doc consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md` | [`docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`](go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#publisher-identity--partner-center-placeholders) | Partner Center MPN / offer IDs, legal entity, landing page |
| `docs/runbooks/STRIPE_WEBHOOK_INCIDENT.md` | [`docs/go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md#webhook-incident-triage) | Stripe webhook incident triage, statement descriptor, signing-secret rotation |
| `docs/runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md` | [`docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`](go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#marketplace-ga-rollback-changeplan--changequantity) | Marketplace `GaEnabled` rollback, SQL reconciliation, re-enable |
| `docs/go-to-market/MARKETPLACE_PUBLICATION.md` | [`docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`](go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#publication-checklist-gtm) | Partner Center publication checklist, tier mapping, default region |
| `docs/runbooks/MARKETING_STRIPE_GA.md` | [`docs/go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md#marketing-site--stripe-ga-public-go-live) | Marketing Front Door GA + live Stripe checkout and webhooks |

## 2026-07-21 migration doc consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/ROLLING_DEPLOY_MIGRATIONS.md` | [`docs/runbooks/MIGRATION_ROLLBACK.md`](runbooks/MIGRATION_ROLLBACK.md#rolling-deploy-migrations) | Expand/contract patterns, coordinated migrations, TB-068 CI lint |
| `docs/runbooks/SAML_CERT_ROTATION.md` | [`docs/runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md`](runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md) | Former short alias filename; canonical SAML SP signing cert rotation |
| `docs/library/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md` | [`docs/runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md`](runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md) | Former library pointer stub; canonical runbook under `docs/runbooks/` |
| `docs/runbooks/EMAIL_OTP_ABUSE_DRILL.md` | [`docs/runbooks/EMAIL_OTP_DELIVERY_AND_ABUSE.md`](runbooks/EMAIL_OTP_DELIVERY_AND_ABUSE.md#abuse-drill-evidence-e1) | Staging OTP flood drill (Evidence E1) |
| `docs/runbooks/FIRST_VALUE_20_MINUTES.md` | [`docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed) | Time-boxed path to sponsor-safe artifact |

## 2026-07-22 runbook consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/PRE_COMMIT_CI_GATE_STARTER.md` | [`docs/runbooks/CI_GOVERNANCE_GATE.md`](runbooks/CI_GOVERNANCE_GATE.md#minimal-ci-starters) | Minimal copy-paste simulate/commit CI starters |
| `docs/runbooks/SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md` | [`docs/runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md`](runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md#artifact-open-order) | Proof-folder artifact open order + buyer-safe table |

## 2026-07-22 archiforge / brownfield Terraform cleanup

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md` | [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) §3 | Pre-release greenfield only; brownfield `state mv` runbook removed |
| `docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md` | [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) §3 | Archived copy removed with runbook |

## 2026-07-22 CHANGE_SET series consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/CHANGE_SET_55R_SUMMARY.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | §55R |
| `docs/archive/CHANGE_SET_56R.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | §56R |
| `docs/archive/CHANGE_SET_57R.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | §57R |
| `docs/archive/CHANGE_SET_58R.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | §58R |
| `docs/archive/CHANGE_SET_59R.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | §59R |

## 2026-07-22 marketability assessment consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M2.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Mixed framing — pre-M2 |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M3.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Mixed framing — post-M1+M2 |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_TRUST_CENTER.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | SaaS-only — pre-Trust Center |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_IMP2_6.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | SaaS-only — post-Trust Center |
| `docs/MARKETABILITY_ASSESSMENT_2026_04_15.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Legacy root alias (mixed framing) |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_trust-center.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Old filename casing alias |
| `docs/archive/IMPROVEMENTS_COMPLETE_2026_04_21.md` | [`docs/archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) | Superseded schema-validation summary; see `docs/CHANGELOG.md` for component history |
| `docs/archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md` | [`docs/library/TECH_BACKLOG.md`](library/TECH_BACKLOG.md) | April 2026 refactor snapshot removed; canonical engineering backlog |

## 2026-07-22 assessment series consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/root-superseded-2026-05-01/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md` | [`docs/archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md`](archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md) | §Weighted assessment |
| `docs/archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md` | [`docs/archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md`](archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md) | §Cursor prompts |
| `docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md` | [`docs/archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md`](archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md) | Legacy root path |
| `docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md` | [`docs/archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md`](archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md) | Legacy root path |
| `docs/archive/root-superseded-2026-05-01/USABILITY_SOLUTION_QUALITY_ASSESSMENT_2026_04_25_69_52.md` | [`docs/archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md`](archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md) | §Weighted assessment |
| `docs/archive/root-superseded-2026-05-01/CURSOR_PROMPTS_USABILITY_ASSESSMENT_2026_04_25_69_52.md` | [`docs/archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md`](archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md) | §Cursor prompts |
| `docs/USABILITY_SOLUTION_QUALITY_ASSESSMENT_2026_04_25_69_52.md` | [`docs/archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md`](archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md) | Legacy root path |
| `docs/CURSOR_PROMPTS_USABILITY_ASSESSMENT_2026_04_25_69_52.md` | [`docs/archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md`](archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md) | Legacy root path |

## Renamed (not deleted)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/ONBOARDING_PILOT_GUIDE_2026_04_17.md` | [`docs/library/customer-facing/PILOT_GUIDE.md`](library/customer-facing/PILOT_GUIDE.md) | Former 56R local-dev pilot guide |
| `docs/archive/PILOT_GUIDE_CHANGE_SET_56R.md` | [`docs/library/customer-facing/PILOT_GUIDE.md`](library/customer-facing/PILOT_GUIDE.md) | **56R** local-dev pilot guide (canonical customer-facing guide) |

## 2026-07-22 tier-2 archive consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/PRODUCT_PACKAGING_THREE_LAYERS_2026_04_23.md` | [`docs/library/PRODUCT_PACKAGING.md`](library/PRODUCT_PACKAGING.md) | Three-layer buyer narrative superseded by Pilot + Operate |
| `docs/archive/TECH_BACKLOG_DONE_ARCHIVE.md` | [`docs/library/TECH_BACKLOG.md`](library/TECH_BACKLOG.md) | Empty stub headings removed; summary **Done** rows retained |
| `docs/archive/artifacts-phase3-2026-04-23/gate-verification.md` | [`docs/archive/artifacts-phase3-2026-04-23/PHASE3_EVIDENCE_SERIES_2026_04_23.md`](archive/artifacts-phase3-2026-04-23/PHASE3_EVIDENCE_SERIES_2026_04_23.md) | §Gate verification |
| `docs/archive/artifacts-phase3-2026-04-23/pr-a2-cohort-parity.md` | [`docs/archive/artifacts-phase3-2026-04-23/PHASE3_EVIDENCE_SERIES_2026_04_23.md`](archive/artifacts-phase3-2026-04-23/PHASE3_EVIDENCE_SERIES_2026_04_23.md) | §PR A2 cohort parity |

## 2026-07-22 assessment prompt consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/assessments/ASSESSMENT_PROMPT_V3.MD` (body) | [`docs/assessments/ASSESSMENT_PROMPT_SERIES.md`](assessments/ASSESSMENT_PROMPT_SERIES.md) | §Strategic release and market readiness (v3); stub remains at former path |
| `docs/assessments/assessment_prompt_v4.md` (body) | [`docs/assessments/ASSESSMENT_PROMPT_SERIES.md`](assessments/ASSESSMENT_PROMPT_SERIES.md) | §Broader exposure readiness (v4); stub remains at former path |

## 2026-07-22 internal doc review digest

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/ARCHLUCID_INTERNAL_DOC_REVIEW_AND_MASTER_SUMMARY.md` | Git history | Auto-generated inventory removed; use `docs/archive/README.md` |

## 2026-07-22 library / runbook stub sweep

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/library/FAQ.md` | [`docs/library/customer-facing/FAQ.md`](library/customer-facing/FAQ.md) | Phase 1 move stub removed |
| `docs/library/GOVERNANCE.md` | [`docs/library/contributor-reference/GOVERNANCE.md`](library/contributor-reference/GOVERNANCE.md) | Phase 1 move stub removed |
| `docs/library/CONCEPTS_IN_5_MINUTES.md` | [`docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md`](library/customer-facing/CONCEPTS_IN_5_MINUTES.md) | Phase 2 move stub removed |
| `docs/library/WORKFLOW_RECIPES_BY_PERSONA.md` | [`docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md`](library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md) | Phase 1 bookmark stub removed |
| `docs/library/CHAMPION_48H_KIT.md` | [`docs/go-to-market/DECISION_FAST_LANE.md`](go-to-market/DECISION_FAST_LANE.md) · [`docs/CORE_PILOT.md`](CORE_PILOT.md) | Legacy champion kit filename |
| `docs/runbooks/TENANT_SQL_TOPOLOGY_RUNBOOK.md` | [`docs/operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md`](operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md) | Runbook lives under `docs/operations/` |
| `docs/runbooks/CORRELATION_AND_TRACING.md` | [`docs/library/BACKGROUND_JOB_CORRELATION.md`](library/BACKGROUND_JOB_CORRELATION.md) · [`docs/library/OBSERVABILITY.md`](library/OBSERVABILITY.md) | Correlation + tracing entry points |
| `docs/library/SECURITY.md` | [`docs/library/contributor-reference/SECURITY.md`](library/contributor-reference/SECURITY.md) | Phase 3 move stub removed (TB-013) |
| `docs/library/COVERAGE_GAP_ANALYSIS.md` | [`docs/COVERAGE_GAP_ANALYSIS.md`](COVERAGE_GAP_ANALYSIS.md) | Stale library duplicate removed; CI generator writes root path only |
| `docs/archive/assessments/MARKETABILITY_ASSESSMENT_2026_04_15.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Duplicate of consolidated series |
| `docs/archive/assessments/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Duplicate of consolidated series |

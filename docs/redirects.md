> **Scope:** Canonical redirect map for the documentation audit — former paths, where content lives now, and why the old file was removed. Use this instead of keeping redirect stub markdown files in the tree; update inbound links to the **canonical** column when you touch a caller.

> **Spine doc:** [`START_HERE.md`](START_HERE.md).

# Documentation redirects

**Last reviewed:** 2026-07-20

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

## Renamed (not deleted)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/ONBOARDING_PILOT_GUIDE_2026_04_17.md` | [`docs/archive/PILOT_GUIDE_CHANGE_SET_56R.md`](archive/PILOT_GUIDE_CHANGE_SET_56R.md) | Renamed to match Change Set 56R semantics |

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

## Renamed (not deleted)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/ONBOARDING_PILOT_GUIDE_2026_04_17.md` | [`docs/archive/PILOT_GUIDE_CHANGE_SET_56R.md`](archive/PILOT_GUIDE_CHANGE_SET_56R.md) | Renamed to match Change Set 56R semantics |

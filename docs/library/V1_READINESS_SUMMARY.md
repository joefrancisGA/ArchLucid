> **Scope:** ArchLucid V1 — readiness summary - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid V1 — readiness summary

**Audience:** release owners, pilot leads, and executives who need a **short, honest** picture of where the repo stands for a **V1 / pilot** cut—not a marketing sheet.

**Basis:** This reflects **what the repository actually contains today** (code, docs, scripts, checklists). It does **not** certify a specific customer environment until you run your own gates.

---

## One-paragraph verdict

The codebase ships a **working V1-shaped product**: HTTP API, SQL persistence (DbUp), operator UI, CLI, health/version, support bundle, compare/replay/export surfaces, and documented pilot paths. **Self-serve SaaS trial** is covered by a **merge-blocking** live spec ([`archlucid-ui/e2e/live-api-trial-end-to-end.spec.ts`(../../archlucid-ui/e2e/live-api-trial-end-to-end.spec.ts), runbook [TRIAL_END_TO_END.md](../runbooks/TRIAL_END_TO_END.md)) in **`ui-e2e-live`**. **Operational completeness** (your deploy, auth, SQL, and recovery drills) is **your checklist**, not something the repo can sign for you. Remaining gaps are mostly **platform hygiene** (Terraform **`state mv`** only when remote state still lists legacy **`archiforge`** addresses — **Phase 7.6–7.7 rename + Entra alignment closed 2026-04-19**, see [V1_DEFERRED.md](V1_DEFERRED.md) §3), **compliance/audit coverage** in specific flows, and **staging validation** beyond CI: **`ui-axe-components`** runs fast **Vitest + jest-axe** on shell components, while **`ui-e2e-live`** is the **merge-blocking** **browser** gate running the full **`live-api-*.spec.ts`** suite (including the trial acceptance spec above, plus happy path, conflict, governance rejection, negative paths, advisory/replay/compare/policy packs, alerts, search/graph, digest subscriptions, concurrency, archival smoke, **live axe**) against **real API + SQL** (see [LIVE_E2E_HAPPY_PATH.md](LIVE_E2E_HAPPY_PATH.md))—still not a substitute for your own staging validation.

---

## What is done (in-repo, supportable)

| Area | Evidence |
|------|-----------|
| **Core operator path** | Request → execute → commit → manifest/artifacts; documented in [V1_SCOPE.md](V1_SCOPE.md) §4, [PILOT_GUIDE.md](PILOT_GUIDE.md), [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md). |
| **Automation gates** | `scripts/run-readiness-check.ps1` (build + fast core + UI unit/build), `scripts/release-smoke.ps1` (optional full path with SQL + CLI quick run), `scripts/package-release.ps1` ([RELEASE_LOCAL.md](RELEASE_LOCAL.md), [RELEASE_SMOKE.md](RELEASE_SMOKE.md)). |
| **RC environment drill** | `scripts/v1-rc-drill.ps1` + [V1_RC_DRILL.md](V1_RC_DRILL.md): two reviews (`runId`), compare, authority replay, export ZIP, doctor, support bundle—against a **running** API. |
| **Diagnostics** | `GET /health/*`, `GET /version`, CLI `doctor`, `support-bundle` ([CLI_USAGE.md](CLI_USAGE.md), [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)). |
| **Breaking-change trail** | Phase 7 rename and config surface documented in [BREAKING_CHANGES.md](../../BREAKING_CHANGES.md); integration events **canonical `com.archlucid.*` only**. |
| **Deploy artifacts** | Dockerfiles, compose profiles, Terraform modules under `infra/` ([CONTAINERIZATION.md](CONTAINERIZATION.md), [DEPLOYMENT_TERRAFORM.md](DEPLOYMENT_TERRAFORM.md)). |
| **Release checklist** | Actionable boxes in [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) (scope, deploy, health, flows, exports, recovery). |
| **Self-serve trial** | Shipped in-repo: merge-blocking [`live-api-trial-end-to-end.spec.ts`(../../archlucid-ui/e2e/live-api-trial-end-to-end.spec.ts) + [TRIAL_END_TO_END.md](../runbooks/TRIAL_END_TO_END.md). |
| **Golden cohort / real-LLM evidence log** | Attempt and exemplar-path eval metrics: [REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_2026-05-09.md](../quality/REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_2026-05-09.md) (live Azure OpenAI session still operator-owned when credentials are available). |

---

## What is intentionally deferred

*Phase **7.6–7.7** (GitHub repo + Entra alignment) is **not** deferred — **closed 2026-04-19**; **7.8** waived. See [V1_DEFERRED.md](V1_DEFERRED.md) §3.*

| Item | Why / pointer |
|------|----------------|
| **Terraform `state mv`** (Phase **7.5**) | Resource **addresses** may still contain **`archiforge`** in **remote state** for applied stacks; **`main` IaC** uses **`archlucid`** labels — coordinate `state mv` + deploy window ([TERRAFORM_STATE_MV_PHASE_7_5.md](../runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md), [V1_DEFERRED.md](V1_DEFERRED.md) §3). |
| **Full audit parity** | Some mutating flows do not emit `dbo.AuditEvents`; documented as **known gaps** ([AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md), [V1_DEFERRED.md](V1_DEFERRED.md) §2). |
| **Multi-region SaaS guarantees** | Docs describe targets; not a boxed V1 product promise ([V1_SCOPE.md](V1_SCOPE.md) §3). |
| **Enterprise integration catalog** | Optional events/webhooks exist; custom consumers are customer-owned ([V1_SCOPE.md](V1_SCOPE.md) §3). |

---

## What risks remain

| Risk | Mitigation (in-repo) |
|------|----------------------|
| **GTM / packaging realism** | **`docs/go-to-market/SERVICE_LED_OFFERS.md`** and **`GTM_BACKLOG.md`** define named review SKUs and founder-led sequencing; ship **buyable offers** and pain-first copy alongside technical readiness. |
| **Environment-specific failure** | Run [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) + [V1_RC_DRILL.md](V1_RC_DRILL.md) on **your** staging stack; capture `/version` and support bundle. |
| **Auth mismatch** | Scripts such as `scripts/v1-rc-drill.ps1` assume **DevelopmentBypass** unless you extend them; JWT/API key pilots must follow [README.md](../REPOSITORY_README.md). |
| **UI E2E vs live API** | **`npm run test:e2e`** uses **mock** **`playwright.mock.config.ts`**; do not treat it as SQL-backed UI proof ([RELEASE_SMOKE.md](RELEASE_SMOKE.md)). CI **`ui-e2e-live`** runs all **`live-api-*.spec.ts`** ([LIVE_E2E_HAPPY_PATH.md](LIVE_E2E_HAPPY_PATH.md)) **merge-blocking** — broader than a single happy path, still not a substitute for your own staging validation. |
| **DB / RLS legacy names** | Historical migrations and some **RLS object names** still reference older tokens; breaking-change doc lists them ([BREAKING_CHANGES.md](../../BREAKING_CHANGES.md)). |
| **Compliance expectations** | If pilots need **audit UI parity** for every export path, read [AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md) before promising coverage. |

---

## What is good enough for pilot / V1

**Good enough** means: you can run the **documented happy path**, support it with **version + health + bundle**, and **not** promise deferred items above.

Minimum bar (already described in-repo):

1. **Release build** + agreed **Core** test filter ([TEST_STRUCTURE.md](TEST_STRUCTURE.md)).
2. **API up** on **Sql**; **DbUp** clean on fresh DB ([SQL_SCRIPTS.md](SQL_SCRIPTS.md)).
3. **One scripted E2E** (`scripts/release-smoke.ps1`) or equivalent manual path + **`scripts/v1-rc-drill.ps1`** on the target URL.
4. **Pilot docs** read ([PILOT_GUIDE.md](PILOT_GUIDE.md)) and **known issues** attached ([V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) §9).

If those pass **in the environment you hand off**, the repo is **aligned** with its own V1 contract ([V1_SCOPE.md](V1_SCOPE.md)). If they do not, the product is not “wrong”—the **environment or process** is not ready.

---

## What should be first after V1

Ordered by **typical leverage**, not mandatory roadmap:

1. **Terraform brownfield hygiene** — run **`terraform plan` / `state list`** per [TERRAFORM_STATE_MV_PHASE_7_5.md](../runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md) when remote state may still list **`archiforge`** addresses; **Phase 7.6–7.7** GitHub + Entra rename work already **closed** **2026-04-19** ([V1_DEFERRED.md](V1_DEFERRED.md) §3).
2. **Live API + operator UI** validation pass where Playwright mocks are insufficient (record outcome in release notes).
3. **Audit coverage** closes you care about for compliance ([AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md)).
4. **Maintainer backlog** ([NEXT_REFACTORINGS.md](NEXT_REFACTORINGS.md))—engineering hygiene, not pilot-blocking by default.

---

## Related documents

| Doc | Use |
|-----|-----|
| [V1_SCOPE.md](V1_SCOPE.md) | Contract: in scope, out of scope, minimum release criteria |
| [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) | Executable gates before handoff |
| [V1_RC_DRILL.md](V1_RC_DRILL.md) | Staged API drill |
| [V1_DEFERRED.md](V1_DEFERRED.md) | Doc-sourced deferrals and gaps |
| [BREAKING_CHANGES.md](../../BREAKING_CHANGES.md) | Phase 7 operator migration |

**Change control:** Update this file when **V1 boundaries** or **deferral reality** shifts; keep [V1_SCOPE.md](V1_SCOPE.md) the normative contract.

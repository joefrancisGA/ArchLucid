> **Scope:** Buyer-facing scalability FAQ — V1 single-region posture, explicit non-promises, practical scale levers, and in-repo load evidence (no marketing SLA claims).

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Buyer scalability FAQ

**Audience:** Procurement, solution architecture, and platform buyers who need short answers tied to repository sources.

**Last reviewed:** 2026-04-29

This page summarizes what the **V1** contract does and does **not** promise for scale and geography, where to read **RTO/RPO planning targets** (not automatic product SLAs), which **operational knobs** the docs describe, and what **load-test evidence** exists in CI and baselines.

---

## 1. V1 posture and explicit non-promises

- **V1 describes supportable product scope today**, not a roadmap of net-new scale guarantees — see the opening framing in [`V1_SCOPE.md`](V1_SCOPE.md) (**Status** / §1).
- **Multi-region active/active SaaS is not a V1 guarantee.** [`V1_SCOPE.md`](V1_SCOPE.md) §3 lists **“Multi-region active/active product guarantees”** as **out of scope for V1**, with a pointer that documentation may still describe tier targets and failover runbooks via [`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md); that cross-reference is for **planning and runbooks**, not a bundled active/active topology in the shipping product contract.
- **RTO/RPO numbers are tier planning defaults**, not contractual SLAs unless your organization adopts them formally — see [`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md) (**Constraints**: “Targets below are **not** contractual SLAs…”).

---

## 2. Practical scale-up levers (documentation pointers)

| Concern | Where it is documented |
|--------|-------------------------|
| **API vs worker replicas, SQL saturation, outbox depth, LLM/token signals** | [`CAPACITY_AND_COST_PLAYBOOK.md`](CAPACITY_AND_COST_PLAYBOOK.md) §5 (Component breakdown table: Container Apps, SQL, Outboxes, LLM). |
| **SQL tier, failover group / listener, geo patterns for production RPO** | [`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md) §Tier targets and §Production — SQL RPO; operational steps in [`DATABASE_FAILOVER.md`](../runbooks/DATABASE_FAILOVER.md) (cross-referenced from `RTO_RPO_TARGETS.md`). |
| **Redis cache, same-region vs paired region, Terraform gap note** | [`REDIS_AND_MULTI_REGION.md`](REDIS_AND_MULTI_REGION.md) — production points to Azure Cache for Redis; **multi-region application tier** describes Front Door secondary origin, SQL failover stack, and states that a **full active/active** multi-region app tier needs a second Container Apps environment and coordinated deployments (**not** a single-switch V1 guarantee). |
| **Per-tenant LLM cost estimation (not invoices)** | [`PER_TENANT_COST_MODEL.md`](PER_TENANT_COST_MODEL.md); sponsor-facing **line-item** sketch is referenced from [`CAPACITY_AND_COST_PLAYBOOK.md`](CAPACITY_AND_COST_PLAYBOOK.md) §9 via [`deployment/PER_TENANT_COST_MODEL.md`](../deployment/PER_TENANT_COST_MODEL.md). |

---

## 3. Load and performance evidence in-repo

- **Documented baseline table and methodology:** [`LOAD_TEST_BASELINE.md`](LOAD_TEST_BASELINE.md) — Compose **full-stack** assumptions, initial **p50/p95/p99** row, scaling **threshold interpretation**, and **BenchmarkDotNet** CI job pointer.
- **Merge-blocking k6 smoke on every PR:** [`LOAD_TEST_BASELINE.md`](LOAD_TEST_BASELINE.md) §**CI smoke (automated)** — `tests/load/ci-smoke.js` via the **`k6-ci-smoke`** job in `.github/workflows/ci.yml`, with thresholds and `scripts/ci/assert_k6_ci_smoke_summary.py` behavior described there.
- **Operator-path k6 after full regression:** same doc’s component table — `tests/load/k6-api-smoke.js` and its CI job name as listed in [`LOAD_TEST_BASELINE.md`](LOAD_TEST_BASELINE.md).
- **Manual / heavier profiles:** `.github/workflows/load-test.yml` (manual workflow), `scripts/load/hotpaths.js`, and optional scheduled workflows referenced in [`LOAD_TEST_BASELINE.md`](LOAD_TEST_BASELINE.md) (e.g. soak, per-tenant burst).

**Honest boundary:** Passing CI k6 jobs proves **regression-gated latency/failure-rate thresholds on the scripted paths** for the CI environment described in [`LOAD_TEST_BASELINE.md`](LOAD_TEST_BASELINE.md); they do **not** by themselves prove capacity for every customer topology or peak tenant mix.

---

## 4. Related

| Doc | Use |
|-----|-----|
| [`V1_SCOPE.md`](V1_SCOPE.md) | Authoritative V1 in/out scope including multi-region non-promise. |
| [`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md) | RTO/RPO tier table and SQL/geo mechanisms for **planning**. |
| [`LOAD_TEST_BASELINE.md`](LOAD_TEST_BASELINE.md) | Baseline numbers, k6 scripts, CI vs manual workflows. |
| [`CAPACITY_AND_COST_PLAYBOOK.md`](CAPACITY_AND_COST_PLAYBOOK.md) | Day-2 knobs and FinOps cadence. |

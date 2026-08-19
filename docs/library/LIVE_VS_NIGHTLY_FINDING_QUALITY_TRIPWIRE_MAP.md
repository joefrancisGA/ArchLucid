> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Live regression tripwire vs nightly eval — finding quality after silent AOAI minor revs

**Audience:** Engineering, SRE, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (**TB-1506**, 2026-08-10). GTM **M-275** / **M-276**. Honesty CI **TB-1507** **Done** (2026-08-10) / **M-275**.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#live-vs-nightly-finding-quality-tripwire-m-276`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#live-vs-nightly-finding-quality-tripwire-m-276) (GTM **M-276**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) (GTM **M-275**).

**Verdict (one line):** Nothing in production today is a **scheduled live canary** that proves Azure silently revved the model and finding quality dropped last Tuesday before a customer notices — **TB-683 nightly “real-mode” eval scores frozen `*.real.json` exemplars offline** (not production AOAI); the closest live signals are **per-execute quality/faithfulness gates + Prometheus rate alerts**, which are traffic-dependent and easy to miss for gradual degradation.

---

## 1. Nightly-eval coverage (what it is / is not)

| Mechanism | Cadence | Calls production AOAI? | Detects silent minor-version rev? |
|-----------|---------|------------------------|-----------------------------------|
| **`real-mode-eval-nightly.yml` (Done TB-683)** | Daily when `ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true` | **No** — scores committed `tests/eval-corpus/agent-results/*.real.json` | **No** — fixtures are frozen; consecutive-night script compares scorer trends on those files |
| **`golden-cohort-expanded-nightly.yml`** | Weekly | **No** — same exemplar pinning pattern | **No** for live model drift |
| **PR / RC `eval_agent_corpus.py`** | On PR / RC | **No** | Heuristic/fixture regression only |
| **Owner `Invoke-RealLlmEvidenceGate` / G-REAL-01** | Manual / release | **Yes** (when run) | Point-in-time proof, not continuous tripwire |

Honest label: nightly is a **corpus / scorer / gate-floor regression loop**, not a **live model tripwire**.

---

## 2. Live path signals (closest to a tripwire today)

| Mechanism | When it fires | Gap vs “before a customer does” |
|-----------|---------------|----------------------------------|
| **Agent output QualityGate** (structural/semantic/faithfulness floors) | On Real `execute` per agent | Customer traffic **is** the probe; warn-only / gradual score drop may not reject |
| **Phase B LLM faithfulness** (`EnforcePhaseB` in Staging/Prod) | Post-execute on traces | Same — needs customer (or canary) runs; not a fixed scenario clock |
| **Prometheus alerts** (`ArchLucidAgentOutputQualityGateRejected`, semantic p10/p50, faithfulness p50) | When monitoring Terraform applied + series present | Detects **rate** shifts after traffic; not “Tuesday 02:00 model rev”; thresholds may lag subtle quality loss |
| **`ModelVersion` on `AgentExecutionTrace`** | Recorded per call | Forensic attribution — **no shipped alert** on version change vs last-known pin |
| **PilotStrict / sponsor gates** | When configured | Protects commit path for some tenants; not fleet early-warning |

There is **no** first-class job: “every N hours, execute fixed canary architecture against prod deployment → compare scores/findings to locked baseline → page ops.”

---

## 3. Distinguishing the two (PA table)

| Dimension | Nightly eval (TB-683 class) | Live regression tripwire (missing / partial) |
|-----------|-----------------------------|-----------------------------------------------|
| **Input** | Frozen AgentResult JSON in git | Fresh completions from **current** AOAI deployment |
| **Purpose** | Scorer/floor/corpus drift; release hygiene | Detect **provider model behavior change** in prod |
| **Latency to “last Tuesday”** | Next scheduled night (and still won’t see live rev if fixtures unchanged) | Minutes–hours if canary+alerts exist |
| **Customer exposure** | None (CI) | Ideally **before** customer runs; today often **during** customer runs |
| **False comfort** | Calling TB-683 “live real-mode monitoring” | Treating quality-gate rejects alone as proof of canary coverage |

---

## 4. Safe pin (buyer / PA)

> Per-execute quality and faithfulness gates plus optional Prometheus alerts are the live defense-in-depth on customer traffic. Nightly real-mode eval (**TB-683**) does **not** call Azure OpenAI — it re-scores committed exemplars. Detecting silent Azure minor-version quality drops **before** customers requires an explicit **live canary + baseline compare + alert** (not shipped as a closed loop today). Do not sell nightly corpus jobs as that tripwire.

---

## 5. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Nightly real-mode eval catches Azure model revs” | Nightly scores fixtures; live revs need canary/traffic metrics |
| “We always know quality degraded before customers” | Not guaranteed — no dedicated pre-customer canary loop |
| “Prometheus alone = model-rev detector” | Rate alerts help; no ModelVersion-change tripwire shipped |
| “G-REAL-01 Done = continuous monitoring” | Release evidence gate ≠ 24×7 canary |

---

## 6. Related owners (orchestrate, do not reopen Done)

| ID | Role |
|----|------|
| Done **TB-683** | Nightly fixture scoring + **TB-2231** consecutive-drift alert (fail-loud) |
| Done **TB-004** / `OBSERVABILITY.md` | Agent-output Prometheus rules |
| Done **TB-021** / Phase B faithfulness | Per-trace live floors |
| **TB-1228** / **M-209** | Scoring lane positioning |
| **TB-1499** / **M-273** | Retirement vs repro claims |
| **TB-688** | Per-tier model refresh cadence (**V2**) |
| **TB-1507** / **M-275** | Honesty CI **Done** (2026-08-10) |

---

## 7. Optional engineering follow-ons (tripwire)

1. Scheduled canary: fixed tenant/scenario → Real execute → score vs locked baseline → alert on drop or unexpected `ModelVersion`.
2. Metric: `ModelVersion` / deployment fingerprint change event → page ops.
3. Docs: rename TB-683 talk-track from “live real-mode monitoring” to “offline real-labeled exemplar scoring.”

---

## 8. Code entry points (verification)

| Concern | Primary file |
|---------|--------------|
| Nightly real-mode fixture scoring | `.github/workflows/real-mode-eval-nightly.yml` |
| Corpus eval CLI | `scripts/ci/eval_agent_corpus.py` |
| Consecutive-night regression warn / **TB-2231 drift alert** | `scripts/ci/assert_real_mode_eval_regression_trend.py` / `scripts/ci/assert_golden_cohort_canary_drift_alert.py` |
| Per-execute quality gate | `ArchLucid.AgentRuntime/Evaluation/` (QualityGate pipeline) |
| Phase B faithfulness enforcement | `ArchLucid.Api/appsettings.Production.json` (`EnforcePhaseB`) |
| Agent-output Prometheus rules | `infra/terraform-monitoring/prometheus_agent_output_rules.tf` |
| Nightly vs live honesty (this map) | [`AGENT_EVAL_CORPUS.md`](AGENT_EVAL_CORPUS.md) |
| AOAI retirement (related) | [`AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md`](AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md) (**TB-1499**) |

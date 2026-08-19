> **Scope:** Contributor-reference — 100× review-volume fail-first ordering and option-preserving capacity ledger (**TB-1336**); not measured 100× production proof.

# 100× review-volume fail-first order + option-preserving capacity ledger (TB-1336)

> **Audience:** Contributors, operators, and GTM reviewers answering *what fails first if review volume grows 100×* without prematurely closing remediation options.  
> **Not** a claim of executed 100× load-test results.

**GTM:** **M-237** / **M-238** · **M-182**.  
**Launch-load matrix (distinct):** **TB-1032** — marketing HTTP burst ≠ sustained Real review volume.  
**TPM sizing:** **TB-947** · **TB-1033**.  
**Blob offload gate:** **TB-932** (measured LOB evidence).  
**Async first force:** **TB-1311** — DTF not default V1 move.  
**Honesty CI:** **TB-1337** Done (`scripts/ci/check_review_volume_100x_capacity_honesty.py`).

---

## Decision in one line

Under **sustained Real review volume** (100× completed reviews, not marketing burst), **LLM quota / TPM** fails **first**; agent orchestration latency is a **soft SLA** signal; SQL manifest storage is a **slow burn** when hot paths stay projected (**TB-929** / **TB-930**). The cheapest **option-preserving** move now is a **triple SLI ledger + TPM/concurrency-aware admission checklist** — not unmeasured blob rewrite, DTF, or “scale replicas to fix AOAI.”

---

## Fail-first under sustained Real review volume

| Rank | Component | Failure mode | Buyer-safe pin |
| ---: | --- | --- | --- |
| **1** | **LLM quota** | Hard — TPM/RPM, 429 → fallback → breaker, tenant $ budget | Real execute ceiling; **TB-947** |
| **2** | **Agent orchestration latency** | Soft SLA — admit→complete, authority/worker outbox lag | Queue lag ≠ package loss |
| **3** | **SQL manifest storage** | Slow burn — LOB IO, list p95, DB growth | Not first if projections hold |

---

## Contrast launch-load (**TB-1032**)

| Scenario | First bottleneck | Owner doc |
| --- | --- | --- |
| Marketing / showcase HTTP burst | HTTP / static paths | **TB-1032** |
| 100× **completed Real reviews** | **LLM TPM / quota** | This contract |

---

## Cheapest change now (keeps all three options open)

Publish and operate a **triple SLI ledger** + **TPM/concurrency-aware admission checklist** (extend **TB-947**, bulkhead, budget reserve, outbox age metrics in [`SCALE_THRESHOLD_RUNBOOK.md`](SCALE_THRESHOLD_RUNBOOK.md)) so later choices remain:

| Later option | When | Premature if chosen now without |
| --- | --- | --- |
| TPM / SKU uplift | Sustained 429 after admission tuning | Measured TPM ledger |
| Worker / async scale | Outbox age + execute wall-clock | **TB-1311** forcing criteria |
| **TB-932** blob offload | LOB/list evidence | Measured hot-path LOB pain |

---

## Do not do now (option-closing)

| Move | Why closed |
| --- | --- |
| Unmeasured blob rewrite | Commits to storage architecture without LOB proof |
| DTF as first force | **TB-1311** / **TB-921** gate |
| Reserved-capacity purchase without usage | **TB-911** |
| “Scale API replicas to fix LLM” | Replicas ≠ AOAI TPM (**TB-947**) |

---

## Allow / forbid (GTM-safe)

| Claim | Status |
| --- | --- |
| TPM / quota hard-first on sustained Real volume | **Allow** |
| SLI ledger + admission before structural rewrites | **Allow** |
| Launch-load HTTP-first ≠ 100× review LLM-first | **Allow** |
| “SQL manifests fail first at 100×” | **Forbid** |
| Blob offload / DTF / reserved capacity = cheapest V1 move now | **Forbid** without evidence |
| “More replicas = more LLM throughput” | **Forbid** |
| Orchestration queue lag = committed-package loss | **Forbid** |

---

## CI anchors for **TB-1337**

| Anchor | Purpose |
| --- | --- |
| `REVIEW_VOLUME_100X_FAILURE_ORDER_AND_OPTION_PRESERVING_CAPACITY_CONTRACT.md` | Drift guard (this file) |
| `scripts/ci/check_review_volume_100x_capacity_honesty.py` | Fail SQL-first / premature-blob / replicas-fix-TPM claims |
| Verification | `SCALE_THRESHOLD_RUNBOOK.md`, `DEGRADED_MODE.md`, **TB-1032**, **TB-947**, **TB-932** |

---

## Explicit non-claims

- Does not execute **G-SCALE-*** drills (owner).
- Does not implement blob offload (**TB-932**).
- Does not change Polly defaults.
- Honesty CI shipped: **TB-1337**.

---

## Related

- [`CAPACITY_AND_COST_PLAYBOOK.md`](CAPACITY_AND_COST_PLAYBOOK.md) · **TB-939** · **TB-975** · GTM **M-237** / **M-238**

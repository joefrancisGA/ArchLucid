> **Scope:** Engineering source of truth for launch-load failure order and graceful degradation (**TB-1032**). Distinct from measured drill evidence (**G-SCALE-01** / **G-SCALE-02**).

# Launch-load failure order + graceful degradation contract (TB-1032)

> **Audience:** Contributors, principal architects, SRE, and GTM reviewers answering PA Q on which hot path fails first under launch load.  
> **Buyer summary:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#launch-load-failure-order-m-183`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#launch-load-failure-order-m-183).  
> **Drill:** [`../architecture/LAUNCH_LOAD_DRILL.md`](../architecture/LAUNCH_LOAD_DRILL.md).  
> **Degraded mode:** [`DEGRADED_MODE.md`](DEGRADED_MODE.md).  
> **Execute throttle (sustained AOAI):** [`REAL_EXECUTE_AOAI_THROTTLE_POLICY_CONTRACT.md`](REAL_EXECUTE_AOAI_THROTTLE_POLICY_CONTRACT.md) (**TB-1299**).  
> **100× sustained growth:** **TB-1336** / **M-237**/**M-238** (separate from launch burst).  
> **GTM:** **M-182** / **M-183** · **Honesty CI:** **TB-1033**.

---

## Decision in one line

**Designed order:** marketing/launch **HTTP admission** saturates before worker/outbox lag; **Real execute** then hits **Azure OpenAI TPM / 429** before SQL becomes the dominant sync failure. **Degradation** preserves committed packages, labels non-Real paths, and does **not** treat API replica scale-out as more AOAI TPM. **Designed ≠ measured** until **G-SCALE-02** drill rows exist.

---

## Load-shape matrix (designed failure order)

| Load shape | Fails / saturates first | Next pressure | What it does **not** mean |
| --- | --- | --- | --- |
| **Marketing / static burst** | Sync **HTTP** (UI + API concurrency, edge) | Auth GET burst → API + **SQL reads** | Worker/outbox is first sync admit failure |
| **Showcase / welcome funnel** | HTTP + static assets; **no live LLM** on Tier-1 paths | SQL read p95 under contention | Anonymous preview = tenant-accurate live data |
| **Concurrent Real execute** | **AOAI 429 / TPM** (bulkhead → retry → fallback → breaker) | Per-tenant / run budgets; partial runs (**TB-937**) | More API replicas = more TPM (**TB-947**) |
| **Worker / outbox** | **Lag** after admit (indexing, integrations, projections) | Prometheus queue depth; admin DLQ UI | Committed finalize record lost |
| **SQL** | Second-order under static marketing; dominates list/write p95 when tier undersized or hot-row contention | Connection pool / lock waits | SQL outage = silent package loss (finalize truth stays committed per **TB-1011**) |

---

## Graceful degradation by plane

| Plane | Degradation behavior | Buyer-safe pin |
| --- | --- | --- |
| **HTTP** | 429 + `Retry-After`; scale-out; calm capacity copy for Quick Scan (**TB-900**) | Admit pressure ≠ data loss |
| **AOAI / Real execute** | Fail closed after transport chain (**TB-1299**); partial/failed runs; no silent Simulator as Real | Real trust preserved |
| **SQL** | Fail the request; keep committed truth; no relabeling committed rows | Governance record durable |
| **Worker / async** | Disclosed lag; outbox/DLQ admin surfaces (**TB-992**); integration bridge at customer | Lag ≠ sync admit failure |

---

## Evidence status (do not collapse)

| Status | Meaning | Safe language |
| --- | --- | --- |
| **Designed order** | This contract + `DEGRADED_MODE.md` + capacity playbooks | “Designed to fail HTTP-first on launch burst…” |
| **Measured dominant** | Owner **G-SCALE-01** / **G-SCALE-02** + `LAUNCH_LOAD_DRILL.md` Latest run row | “Measured on staging drill …” |
| **Not substitutable** | Design contract does **not** replace drill execution | Do not say “launch load proven” with only **TB-1032** |

---

## Cross-links (related, not duplicate)

| ID | Role |
| --- | --- |
| **TB-915** / **TB-947** | More API replicas ≠ more AOAI TPM |
| **TB-946** / **G-SCALE-01** | Scale drill methodology |
| **TB-905** / **G-SCALE-02** | Launch-load execution / evidence |
| **TB-1299** / **M-229** | Sustained AOAI throttle triad (not load-shape order) |
| **TB-1336** / **M-238** | 100× review-volume fail-first (not LinkedIn burst) |
| **TB-1011** | Finalize vs outbox delivery lag honesty |
| **LLM_RETRY_AND_CIRCUIT_BREAKER.md** | Transport resilience (per-call), not product policy |

---

## Forbidden claims

| Too strong | Safe |
| --- | --- |
| “Scale-out removes AOAI 429 / TPM limits” | HTTP scale ≠ AOAI TPM (**TB-947**) |
| “Launch load validated / proven” without **G-SCALE-02** drill | Cite designed order + drill pending |
| “Worker/outbox lag = first sync failure on marketing burst” | HTTP admits first |
| “Committed package lost when worker backs up” | Finalize committed; projections lag |
| “Drill results exist” when `LAUNCH_LOAD_DRILL.md` Latest run pending | Honest evidence status |

---

## CI follow-on

**TB-1033** should fail dishonest scale/launch-load/LLM claims per this contract and pair **M-182**.

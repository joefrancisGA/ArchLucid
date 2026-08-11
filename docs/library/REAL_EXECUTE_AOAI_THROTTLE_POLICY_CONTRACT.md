> **Scope:** Engineering source of truth — product Real execute policy when Azure OpenAI is degraded or throttled (**TB-1299**). Distinct from per-call Polly transport resilience.

# Real execute AOAI throttle policy (TB-1299)

> **Audience:** Contributors, principal architects, and GTM reviewers answering PA Q on sustained 429 / AOAI degradation during **Real** execute.  
> **Transport plane:** [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](LLM_RETRY_AND_CIRCUIT_BREAKER.md) · [`POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md`](POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md).  
> **Degraded-mode matrix:** [`DEGRADED_MODE.md`](DEGRADED_MODE.md).  
> **Execution mode honesty:** Done **TB-969** / **TB-971** (INV-002).  
> **Partial-run contract:** Done **TB-937**.  
> **GTM:** **M-229** / **M-230** / **M-182** / **M-127**.

---

## Decision in one line

**Product Real execute fails closed** after retry + optional secondary AOAI + circuit breaker: runs stay **PartiallyCompleted / Failed**; commit stays blocked. **Labeled Simulator** is allowed only on explicit non-proof paths (CLI `try --real`, demo/sample, QuickStart forced simulator) — never as silent mid-execute degrade for buyer Real proof.

---

## Policy triad

| Policy | When | Run / buyer outcome | Proof posture |
| --- | --- | --- | --- |
| **Fail closed (default)** | Product Real / commit-eligible execute after transport chain exhausted | **PartiallyCompleted** or **Failed** per **TB-937**; no `ReadyForCommit`; triage via `RealAgentFailureTriageCatalog` / ProblemDetails | Real trust claim preserved — incomplete, not fake-Real |
| **Deferred queue / retry (optional)** | Operator or future deferral when capacity returns | Status remains pending/failed until Real completions finish; **not** successful Real package | Never claim queued work as Real success |
| **Labeled Simulator degrade (narrow)** | Explicit non-proof paths only | Sets INV-002 Simulator/Fallback + `RealModeFellBackToSimulator` where applicable | Sponsor/email/proof gates treat as non-live-model (**TB-969**–**TB-971**) |

---

## Forbidden

| Forbidden | Why |
| --- | --- |
| Silent Real → Simulator mid-execute on product paths | Undermines Real trust / INV-002 |
| AOAI secondary deployment (`FallbackAgentCompletionClient`) labeled as Simulator | Mode is **Fallback**, not deterministic simulator |
| AOAI secondary mislabeled as undegraded Real | Still degraded transport; not proof-grade Real completion |
| “Degraded but still Real proof” without persisted Real completions | Buyer-facing lie |
| Polly / breaker recovery = run complete | See **TB-995** matrix |

---

## Shipped transport vs product policy

| Layer | What it does | What it does **not** do |
| --- | --- | --- |
| Polly 429/5xx retry | Retry **one** HTTP completion call | Choose Simulator; complete multi-agent run |
| `FallbackAgentCompletionClient` | Primary AOAI → secondary AOAI deployment | Imply Simulator or undegraded Real proof |
| Circuit breaker | Shed load after sustained failures | Mark run Ready; bypass **TB-937** |
| **This contract** | Pins **product** behavior after chain fails | Replace transport config |

---

## Narrow allow — labeled Simulator paths

| Path | Labeling requirement |
| --- | --- |
| CLI `archlucid try --real` (non-`--strict-real`) | `RealModeFellBackToSimulator` when seed/simulator used |
| QuickStart forced simulator / demo sample runs | INV-002 Simulator; not sponsor proof |
| Explicit demo/sample flags | Must not appear as production Real execute |

---

## Operator / buyer safe copy

| Situation | Safe message |
| --- | --- |
| AOAI 429 after retries + fallback + breaker | Real execute could not complete; review shows partial/failed — retry failed agents (**TB-938**) when capacity returns |
| Queued/deferred (if enabled) | Work is not complete; package is not Real-proof until Real agents finish |
| CLI evaluator with simulator fallback | Labeled simulator output — not production Real proof |

---

## Related backlog / CI

| ID | Role |
| --- | --- |
| **TB-1299** | This contract |
| **TB-1300** | Open — CI anchors for throttle-policy honesty |
| **TB-1032** | Launch-load order (complements, does not own policy) |
| **TB-937** / **TB-938** | Done — partial + selective re-execute |
| **TB-969** / **TB-971** | Done — execution-mode honesty |

**CI follow-on:** **TB-1300** should fail silent Real→Simulator mid-execute claims and mislabeled Fallback-as-Simulator copy in buyer surfaces.

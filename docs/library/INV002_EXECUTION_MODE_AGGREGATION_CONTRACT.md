> **Scope:** Contributor-reference — INV-002 within-run execution-mode roll-up (TB-969); per-task final outcomes → run `StructuralExecutionMode`.

# INV-002 execution-mode aggregation (TB-969)

> **Audience:** Contributors, principal architects, and GTM claim reviewers who need one matrix for how per-agent outcomes roll up to a run label.  
> **Not** a buyer assurance claim — aggregation rules describe engineering honesty; they do not prove live-model quality or customer ROI.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#execution-mode-honesty-m-128) (GTM **M-128**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-127**).  
**Invariant:** [`ARCHITECTURE_INVARIANTS.md`](ARCHITECTURE_INVARIANTS.md) INV-002 · `StructuralExecutionMode` on `dbo.Runs`.  
**Reference implementation:** `ArchLucid.Application/Runs/StructuralExecutionModeResolver.AggregateFromFinalTaskOutcomes`.

---

## Decision in one line

Run `StructuralExecutionMode` is derived from the **final persisted** per-`(RunId, TaskId)` outcome set only. Heterogeneous Real + Simulator/Fallback among final tasks → **Mixed**. Cache-served is disclosed separately and does **not** relabel Real as Simulator or silently upgrade Simulator to Real.

---

## Inputs and output

| Input | Meaning |
|-------|---------|
| `TaskExecutionModeOutcome.Mode` | Final structural mode for that task after execute / selective resume (Real, Simulator, or Fallback) |
| `TaskExecutionModeOutcome.CacheServed` | Optional disclosure flag: completion reused from cache; does not change `Mode` |
| **Output** | Run-level `StructuralExecutionMode` (including auto-derived **Mixed**) |

**Final task set only:** retries and superseded attempts are ignored; only the latest persisted row per `TaskId` participates. Partial runs with zero final tasks do not call the aggregator (see empty-set rule below).

---

## Roll-up matrix (within-run)

| Final task modes present | Run `StructuralExecutionMode` |
|--------------------------|-------------------------------|
| All Real | **Real** |
| All Simulator | **Simulator** |
| All Fallback | **Fallback** |
| Real + Simulator (any counts) | **Mixed** |
| Real + Fallback (any counts) | **Mixed** |
| Simulator + Fallback (any counts) | **Mixed** |
| Real + Simulator + Fallback | **Mixed** |
| Single final task (any of Real / Simulator / Fallback) | That task's mode |

### Cache-served

| Situation | Run mode | Disclosure |
|-----------|----------|------------|
| All final tasks Real, some `CacheServed=true` | **Real** | UI/API must disclose cache reuse; cache ≠ Simulator |
| All final tasks Simulator | **Simulator** | Cache flag irrelevant unless product adds simulator-cache semantics later |
| Mixed modes with cache on subset | **Mixed** | Per-task cache flags remain visible on payloads (**TB-970**) |

**Never:** treat `CacheServed=true` as proof of live-model execution; never promote Mixed or Fallback to Real.

---

## Edge cases

| Case | Rule |
|------|------|
| **Empty final task set** | Aggregator returns **no roll-up** (`null`); callers keep request-time `FromAgentExecutionOptionsAndFallback` until at least one task is final (**TB-970** wires recompute triggers) |
| **Selective resume** | Recompute from the **current** final task set after resume; stale first-write run mode is invalid |
| **Retries** | Only the final persisted outcome per `TaskId` counts |
| **ROI period `IsMixedMode`** (**TB-239** Done) | **Different concept** — mix of Real vs Simulator **runs** across a reporting window; not the same as within-run **Mixed** |

---

## Explicit non-claims

- Run mode label ≠ quality-gate pass, ≠ sponsor-safe ROI dollars, ≠ CPA/third-party assurance.
- Within-run **Mixed** ≠ sponsor history period-mix footnote (**TB-239** `IsMixedMode`).
- Request-time `AgentExecutionOptions.Mode` alone does not override a heterogeneous final task set once aggregation runs (**TB-970**).

---

## Follow-on

| ID | Owns |
|----|------|
| **TB-970** | Persist per-task mode + `cacheServed`; recompute run roll-up after execute / selective resume |
| **TB-971** | Cross-surface guards (never promote Mixed/Fallback→Real; copy-key separation) |
| **TB-1299** | AOAI throttle fail-closed vs labeled Simulator (orthogonal to roll-up) |

---

## Related

- [`EXECUTION_MODE_HONESTY_ONE_PAGER.md`](../go-to-market/EXECUTION_MODE_HONESTY_ONE_PAGER.md) · GTM **M-127** / **M-128**
- [`REAL_MODE_FAITHFULNESS_ROLLUP.md`](../quality/REAL_MODE_FAITHFULNESS_ROLLUP.md) · Done **TB-239**
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-969**–**TB-971**

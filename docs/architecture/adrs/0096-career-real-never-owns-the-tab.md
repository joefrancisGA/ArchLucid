> **Scope:** ADR 0096 — Working **Career Real** execute must not block the browser tab on sync HTTP through the edge proxy. Async operations (202 + `GET /v1/operations/{operationId}` poll / SSE where shipped) is the contract. `GET /v1/runs/{runId}/progress` does **not** exist.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0096: Career Real execute never owns the tab

- **Status:** Accepted
- **Date:** 2026-09-12
- **Accepted:** 2026-09-12 (owner)
- **Owner decision:** All-day Working seats cannot babysit one tab while Real-mode execute exceeds Front Door proxy ceilings (~45–60s). Career Real execute returns **202 Accepted** with an operation id; the UI polls **operations**, not a fictional run-progress URL. Simulator/CI may keep labeled sync siblings. No fake `percentComplete`. Working chrome never tells the architect to “stay on this page until finalize.”

## Context

**TB-2072** (`LONG_RUNNING_OPERATIONS_CONTRACT.md`) tiers endpoints A–D and documents that **`GET /v1/runs/{runId}/progress` does not exist** — use operations projection + authority SSE. **TB-2074** ships unified `GET /v1/operations/{operationId}`.

**Livelihood failure:** architects multitask across packages, desks, and governance surfaces. Sync Career Real execute that holds the tab trains distrust and proxy timeouts masquerade as product failure.

**ADR 0091 / 0094** keep Career as Working default execute gravity without flipping host `AgentExecution:Mode` to Real (**G-REAL-06** stays owner). When Real execute is enabled, the **async** pattern is mandatory on Working — not a second gravity.

**Related (not rewritten):** ADR 0086 (doors), ADR 0091 (Career default), ADR 0094 (one gravity), PC-08 (background wait), LW-096 (retry not abandon), SN-030 (in-flight on desk).

## Decision

1. **Career Real execute is async on Working.** Production Real path returns **202** + operation id (or equivalent accepted envelope). UI tracks in-flight work via operations poll / shell affordance — not a blocking sync POST through the edge.
2. **No run-progress URL.** Do not invent `GET /v1/runs/{runId}/progress`. Progress truth is operations API + named lifecycle stages — not a smooth 0–100 bar.
3. **No fake percentComplete.** Wire shapes and Working UI must not fabricate authoritative completion percentages on Real execute.
4. **Working never stay-on-this-page.** In-progress review guidance for Working seats describes background wait, Activity, and sibling packages — not “stay on this page until finalize.” Guided eval may keep buyer-polished stay copy.
5. **Simulator sync sibling stays labeled.** Local Simulator/CI sync execute remains possible when explicitly labeled rehearsal/simulator — not unlabeled Career proof.
6. **Finalize/commit stays tier-aware.** Finalize is not silently stretched into a sync proxy-blocking call; tier D semantics per TB-2072 when Real.

### Quoteable FAQ

| Question | Answer |
| --- | --- |
| **Does Career Real execute block the tab?** | **No** on Working — async operations pattern. |
| **May we add GET /v1/runs/{id}/progress?** | **No.** Use operations API (TB-2074). |
| **May Working show fake 0–100%?** | **No.** Named stages only; no authoritative percentComplete. |
| **May Guided say stay on this page?** | **Yes** for eval/buyer-polished skin; Working uses background-wait copy. |
| **Does this flip host Mode to Real?** | **No.** G-REAL-06 remains owner. |

## Trade-offs

**Gains:** Architects can open other packages while Real execute runs. Proxy timeouts stop masquerading as finalize failure. One ADR for support/on-call on “why isn’t my tab moving?” Honest alignment with TB-2072 contract.

**Sacrifices:** Two wait UX paths (Working background vs Guided stay) need clear eval vs Working split. Operations poll adds client complexity — already shipped for advisory draft and pipeline paths. Real execute rollout stays gated on G-REAL-06.

**Rejected:** Inventing run-progress URL; fake percentComplete; stay-on-this-page on Working; sync Real execute through Front Door as default; rewriting TB-2072; flipping host Mode default in this ADR.

## Constraints

- **Do not** invent `GET /v1/runs/{runId}/progress`.
- **Do not** fake `percentComplete` on Working Real execute surfaces.
- **Do not** tell Working architects to stay on this page until finalize.
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No **G-REAL-06**.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** add a 40th coverage engine or change `DeterministicInsightDensityGate` `typed-engine-protected`.
- TB-645 vocabulary. TB-2005 on forms.
- SQL stays in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus numbered migrations — this ADR adds no tables.

## Expected impact

**System:** Working Real execute paths align with long-running operations contract. Shell in-flight affordance and desk child rows remain the navigation primitive (SN-030 / PC-08).

**Security:** Operations poll stays tenant-scoped per catalog boundary (ADR 0037). No new public progress leak surface.

**Operations:** Support cites 0096 + TB-2072 for proxy timeout vs Real execute. Diagnostics distinguish Simulator sync from Real async.

**Cost:** Client poll traffic already budgeted in TB-2074; no new Azure services from this ADR.

**Teams:** DW wave owns inventories, ratchets, and help; API 202 wiring tracked under TB-2073+ when G-REAL-06 enables Real paths.

## Consequences

- **Positive:** 0096 is merge-blocking for “sync Real owns the tab” — answer is no on Working.
- **Negative:** Until G-REAL-06, Simulator-default hosts still need labeled honesty — ADR does not claim live Real fleet.
- **Follow-ups:** DW-002+ inventories; DW-004 API 202 when Real enabled; DW-024 close audit.

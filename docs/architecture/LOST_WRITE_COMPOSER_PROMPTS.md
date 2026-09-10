> **Scope:** Copy-paste Composer prompts that close **silent lost or overwritten in-flight work** on a Working architect desk. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/lost-write-00-index.md`](../../.cursor/prompts/lost-write-00-index.md) (**LW-001–LW-100**)
> **Predecessor (wave 22 — architecture-spine):** [`ARCHITECTURE_SPINE_COMPOSER_PROMPTS.md`](ARCHITECTURE_SPINE_COMPOSER_PROMPTS.md) (**AS-001–AS-100**). **Do not re-run AS.**
> **Not** Hasher robustness wave 23: [`../library/ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md`](../library/ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md) (items 221–230). Do not renumber those controls.

# Lost-write Composer prompts (LW-001–LW-100)

**Created:** 2026-09-10 · **Status:** ready to run · **Do not re-run** AS, FP, LP, WS, LK, V12-01 / AS-094 except as an LW row names a leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. Waves through **22** made Working an instrument (chrome, persist gates, disposition CAS, diagrams on decide). They did not fail-close **in-flight writes**.

Paste **one** `.cursor/prompts/lost-write-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

The 2026-09-10 livelihood-desk audit’s **first** failure class: a professional’s work can still be **silently lost or overwritten**.

1. **Draft PATCH CAS is opt-in.** `DraftPatchStaleUpdatedUtcGuard` returns when `expectedUpdatedUtc` is null. Online UI usually sends the token; **offline replay**, **CLI `DraftNewCommandAdmitStage`**, and any omit-token client last-write-wins.
2. **Offline queue is last-write-wins.** Enqueue stringifies `buildArchitectureDraftPatchPayload` only. Replay `patchDraftRequest`s that body and `break`s on error without Keep mine.
3. **401 resume is two kinds in `sessionStorage`.** LP-19 covers finding disposition + governance correction. Bulk, draft PATCH, finalize, policy packs, ITSM, shares, approvals have no replay. Closing the IdP tab drops the pending POST.
4. **Dirty text still drops.** Governance approval `reviewComment` is not in the guard inventory. Intake wizard and identity rename are deferred. `useInAppNavigationGuard` misses `router.push`.
5. **Sibling tabs keep writing** after one tab clears the BFF cookie; scope changes are same-tab `CustomEvent` only.
6. **Concurrent desk has no lease.** Architecture-spine named this as wave 23 and forbade live presence. This set adds a **soft work-lease** (ADR 0090) plus mandatory CAS — not avatars or finding chat.

### Done test

After this wave:

1. Omit-token draft PATCH does **not** 200. `forceOverwrite` is explicit and audited.
2. Offline replay sends `expectedUpdatedUtc`; 409 opens Keep mine and does not dequeue; v1 queue entries never omit-token PATCH.
3. 401 pending mutations survive tab close (`localStorage`) for inventoried livelihood writes, including draft patch and bulk (FP row versions intact).
4. Approval rationale, rename, and intake nav cannot silent-navigate; programmatic `router.push` prompts when dirty.
5. A sibling operator tab receives auth-cleared and stops writing; scope broadcast refreshes the other desk.
6. Work-lease banner is honest (not presence); steal is confirmed and audited; CAS still required.

## Diagnosis → prompt

| Class | Prompts | Residual after AS / FP / LP / LK |
|-------|---------|----------------------------------|
| Kernel ADRs + inventories | **LW-001–012** | Omit-token LWW not listed; LP-19 kinds not generalized |
| Server fail-closed CAS | **LW-013–028** | Guard early-return; CLI omit; OpenAPI “optional ignored” |
| Online UI ratchet | **LW-029–035** | Persist usually sends token; no grep ratchet |
| Offline queue | **LW-036–050** | Replay LWW; silent `catch { break }` |
| 401 resume | **LW-051–070** | sessionStorage; two kinds; no interceptor |
| Dirty guards | **LW-071–082** | Approval missing; wizard/rename deferred; `router.push` |
| Cross-tab | **LW-083–088** | Idle BroadcastChannel only |
| Work-lease | **LW-089–094** | Named in AS; not built |
| Recovery | **LW-095–098** | error.tsx drops React state; 4s mutation toasts |
| Close | **LW-099–100** | Next client omits the token |

## Sequencing

See [`.cursor/prompts/lost-write-00-index.md`](../../.cursor/prompts/lost-write-00-index.md). **ADRs (001 / 007 / 008) can start in parallel.** Server **013** after 001. Offline **036** after 013. 401 **051** after 007. Lease **089** after 008. **100** last.

**001** must not change the guard. **013** must not change the offline queue. **036** must not PATCH omit-token. **053** must not wrap GET. **008 / 089** must not add presence avatars. **100** must not claim G-REAL-06.

## Owner authorizations that prior waves forbade

| Prior forbid | This wave |
|--------------|-----------|
| FP-24: do not implement LP-19 | **0089** generalizes 401 resume (including bulk). Do not weaken FP CAS tokens. |
| AS: do not invent live presence | **Still forbidden.** **0090** is a server lease + banner, not occupancy. |
| LK-12 omit-token skip | **0088** fail-closes omit. Keep mine remains `forceOverwrite`. |
| Merge `DraftRequests`/`Runs` | **Still forbidden** |
| Flip `AgentExecution:Mode` | **Still forbidden** |

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- Sealed records stay immutable.
- Collab strip stays recent **history**, not live viewers (AD-06 / TB-2248). Lease is a separate banner.
- Guided / demo / trial keep eval teaching (ADR 0080).
- Favorites/recents/pins server sync, density prefs, rate-limit partition, tenant escrow ZIP, and in-app changelog are **out of wave**.

## Global constraints

See [`.cursor/prompts/lost-write-00-index.md`](../../.cursor/prompts/lost-write-00-index.md). Same as AS/FP: no desktop **More** menu; no `typed-engine-protected` change; no ADR 0067 rewrite; no GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopening **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#.

## Do not re-run

- **AS-001–100** — wave 22; do not implement from LW files except leftovers named in *What to build*
- **V12-01 / AS-094** — hub/search share filter; shipped on AS close
- **FP-01–24** — disposition pointer CAS; do not rewrite ADR 0076
- **LP-01–20** — persist gates; keep LP-19 kinds working
- **WS / SY / AO / LK / AD / LI** — owners; LW names leftovers only
- **Hasher robustness 221–230** — separate numbering (LW-022 relates start-review stale utc only)

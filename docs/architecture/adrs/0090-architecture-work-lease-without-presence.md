> **Scope:** ADR 0090 — Soft exclusive work-lease on an architecture draft, without live presence.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0090: Architecture work-lease without live presence

- **Status:** Proposed
- **Date:** 2026-09-10
- **Owner decision:** A Working desk may take a **soft exclusive lease** on a draft (acquire / heartbeat / release / steal-with-confirm). Lease is **not** live occupancy, avatars, or finding-comment chat (lost-write LW-008). ADR 0088 CAS remains mandatory even with a lease.

## Context

Architecture-spine named concurrent desk as wave 23 and forbade live presence. `CollabRecentActorPresenceStrip` is **history**, not occupancy. Two architects still last-write-wins at replay time if both omit CAS; with 0088 they 409, but they discover the collision only after typing.

A lease makes “someone else is editing this draft” visible **before** 409. It does not replace CAS. Steal-with-confirm is the career override, audited like Keep mine.

**Related:** ADR 0087 (optional RestrictToShares — do not rewrite; lease is not ACL). ADR 0088 (CAS still required). TB-2248 (collab strip stays history).

## Decision

1. **Scope:** Lease is per **draft** (and its Working desk), not the whole tenant or every architecture in the catalog.
2. **API:** acquire / heartbeat / release / steal-with-confirm. TTL plus heartbeat; expiry releases. Steal requires an in-app confirm and a Required durable audit.
3. **Honesty:** Banner copy is “another architect holds the edit lease,” not “they are online.” Collab strip remains history-only. No avatars, cursors, occupancy heartbeats rendered as presence, or finding-comment chat.
4. **CAS still required:** Holding a lease does **not** authorize omit-token PATCH or skip stale 409.
5. **Enforcement:** App-layer authz + IDOR tests. **No SQL RLS** (same posture as ADR 0087 shares).
6. **Not in scope:** Live presence product, second tenant, merging `DraftRequests`/`Runs`, G-REAL-06.

## Trade-offs

**Gains:** Two people on one draft see a banner before they overwrite; steal is explicit and auditable. Collision becomes a desk event, not a silent LWW (0088) or a surprise 409 after a long edit.

**Sacrifices:** Soft exclusive is not a lock: expired TTL, killed browser, and steal still happen. Heartbeat traffic and a new SQL table (LW-089) add ops surface. False “held” banners after a crashed tab until TTL. Engineering must not slide into presence (avatars, green dots).

**Rejected:** True pessimistic DB locks on `DraftRequests`. Presence avatars / cursors. Replacing CAS with “lease holder may omit token.” SQL RLS.

## Constraints

- **Do not** invent live presence avatars, cursors, occupancy heartbeats-as-presence, or finding-comment chat.
- **Do not** add SQL RLS for leases (ADR 0037 / 0087 posture).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal (ADR 0039).
- **Do not** flip `AgentExecution:Mode` host default (G-REAL-06).
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- SQL for leases lands in the single DDL file `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus a numbered migration (LW-089) — **not** in this ADR file.
- Terraform for net-new infra follows existing SQL/API patterns when a new table ships.

## Expected impact

**System:** ADR-only until LW-089 SQL and LW-090 API. UI banner is a Working desk strip separate from the history collab component (LW-091).

**Security:** IDOR/authz tests on acquire/heartbeat/steal (LW-093). Steal is a governed overwrite of the lease holder, not of the document — document overwrite still needs 0088. Audit must name actor, draftId, previous holder.

**Operations:** TTL tuning if crashed tabs leave stale leases. No new Azure SKU.

**Cost:** One table + a few endpoints; heartbeat interval must stay cheap (seconds-to-minutes, not websockets).

**Teams:** Help must say two people on one draft use lease + CAS, not chat (LW-094).

## Consequences

- **Positive:** Quoteable “work-lease without presence”; collab strip stays history.
- **Negative:** Soft exclusivity can be stolen; CAS 409 still happens if two tabs of the same holder race.
- **Follow-ups:** LW-089 SQL · LW-090 API · LW-091 banner · LW-092 steal audit · LW-093 IDOR tests · LW-094 help.

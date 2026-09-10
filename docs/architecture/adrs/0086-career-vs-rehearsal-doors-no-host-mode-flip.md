> **Scope:** ADR 0086 — Working Career vs Rehearsal doors without flipping host `AgentExecution:Mode` (architecture-spine AS-076).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0086: Working Career vs Rehearsal doors (no host Mode flip)

- **Status:** Proposed
- **Date:** 2026-09-10
- **Owner decision:** Working product chrome exposes two explicit doors — **Career** (Real execute, career artifacts) and **Rehearsal** (Simulator, labeled incomplete). Host `AgentExecution:Mode` default may remain Simulator for local/dev clones. **Do not implement G-REAL-06 in this wave.**

## Context

Default day is still rehearsal for local clones. Flipping host `AgentExecution:Mode` to Real breaks environments without AOAI and is owned by G-REAL-06. Architects still need livelihood gravity on Working without silent Simulator-as-Career.

**Related:** ADR 0033 (`archlucid try --real`), ADR 0078 (career artifact honesty), ADR 0080 (Working seat), LP-06 simulator career honesty, [`simulator-career-honesty.ts`](../../../archlucid-ui/src/lib/governance/simulator-career-honesty.ts).

## Decision

1. **Two Working doors:** Career vs Rehearsal is **product chrome** on Working only — not a buyer pill on Guided (AS-081).
2. **Career blocked on Simulator host:** Selecting Career when Real is unavailable shows a blocked honesty state; execute does not silently run as Career under Simulator (AS-078).
3. **Rehearsal labeled:** Simulator Working must not present unlabeled rehearsal as career-complete (AS-079 / LP-18).
4. **No host default flip:** `AgentExecution:Mode` remains **Simulator** in default appsettings; Career intent does not mutate host config (AS-085 ratchet).
5. **New Working tenants:** UI intent defaults to Career with AS-078 block when Real unavailable; stored Rehearsal preference is grandfathered (AS-080).

## Trade-offs

**Gains:** Livelihood gravity without G-REAL-06; local clones keep Simulator host; Guided teaching seat unchanged.

**Sacrifices:** Two axes (Guided/Working and Career/Rehearsal) add chrome complexity; Career on Simulator-only hosts stays blocked until Real is configured.

**Rejected:** Flipping host Mode default to Real; silent Simulator-under-Career execute; removing Guided Simulator teaching.

## Constraints

- **Do not** flip `AgentExecution:Mode` default from Simulator to Real.
- **Do not** implement G-REAL-06 Real-mode proof program in engineering prompts.
- **Do not** collapse desktop review workspace tabs behind **More**.
- TB-645 vocabulary on operator copy.

## Expected impact

**System:** `WorkingCareerRehearsalChooser` on Working desk; provider persists intent locally until tenant pref ships.

**Security:** Blocked Career path prevents laundering Simulator output as production customer evidence.

**Operations:** Support distinguishes host Mode (infra) vs Working door (product intent).

**Cost:** UI/provider only — no new infra.

## Consequences

- **Positive:** Quoteable answer: “May Working look like Career while Mode=Simulator?” → **No**, unless Rehearsal door is explicit or Real is available.
- **Follow-ups:** AS-077 chooser · AS-078 gate · AS-079 Ready suppression · AS-084 matrix tests · AS-085 host-default ratchet.

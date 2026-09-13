> **Scope:** ADR 0100 — After spawn, the Working architect inhabits the open architecture; the pre-seal afternoon is document-grade findings work on that identity.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0100: Working inhabits the architecture (findings as the afternoon document)

- **Status:** Accepted
- **Date:** 2026-09-13
- **Evidence:** `.cursor/prompts/inhabit-00-index.md` (IH-001) — proposed 2026-09-13.

## Context

ArchLucid sells a seat for a repeat professional (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13). People will sit in it much of the day; livelihoods may depend on the sealed record.

Waves 1–33 overlaid a desk onto a governed batch-review pipeline: Working default, architecture as locator (0077), desk as work surface (0079), spawn-lock (0092), instrument chrome after spawn (0098), Record/Practice doors (0091/0097), Career honesty, lost-write CAS, background wait (0096). Those waves fixed **where bookmarks land** and **what the header says**. They did not change **what the architect inhabits**.

The remaining livelihood failure: after Start review, the architect still **operates a child job** (nested review-detail, five-minute disposition undo, clone-to-explore, host Simulator as the installed default) under a mode matrix. Excel-for-architecture-decisions would inhabit **this system**. ArchLucid still schedules **this job**.

ADR **0098** owns instrument chrome (H1, last-open, inspector vs Monday morning). This ADR owns **inhabited work**: the pre-seal afternoon is findings work on the open architecture — disposition, trail, quiet-engine honesty, amend after the undo toast — without merging kernels or unsealing.

> **0098 instrument vs 0100 inhabit (IH-002):** ADR **0098** answers *where chrome and bookmarks land after spawn* — architecture H1, last-open, nested review as job inspector. ADR **0100** answers *what the architect inhabits for the afternoon* — architecture-nested findings as the working document (rows are the work; the child job is a subtitle). Do not rewrite 0098; pointer only.

**Rejected alternatives:**

- **Merge `DraftRequests` and `Runs`** — violates ADR 0068 and sealed-record immutability (ADR 0039).
- **Make nested review-detail Monday morning** — rejected by 0098; inhabit must not reopen that bet.
- **Lengthen `MUTATION_UNDO_WINDOW_SECONDS`** — conflates governed audit writes with document undo (ADR 0071). Amend/record-correction is the livelihood path after five minutes.
- **Unseal to edit** — violates ADR 0039. Clone-from-snapshot remains the new version path.
- **Flip host `AgentExecution:Mode` to Real (G-REAL-06)** — owner program; inhabit uses **honesty before start**, not a default-day lie and not a third Mode chooser.
- **Draft-to-draft Compare** — rejected by ADR 0092. Sketch stays a labeled Practice clone; Compare stays committed-manifest.
- **Live presence / finding-comment chat** — rejected by ADR 0090. Work-lease + CAS remain the collab primitives.
- **Collapse desktop review tabs behind More** — rejected by product direction.
- **A 40th coverage engine** — forbidden (`HOLD_NO_COVERAGE_ENGINES.md`).

**Related (not rewritten):** ADR 0068, 0071, 0073, 0076, 0077, 0079, 0086, 0090, 0091, 0092, 0094, 0096, 0097, 0098, 0099.

## Decision

1. **After spawn on Working**, when `ArchitectureId` is known, the architect **inhabits the architecture**. Nested review-detail remains a **job inspector** (ADR 0098) — not Monday morning, not a second product, not exile from the desk.
2. **The pre-seal afternoon’s document** is **architecture-nested findings**: disposition, inspect, transparency trail, quiet-engine / measurement-floor honesty, finalize as a verb that **returns to the desk**. Working spawn/continue/last-open land on that document when ArchitectureId is known.
3. **Kernels stay two.** `DraftRequests` and `Runs` remain separate tables. Spawn-lock still freezes the Career draft editor. Clone-from-snapshot / Sketch a change remain the new-version and Practice exploration paths.
4. **Default-day honesty without G-REAL-06:** Working Record + host Simulator names incompleteness **before start** (readiness line). Finalize/export honesty already contracted (0091/CG) stays. Do not add a customer Simulator vs Real chooser. Practice cannot screenshot as Record-complete at start.
5. **Finding-work reversibility:** `MUTATION_UNDO_WINDOW_SECONDS = 300` stays. After the toast, **record correction / amend stays on the finding row** (append-only). Draft Ctrl+Z stays in-tab (0071). Undo does not unseal.
6. **Completeness on the document:** quiet engines and support-band honesty appear on Working nested findings, not only on Career export. Density remains generation, not a support-band filter. Simulator never shows Career Supported on the document.
7. **Exploration:** Sketch a change and committed-child Compare from the inhabited document. **No** draft-diff Compare.
8. **Room without presence:** a non-modal MUST elicitation card (yes / no / another) may append to the asserted trail on the architecture. No avatars, cursors, occupancy heartbeats, or finding-comment chat.
9. **Guided / demo / trial** keep eval chrome and peer review URLs (ADR 0094 / 0098). Host `AgentExecution:Mode` default stays **Simulator**.

### FAQ (quote in reviews)

| Question | Answer |
|---|---|
| After Start review, does the architect inhabit the architecture? | **Yes.** The afternoon’s document is findings on that system. |
| Is nested review-detail Monday morning? | **No.** It is a job inspector (ADR 0098). |
| May we merge kernels so the job is the document? | **No.** `DraftRequests` and `Runs` remain separate. |
| May we lengthen 300s undo or unseal? | **No.** Amend/record-correction after the toast; clone-from-snapshot for a new version. |

## Trade-offs

**Gains:** The paying day matches the architect mental model — this system, these findings — without pretending synthesis and evaluation are one table. False confidence moves from export-only to the document people stare at. Record+Simulator cannot look career-complete at the start of work. Keyboard and room elicitation attach to the inhabited document instead of a pipeline map. Livelihood reversibility after five minutes exists as amend, not as a silent longer toast that would pollute the audit trail.

**Sacrifices:** Dual presentation paths remain (Working inhabit vs Guided review-centric inspector). Engineers must keep passing `architectureId` into findings/finalize/share hrefs. Inhabit cannot make host Simulator produce Career-complete packets (honesty, not G-REAL-06). Concurrent operators still collide via 409/CAS/lease rather than presence. Cheap exploration still cannot diff two uncommitted drafts. In-tab draft undo still dies on refresh.

**Rejected as “simpler”:** merging kernels to get a single document type; unsealing; a third Mode dropdown; hiding quiet engines behind density so the queue looks done.

## Constraints

- Do not rewrite ADR 0068, 0071, 0077, 0079, 0091, 0092, 0096, 0097, or 0098 bodies — Related pointers only.
- `DraftRequests` and `Runs`/`Reviews` remain separate tables.
- Tenant isolation on every query (ADR 0037); route `architectureId` mismatch → 404.
- Desktop review workspace tabs stay a full strip (no **More** overflow).
- `MUTATION_UNDO_WINDOW_SECONDS = 300` unchanged.
- No G-REAL-06 host Mode flip. No customer AgentExecution Mode picker on Working.
- No draft-to-draft Compare. No remount of the CE Sketch runner (reuse the shipped entry).
- No live presence, finding-comment chat, or occupancy heartbeats.
- No 40th coverage engine. `typed-engine-protected` unchanged.
- TB-645 vocabulary: architecture, review, finding, sealed review record.
- User-facing execute labels are **Record** / **Practice** (ADR **0097**); stored tokens stay `"career"` / `"rehearsal"`.
- No GTM cohort programs (M-90, M-44, M-91, M-92). No reopen TB-135 / TB-136.
- System-wide breadcrumbs stay retired (TB-2090).
- BFF/session tokens stay HttpOnly (ADR 0059); finding selection deep-links must not put bearer material in the URL.

## Expected impact

**System:** Working spawn/continue/last-open prefer architecture-nested findings. Findings list presentation uses architecture H1 and job subtitle. Trail, quiet-engine floor, support band, and amend appear on that document. Record+Simulator start shows an inline readiness line. Finalize success still returns to the architecture desk (0098). Inventories IH-004–012 track remaining operate-a-job leaks.

**Security:** Unchanged trust boundary — workspace-scoped RBAC; nested paths remain tenant-scoped; no cross-architecture render on id mismatch. Finding disposition still requires CAS (0076). Share URLs carry architecture locators, not tokens. Room-card answers append to the asserted trail (audit), not a chat store. XSS still cannot read BFF access tokens.

**Operations:** No required SQL migration for the kernel decision. Vitest guards (IH-072–075, prompt inventory IH-079) ratchet inhabit landing, Record honesty, 300s, and unmerged kernels. Wave close audit IH-080. Support scripts still read door stamp + host Mode (0091/0094); inhabit does not invent a third execute gravity.

**Cost:** Negligible hosting — presentation, href helpers, and honesty copy. Room-card answers reuse existing elicitation/trail writes. Pins/recents server sync (IH-066) is the only likely OpenAPI/preferences touch; it must stay last-write-wins on the existing user-preferences plane if shipped.

**Teams:** Engineering pastes one `inhabit-NNN-*.md` per session. Do not re-run SG/LY product bodies except as numbered leftovers. Do not remount CE. Do not implement G-REAL-06 from this ADR.

## Consequences

- **Positive:** All-day seat can inhabit a named system through the afternoon; sealed records stay honest children; completeness and Record/Simulator honesty show up before export.
- **Negative:** Inspectors still exist; Guided remains a second spine; Real estate packets still require owner G-REAL-06; two kernels remain a contributor burden.
- **Follow-ups:** IH-002–080 in `.cursor/prompts/inhabit-00-index.md`. Formal **Accepted** status is a separate owner step.

> **Scope:** ADR 0086 — Working product chrome has explicit **Career** and **Rehearsal** doors without flipping host `AgentExecution:Mode` default (architecture-spine AS-076).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0086: Working Career vs Rehearsal doors (no host Mode flip)

- **Status:** Proposed
- **Date:** 2026-09-10
- **Owner decision:** Default day remains rehearsal for local/dev clones — livelihood gravity is fixed with **product chrome doors**, not a global Simulator→Real host-config flip (**G-REAL-06** stays GTM owner program)

## Context

Most developer laptops and CI clones still run with **`AgentExecution:Mode=Simulator`** (or Fallback) so `archlucid try` and local Docker stacks work without Azure OpenAI keys. ADR **0033** keeps **`archlucid try --real`** as an explicit opt-in CLI path (`ARCHLUCID_REAL_AOAI=1`) — not a silent host default flip.

**Livelihood risk:** If Working production UI presents Simulator output as unlabeled career work — green chips, “Ready to finalize,” sponsor exports without rehearsal labeling — screenshots and ARB packets borrow authority the run did not earn. LP-06 / `simulator-career-honesty.ts` already blocks career-complete Simulator paths without explicit rehearsal banners; wave 22 makes the **door model** quoteable in review.

**G-REAL-06** (first real-mode pilot proof packets) remains a **GTM owner program**. This ADR does **not** implement G-REAL-06, does **not** change hosted production defaults to Real, and does **not** substitute chrome doors for pilot evidence rows.

**Related (not rewritten):** ADR 0033 (`archlucid try --real`), ADR 0078 (career artifact honesty), ADR 0080 (Working seat density), ADR 0082 (structural provenance), ADR 0085 (semantic support band on career surfaces), LP-06 simulator-career-honesty, `EXECUTION_MODE_HONESTY_ONE_PAGER.md` (**M-128**).

## Decision

1. **Two explicit Working doors:** Working product chrome exposes two labeled intents:
   - **Career** — Real execute posture, career artifacts, sponsor/export honesty under ADR 0078; user chose production proof path.
   - **Rehearsal** — Simulator (or Fallback) execute posture, labeled **incomplete** / **not career-complete** on artifacts and finalize surfaces; teaching and dry-runs stay honest.
2. **Host Mode default unchanged:** `AgentExecution:Mode` may remain **Simulator** for local/dev/hosted dev loops. Career vs Rehearsal is **UI + execute labeling** (AS-076+), **not** a repo-wide default flip to Real.
3. **No unlabeled Simulator as work:** Working production UI must **not** present Simulator output as unlabeled career work. If structural execution mode is Simulator/Fallback, the user must be in the **Rehearsal** door (or Guided/demo/trial eval seats), with visible rehearsal labeling on finalize, career exports, and semantic support presentation (AS-068).
4. **Guided keeps Simulator teaching:** Guided, demo, static showcase, and frictionless trial **keep** Simulator teaching chrome per ADR 0067/0080 — this ADR does not remove eval hand-holding on non-Working seats.
5. **CLI honesty preserved:** `archlucid try --real` remains the explicit local Real path (ADR 0033). AS-083 may add `--rehearse` symmetry; this ADR does not change try defaults.
6. **Implementation waves are follow-on:** AS-077–AS-085 ship chooser chrome, blocked Career paths, help copy, CLI flags, and ratchet tests. This ADR records the contract only.

### Quoteable FAQ

| Question | Answer |
| --- | --- |
| **May Working look like Career while `Mode=Simulator`?** | **No** — unless the user is in the explicit **Rehearsal** door (or Guided/demo/trial eval seats) with rehearsal labeling on artifacts and finalize surfaces. |
| **Does this ADR flip host default to Real?** | **No** — G-REAL-06 remains the owner program for Real pilot proof; chrome doors fix livelihood gravity without breaking AOAI-less clones. |
| **May Rehearsal screenshots show “Ready to finalize” as career proof?** | **No** — AS-079+ suppresses career-looking finalize posture on Rehearsal; exports carry rehearsal/sample honesty (ADR 0078). |

## Trade-offs

**Gains:** PR review can answer Simulator-as-career questions with one ADR; local/dev clones keep working without mandatory AOAI; architects choose Career vs Rehearsal explicitly; LP-06 rules gain a product-level anchor; G-REAL-06 stays scoped to pilot proof rather than blocking all chrome work.

**Sacrifices:** Extra chooser chrome and copy maintenance; two doors to test (AS-084 matrix); Career door may block until Real or an explicit blocked-honesty state (AS-078); Rehearsal cannot be screenshot as production-ready without labels.

**Rejected:** Flipping `AgentExecution:Mode` host default from Simulator to Real; implementing G-REAL-06 in this wave; hiding Rehearsal behind undifferentiated “Run review”; removing Guided Simulator teaching; merging Career/Rehearsal into a single silent default.

## Constraints

- **Do not** flip `AgentExecution:Mode` default from **Simulator** to Real in appsettings, compose, or host composition — Career vs Rehearsal is product chrome, not a config flip.
- **Do not** implement or reopen **G-REAL-06** — Real pilot proof packets remain GTM owner execution.
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** present Simulator/Fallback structural mode as unlabeled Career on Working production surfaces.
- **TB-645 vocabulary** on door labels and honesty strips. **TB-2005** on chooser forms.
- Guided/demo/trial eval seats **keep** Simulator teaching — ADR 0067/0080 unchanged.

## Expected impact

**System:** AS-077–AS-085 add Career/Rehearsal chooser, blocked Career without Real, finalize suppression, help topics, CLI `--rehearse`, and Vitest/C# ratchets. Host `AgentExecution:Mode` default stays Simulator for dev loops.

**Security:** Rehearsal labeling reduces authority-borrowing from Simulator runs in sponsor packets; Career door aligns with Real execute and ADR 0078 export gates. No new tenant isolation surface — doors are chrome inside the existing workspace.

**Operations:** Support can distinguish “I was in Rehearsal” vs “Career blocked — need Real”; on-call cites 0086 + LP-06. No mandatory AOAI for local reproduction.

**Cost:** Engineering time for AS-077–AS-085 only; zero incremental Azure spend from a host Mode flip (explicitly avoided).

**Teams:** GTM keeps **G-REAL-06**/**G-REAL-07** as Real proof evidence; principal architects get explicit Career intent; Guided owners keep teaching Simulator without polluting Working Career surfaces.

## Consequences

- **Positive:** 0086 becomes the merge-blocking question for “flip Mode default to fix Simulator screenshots?”; wave 22 rehearsal cluster can parallel after semantic band close; LP-06 gains ADR anchor.
- **Negative:** Contract-only until AS-077 ships chooser; two-door UX adds chooser friction; ratchet matrix required before claiming V1 rehearsal honesty complete.
- **Follow-ups:** AS-077 Working chrome Career/Rehearsal chooser; AS-078 Career door requires Real or blocked honesty; AS-079 Rehearsal cannot screenshot as Ready; AS-080 new Working tenant UI intent default; AS-081 Guided keeps Simulator teaching; AS-082 help topic; AS-083 CLI try flags; AS-084 Vitest matrix; AS-085 no host Mode flip ratchet (**ratchet:** `ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests` when landed).

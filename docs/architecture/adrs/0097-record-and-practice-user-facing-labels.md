> **Scope:** ADR 0097 — User-facing rename of Working **Career / Rehearsal** chrome to **Record / Practice**. Engineering tokens, API fields, and persistence stay on `career` / `rehearsal`.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0097: Record and Practice user-facing labels

- **Status:** Accepted
- **Date:** 2026-09-12
- **Owner decision:** Replace threatening **Career** vocabulary in operator chrome with **Record** (sealed-record proof path) and **Practice** (labeled dry-run path). ADR 0086 door model is unchanged.

## Context

ADR **0086** introduced Working **Career vs Rehearsal doors** with honest Simulator labeling. Operators reported that **Career** reads as job-loss threat in the chooser and blocked-state dialogs, even when engineering intent is livelihood / sealed-record proof.

**0086 and 0091 are not rewritten.** Host `AgentExecution:Mode` default stays Simulator. Stored preference field `WorkingCareerRehearsalDoor`, OpenAPI path `/v1/user/preferences/working-career-rehearsal-door`, webhook `careerComplete`, localStorage keys, honesty cell ids (`career-real`, etc.), help slugs (`career-rehearsal-doors`), and engineering family names (`career-gravity`, `CareerGravityCg*`) remain stable.

## Decision

1. **User-facing toggle labels:** **Record** / **Practice** (replacing Career / Rehearsal in operator chrome).
2. **Aria and shortcuts:** chooser aria label **Review type** (not "Working execution door").
3. **Adjectives:** **record-complete** / **sealed-record proof** replace career-complete / career proof in user copy.
4. **Blocked states:** **Sealed record blocked** / host cannot produce sealed-record proof (highest-threat strings prioritized).
5. **Parse aliases:** `parseWorkingCareerRehearsalDoorId` and intent parsers accept `record` / `practice` in addition to legacy `career` / `rehearsal` for bookmarks and hand-edited storage.
6. **CLI help:** `archlucid try` help text uses Record / Practice; flags `--real` / `--rehearse` unchanged.
7. **Help search:** add record / practice / record-complete keywords; keep career / rehearsal aliases mapping to slug `career-rehearsal-doors`.
8. **Chooser chrome:** hide duplicate Practice status chip on `rehearsal-simulator` matrix cell when the segment already shows Practice (RP-004).

### Unchanged (explicit)

| Layer | Stays |
| --- | --- |
| Stored tokens | `"career"`, `"rehearsal"` |
| SQL / OpenAPI field names | `WorkingCareerRehearsalDoor` |
| Honesty cell ids | `career-real`, `rehearsal-simulator`, … |
| Help route slug | `career-rehearsal-doors` |
| Engineering test families | `career-gravity`, `CareerGravityCg*` |

## Trade-offs

**Gains:** Lower threat reading on Working chrome; clearer sealed-record vs practice intent for architects; aliases preserve bookmarks and integrator hand-edits.

**Sacrifices:** Dual vocabulary in docs and code review (engineering **career** vs user **Record**); broader test churn on copy ratchets; GTM materials must cross-link legacy Career/Rehearsal terms during transition.

**Rejected:** Renaming stored tokens or API fields in this wave; deleting Career/Rehearsal aliases from help search; merging Record and Practice into one silent default.

## Constraints

- **Do not** rename `WorkingCareerRehearsalDoor` persistence or OpenAPI paths in this ADR.
- **Do not** rewrite ADR 0086 door semantics or flip host `AgentExecution:Mode` (no G-REAL-06).
- **Do not** collapse desktop review workspace tabs behind **More**.
- **TB-645** vocabulary alignment on user copy modules listed in `RECORD_PRACTICE_COMPOSER_PROMPTS.md`.

## Expected impact

- **Security:** unchanged — honesty gates and stamp rules unchanged; copy-only.
- **Scalability:** unchanged.
- **Reliability:** unchanged.
- **Cost:** minimal — UI copy and test updates only.

## Related

- ADR 0086 (doors), ADR 0091 (Career gravity), ADR 0078 (artifact honesty)
- Composer prompts: `docs/architecture/RECORD_PRACTICE_COMPOSER_PROMPTS.md` (when merged)

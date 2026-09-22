<!-- Record-practice copy overlay — Composer prompt set (RP-001–RP-024) — paste one prompt per session.
     Origin: 2026-09-12 owner concern that user-facing "Career" feels threatening
     (as if the operator could lose their job if the tool makes a mistake).
     Livelihood UX wave 31 — copy overlay after livelihood-gravity waves 24–30.
     Owner chose Record / Practice. Do not implement from this index. -->

# Record-practice copy overlay — Composer prompt set (RP-001–RP-024)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/record-practice-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not** re-run CG-001–100, AS-076–085, or ADR 0086 / 0091 bodies except as a named leftover. Career vs Rehearsal **semantics** (chrome + run stamp, not a host-config flip) stay. This wave retargets **user-facing labels and honesty prose** only.

## Owner decision (2026-09-12)

User-facing Working execute labels are **Record** and **Practice**. **Working**, **Standard**, and **Normal** were considered and rejected for the toggle: Working is already the seat name (pairs with Guided); Standard/Normal are empty or judgmental. **Production**, **Real**, and **Live** collide with the environment chip and host Mode.

The word **Career** was doing three jobs. Split them:

| Role | Old user-facing | New user-facing |
|------|-----------------|-----------------|
| Toggle (Record path) | Career | **Record** |
| Toggle (practice path) | Rehearsal | **Practice** |
| Honesty adjective | career-complete | **record-complete** |
| Honesty noun | career proof | **sealed-record proof** |
| Blocked status | Career blocked / Career seal blocked | **Sealed record blocked** |
| Blocked dialog title | Career door blocked | **This host cannot produce a sealed record** |
| Chooser aria | Working execution door | **Review type** |
| Learn-more | Learn about Career and Rehearsal doors | **Learn about Record and Practice** |
| Switch CTA | Switch to Rehearsal | **Switch to Practice** |
| Help H1 | Career and Rehearsal doors | **Record and Practice** |

**Forbidden** as a door label: Career, Working, Production, Real, Live, Standard, Normal. Drop **door** from chrome (ADR jargon).

**Must not change:** stored tokens `"career"` / `"rehearsal"`; `WorkingCareerRehearsalDoor`; SQL; OpenAPI path; webhook `careerComplete`; localStorage keys; query keys `career` / `rehearsal`; honesty cell ids `career-real`; help slugs (keep as aliases); prompt-family and C# test **file names**; ADR 0078 title.

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `record-practice-001-adr-0097-record-and-practice-labels.md` | ADR 0097: Record and Practice user-facing labels | kernel-adr | none — run first |
| **002** | `record-practice-002-inventory-user-facing-career-copy.md` | Inventory user-facing Career / Rehearsal copy | inventory | RP-001 |
| **003** | `record-practice-003-central-record-practice-labels.md` | Central toggle labels: Record and Practice | copy | RP-001 |
| **004** | `record-practice-004-chooser-chrome-review-type.md` | Chooser chrome: review type, no duplicate chip | chrome | RP-003 |
| **005** | `record-practice-005-blocked-state-copy.md` | Blocked-state copy: capability, not Career blocked | copy | RP-003 |
| **006** | `record-practice-006-status-pipeline-progress-copy.md` | Status, pipeline, and progress copy | copy | RP-005 |
| **007** | `record-practice-007-honesty-strips-sponsor-metrics.md` | Honesty strips: ROI, scorecard, value report | copy | RP-003 |
| **008** | `record-practice-008-honesty-strips-ops-recovery.md` | Honesty strips: recovery, DLQ, budget, quality gate | copy | RP-003 |
| **009** | `record-practice-009-export-print-finalize-copy.md` | Export, print, and finalize copy | copy | RP-003 |
| **010** | `record-practice-010-simulator-banner-matrix-copy.md` | Simulator clone banner and matrix copy | copy | RP-004, RP-005 |
| **011** | `record-practice-011-help-topics-record-practice.md` | Help topics: Record and Practice | copy | RP-001, RP-003 |
| **012** | `record-practice-012-help-search-aliases.md` | Help search: Record, Practice, and Career aliases | copy | RP-011 |
| **013** | `record-practice-013-first-review-guide-non-accusatory.md` | First-review guide: drop accusatory screenshot copy | copy | RP-003 |
| **014** | `record-practice-014-cli-help-record-practice.md` | CLI help: Record and Practice | cli | RP-003 |
| **015** | `record-practice-015-gtm-and-preferences-copy.md` | GTM doc, preferences, and one-sentence gravity | copy | RP-011 |
| **016** | `record-practice-016-keyboard-shortcut-copy.md` | Keyboard shortcut registry copy | copy | RP-004 |
| **017** | `record-practice-017-csharp-copy-ratchets.md` | C# ratchets that pin user-facing Career copy | ratchet | RP-005, RP-010, RP-011, RP-014 |
| **018** | `record-practice-018-vitest-playwright-copy-assertions.md` | Vitest and Playwright copy assertions | ratchet | RP-003–RP-013 |
| **019** | `record-practice-019-clone-and-nested-desk-copy.md` | Clone, envelope, and nested-desk copy | copy | RP-003 |
| **020** | `record-practice-020-outbound-user-facing-copy.md` | Outbound user-facing copy (email, digest, ITSM) | copy | RP-003 |
| **021** | `record-practice-021-prompt-inventory-vitest.md` | Vitest: RP-00 index + RP-001–RP-024 files exist | close | prompt-set PR |
| **022** | `record-practice-022-do-not-rename-stored-tokens.md` | Explicit skip: stored tokens, API, DB, webhooks | out-of-wave | RP-001 |
| **023** | `record-practice-023-do-not-rename-engineering-families.md` | Explicit skip: engineering family names stay | out-of-wave | RP-001 |
| **024** | `record-practice-024-wave-close-audit.md` | Wave close audit — Record and Practice on Working chrome | close | RP-001–RP-023 |

## Run order

Follow **Depends on**. ADR first. Inventory before mutating copy. Blocked-state (RP-005) before status badges. Help slugs stay as aliases. Close audit last.

Suggested Cloud Agent branch per prompt: `cursor/record-practice-<short-name>-554d`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/record-practice-prompts-554d`.

## After each prompt

Summarize: files changed, tests run, residual user-visible Career strings on Working, whether stored tokens still `"career"` / `"rehearsal"`, Working vs Guided, whether unlabeled Simulator can still screenshot as record-complete (CG honesty must still hold).

**Predecessor:** [`career-gravity-00-index.md`](career-gravity-00-index.md) (**CG-001–100**, shipped). **Family spine:** [`../docs/architecture/LIVELIHOOD_GRAVITY_COMPOSER_PROMPTS.md`](../../docs/architecture/LIVELIHOOD_GRAVITY_COMPOSER_PROMPTS.md) (waves 24–30). Do not re-run CG.

## Global constraints (every prompt)

See any numbered file’s Constraints block. No desktop **More** menu; no `typed-engine-protected` change; no table merge; no live presence; no finding-comment chat; no GTM cohorts; no reopen TB-135/TB-136; TB-645; focused Vitest; scoped compile only for C#. No stored-token rename. No Working/Production/Real/Live door labels.

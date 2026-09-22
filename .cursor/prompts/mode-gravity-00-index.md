<!-- Mode-gravity mitigations — Composer prompt set (MG-001–MG-024) — paste one prompt per session.
     Origin: 2026-09-11 livelihood-desk diagnosis (all-day use; livelihoods may depend on the sealed record).
     Livelihood UX wave 27 — issue 5 after lost-write-00-index.md (LW-001–LW-100, issue 4).
     Do not implement from this index. -->

# Mode-gravity mitigations — Composer prompt set (MG-001–MG-024)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/mode-gravity-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not** delete Guided. **Do not** flip host Mode. operator-experience is density, not gravity.

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `mode-gravity-001-adr-0094-working-one-execute-gravity.md` | ADR 0094: Working has one execute gravity | kernel-adr | none — run first |
| **002** | `mode-gravity-002-inventory-experience-flags.md` | Inventory experience flags and skins | inventory | MG-001 |
| **003** | `mode-gravity-003-working-gravity-one-sentence-help.md` | Working gravity in one sentence in-product | copy | MG-001 |
| **004** | `mode-gravity-004-operator-experience-flag-not-gravity.md` | `NEXT_PUBLIC_OPERATOR_EXPERIENCE` is density, not gravity | chrome | MG-002 |
| **005** | `mode-gravity-005-chooser-vs-workspace-mode.md` | Chooser vs workspace mode: two controls, one story | chrome | MG-001 |
| **006** | `mode-gravity-006-demo-trial-static-remain-eval.md` | Demo/trial/static remain eval ratchet | ratchet | MG-001 |
| **007** | `mode-gravity-007-product-line-not-a-door.md` | Product line is not a Career door | chrome | MG-002 |
| **008** | `mode-gravity-008-pre-commit-nav-vs-working.md` | Pre-commit nav vs Working leftover | chrome | MG-002 |
| **009** | `mode-gravity-009-al-ui-rate-not-buyer-on-working.md` | /al-ui-rate Working leftover (WS-07) | ratchet | MG-001 |
| **010** | `mode-gravity-010-fixture-matrix-working-career.md` | Fixture matrix: Working+Career default | ratchet | MG-005 |
| **011** | `mode-gravity-011-preferences-copy-two-controls.md` | Preferences page two-control copy | copy | MG-005 |
| **012** | `mode-gravity-012-help-which-mode-am-i-in.md` | Help: which mode am I in | copy | MG-003 |
| **013** | `mode-gravity-013-do-not-delete-guided.md` | Explicit skip: do not delete Guided | out-of-wave | MG-001 |
| **014** | `mode-gravity-014-do-not-flip-host-mode.md` | Explicit skip: host Mode default | out-of-wave | MG-001 |
| **015** | `mode-gravity-015-command-palette-does-not-list-hidden-eval.md` | Palette does not advertise eval destinations as Working tools leftover | ia | MG-008 |
| **016** | `mode-gravity-016-openapi-no-flag-as-mode.md` | API does not treat UI flags as execute Mode | contract | MG-004 |
| **017** | `mode-gravity-017-vitest-working-eval-chrome-false.md` | Vitest: Working eval chrome false | ratchet | MG-006 |
| **018** | `mode-gravity-018-prompt-inventory-vitest.md` | Vitest: MG-00 index + MG-001–MG-024 files exist | close | prompt-set PR |
| **019** | `mode-gravity-019-docs-operator-ui-modes-0094.md` | OPERATOR_UI_EXPERIENCE_MODES cites 0094 | copy | MG-001 |
| **020** | `mode-gravity-020-unlock-phase-copy-working.md` | Operate unlock copy not aimed at Working leftover | copy | MG-008 |
| **021** | `mode-gravity-021-cto-tour-not-working-gravity.md` | CTO tour / presenter is not Working gravity | chrome | MG-006 |
| **022** | `mode-gravity-022-local-env-development-honesty.md` | Local .env.development operator flag honesty | docs | MG-004 |
| **023** | `mode-gravity-023-support-bundle-lists-flags.md` | Support bundle lists flags without implying Career | ops | MG-002 |
| **024** | `mode-gravity-024-wave-close-audit.md` | Wave close audit — one Working gravity | close | MG-001–MG-023 |

## Run order

Follow **Depends on**. ADRs first. Inventories before mutating surfaces. Close audit last.

Suggested Cloud Agent branch per prompt: `cursor/mode-gravity-<short-name>-5b6b`. Implementation sessions use a **new** feature branch per prompt. The prompt-set PR may live on `cursor/livelihood-gravity-prompts-5b6b`.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided, whether unlabeled Simulator Career is still possible on the path you touched (CG) or the wave’s done test.

**Successor:** [`desk-ia-00-index.md`](desk-ia-00-index.md) (**DI-001–024**).

## Global constraints (every prompt)

See any numbered file’s Constraints block. No desktop **More** menu; no `typed-engine-protected` change; no table merge; no live presence; no finding-comment chat; no GTM cohorts; no reopen TB-135/TB-136; TB-645; focused Vitest; scoped compile only for C#.

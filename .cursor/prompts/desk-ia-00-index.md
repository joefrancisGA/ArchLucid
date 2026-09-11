<!-- Desk-IA mitigations — Composer prompt set (DI-001–DI-024) — paste one prompt per session.
     Origin: 2026-09-11 livelihood-desk diagnosis (all-day use; livelihoods may depend on the sealed record).
     Livelihood UX wave 28 — issue 6 after lost-write-00-index.md (LW-001–LW-100, issue 4).
     Do not implement from this index. -->

# Desk-IA mitigations — Composer prompt set (DI-001–DI-024)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/desk-ia-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not** collapse desktop review tabs. **Do not** restore breadcrumbs (TB-2090). **Do not** merge six sponsor routes this wave.

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `desk-ia-001-adr-0095-sealed-record-governance-home.md` | ADR 0095: sealed record inventory is a Governance home | kernel-adr | none — run first |
| **002** | `desk-ia-002-inventory-404-and-orphans.md` | Inventory 404 parents and orphan lists | inventory | DI-001 |
| **003** | `desk-ia-003-sealed-record-list-page.md` | Sealed review records list page | ia | DI-001, DI-002 |
| **004** | `desk-ia-004-signed-records-list-not-404.md` |  `/signed-records` list is not 404 leftover | ia | DI-003 |
| **005** | `desk-ia-005-cross-link-decision-register.md` | Cross-link decision register ↔ sealed records | ia | DI-003 |
| **006** | `desk-ia-006-review-tab-label-honesty.md` | Review-detail tab labels leftover | ia | DI-001 |
| **007** | `desk-ia-007-palette-vs-sidebar-honesty.md` | Palette vs sidebar honesty leftover | ia | DI-002 |
| **008** | `desk-ia-008-architectures-list-nav-working.md` | Architecture drafts list reachable leftover | ia | SN-029 |
| **009** | `desk-ia-009-no-collapse-tabs-ratchet.md` | Ratchet: desktop review tabs not behind More | ratchet | DI-006 |
| **010** | `desk-ia-010-dual-start-cta-working-leftover.md` | Dual start CTA Working leftover | copy | SN-020 |
| **011** | `desk-ia-011-sponsor-reporting-which-page.md` | Help: which reporting page answers which question | copy | DI-001 |
| **012** | `desk-ia-012-evidence-four-names.md` | Evidence naming leftover (trail vs graph) | copy | DI-001 |
| **013** | `desk-ia-013-internal-rank-names-customer-copy.md` | Internal rank names not in customer copy leftover | copy | DI-001 |
| **014** | `desk-ia-014-help-in-nav-or-topbar-honesty.md` | Help discoverability leftover | ia | DI-007 |
| **015** | `desk-ia-015-governance-view-dead-weight.md` | Governance-view half-wired leftover | ia | DI-001 |
| **016** | `desk-ia-016-pattern-library-empty-beta.md` | Pattern library empty-state leftover | ia | DI-001 |
| **017** | `desk-ia-017-approval-request-parent-detail.md` | Approval request parent detail leftover | ia | DI-005 |
| **018** | `desk-ia-018-ask-empty-before-finalize.md` | Ask empty-state before finalized record leftover | ia | DI-001 |
| **019** | `desk-ia-019-prompt-inventory-vitest.md` | Vitest: DI-00 index + DI-001–DI-024 files exist | close | prompt-set PR |
| **020** | `desk-ia-020-nav-item-sealed-records.md` | Nav: Sealed review records in Governance | ia | DI-003 |
| **021** | `desk-ia-021-do-not-merge-six-sponsor-routes.md` | Explicit skip: merge six sponsor routes | out-of-wave | DI-011 |
| **022** | `desk-ia-022-do-not-restore-breadcrumbs.md` | Explicit skip: system-wide breadcrumbs | out-of-wave | DI-001 |
| **023** | `desk-ia-023-help-sealed-vs-decision-register.md` | Help: sealed record vs decision register | copy | DI-005 |
| **024** | `desk-ia-024-wave-close-audit.md` | Wave close audit — desk IA | close | DI-001–DI-023 |

## Run order

Follow **Depends on**. ADRs first. Inventories before mutating surfaces. Close audit last.

Suggested Cloud Agent branch per prompt: `cursor/desk-ia-<short-name>-5b6b`. Implementation sessions use a **new** feature branch per prompt. The prompt-set PR may live on `cursor/livelihood-gravity-prompts-5b6b`.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided, whether unlabeled Simulator Career is still possible on the path you touched (CG) or the wave’s done test.

**Successor:** [`cheap-exploration-00-index.md`](cheap-exploration-00-index.md) (**CE-001–040**).

## Global constraints (every prompt)

See any numbered file’s Constraints block. No desktop **More** menu; no `typed-engine-protected` change; no table merge; no live presence; no finding-comment chat; no GTM cohorts; no reopen TB-135/TB-136; TB-645; focused Vitest; scoped compile only for C#.

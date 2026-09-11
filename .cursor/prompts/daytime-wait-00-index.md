<!-- Daytime-wait mitigations — Composer prompt set (DW-001–DW-024) — paste one prompt per session.
     Origin: 2026-09-11 livelihood-desk diagnosis (all-day use; livelihoods may depend on the sealed record).
     Livelihood UX wave 30 — issue 8 after lost-write-00-index.md (LW-001–LW-100, issue 4).
     Do not implement from this index. -->

# Daytime-wait mitigations — Composer prompt set (DW-001–DW-024)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/daytime-wait-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not** invent `GET /v1/runs/{runId}/progress`. **Do not** fake percentComplete. **Do not** stay-on-this-page on Working.

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `daytime-wait-001-adr-0096-career-real-never-owns-the-tab.md` | ADR 0096: Career Real execute never owns the tab | kernel-adr | none — run first |
| **002** | `daytime-wait-002-inventory-sync-execute-behind-proxy.md` | Inventory sync execute behind proxy | inventory | DW-001 |
| **003** | `daytime-wait-003-never-stay-on-this-page-working.md` | Working never “stay on this page until finalize” leftover | chrome | DW-001 |
| **004** | `daytime-wait-004-career-real-202-execute.md` | Career Real execute returns 202 + operation | api | DW-001, DW-002 |
| **005** | `daytime-wait-005-ui-poll-operations-not-run-progress.md` | UI polls operations, not missing run progress | ui | DW-004 |
| **006** | `daytime-wait-006-shell-inflight-affordance-leftover.md` | Shell in-flight affordance leftover | ui | DW-005, PC-08 |
| **007** | `daytime-wait-007-proxy-timeout-honesty-copy.md` | Help/diagnostics: proxy timeout vs Real execute | copy | DW-001 |
| **008** | `daytime-wait-008-cancel-confirm-leftover.md` | In-flight cancel confirm leftover (AD-02) | ui | AD-02 |
| **009** | `daytime-wait-009-no-fake-percent-complete.md` | Ratchet: no fake percentComplete | ratchet | DW-001 |
| **010** | `daytime-wait-010-simulator-sync-sibling-honesty.md` | Simulator sync sibling honesty | honesty | DW-004 |
| **011** | `daytime-wait-011-duplicate-execute-idempotency.md` | Duplicate execute idempotency leftover | api | DW-004 |
| **012** | `daytime-wait-012-error-retry-not-abandon.md` | Review error retry not abandon leftover (LW-096) | recovery | LW-096 |
| **013** | `daytime-wait-013-openapi-operations-docs.md` | OpenAPI operations poll documented | contract | DW-004 |
| **014** | `daytime-wait-014-vitest-no-run-progress-url.md` | Vitest/grep: no GET /v1/runs/{id}/progress | ratchet | DW-005 |
| **015** | `daytime-wait-015-help-background-wait.md` | Help: work continues in the background | copy | DW-006 |
| **016** | `daytime-wait-016-cli-wait-vs-nowait.md` | CLI wait vs no-wait leftover | cli | DW-004 |
| **017** | `daytime-wait-017-prompt-inventory-vitest.md` | Vitest: DW-00 index + DW-001–DW-024 files exist | close | prompt-set PR |
| **018** | `daytime-wait-018-do-not-invent-progress-url.md` | Explicit skip: invent run progress URL | out-of-wave | DW-001 |
| **019** | `daytime-wait-019-tenant-isolation-on-operations-poll.md` | Operations poll tenant isolation leftover | security | DW-004 |
| **020** | `daytime-wait-020-performance-baselines-not-real-sla.md` | Performance baselines doc honesty leftover | docs | DW-001 |
| **021** | `daytime-wait-021-in-flight-across-tabs.md` | In-flight visible in sibling tabs leftover | ui | DW-006, LW-083 |
| **022** | `daytime-wait-022-finalize-not-sync-behind-proxy.md` | Finalize/commit not sync behind proxy leftover | api | DW-002 |
| **023** | `daytime-wait-023-do-not-claim-gate-1.md` | Explicit skip: Gate 1 live review | out-of-wave | LN-012 |
| **024** | `daytime-wait-024-wave-close-audit.md` | Wave close audit — daytime wait | close | DW-001–DW-023 |

## Run order

Follow **Depends on**. ADRs first. Inventories before mutating surfaces. Close audit last.

Suggested Cloud Agent branch per prompt: `cursor/daytime-wait-<short-name>-5b6b`. Implementation sessions use a **new** feature branch per prompt. The prompt-set PR may live on `cursor/livelihood-gravity-prompts-5b6b`.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided, whether unlabeled Simulator Career is still possible on the path you touched (CG) or the wave’s done test.

**Family spine:** [`../docs/architecture/LIVELIHOOD_GRAVITY_COMPOSER_PROMPTS.md`](../../docs/architecture/LIVELIHOOD_GRAVITY_COMPOSER_PROMPTS.md). Issue 4 is LW — do not re-run.

## Global constraints (every prompt)

See any numbered file’s Constraints block. No desktop **More** menu; no `typed-engine-protected` change; no table merge; no live presence; no finding-comment chat; no GTM cohorts; no reopen TB-135/TB-136; TB-645; focused Vitest; scoped compile only for C#.

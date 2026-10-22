<!-- Career-gravity mitigations — Composer prompt set (CG-001–CG-100) — paste one prompt per session.
     Origin: 2026-09-11 livelihood-desk diagnosis (all-day use; livelihoods may depend on the sealed record).
     Livelihood UX wave 24 — issue 1 after lost-write-00-index.md (LW-001–LW-100, issue 4).
     Do not implement from this index. -->

# Career-gravity mitigations — Composer prompt set (CG-001–CG-100)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/career-gravity-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not** re-run AS-076–085, LP-06, FC, WS bodies except as a named leftover. **Do not** implement G-REAL-06. Career vs Rehearsal stays product chrome plus run stamp, not a host-config flip.

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `career-gravity-001-adr-0091-career-is-working-default-day.md` | ADR 0091: Career is the Working default day | kernel-adr | none — run first |
| **002** | `career-gravity-002-inventory-unlabeled-simulator-ready.md` | Inventory unlabeled Simulator Ready surfaces | inventory | CG-001 |
| **003** | `career-gravity-003-inventory-career-export-without-watermark.md` | Inventory career exports without rehearsal watermark | inventory | CG-001 |
| **004** | `career-gravity-004-inventory-status-badge-pipeline-copy.md` | Inventory status badges and pipeline copy | inventory | CG-002 |
| **005** | `career-gravity-005-inventory-cli-api-execute-without-door.md` | Inventory CLI/API execute without door | inventory | CG-001 |
| **006** | `career-gravity-006-inventory-email-digest-itsm-outbound.md` | Inventory email, digest, and ITSM outbound | inventory | CG-003 |
| **007** | `career-gravity-007-inventory-nested-desk-tools-inherit-door.md` | Inventory nested desk tools inherit door | inventory | CG-001 |
| **008** | `career-gravity-008-inventory-compare-ask-graph-search.md` | Inventory Compare, Ask, Graph, Search outputs | inventory | CG-007 |
| **009** | `career-gravity-009-inventory-sponsor-roi-scorecard.md` | Inventory sponsor, ROI, and scorecard Career claims | inventory | CG-003 |
| **010** | `career-gravity-010-compat-matrix-as076-085-vs-leaks.md` | Compat matrix: AS-076–085 vs remaining leaks | contract | CG-002–CG-009 |
| **011** | `career-gravity-011-server-persist-career-rehearsal-door.md` | Server-persist Career/Rehearsal door (not localStorage-only) | door-persist | CG-001 |
| **012** | `career-gravity-012-cross-tab-door-sync.md` | Cross-tab door sync | door-persist | CG-011 |
| **013** | `career-gravity-013-url-query-door-honesty.md` | URL/query door honesty | door-persist | CG-011 |
| **014** | `career-gravity-014-new-tenant-career-intent-ratchet.md` | New Working tenant Career intent ratchet | door-persist | CG-011 |
| **015** | `career-gravity-015-legacy-simulator-clone-rehearsal-banner.md` | Legacy Simulator clones grandfather Rehearsal with banner | door-persist | CG-014 |
| **016** | `career-gravity-016-chooser-keyboard-carbon-one-source.md` | Chooser: keyboard, Carbon, one source of truth | chrome | CG-011 |
| **017** | `career-gravity-017-security-product-line-chooser-honesty.md` | Security product-line: skip chooser with honesty | chrome | CG-016 |
| **018** | `career-gravity-018-door-cannot-silently-flip-mid-review.md` | Door cannot silently flip mid-review | door-persist | CG-011 |
| **019** | `career-gravity-019-execute-posture-stamp-on-run.md` | Execute posture stamp on the run | door-persist | CG-001 |
| **020** | `career-gravity-020-door-vs-host-mode-mismatch-honesty.md` | Door vs host Mode mismatch honesty | door-persist | CG-019 |
| **021** | `career-gravity-021-career-blocks-finalize-when-simulator.md` | Career door blocks finalize when Mode is Simulator | career-gate | CG-019, CG-020 |
| **022** | `career-gravity-022-career-blocks-sponsor-pdf.md` | Career door blocks sponsor PDF when rehearsal | career-gate | CG-003, CG-021 |
| **023** | `career-gravity-023-career-blocks-print.md` | Career door blocks unlabeled print | career-gate | CG-022 |
| **024** | `career-gravity-024-career-blocks-adr-export.md` | Career door blocks unlabeled ADR export | career-gate | CG-003 |
| **025** | `career-gravity-025-career-blocks-decision-receipt.md` | Career door blocks unlabeled decision receipt | career-gate | CG-003 |
| **026** | `career-gravity-026-career-blocks-audit-csv.md` | Career door blocks unlabeled audit CSV as career-complete | career-gate | CG-003 |
| **027** | `career-gravity-027-career-blocks-cli-export-bundle.md` | Career door blocks unlabeled CLI export bundle | career-gate | CG-005 |
| **028** | `career-gravity-028-career-blocks-api-export.md` | Career door blocks unlabeled API export | career-gate | CG-005 |
| **029** | `career-gravity-029-career-email-to-sponsor-gate.md` | Career email-to-sponsor gate | career-gate | CG-022 |
| **030** | `career-gravity-030-ready-to-finalize-label-suppression.md` | Ready-to-finalize label suppression leftover | career-gate | CG-021 |
| **031** | `career-gravity-031-run-status-badge-rehearsal.md` | Run status badge rehearsal honesty | chrome | CG-004, CG-019 |
| **032** | `career-gravity-032-progress-tracker-rehearsal.md` | Progress tracker rehearsal honesty | chrome | CG-031 |
| **033** | `career-gravity-033-pipeline-complete-copy.md` | Pipeline complete copy honesty | chrome | CG-030 |
| **034** | `career-gravity-034-scorecard-kpis-not-career-proof.md` | Scorecard KPIs are not Career proof on rehearsal | chrome | CG-009 |
| **035** | `career-gravity-035-roi-not-career-proof.md` | ROI tiles are not Career proof on rehearsal | chrome | CG-009 |
| **036** | `career-gravity-036-alert-fire-from-rehearsal.md` | Alerts from rehearsal cannot look like production proof | outbound | CG-006 |
| **037** | `career-gravity-037-digest-as-career.md` | Digests cannot present rehearsal as Career | outbound | CG-006 |
| **038** | `career-gravity-038-itsm-ticket-as-career.md` | ITSM tickets cannot present rehearsal as Career | outbound | CG-006 |
| **039** | `career-gravity-039-share-link-preview-honesty.md` | Share link preview honesty | outbound | CG-013 |
| **040** | `career-gravity-040-manifest-stamp-rehearsal-band.md` | Sealed record stamp rehearsal band | career-gate | CG-019, CG-021 |
| **041** | `career-gravity-041-watermark-css-print.md` | Rehearsal watermark in print CSS | watermark | CG-023 |
| **042** | `career-gravity-042-watermark-pdf.md` | Rehearsal watermark in sponsor PDF | watermark | CG-022 |
| **043** | `career-gravity-043-watermark-docx.md` | Rehearsal watermark in DOCX | watermark | CG-024 |
| **044** | `career-gravity-044-json-export-rehearsal-flag.md` | JSON export rehearsal flag | watermark | CG-025 |
| **045** | `career-gravity-045-cli-stdout-honesty.md` | CLI stdout rehearsal honesty | watermark | CG-027 |
| **046** | `career-gravity-046-playwright-rehearsal-ready-ratchet.md` | Playwright: rehearsal cannot screenshot Ready | ratchet | CG-030, CG-031 |
| **047** | `career-gravity-047-filename-includes-rehearsal.md` | Download filenames include rehearsal | watermark | CG-022 |
| **048** | `career-gravity-048-clipboard-copy-honesty.md` | Clipboard copy includes rehearsal | watermark | CG-033 |
| **049** | `career-gravity-049-presenter-mode-rehearsal.md` | Presenter mode rehearsal honesty | chrome | CG-040 |
| **050** | `career-gravity-050-sample-vs-rehearsal-vs-career.md` | Sample vs Rehearsal vs Career three-way honesty | contract | CG-001 |
| **051** | `career-gravity-051-demo-waiver-not-on-working-career.md` | Demo waiver copy not on Working Career | chrome | CG-050 |
| **052** | `career-gravity-052-guided-keeps-simulator-teaching-ratchet.md` | Guided keeps Simulator teaching ratchet | ratchet | CG-001 |
| **053** | `career-gravity-053-help-topic-career-rehearsal-expansion.md` | Help topic: Career vs Rehearsal expansion | copy | CG-050 |
| **054** | `career-gravity-054-cli-rehearse-real-symmetry.md` | CLI --rehearse / --real symmetry leftover | cli | CG-005 |
| **055** | `career-gravity-055-archlucid-try-default-honesty.md` | archlucid try default honesty | cli | CG-054 |
| **056** | `career-gravity-056-nested-ask-inherits-door.md` | Nested Ask inherits door/stamp | nested | CG-007 |
| **057** | `career-gravity-057-nested-compare-inherits-door.md` | Nested Compare inherits door/stamp | nested | CG-007 |
| **058** | `career-gravity-058-nested-graph-inherits-door.md` | Nested Graph inherits door/stamp | nested | CG-007 |
| **059** | `career-gravity-059-nested-search-inherits-door.md` | Nested Search inherits door/stamp | nested | CG-007 |
| **060** | `career-gravity-060-nested-findings-inherit-door.md` | Nested Findings inherit door/stamp | nested | CG-007 |
| **061** | `career-gravity-061-what-if-branch-inherits-door.md` | What-if branch inherits door/stamp | nested | CG-019 |
| **062** | `career-gravity-062-spawned-review-inherits-door.md` | Spawned review inherits door | nested | CG-061 |
| **063** | `career-gravity-063-clone-from-snapshot-door.md` | Clone-from-snapshot door honesty | nested | CG-061 |
| **064** | `career-gravity-064-recurrence-schedules-door.md` | Recurrence schedules inherit door honesty | nested | CG-019 |
| **065** | `career-gravity-065-advisory-scans-door.md` | Advisory scans inherit door honesty | nested | CG-019 |
| **066** | `career-gravity-066-replay-honesty.md` | Replay cannot mint Career from rehearsal | nested | CG-019 |
| **067** | `career-gravity-067-impact-preview-door.md` | Impact preview inherits door honesty | nested | CG-008 |
| **068** | `career-gravity-068-governance-approve-rehearsal.md` | Governance approve of rehearsal is labeled | governance | CG-040 |
| **069** | `career-gravity-069-promote-rehearsal-blocked-or-labeled.md` | Promote rehearsal blocked or labeled | governance | CG-068 |
| **070** | `career-gravity-070-activate-rehearsal-blocked-or-labeled.md` | Activate rehearsal blocked or labeled | governance | CG-069 |
| **071** | `career-gravity-071-vitest-no-unlabeled-ready.md` | Vitest: no unlabeled Ready on Working Simulator | ratchet | CG-030, CG-046 |
| **072** | `career-gravity-072-csharp-career-completeness-includes-door.md` | C# career completeness includes door stamp | ratchet | CG-019, CG-021 |
| **073** | `career-gravity-073-openapi-execution-mode-and-door.md` | OpenAPI executionMode + door on run/export | contract | CG-019 |
| **074** | `career-gravity-074-golden-corpus-not-claimed-career.md` | Golden corpus not claimed as Career | honesty | CG-050 |
| **075** | `career-gravity-075-fixture-working-defaults-career.md` | Working test fixtures default Career door | ratchet | CG-014 |
| **076** | `career-gravity-076-playwright-rehearsal-watermark.md` | Playwright rehearsal watermark on export preview | ratchet | CG-042 |
| **077** | `career-gravity-077-grep-ratchet-ready-plus-simulator.md` | Grep ratchet: Ready + Simulator on Working | ratchet | CG-002, CG-071 |
| **078** | `career-gravity-078-grandfather-shrink-unlabeled-ready.md` | Shrink unlabeled-Ready grandfather | ratchet | CG-002, CG-077 |
| **079** | `career-gravity-079-al-ui-rate-working-rates-career-gravity.md` | /al-ui-rate Working rates career gravity | ratchet | CG-001 |
| **080** | `career-gravity-080-no-host-mode-flip-ratchet.md` | No host Mode flip ratchet leftover | ratchet | CG-001 |
| **081** | `career-gravity-081-prompt-inventory-vitest.md` | Vitest: CG-00 index + CG-001–CG-100 files exist | close | prompt-set PR may already include this test |
| **082** | `career-gravity-082-working-vs-guided-split-ratchet.md` | Working vs Guided split ratchet for gravity gates | ratchet | CG-052 |
| **083** | `career-gravity-083-command-palette-start-review-door.md` | Command palette Start review respects door | chrome | CG-062 |
| **084** | `career-gravity-084-keyboard-alt-n-door.md` | Keyboard Alt+N respects door | chrome | CG-062 |
| **085** | `career-gravity-085-home-next-best-action-door.md` | Home next-best-action respects door | chrome | CG-030 |
| **086** | `career-gravity-086-architecture-desk-cta-door.md` | Architecture desk CTA respects door | chrome | CG-062 |
| **087** | `career-gravity-087-reviews-hub-status-door.md` | Reviews hub status respects door | chrome | CG-031 |
| **088** | `career-gravity-088-sealed-record-detail-door.md` | Sealed record detail shows stamp door | chrome | CG-040 |
| **089** | `career-gravity-089-decision-register-door.md` | Decision register rows show rehearsal | chrome | CG-068 |
| **090** | `career-gravity-090-value-report-door.md` | Value report rehearsal honesty | chrome | CG-035 |
| **091** | `career-gravity-091-first-review-guide-door.md` | First-review guide does not launder Career | chrome | CG-052 |
| **092** | `career-gravity-092-support-bundle-door.md` | Support bundle includes door/Mode | ops | CG-019 |
| **093** | `career-gravity-093-webhook-payload-door.md` | Webhook payload includes rehearsal flag | outbound | CG-006 |
| **094** | `career-gravity-094-integration-dlq-not-career.md` | Integration DLQ is not Career proof | honesty | CG-006 |
| **095** | `career-gravity-095-admin-ai-budget-not-execute-posture.md` | AI budget pill is not execute posture | honesty | CG-004 |
| **096** | `career-gravity-096-error-pages-door.md` | Error/recovery pages do not promise Career | recovery | CG-032 |
| **097** | `career-gravity-097-help-center-search-door-terms.md` | Help search finds Career/Rehearsal terms | copy | CG-053 |
| **098** | `career-gravity-098-changelog-in-app-not-required.md` | Do not add in-app changelog in this wave | out-of-wave | CG-001 |
| **099** | `career-gravity-099-prompt-inventory-confirm.md` | Confirm CG inventory test still green | close | CG-081 |
| **100** | `career-gravity-100-wave-close-audit.md` | Wave close audit — no unlabeled Simulator Career | close | CG-001–CG-099 |

## Run order

Follow **Depends on**. ADRs first. Inventories before mutating surfaces. Close audit last.

Suggested Cloud Agent branch per prompt: `cursor/career-gravity-<short-name>-5b6b`. Implementation sessions use a **new** feature branch per prompt. The prompt-set PR may live on `cursor/livelihood-gravity-prompts-5b6b`.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided, whether unlabeled Simulator Career is still possible on the path you touched (CG) or the wave’s done test.

**Successor:** [`system-not-job-00-index.md`](system-not-job-00-index.md) (**SN-001–040**). **Issue 4** remains [`lost-write-00-index.md`](lost-write-00-index.md) — do not re-run LW.

**Copy overlay (wave 31):** [`record-practice-00-index.md`](record-practice-00-index.md) (**RP-001–024**) — user-facing Record / Practice. Do not re-run CG.

## Global constraints (every prompt)

See any numbered file’s Constraints block. No desktop **More** menu; no `typed-engine-protected` change; no table merge; no live presence; no finding-comment chat; no GTM cohorts; no reopen TB-135/TB-136; TB-645; focused Vitest; scoped compile only for C#.

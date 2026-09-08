<!-- System-desk Composer prompts — paste one prompt per session.
     Origin: 2026-09-07 livelihood restatement: the Monday-morning object is
     still a job, not a system. Wave 18 after architecture-object-00-index.md
     (AO-01–50). AO made architecture the locator; this set makes the desk the
     work surface (ADR 0079). Do not merge DraftRequests and Runs.
     Wave 19: working-seat-00-index.md (WS-01–WS-24) — buyer polish off Working.
     Do not implement from this index. -->

# System-desk mitigations — Composer prompt set (SY-01–SY-100)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**This set is wave 18. It owns only:** the paying desk still treats a **review / Insights tool** as the place you work. Wave 17 (**AO-01–50**) nested the review job and pointed Start at the architecture. Leftovers AO-50 did not ratchet: **Alt+R → `/architecture/reviews`**, Ask/Compare/Graph as **peer `/insights/*` products**, remaining **`reviewDetailPath`** mints, hub copy as Home.

Later livelihood issues (insight density, dual buyer/Working skin, batch-priced what-if, career-export honesty leftovers, collaboration ACL) are **out of this wave**. Dual skin is **WS-01–WS-24**. Do not smuggle them in.

**Owner authorization (this wave):** on Working, the architecture desk is the **work surface**. Ask / Compare / Graph / Search / Findings **nest** under `/architecture/architectures/{architectureId}/`. `/architecture/reviews` is an **inbox**, never Monday morning, and **must not** own Alt+R. Guided / demo / trial may keep peer URLs. **Do not merge tables.** **Do not rewrite ADR 0068 / 0069 / 0072 / 0074 / 0077 bodies** — add **ADR 0079**; **Accept 0077** when locator evidence still holds.

**Do not implement from this index.** Paste one numbered file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Contract** | 0077 Proposed; tools bind via query | 0077 Accepted; **ADR 0079** desk is the work surface | SY-01–06 |
| **Keyboard** | Alt+R = packages hub; Alt+C/A/Y = Insights | Alt+R = desk/portfolio; tools are desk verbs | SY-07–15 |
| **Mint sweep** | `reviewDetailPath` still in guide/share/room/invite | Working uses `resolveArchitectureReviewHref` | SY-16–35 |
| **Nested tools** | `/insights/ask\|compare\|graph` | `/architectures/{id}/ask\|compare\|graph\|search\|findings` | SY-36–50 |
| **Inbox** | Hub competes as Home | Labeled Inbox; below Architectures | SY-51–58 |
| **Desk shell** | Identity summary + launch pad | Workbench + command bar; document title = name | SY-59–70 |
| **Teaching** | Help/onboarding/screenshots teach the job | Monday object is the architecture | SY-71–76 |
| **Ratchet** | AO-50 only blocks Start→run URL | Alt+R, imports, nested helpers, close audit | SY-77–80, 100 |
| **Satellites** | Recents, search, CLI, E2E still run-first | Architecture rows and URLs | SY-81–99 |

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039); ADR 0068 two **kernels** and **separate SQL tables**; spawn lock; document undo (ADR 0071); density gate (ADR 0070); trail finalize gate (ADR 0073); disposition 409 (ADR 0076); desktop review **tabs** as a full strip; Guided / demo / trial as eval sessions; `MUTATION_UNDO_WINDOW_SECONDS = 300`; BFF session (LK-05–07); FC career-artifact honesty.

Do **not** collapse desktop review workspace tabs behind **More**. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** add a 40th coverage engine. Do **not** invent live presence, finding-comment chat, or per-architecture ACL. Do **not** lengthen 300s undo. Do **not** unseal. Do **not** paste **FC** or **DX** density work.

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **AO-01–50** | Wave 17 locator | **Do not re-run.** SY supersedes AO-30–32 *product* shape (bind-by-query) via **0079** |
| **CA / DA** | Named identity | Do not re-run |
| **FC-01–80** | Career artifact honesty | Parallel; do not paste into SY |
| Overlay waves | Chrome | Do not re-run / do not fork |

If a row lists an AO/CA/PC owner, **do not re-implement that file**. Implement only the leftover in *What to build*.

## Run order

**ADR → inventory → keyboard → mint sweep → nested routes → redirects → desk → satellites → ratchet.**

Prefer **01 → 02 → 03 → 04**. Then **07** (Alt+R — load-bearing). Then **16–17** (peer start href). Then **36 → 38 → 40 → 42 → 43** (nested tools; **37/39/41** after each pair). Then **45–50**. Then **59–60** (workbench + command bar). Then **77–78** as soon as 07 and 36 exist. **80** after 36–43. **79** when guards are green. **100** last.

**02** must not rewrite 0077. **06** must not delete Guided peer routes. **07** must not hide Inbox from the sidebar. **36** must not delete Insights Ask. **60** must not collapse review-detail tabs. **77** must not ban `reviewDetailPath` in Guided. **80** must not skip Alt+R once SY-07 landed. **89** must not expand OpenAPI unless a UI URL field already exists. **99** must not claim density/FC closed.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `system-desk-01-accept-adr-0077.md` | 0077 still Proposed after locator shipped |
| 02 | `system-desk-02-adr-0079-desk-is-the-work-surface.md` | Bind-by-query keeps Insights as peer products |
| 03 | `system-desk-03-monday-morning-done-test.md` | AO-50 too weak (Start only) |
| 04 | `system-desk-04-inventory-remaining-peer-mints.md` | Unknown leftover `reviewDetailPath` sites |
| 05 | `system-desk-05-vocabulary-review-is-a-verb-on-the-desk.md` | “Open packages” still names the object |
| 06 | `system-desk-06-guided-demo-trial-keep-peer-products.md` | Nested Working would delete teaching |
| 07 | `system-desk-07-alt-r-is-not-the-inbox.md` | Alt+R → reviews hub |
| 08 | `system-desk-08-alt-c-compare-on-open-architecture.md` | Alt+C → bare Compare |
| 09 | `system-desk-09-alt-a-ask-on-open-architecture.md` | Alt+A → bare Ask |
| 10 | `system-desk-10-alt-y-graph-on-open-architecture.md` | Alt+Y → bare Graph |
| 11 | `system-desk-11-alt-g-findings-on-open-architecture.md` | Alt+G → unscoped queue |
| 12 | `system-desk-12-alt-h-home-is-portfolio-not-reviews.md` | Home leftover hub CTA |
| 13 | `system-desk-13-shortcut-overlay-desk-first.md` | Overlay still teaches inbox first |
| 14 | `system-desk-14-keyboard-docs-match-listeners.md` | Docs say Alt+R → packages |
| 15 | `system-desk-15-palette-inbox-is-not-a-file.md` | Ctrl+K opens reviews as files |
| 16 | `system-desk-16-retire-working-peer-start-href.md` | Peer `/reviews/new` start helper |
| 17 | `system-desk-17-home-cta-nested-start-only.md` | Home tests still expect peer start |
| 18 | `system-desk-18-first-review-guide-nested-urls.md` | Guide mints peer run URLs |
| 19 | `system-desk-19-buyer-nav-vs-working-split.md` | Buyer helper leaks into Working |
| 20 | `system-desk-20-share-and-clipboard-architecture-url.md` | Copy link peer fallback |
| 21 | `system-desk-21-room-elicitation-url-nests.md` | Room URL is peer run |
| 22 | `system-desk-22-pin-compare-url-nests.md` | Pin mints peer path |
| 23 | `system-desk-23-invite-reviewer-returns-to-desk.md` | Invite back → peer package |
| 24 | `system-desk-24-settings-invite-back-to-desk.md` | Roles invite success peer link |
| 25 | `system-desk-25-draft-intake-handoff-nested.md` | Handoff still peer |
| 26 | `system-desk-26-provenance-fallback-nested.md` | Provenance fallback peer |
| 27 | `system-desk-27-findings-dual-pane-nested-path.md` | Dual-pane default peer |
| 28 | `system-desk-28-activity-and-audit-deep-links.md` | Activity opens peer run |
| 29 | `system-desk-29-cli-prints-architecture-urls.md` | CLI prints run URLs |
| 30 | `system-desk-30-email-digest-notification-links.md` | Email CTA is a run |
| 31 | `system-desk-31-evidence-copy-parent-is-desk.md` | Related-links parent = reviews hub |
| 32 | `system-desk-32-architectures-hub-breadcrumb-not-reviews.md` | Architectures parented to jobs |
| 33 | `system-desk-33-insights-and-provenance-copy-parents.md` | Specialty copy climbs to hub |
| 34 | `system-desk-34-decision-register-empty-teaching.md` | Empty register starts unparented review |
| 35 | `system-desk-35-usability-consolidation-hrefs.md` | IA map Home = reviews |
| 36 | `system-desk-36-nested-ask-route.md` | Ask is a peer Insights app |
| 37 | `system-desk-37-redirect-peer-ask-on-working.md` | Ask bookmarks keep peer product |
| 38 | `system-desk-38-nested-compare-route.md` | Compare is a peer Insights app |
| 39 | `system-desk-39-redirect-peer-compare-on-working.md` | Compare bookmarks keep peer product |
| 40 | `system-desk-40-nested-graph-route.md` | Graph is a tenant canvas |
| 41 | `system-desk-41-redirect-peer-graph-on-working.md` | Graph bookmarks keep peer product |
| 42 | `system-desk-42-nested-search-route.md` | Search is always tenant-wide |
| 43 | `system-desk-43-nested-findings-route.md` | Findings require opening a run app |
| 44 | `system-desk-44-nested-print-and-provenance-stay-under-architecture.md` | Print/inspect drop the nest |
| 45 | `system-desk-45-insights-nav-are-desk-actions.md` | Sidebar Insights still look like a product |
| 46 | `system-desk-46-palette-nested-tool-actions.md` | Palette still allowlists Insights |
| 47 | `system-desk-47-open-architecture-context-for-redirects.md` | Redirects fail from Home/Inbox |
| 48 | `system-desk-48-tool-empty-states-start-on-this-architecture.md` | Empty tools recover to samples |
| 49 | `system-desk-49-compare-siblings-only-on-working.md` | Compare picker is tenant-wide |
| 50 | `system-desk-50-ask-requires-architecture-scope-on-working.md` | Unscoped Ask is a chatbot |
| 51 | `system-desk-51-reviews-hub-never-home-start-or-hero.md` | Hub still in Home heroes |
| 52 | `system-desk-52-reviews-hub-copy-is-inbox.md` | Hub titles itself like Home |
| 53 | `system-desk-53-hub-row-click-policy.md` | Row click opens peer job |
| 54 | `system-desk-54-unfinished-work-href-is-desk-or-nested-job.md` | Needs-attention dumps to hub filter |
| 55 | `system-desk-55-hub-related-links.md` | Hub related-links call hub Home |
| 56 | `system-desk-56-sidebar-reviews-labeled-inbox.md` | Sidebar still says Packages/Reviews |
| 57 | `system-desk-57-i18n-packages-label-working-branch.md` | i18n constant fights Inbox label |
| 58 | `system-desk-58-operate-analysis-not-daily-on-working.md` | Graph/Ask return to first viewport |
| 59 | `system-desk-59-desk-is-a-workbench-not-a-summary-card.md` | Desk is a launch pad |
| 60 | `system-desk-60-desk-command-bar-for-nested-tools.md` | Nested routes have no visible entry |
| 61 | `system-desk-61-document-title-is-architecture-name.md` | Tab title is a run |
| 62 | `system-desk-62-last-open-writes-on-every-nested-tool.md` | Tools do not update last-open |
| 63 | `system-desk-63-restore-second-window-to-architecture.md` | Restore prefers last peer review |
| 64 | `system-desk-64-inflight-is-a-chip-not-the-locator.md` | Wait page is Home |
| 65 | `system-desk-65-finalize-no-packet-island.md` | Success parks on a packet |
| 66 | `system-desk-66-finding-inspect-back-is-architecture.md` | Inspect back is hub |
| 67 | `system-desk-67-governance-queue-return-to-architecture.md` | Queue Open is peer run |
| 68 | `system-desk-68-recurrence-advisory-itsm-return-to-architecture.md` | Satellites only know run ids |
| 69 | `system-desk-69-decision-register-scoped-when-architecture-open.md` | Register unscoped while system open |
| 70 | `system-desk-70-sponsor-primary-open-is-architecture.md` | Sponsor Open is only the last run |
| 71 | `system-desk-71-help-monday-object-is-architecture.md` | Help narrates first-review as the job |
| 72 | `system-desk-72-onboarding-never-teaches-hub-as-working-home.md` | Day-one copy opens packages |
| 73 | `system-desk-73-ux-audit-working-home-is-architectures.md` | Screenshots freeze Reviews as Home |
| 74 | `system-desk-74-demo-showcase-working-identity.md` | Demo lands on showcase run URL |
| 75 | `system-desk-75-operator-shell-tutorial-architecture-first.md` | Tutorial starts at reviews hub |
| 76 | `system-desk-76-glossary-review-as-verb.md` | Glossary defines review as the workspace |
| 77 | `system-desk-77-grep-ratchet-review-detail-path.md` | Next overlay re-imports `reviewDetailPath` |
| 78 | `system-desk-78-shortcut-ratchet-alt-r.md` | Alt+R regresses to hub |
| 79 | `system-desk-79-accept-adr-0077-and-0079.md` | ADRs stay Proposed after evidence |
| 80 | `system-desk-80-acceptance-guard-system-desk.md` | No CI that job-as-Home stayed closed |
| 81 | `system-desk-81-notification-center-deep-links.md` | Bell menu opens peer runs |
| 82 | `system-desk-82-alerts-return-to-architecture.md` | Alert Open is unscoped run |
| 83 | `system-desk-83-global-search-architecture-rows-first.md` | Search ranks jobs first |
| 84 | `system-desk-84-recents-widget-is-architectures.md` | Recents are peer review files |
| 85 | `system-desk-85-history-and-os-titles.md` | Task switcher loses the system name |
| 86 | `system-desk-86-copy-link-from-nested-job-includes-architecture.md` | Copy canonicalizes back to peer |
| 87 | `system-desk-87-in-app-help-topics-nested-urls.md` | Help examples are peer review URLs |
| 88 | `system-desk-88-cli-archlucid-open-architecture.md` | CLI open is a run |
| 89 | `system-desk-89-api-location-headers-nested-for-working-clients.md` | API Location is a run URL |
| 90 | `system-desk-90-mobile-more-vs-desktop-inbox.md` | Hiding Inbox on desktop |
| 91 | `system-desk-91-product-line-architecture-shell-obeys-system-desk.md` | Architecture product line regresses |
| 92 | `system-desk-92-signed-records-are-children-not-home.md` | Sealed list competes as Home |
| 93 | `system-desk-93-pattern-library-and-intelligence-are-not-the-object.md` | Specialty tools become Home |
| 94 | `system-desk-94-finish-setup-working-points-at-architectures.md` | Setup success → reviews hub |
| 95 | `system-desk-95-golden-journey-pills-architecture-first.md` | Journey leads with Open package |
| 96 | `system-desk-96-nav-config-contract-and-drift.md` | Nav contract still says reviews are Home |
| 97 | `system-desk-97-route-roles-inventory-nested-tools.md` | New nests unclassified |
| 98 | `system-desk-98-e2e-mock-working-home-is-architectures.md` | E2E first goto is reviews hub |
| 99 | `system-desk-99-wave-boundary-not-fc-density-or-what-if.md` | SY PRs smuggle density/FC |
| 100 | `system-desk-100-wave-close-audit.md` | Wave never declared done |

## Already shipped (AO) — do not re-open

| Item | Evidence |
|------|----------|
| `resolveWorkingStartHref` → architecture identity | `working-start-route.ts` / AO-15 |
| Nested review/draft App Router pages | `architectures/[architectureId]/reviews/` |
| AO-50 Start≠peer review URL | `architecture-object-acceptance-guard.test.ts` |
| Bind-by-query Insights helpers | `resolve-working-insights-nav-href.ts` — **superseded as product shape by 0079** |
| Working operate-analysis daily strip empty | `SIDEBAR_DAILY_HREFS_BY_GROUP_WORKING` |

## Global constraints (every prompt)

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** / overflow (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0071, 0072, 0073, 0074, 0075, 0076, or 0077 in place. **Do not** merge draft and review tables.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate.
- **Do not** add a 40th coverage engine or fake frontier transcripts.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary. Do **not** call a draft a sealed record.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named in the prompt. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution builds, no dev servers unless the prompt says so.
- UI: Carbon density, sentence case, no ghost/link `Button`, form validation **TB-2005**. Disabled reasons visible (not native `title` only).
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first in method; check nulls; prefer LINQ and concrete types.
- New ADRs must include **Trade-offs**, **Constraints**, and **Expected impact** per `docs/architecture/adrs/template.md`.
- Tenant isolation: every new query is scoped (ADR 0037). No per-architecture ACL in V1.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, **whether Working Alt+R / Start / Home can still open `/architecture/reviews` as the locator**, whether nested Ask/Compare/Graph exist yet, which ADR was added or Accepted, and whether Guided/demo/trial still work. Do not mark AO as undone — except **AO-30–32 Working bind-by-query as the product shape**, which this set supersedes via **ADR 0079**.

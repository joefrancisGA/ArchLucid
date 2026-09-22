<!-- Lost-write Composer prompts — paste one prompt per session.
     Origin: 2026-09-10 owner diagnosis that ArchLucid is a working-architect
     tool (all-day use; livelihoods may depend on the sealed record). The first
     remaining livelihood failure is silent lost or overwritten in-flight work.
     Wave 23 after architecture-spine-00-index.md (AS-001–AS-100 shipped).
     Distinct from Hasher robustness wave 23 (docs/library/ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md).
     Do not implement from this index. -->

# Lost-write mitigations — Composer prompt set (LW-001–LW-100)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**This set is livelihood UX wave 23.** Chrome, persist gates, disposition CAS, and architecture-spine ontology (waves 1–22) are not enough. The remaining first failure is **durability of in-flight work**: omit-token draft PATCH is last-write-wins, offline replay skips CAS, 401 resume covers two mutation kinds in `sessionStorage`, dirty approval comments are unguarded, sibling tabs do not learn the BFF cookie died, and two architects collide with no lease.

**Owner authorization (this wave):**

1. Draft PATCH **CAS is mandatory** unless `forceOverwrite` (ADR **0088**). Offline queue must carry `expectedUpdatedUtc` and 409 into Keep mine — never silent LWW.
2. Livelihood **401 resume** for the inventoried mutate kinds, stored in **localStorage** (ADR **0089**). LP-19 two-kinds remain; this wave generalizes. FP-24 forbade LP-19 — this wave is the authorized follow-on.
3. **Work-lease without presence** (ADR **0090**). Soft exclusive editor token + steal-with-confirm + audit. CAS still required. No avatars, cursors, or finding-comment chat.
4. Dirty-guard leftovers that drop typed livelihood text (approval rationale, rename, intake nav, programmatic `router.push`).
5. Cross-tab **auth-cleared** and **scope** signals so a second tab does not keep writing.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/lost-write-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06. Do **not** re-implement V12-01 / AS-094 (share hub filter shipped on wave 22 close).

This is **not** Hasher robustness wave 23 (`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md`, items 221–230). Do not renumber those controls. Start-review stale `updatedUtc` (item 226) stays a separate guard (LW-022).

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Mandatory draft CAS** | Omit `expectedUpdatedUtc` = LWW | Omit = 409/400; `forceOverwrite` audited | LW-001, LW-013–028 |
| **Offline queue integrity** | Replay PATCHes field payload only | Entry carries token; 409 Keep mine; v1 no LWW | LW-006, LW-036–050 |
| **401 resume** | Two kinds, sessionStorage | Inventoried livelihood mutates, localStorage | LW-007, LW-051–070 |
| **Dirty text** | Approval/rename/wizard/router.push holes | Guarded + idle snapshot; one confirm | LW-004, LW-071–082 |
| **Cross-tab** | Idle activity sync only | Auth-cleared + scope broadcast | LW-083–088 |
| **Work-lease** | History strip only | Soft lease + steal audit, not presence | LW-008, LW-089–094 |
| **Recovery** | error.tsx / 4s toasts drop work | Snapshot + Retry + sticky mutation errors | LW-095–098 |
| **Close** | Next PATCH omits token | Acceptance audit | LW-099–100 |

## What this set does *not* change

Keep: tenant catalog isolation (ADR 0037) + optional RestrictToShares (0087); sealed-manifest immutability (ADR 0039); ADR 0068 two kernels — **do not merge** `DraftRequests`/`Runs`; density demotion predicate (ADR 0070); disposition 409 (ADR 0076) — do not rewrite the body; desktop review **tabs** as a full strip; Guided / demo / trial eval chrome; `MUTATION_UNDO_WINDOW_SECONDS = 300`; Simulator **host** default Mode; collab strip as **history not presence** (TB-2248).

Do **not** collapse desktop review workspace tabs behind **More**. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** add a 40th coverage engine. Do **not** invent live presence avatars or finding-comment chat. Do **not** lengthen 300s undo. Do **not** unseal. Do **not** flip G-REAL-06.

## Out of wave (do not pretend closed)

| Residual | Why |
|----------|-----|
| Favorites / recents / nav pins / last-visit / filter presets server sync | Cosmetic/workspace muscle memory — next wave; not in-flight overwrite |
| Compact/comfortable density, remappable shortcuts, resizable panes, high-contrast | Eight-hour ergonomics — not silent data loss |
| Full notification drawer / toast history | LW-097 only stickies **mutation** errors |
| Per-user rate-limit partition + client backoff | Throttle bite — not lost writes |
| Tenant-wide escrow ZIP / offline ManifestHash↔audit verify | Portability — not in-flight CAS |
| In-app product changelog / what’s new | Change management |
| G-REAL-06 Simulator→Real host default | Owner/GTM |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 |
| GTM cohorts M-90 / M-44 / M-91 / M-92 | Human-led validation |

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **AS-001–100** | Wave 22 ontology + shares | **Do not re-run.** Named concurrent desk as this wave |
| **V12-01 (AS-094)** | Hub/search RestrictToShares | **Do not re-run** (shipped on AS close) |
| **FP-01–24** | Disposition pointer CAS | **Do not re-run.** This wave **may** add 401 resume on bulk (FP forbade LP-19; 0089 authorizes it) |
| **LP-01–20** | Persist gates; LP-19 two kinds | **Do not re-run.** Generalize resume; keep the two kinds working |
| **LK-12** | Draft stale UpdatedUtc guard (opt-in token) | Leftover: omit still LWW — **0088** fail-closes |
| **AD-04 / LI-12** | Offline queue + new-draft recovery | Leftover: replay omits token |
| **WA-16** | Last-saved chrome | Leftover named in offline chrome (LW-049) |
| **Hasher robustness 221–230** | Create/review fail-closed (including start-review stale utc) | **Do not renumber.** LW-022 relates, does not fork |

If a row lists an AS/FP/LP/LK/AD owner, **do not re-implement that file**. Implement only the leftover in *What to build*.

## Run order

**ADRs first (can parallel):** **001**, **007**, **008**.

Inventories **002–006, 009–012** after 001 (002/003/004 can parallel).

Server CAS **013** after 001+009. **014–028** after 013. **023** CLI after 013. **024–025** OpenAPI after 013.

Online UI ratchet **029–035** after 013 (can parallel CLI).

Offline **036 → 037 → 038 → 039 → 040/041**. **042** with 036. Tests **045–048** with the code they lock. **049–050** after 039.

401 **051 → 053 → 054**; then kinds **055–062** (parallel after 053). **063–070** ratchets after kinds exist.

Dirty **071 → 072 → 073**. **074/075** independent after 004. **076** then **077/078**. **080** after shrinks.

Cross-tab **083 → 084**; **085 → 086**; **087** after 085. **088** with them.

Lease **089 → 090 → 091/092**; **093** with 090; **094** after 091.

Recovery **095–098** after 040/055. **099** anytime (file ratchet). **100** last.

**001** must not change the guard. **013** must not change the offline queue. **036** must not PATCH omit-token. **053** must not wrap GET. **008/089** must not add presence avatars. **100** must not claim G-REAL-06.

Suggested Cloud Agent branch per prompt: `cursor/lw-<short-name>-cf1e`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/lost-write-prompts-cf1e`.

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `lost-write-001-adr-0088-draft-cas-mandatory.md` | ADR 0088: draft PATCH CAS is mandatory unless forceOverwrite | kernel-adr | none — run first |
| **002** | `lost-write-002-inventory-patch-draft-clients.md` | Inventory every PatchDraftRequest / patchDraftRequest client | inventory | LW-001 |
| **003** | `lost-write-003-inventory-401-resume-gaps.md` | Inventory livelihood mutations with no 401 resume | inventory | LW-001 (can parallel LW-002) |
| **004** | `lost-write-004-inventory-dirty-guard-gaps.md` | Inventory dirty-guard deferred + missing approval rationale | inventory | LW-001 (can parallel) |
| **005** | `lost-write-005-inventory-browser-wip-storage.md` | Inventory browser keys that hold in-flight livelihood work | inventory | LW-001 (can parallel) |
| **006** | `lost-write-006-contract-offline-queue-cas.md` | Contract: offline draft queue carries expectedUpdatedUtc | contract | LW-001, LW-002 |
| **007** | `lost-write-007-adr-0089-401-resume-all-kinds.md` | ADR 0089: livelihood mutations resume after 401 from localStorage | kernel-adr | LW-001 (can parallel after 0088 number reserved) |
| **008** | `lost-write-008-adr-0090-work-lease-no-presence.md` | ADR 0090: work-lease without live presence | kernel-adr | LW-001 (can parallel) |
| **009** | `lost-write-009-omit-token-compat-matrix.md` | Compat matrix: omit-token today vs fail-closed | contract | LW-001, LW-002 |
| **010** | `lost-write-010-openapi-patch-draft-current-shape.md` | Snapshot current PatchDraftRequest OpenAPI (read-only) | contract | LW-001 |
| **011** | `lost-write-011-cli-patch-omits-token-repro.md` | CLI omit-token repro (red test, no product flip) | inventory | LW-002 |
| **012** | `lost-write-012-help-honesty-overwrite-copy-inventory.md` | Help copy inventory: overwrite vs Keep mine | honesty | LW-001 (can parallel) |
| **013** | `lost-write-013-guard-require-expected-updated-utc.md` | DraftPatchStaleUpdatedUtcGuard requires the token | server-cas | LW-001, LW-009 |
| **014** | `lost-write-014-problem-details-omit-vs-stale.md` | ProblemDetails distinguish omit-token vs stale token | server-cas | LW-013 |
| **015** | `lost-write-015-force-overwrite-required-audit.md` | forceOverwrite writes a Required durable audit event | server-cas | LW-013 |
| **016** | `lost-write-016-csharp-omit-token-throws.md` | C# test: omit expectedUpdatedUtc throws | server-cas | LW-013 |
| **017** | `lost-write-017-csharp-stale-token-throws.md` | C# test: stale expectedUpdatedUtc throws 409 | server-cas | LW-013 |
| **018** | `lost-write-018-csharp-matching-token-passes.md` | C# test: matching expectedUpdatedUtc succeeds | server-cas | LW-013 |
| **019** | `lost-write-019-csharp-force-overwrite-passes.md` | C# test: forceOverwrite skips CAS | server-cas | LW-013, LW-015 |
| **020** | `lost-write-020-csharp-concurrent-two-patch.md` | C# concurrent two-writer PATCH test | server-cas | LW-013 |
| **021** | `lost-write-021-mutate-stage-forwards-token.md` | DraftRequestMutateStage always forwards expected + forceOverwrite | server-cas | LW-013 |
| **022** | `lost-write-022-admit-submit-cas-relationship.md` | Start-review stale UpdatedUtc vs PATCH CAS (do not fork) | server-cas | LW-013 |
| **023** | `lost-write-023-cli-patch-sends-token.md` | CLI draft PATCH sends expectedUpdatedUtc | server-cas | LW-011, LW-013 |
| **024** | `lost-write-024-openapi-snapshot-required-unless-force.md` | OpenAPI describes fail-closed PATCH CAS | server-cas | LW-013, LW-010, LW-014 |
| **025** | `lost-write-025-generated-ts-types.md` | Generated TS types match fail-closed PATCH | server-cas | LW-024 |
| **026** | `lost-write-026-in-memory-draft-host-same-guard.md` | In-memory draft host uses the same CAS guard | server-cas | LW-013 |
| **027** | `lost-write-027-demo-host-cas-honesty.md` | Working copy: demo draft LWW is labeled if it remains | server-cas | LW-026 |
| **028** | `lost-write-028-ratchet-patch-construction.md` | CI ratchet: new PatchDraftRequest omit sites | server-cas | LW-002, LW-013, LW-023 |
| **029** | `lost-write-029-vitest-persist-sends-token.md` | Vitest: online persistDraft sends expectedUpdatedUtc | ui-cas | LW-013 |
| **030** | `lost-write-030-vitest-force-overwrite-omits-expected-ok.md` | Vitest: Keep mine sends forceOverwrite | ui-cas | LW-029 |
| **031** | `lost-write-031-keep-mine-still-force-overwrite.md` | Keep mine UI still uses forceOverwrite (no second panel) | ui-cas | LW-015, LW-030 |
| **032** | `lost-write-032-first-save-then-patch-has-token.md` | After deferred create, the following PATCH has a token | ui-cas | LW-029 |
| **033** | `lost-write-033-spawn-lock-independent-of-cas.md` | Spawn-lock / non-Drafting still independent of CAS | ui-cas | LW-013 |
| **034** | `lost-write-034-conflict-copy-covers-offline.md` | Conflict copy covers offline replay, not only “another session” | ui-cas | LW-014, LW-012 |
| **035** | `lost-write-035-grep-ratchet-patch-draft-request.md` | UI grep ratchet: patchDraftRequest CAS fields | ui-cas | LW-029, LW-028 |
| **036** | `lost-write-036-queue-schema-v2-expected.md` | Offline queue schema v2 includes expectedUpdatedUtc | offline-queue | LW-006, LW-013 |
| **037** | `lost-write-037-enqueue-writes-expected.md` | Enqueue writes expectedUpdatedUtc from serverUpdatedUtcRef | offline-queue | LW-036 |
| **038** | `lost-write-038-payload-fields-vs-cas-wrapper.md` | Field payload stays field-only; wrapper adds CAS | offline-queue | LW-037 |
| **039** | `lost-write-039-replay-sends-expected.md` | Offline replay PATCH sends expectedUpdatedUtc | offline-queue | LW-037, LW-038, LW-013 |
| **040** | `lost-write-040-replay-409-conflict-ui.md` | Replay 409 opens Keep mine / Keep server, does not silent break | offline-queue | LW-039, LW-034 |
| **041** | `lost-write-041-replay-409-does-not-dequeue.md` | Replay 409 must not dequeue the entry | offline-queue | LW-040 |
| **042** | `lost-write-042-v1-entries-no-silent-lww.md` | v1 queue entries without token do not last-write-wins | offline-queue | LW-036, LW-013 |
| **043** | `lost-write-043-dequeue-only-on-2xx.md` | Dequeue only on successful PATCH | offline-queue | LW-041 |
| **044** | `lost-write-044-replay-failure-names-draft.md` | Replay failure names the draftId in the desk chrome | offline-queue | LW-040 |
| **045** | `lost-write-045-vitest-enqueue-token.md` | Vitest: enqueue includes expectedUpdatedUtc | offline-queue | LW-037 |
| **046** | `lost-write-046-vitest-replay-409-keeps-entry.md` | Vitest: replay 409 keeps queue entry | offline-queue | LW-041 |
| **047** | `lost-write-047-vitest-replay-success-dequeues.md` | Vitest: replay 2xx dequeues | offline-queue | LW-043 |
| **048** | `lost-write-048-vitest-v1-migration.md` | Vitest: v1 localStorage migrates without LWW PATCH | offline-queue | LW-042 |
| **049** | `lost-write-049-offline-last-saved-chrome.md` | Offline last-saved / queued chrome on the draft desk | offline-queue | LW-044 |
| **050** | `lost-write-050-ratchet-enqueue-must-include-expected.md` | CI ratchet: enqueueArchitectureDraftOfflinePatch includes CAS | offline-queue | LW-037, LW-045 |
| **051** | `lost-write-051-pending-mutation-localstorage-v2.md` | Pending livelihood mutation moves to localStorage v2 | 401-resume | LW-007 |
| **052** | `lost-write-052-cross-tab-pending-visible.md` | Sibling tabs can see the pending mutation | 401-resume | LW-051 |
| **053** | `lost-write-053-generic-mutating-401-wrapper.md` | Generic 401 resume wrapper for livelihood mutating verbs | 401-resume | LW-007, LW-003, LW-051 |
| **054** | `lost-write-054-retain-lp19-disposition-correction.md` | Do not regress LP-19 finding disposition + correction resume | 401-resume | LW-053 |
| **055** | `lost-write-055-kind-architecture-draft-patch.md` | 401 resume kind: architecture_draft_patch | 401-resume | LW-053, LW-039 |
| **056** | `lost-write-056-kind-finding-bulk-disposition.md` | 401 resume kind: finding_bulk_disposition | 401-resume | LW-053 |
| **057** | `lost-write-057-kind-governance-workflow-transition.md` | 401 resume kind: governance_workflow_transition | 401-resume | LW-053, LW-071 |
| **058** | `lost-write-058-kind-architecture-review-finalize.md` | 401 resume kind: architecture_review_finalize | 401-resume | LW-053 |
| **059** | `lost-write-059-kind-policy-pack-save.md` | 401 resume kind: policy_pack_save | 401-resume | LW-053 |
| **060** | `lost-write-060-kind-itsm-connector-save.md` | 401 resume kind: itsm_connector_save | 401-resume | LW-053 |
| **061** | `lost-write-061-kind-architecture-share-grant.md` | 401 resume kind: architecture_share_grant | 401-resume | LW-053 |
| **062** | `lost-write-062-kind-risk-exception-write.md` | 401 resume kind: risk_exception_write | 401-resume | LW-053 |
| **063** | `lost-write-063-idempotency-key-on-replay.md` | Replay always sends the stored idempotency key | 401-resume | LW-052, LW-058 |
| **064** | `lost-write-064-return-path-and-safe-replay.md` | Replay only on safe returnPath match (keep LP-19 rule) | 401-resume | LW-051 |
| **065** | `lost-write-065-request-left-client-honesty.md` | requestLeftClient honesty on the resume chrome | 401-resume | LW-063 |
| **066** | `lost-write-066-resume-hook-new-kinds.md` | Resume hook exhausts new kinds | 401-resume | LW-055–062 |
| **067** | `lost-write-067-vitest-tab-close-still-resumes.md` | Vitest: tab close after 401 still resumes | 401-resume | LW-051, LW-052 |
| **068** | `lost-write-068-vitest-wrapper-covers-apipost.md` | Vitest: livelihood wrapper persists on 401 from apiPost | 401-resume | LW-053 |
| **069** | `lost-write-069-ratchet-new-livelihood-posts.md` | Ratchet: livelihood mutate sites use the wrapper or inventory | 401-resume | LW-003, LW-053 |
| **070** | `lost-write-070-no-resume-gets-or-auth.md` | Ratchet: GET and auth routes are not 401-resumed | 401-resume | LW-053 |
| **071** | `lost-write-071-approval-rationale-inventory-wire-id.md` | Move approval rationale from missing → guarded inventory id | dirty-guard | LW-004 |
| **072** | `lost-write-072-approval-rationale-guards.md` | Wire useLivelihoodDocumentGuards on approval rationale | dirty-guard | LW-071 |
| **073** | `lost-write-073-approval-rationale-idle-snapshot.md` | Idle snapshot for approval rationale | dirty-guard | LW-072, LW-051 |
| **074** | `lost-write-074-identity-rename-leave-deferred.md` | Architecture identity rename: guard (leave deferred list) | dirty-guard | LW-004 |
| **075** | `lost-write-075-intake-wizard-nav-guard.md` | Intake wizard: in-app nav guard (session persist already exists) | dirty-guard | LW-004 |
| **076** | `lost-write-076-intercept-router-push.md` | In-app guard intercepts router.push / replace | dirty-guard | LW-072 |
| **077** | `lost-write-077-command-palette-dirty.md` | Command palette navigation respects dirty guard | dirty-guard | LW-076 |
| **078** | `lost-write-078-scope-switch-dirty.md` | Workspace/project scope switch respects dirty guard | dirty-guard | LW-076, LW-085 |
| **079** | `lost-write-079-vitest-programmatic-nav-blocked.md` | Vitest: programmatic navigation blocked when dirty | dirty-guard | LW-076 |
| **080** | `lost-write-080-shrink-deferred-baseline.md` | Shrink deferred baseline after rename + wizard + approval | dirty-guard | LW-074, LW-075, LW-071 |
| **081** | `lost-write-081-remediation-yaml-guard-or-exception.md` | Remediation YAML: guard or documented exception | dirty-guard | LW-080 |
| **082** | `lost-write-082-draft-no-double-dialog.md` | Draft workspace: do not double-prompt | dirty-guard | LW-076 |
| **083** | `lost-write-083-broadcast-bff-session-cleared.md` | BroadcastChannel (or storage) when BFF session is cleared | cross-tab | LW-007 |
| **084** | `lost-write-084-sibling-tab-session-expired.md` | Sibling tab shows session-expired, not a failed save toast | cross-tab | LW-083 |
| **085** | `lost-write-085-broadcast-operator-scope.md` | Broadcast operator scope changes across tabs | cross-tab | LW-078 |
| **086** | `lost-write-086-sibling-tab-invalidate-queries.md` | Sibling tab invalidates React Query on scope change | cross-tab | LW-085 |
| **087** | `lost-write-087-write-path-scope-stamp.md` | Optional write-path scope stamp vs current scope | cross-tab | LW-085, LW-013 |
| **088** | `lost-write-088-vitest-cross-tab-sync.md` | Vitest: auth-cleared and scope broadcast | cross-tab | LW-083, LW-085 |
| **089** | `lost-write-089-sql-work-leases.md` | SQL architecture draft work leases (unified DDL + migration) | work-lease | LW-008 |
| **090** | `lost-write-090-api-lease-acquire-heartbeat.md` | API: acquire / heartbeat / release work lease | work-lease | LW-089 |
| **091** | `lost-write-091-ui-lease-banner-not-presence.md` | Working banner: another architect holds the lease (not presence) | work-lease | LW-090, LW-008 |
| **092** | `lost-write-092-lease-steal-confirm-audit.md` | Steal lease: confirm dialog + Required audit | work-lease | LW-090, LW-015 |
| **093** | `lost-write-093-lease-idor-authz-tests.md` | Work-lease IDOR / authz tests | work-lease | LW-090 |
| **094** | `lost-write-094-help-two-people-one-draft.md` | Help: two people on one draft (lease + CAS, not chat) | work-lease | LW-012, LW-091 |
| **095** | `lost-write-095-error-boundary-preserves-idle-snapshot.md` | error.tsx persists idle snapshots before unmount recovery UI | recovery | LW-073 |
| **096** | `lost-write-096-review-error-retry-not-abandon.md` | Review-detail error primary CTA is Retry, not Back to reviews | recovery | LW-095 |
| **097** | `lost-write-097-sticky-mutation-error-toasts.md` | Save/disposition/approve error toasts do not auto-dismiss in 4s | recovery | LW-040, LW-044 |
| **098** | `lost-write-098-tb2155-offline-and-401-roots.md` | TB-2155 inventory: offline replay conflict + 401 resume failure | recovery | LW-040, LW-055, LW-096 |
| **099** | `lost-write-099-prompt-inventory-vitest.md` | Vitest: LW-00 index + LW-001–LW-100 files exist | close | prompt-set PR may already include this test — confirm |
| **100** | `lost-write-100-wave-close-audit.md` | Wave close audit — no silent lost or overwritten livelihood write | close | LW-001–LW-099 |

## Done tests (LW-100 may mark shipped only if all true)

1. `PATCH` draft with `forceOverwrite: false` and omitted `expectedUpdatedUtc` **does not 200** (0088).
2. Offline replay sends `expectedUpdatedUtc`; 409 opens Keep mine and **does not dequeue**; v1 entries never omit-token PATCH.
3. 401 pending mutation survives **tab close** (localStorage) for disposition **and** draft patch (at least); bulk keeps FP row versions.
4. Governance approval `reviewComment` is dirty-guarded; intake wizard and identity rename have left the deferred hole or are honestly excepted.
5. Sibling operator tab receives **auth-cleared** and stops writing; scope change refreshes the other tab’s desk.
6. Work-lease banner is honest (not presence); steal is confirmed and audited; CAS still required.
7. Mutation save failures are not 4s-only; review error primary CTA is Retry.

## Global constraints (every prompt)

See any numbered file’s Constraints block. Same as AS/FP: no desktop **More** menu; no `typed-engine-protected` change; no ADR 0067 rewrite; no GTM cohorts; no reopen TB-135/TB-136; TB-645 vocabulary; focused Vitest; scoped compile only for C#.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, whether omit-token LWW is still possible on the path you touched. Do not mark AS, FP, or LP as undone.

**Wave 22:** [`architecture-spine-00-index.md`](architecture-spine-00-index.md) (**AS-001–100**). Do not fork AS-094.
**Hasher wave 23:** [`docs/library/ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md`](../../docs/library/ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE23.md). Do not renumber.
**Successor (livelihood UX waves 24–30):** [`livelihood-gravity-00-index.md`](livelihood-gravity-00-index.md). Issue 1 is [`career-gravity-00-index.md`](career-gravity-00-index.md) (**CG-001–100**). **Do not re-run LW.**

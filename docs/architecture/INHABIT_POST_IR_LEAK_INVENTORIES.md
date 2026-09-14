> **Scope:** Post-IR secondary inspector leak inventory (**IP-001**). Named leftovers after remain pack **IR-001–IR-018** close. **Not wave 35.** Closed remain rows stay in [`INHABIT_LEAK_INVENTORIES.md`](INHABIT_LEAK_INVENTORIES.md) — do not flip them back.

# Inhabit post-IR leak inventories (IP-002–IP-011)

**Last reviewed:** 2026-09-13 · **ADR:** [0100](adrs/0100-working-inhabit-architecture-findings-document.md)

These tables record **secondary** Working inhabit leaks on the job inspector and related chrome. Source of truth: `archlucid-ui/src/lib/inhabit-post-ir-leak-inventories.ts`. Diagnosis: [`WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md`](WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md). Remain close: [`INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md`](INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md).

`leakOpen: Yes` means the livelihood leak is **still open**. Product IPs (**IP-002**–**IP-011**) flip rows to **No** via **IP-013**.

## IP-002 — Reviews hub lands on inhabited findings (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Reviews hub Continue strip | `reviews-hub-continue-review.ts` | No | IP-002 |
| Reviews hub row primary href | `reviews-hub-package-display.ts` | No | IP-002 |

## IP-003 — Global search resume stays on inhabited findings (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Global search run resume | `use-global-search-bar.ts` | No | IP-003 |
| Global search finding inspect | `use-global-search-bar.ts` | No | IP-003 |
| Global search package finding link | `GlobalSearchPackageResultsPanel.tsx` | No | IP-003 |

## IP-004 — Working share copies inhabited findings (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Working share href resolver | `working-share-href.ts` | No | IP-004 |
| Working review copy link button | `WorkingReviewCopyLinkButton.tsx` | No | IP-004 |

## IP-005 — Quick-decision cards use inhabited hrefs (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Quick-decision primary finding card | `QuickDecisionWorkspacePrimaryFindingCard.tsx` | No | IP-005 |
| Quick-decision secondary finding card | `QuickDecisionWorkspaceSecondaryFindingCard.tsx` | No | IP-005 |
| Run detail findings dense table | `RunDetailFindingsDenseTable.tsx` | No | IP-005 |

## IP-006 — Completion notification opens inhabited findings (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Review completion notification | `use-review-completion-notification.ts` | No | IP-006 |
| Review completion href resolver | `resolve-review-completion-href.ts` | No | IP-006 |

## IP-007 — Room on review-detail (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Review room header button | `ReviewRoomHeaderButton.tsx` | No | IP-007 |
| Presenter elicitation bridge (room path) | `RunDetailPresenterElicitationBridge.tsx` | No | IP-007 |
| Room elicitation shortcut host (Alt+M) | `ReviewRoomElicitationShortcutHost.tsx` | No | IP-007 |

Post-spawn MUST on nested findings (`InhabitedFindingsRoomCard`) and draft-desk Room when `parentArchitectureId` is known stay closed (**IR-012** / **IR-013**).

## IP-008 — Finding inspect support band threads Simulator mode (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Finding detail header support chip | `FindingDetailHeader.tsx` | No | IP-008 |
| Finding detail inspect body support chip | `FindingDetailInspectBody.tsx` | No | IP-008 |
| Finding semantic support band inspect section | `FindingSemanticSupportBandInspectSection.tsx` | No | IP-008 |

## IP-009 — Secondary re-run mounts start-honesty notices (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Run progress tracker terminal-failure re-run | `RunProgressTracker.tsx` | No | IP-009 |
| Run agent quality warnings re-run | `RunAgentQualityWarningsPanel.tsx` | No | IP-009 |

Primary start-honesty surfaces remain closed (**IH-025**).

## IP-010 — Inspector finalize passes parentArchitectureId (closed)

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Review package Do this next finalize | `ReviewPackageDoThisNextStrip.tsx` | No | IP-010 |

Inhabited findings-document finalize with `parentArchitectureId` stays closed (**IH-022**).

## IP-011 — Inhabited first-paint trail and run-scope banner

| Surface | Module | Leak open | Owner |
| --- | --- | --- | --- |
| Inhabited findings document chrome (reasoned-no first paint) | `InhabitedFindingsDocumentChrome.tsx` | Yes | IP-011 |
| Governance findings queue run-scope banner | `GovernanceFindingsQueueScopeSection.tsx` | No | IP-011 |

Run-scope banner is gated on `suppressPipelineChrome` when inhabited nested findings are mounted. First-paint infeasible + transparency trail still waits on client `useQuery` in `InhabitedFindingsDocumentChrome` — no cheap server bundle exists without inventing a progress API.

## Intentional skips (not IP work)

| Skip | Why |
| --- | --- |
| Peer `/governance/findings` as architecture Home | **IR-015** — run-scoped peer queue |
| Nested review-detail as **inspector** | ADR 0098 — full tab strip stays |
| G-REAL-06 / host Mode Real | Honesty, not a default-day lie |
| Draft-diff Compare | ADR 0092 / IH-077 |

## Ratchet

- `archlucid-ui/src/lib/inhabit-post-ir-leak-inventories.ts`
- `archlucid-ui/src/lib/inhabit-post-ir-leak-inventories.test.ts`
- Flip rows: **IP-013** after each product IP ships
- Close audit: **IP-015** after **IP-001–IP-014**

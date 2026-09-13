> **Scope:** Shrink-only inventories — inhabit wave 34 (**IH-004–IH-012**) plus remain pack (**IR-001–IR-014** closed). **IR-015** is an intentional skip.

# Inhabit leak inventories (IH-004–IH-012)

**Last reviewed:** 2026-09-13 · **ADR:** [0100](adrs/0100-working-inhabit-architecture-findings-document.md)

These tables record where Working inhabit behavior is defined and ratcheted. Source of truth: `archlucid-ui/src/lib/inhabit-leak-inventories.ts`. Wave 34 close: [`INHABIT_ACCEPTANCE_2026-09-13.md`](INHABIT_ACCEPTANCE_2026-09-13.md). Remain close: [`INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md`](INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md). Diagnosis: [`WORKING_ARCHITECT_DIAGNOSIS_2026-09-13.md`](WORKING_ARCHITECT_DIAGNOSIS_2026-09-13.md).

## IH-004 — Findings editor still on review-detail

| Surface | Href pattern | ArchitectureId known | Editor kind | Owner |
| --- | --- | --- | --- | --- |
| Architecture nested findings desk | `/architecture/architectures/{id}/findings?runId=` | Yes | nested-findings-desk | IH-015 |
| Review-detail finding inspect | `/architecture/reviews/{id}/findings/{findingId}` | Yes | review-detail-inspect | IR-004 |
| Governance findings queue (peer — IR-015 skip) | `/governance/findings?runId=` | No | governance-queue | IR-015 |
| Quick decision workspace | in-page | Yes | quick-decision | IR-005 |

## IH-005 — Record CTA implies Simulator work is career-complete

| Surface | Module | Simulator incompleteness copy at start | Owner |
| --- | --- | --- | --- |
| Draft Start review footer | `ArchitectureDraftWorkspaceStartReviewFooter.tsx` | **IH-025** | IH-025 |
| Identity desk Start review | `ArchitectureIdentityDeskCommandBar.tsx` | **IH-025** | IH-025 |
| Review package re-run strip | `ReviewPackageDoThisNextStrip.tsx` | **IH-025** | IH-025 |
| New run wizard submit | `NewRunWizardClient.tsx` | **IH-025** | IH-025 |

## IH-006 — Disposition reversible only via 300s toast

| Surface | Toast undo | Record correction visible | Disposition history | Owner |
| --- | --- | --- | --- | --- |
| Governance finding row | Yes | Yes | Yes | IR-006 |
| Finding inspect form | Yes | Yes | Yes | IH-034 |
| Governance queue client | Yes | Yes | Yes | IR-007 |
| Inhabited findings document card rows | Yes | Yes | Yes | IH-034 |
| Governance finding triage panel | No | Yes | Yes | IH-034 |

`MUTATION_UNDO_WINDOW_SECONDS = 300` stays. Do not lengthen.

## IH-007 — Quiet engines named only on export

| Surface | Names quiet engines on desk | Owner |
| --- | --- | --- |
| Nested findings empty state | Yes | IH-021 |
| Inhabited findings document chrome | Yes | IH-040 |
| Run progress Ready chrome | Yes | IR-001 |
| Pre-finalize checklist | Yes | IH-041 |
| Career export gate | Yes (export-only) | CG-021 |

## IH-008 — Exploration requires clone ceremony

| Surface | Sketch entry | Committed Compare from desk | Owner |
| --- | --- | --- | --- |
| Architecture identity desk | Yes | Yes | IH-047 |
| Nested findings document chrome | Yes | Yes | IH-047 |
| Spawn-lock handoff | Yes (clone) | Yes | IR-014 |

No draft-diff Compare. No CE Sketch runner remount.

## IH-009 — Room elicitation is presenter route

| Surface | Leaves architecture findings document | Owner |
| --- | --- | --- |
| Inhabited findings room card | No | IH-053 |
| Presenter elicitation bridge | No | IR-012 |
| Draft room header | No | IR-013 |
| Quick start L0 must questions | No | IR-013 |

No avatars. No finding-comment chat.

## IH-010 — Keyboard does not land on first finding

| Surface | Default focus first finding | Palette work actions first | Owner |
| --- | --- | --- | --- |
| Nested findings page | Yes | Yes | IH-059 |
| Keyboard triage host | Yes | Yes | IR-009 |
| Finding card shortcuts | Yes | Yes | IR-008 |

## IH-011 — Recents, pins, selection not inhabited continuity

| Concern | Mechanism | Persist | Architecture-shaped | Owner |
| --- | --- | --- | --- | --- |
| Recent views | localStorage + user preferences API | account-prefs | Yes | IH-066 |
| Continue-last | `resolve-continue-last-review-package` | account-prefs | Yes | IR-010 |
| Pins | favoriteReviews localStorage + user preferences API | account-prefs | Yes | IR-011 |
| Finding selection | `focusedFinding` URL query | url | Yes | IH-064 |

## IH-012 — Working Home teaches pipeline

| Surface | Pipeline hero / stepper | Owner |
| --- | --- | --- |
| Unfinished work rail | No | IH-027 |
| First review guide | No | IR-003 |
| Identity desk command bar | No (desk verbs) | IH-027 |
| Core pilot steps | No | IR-002 |

Guided / demo / trial may keep eval chrome (**IH-070**).

## IH-024 — Nested review Back href

| Surface | Returns to architecture | Owner |
| --- | --- | --- |
| Finding detail page | Yes | IH-024 |
| Spawn-lock draft handoff | Yes | IH-022 |
| Governance finding triage panel | Yes | IH-020 |
| Peer governance findings queue (IR-015 skip) | No | IR-015 |

## Ratchet

- `archlucid-ui/src/lib/inhabit-leak-inventories.ts`
- `archlucid-ui/src/lib/inhabit-leak-inventories.test.ts`
- Remain close audit: [`INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md`](INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md)

> **Scope:** Shrink-only inventories — inhabit wave 34 leaks (**IH-004–IH-012**). Do not fix rows in this file; numbered prompts own the close.

# Inhabit leak inventories (IH-004–IH-012)

**Last reviewed:** 2026-09-13 · **ADR:** [0100](adrs/0100-working-inhabit-architecture-findings-document.md)

These tables name where Working still behaves like a governed job inspector instead of an inhabited architecture afternoon. Shrink rows when a later **IH** prompt closes the leak.

## IH-004 — Findings editor still on review-detail

| Surface | Href pattern | ArchitectureId known | Editor kind | Owner |
| --- | --- | --- | --- | --- |
| Architecture nested findings desk | `/architecture/architectures/{id}/findings?runId=` | Yes | nested-findings-desk | IH-015 |
| Review-detail finding inspect | `/architecture/reviews/{id}/findings/{findingId}` | Optional | review-detail-inspect | IH-020 |
| Governance findings queue | `/governance/findings?runId=` | No | governance-queue | IH-015 |
| Quick decision workspace | in-page | No | quick-decision | IH-017 |

## IH-005 — Record CTA implies Simulator work is career-complete

| Surface | Module | Simulator incompleteness copy at start | Owner |
| --- | --- | --- | --- |
| Draft Start review footer | `ArchitectureDraftWorkspaceStartReviewFooter.tsx` | **IH-025** | IH-025 |
| Identity desk Start review | `ArchitectureIdentityDeskCommandBar.tsx` | **IH-025** | IH-025 |
| Review package re-run strip | `ReviewPackageDoThisNextStrip.tsx` | Open | IH-025 |
| New run wizard submit | `NewRunWizardClient.tsx` | Open | IH-025 |

## IH-006 — Disposition reversible only via 300s toast

| Surface | Toast undo | Record correction visible | Disposition history | Owner |
| --- | --- | --- | --- | --- |
| Governance finding row | Yes | Yes | No | IH-033 |
| Finding inspect form | Yes | Yes | No | IH-034 |
| Governance queue client | Yes | No | No | IH-004 |

`MUTATION_UNDO_WINDOW_SECONDS = 300` stays. Do not lengthen.

## IH-007 — Quiet engines named only on export

| Surface | Names quiet engines on desk | Owner |
| --- | --- | --- |
| Nested findings empty state | No | IH-021 |
| Run progress Ready chrome | No | IH-040 |
| Pre-finalize checklist | No | IH-041 |
| Career export gate | Yes (export-only) | CG-021 |

## IH-008 — Exploration requires clone ceremony

| Surface | Sketch entry | Committed Compare from desk | Owner |
| --- | --- | --- | --- |
| Architecture identity desk | Yes | Yes | IH-047 |
| Nested findings document | No | No | IH-047 |
| Spawn-lock handoff | Clone only | No | IH-008 |

No draft-diff Compare. No CE Sketch runner remount.

## IH-009 — Room elicitation is presenter route

| Surface | Leaves architecture findings document | Owner |
| --- | --- | --- |
| Presenter elicitation bridge | Yes | IH-053 |
| Draft room header | Yes | IH-053 |
| Quick start L0 must questions | Yes | IH-053 |

No avatars. No finding-comment chat.

## IH-010 — Keyboard does not land on first finding

| Surface | Default focus first finding | Palette work actions first | Owner |
| --- | --- | --- | --- |
| Nested findings page | No | No | IH-059 |
| Keyboard triage host | No | No | IH-060 |
| Finding card shortcuts | No | No | IH-010 |

## IH-011 — Recents, pins, selection not inhabited continuity

| Concern | Mechanism | Persist | Architecture-shaped | Owner |
| --- | --- | --- | --- | --- |
| Recent views | localStorage | tab-local | No | IH-064 |
| Continue-last | resolver + recents | tab-local | **IH-015** | IH-015 |
| Pins | localStorage + user preferences API | account-prefs | Yes | IH-066 |
| Finding selection | URL / memory | partial | Yes | IH-064 |

## IH-012 — Working Home teaches pipeline

| Surface | Pipeline hero / stepper | Owner |
| --- | --- | --- |
| Unfinished work rail | Yes | IH-027 |
| First review guide | Yes | IH-027 |
| Identity desk command bar | No (desk verbs) | IH-027 |
| Core pilot steps | Yes | IH-069 |

Guided / demo / trial may keep eval chrome (**IH-070**).

## Ratchet

- `archlucid-ui/src/lib/inhabit-leak-inventories.ts`
- `archlucid-ui/src/lib/inhabit-leak-inventories.test.ts`

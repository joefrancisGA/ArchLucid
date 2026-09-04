# LD-11 — In-flight desk on the reviews hub, without sample rows

**Do not fork LI-08 or WD-06** for the Overview `in-flight` section slot or `use-shell-in-flight-operations`. Do not invent `GET /v1/runs/{runId}/progress`. This file is **reviews hub grouping + live vs sample honesty**.

## Goal

Working-mode **reviews hub** treats analysis-in-progress as resumable work above completed eval samples. Overview in-flight rows use discrete `state` / `stepLabel` from the existing operations store (no fake percent). Live tenants never mix Claims Intake into that queue (pair with LD-02). Stale-vs-live stays on the open review banner; do not toast-spam other routes.

## Why

Livelihood throughput is blocked by waiting. LI-08 added an Overview composition slot. If the hub still defaults to completed showcase rows, or the Overview slot is empty of mapped DTOs, the architect still babysits one spinner tab. A daily driver works *while* two reviews run.

## Context

- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` (TB-2072)
- `archlucid-ui/src/hooks/use-shell-in-flight-operations.ts`
- `archlucid-ui/src/lib/operations/in-flight-operations-store.ts`
- `archlucid-ui/src/components/reviews/ReviewWorkspaceStaleBanner.tsx`
- `archlucid-ui/src/lib/compose-operator-home-sections.ts` — `in-flight` id
- Reviews hub: `archlucid-ui/src/app/(operator)/architecture/reviews/`
- Existing `state` / `stepLabel` / `heartbeatUtc` on operation payloads
- LD-02 owns error-boundary sample substitution

## What to build

1. Map the existing in-flight store onto the Overview `in-flight` section if not already listing packages (title, discrete step, link). No invented percentages. Do not poll a second way.
2. Reviews hub Working default: in-progress above completed; Guided may keep current default. Showcase rows labeled sample when demo is on; omitted on live.
3. Keep stale banner on the open review. Other routes: desk list is the signal, not toast-spam.
4. Queue row deep-links to the review with `?reviewTab=` landing on Activity while analysis runs — **default tab only**, not tab visibility/order changes.
5. Copy: analysis is running; do not imply the package is ready to seal.
6. Vitest for hub grouping and DTO mapping. No new progress endpoint.

## Acceptance criteria

- Working user with two in-flight reviews sees both on Overview **and** the reviews hub without opening each spinner tab.
- Progress labels are discrete and honest; no fake `%`.
- Live hub does not insert Claims Intake into the in-flight list.
- Desktop tabs stay fully visible in stable order.

## Constraints

- Do not start a long-lived dev server or `gh pr checks --watch`.
- Do not implement GTM **M-90**.
- Do not collapse tabs to “make the queue simpler.”

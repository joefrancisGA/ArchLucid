> **Scope:** RP-002 — user-facing Career/Rehearsal copy inventory. Engineering tokens unchanged.

# Record-practice user copy inventory

**Last reviewed:** 2026-09-12 · **ADR:** [0097](adrs/0097-record-and-practice-user-facing-labels.md)

## P0 — toggle and blocked state (shipped)

| Surface | Module | User-visible label |
| --- | --- | --- |
| Top bar toggle | `working-career-rehearsal-door-copy.ts` | Record / Practice |
| Blocked dialog title | `working-career-door-gate-copy.ts` | This host cannot produce a sealed record |
| Switch CTA | `working-career-door-gate-copy.ts` | Switch to Practice |
| Status badge | `run-status-badge-career-honesty.ts` | Record complete / Sealed record blocked |

## P1 — honesty strips and outbound (shipped this wave)

| Surface | Module | Notes |
| --- | --- | --- |
| Sponsor email banner | `EmailRunToSponsorBanner.tsx` | Sealed-record honesty |
| DLQ page | `integration-events-dlq-page-copy.ts` | not sealed-record proof |
| Digest / ITSM rows | `ExecDigestCareerHonestyPresenter.cs` | Sealed record blocked |
| Support triage index | `SupportBundleTriageIndexBuilder.cs` | Sealed record blocked: |

## Must not change (RP-022)

| Layer | Values |
| --- | --- |
| Stored tokens | `career`, `rehearsal` |
| OpenAPI field | `WorkingCareerRehearsalDoor` |
| Help slug | `career-rehearsal-doors` |
| Honesty cell ids | `career-real`, `rehearsal-simulator`, … |

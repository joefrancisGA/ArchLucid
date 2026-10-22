# Advisory scan schedule page refinement — implementation report

**Date:** 2026-07-23  
**Route:** `/advisory?tab=schedules`  
**Scope:** UI refinement of advisory-scan scheduling only (no scheduler engine redesign).

## Summary

Turned the Schedules tab from a cron/slug-oriented configuration screen into a customer workflow for recurring advisory scans: plain-language frequency, local time and time zone, current-project scope, upcoming-run preview, sample-mode and permission-aware create controls, and a clearer relationship to Governance → Recurrence schedules.

## Route and component inventory

| Role | Path |
|------|------|
| Route page | `archlucid-ui/src/app/(operator)/advisory/page.tsx` |
| Hub tabs | `archlucid-ui/src/components/advisory/AdvisoryHubClient.tsx` |
| Schedules orchestrator | `archlucid-ui/src/components/advisory/AdvisorySchedulesContent.tsx` |
| Create form | `archlucid-ui/src/components/advisory/AdvisoryScheduleCreateForm.tsx` |
| Advanced expression editor (shared) | `archlucid-ui/src/components/advisory/CronExpressionBuilder.tsx` |
| Form / cron helpers | `archlucid-ui/src/lib/advisory-schedule-form.ts` |
| List presentation model | `archlucid-ui/src/lib/advisory-schedule-page-model.ts` |
| Upcoming-run preview loader | `archlucid-ui/src/lib/advisory-schedule-upcoming-preview.ts` |
| Copy | `archlucid-ui/src/lib/advisory-copy.ts` |
| API client (unchanged contract) | `archlucid-ui/src/lib/api/advisory-digests-api.ts` |
| Backend | `ArchLucid.Api/Controllers/Advisory/AdvisorySchedulingController.cs` |

Legacy redirect `/advisory-scheduling` → `/advisory?tab=schedules` remains.

## Scheduler capabilities discovered

| Capability | Advisory scan schedules | Notes |
|------------|-------------------------|--------|
| List | Yes | `GET /v1/advisory-scheduling/schedules` |
| Create | Yes | `POST …/schedules` — **AdminAuthority** |
| Run now | Yes | `POST …/schedules/{id}/run` — **AdminAuthority** |
| Execution history | Yes | `GET …/schedules/{id}/executions` |
| Preview next runs | Via recurrence preview API | Same UTC Cronos calculator |
| Update / pause / resume / delete | **No HTTP API** | UI does not invent these actions |
| Time zone field | **None** (UTC cron only) | UI converts local wall time → UTC five-field cron |
| Project field | `runProjectSlug` | Defaults to `"default"`; maps to run-list project key |

Cron support: `@hourly` / `@daily` / `@weekly` aliases or five-field Cronos UTC. Monthly is expressed as five-field cron (e.g. `0 6 15 * *`), not `@monthly`.

## Simple scheduling controls implemented

Primary customer options:

- **Daily** — time + time zone  
- **Weekdays** — time + time zone → `M H * * 1-5`  
- **Weekly** — day + time + time zone  
- **Monthly** — day-of-month (1–28) + time + time zone  
- **Custom** — opens Advanced scheduling  

Default time zone: browser IANA zone (`Intl`), with UTC as an explicit select option. Generated UTC expression is shown read-only under the upcoming-run preview.

## Advanced cron treatment

- Hidden by default behind **Advanced scheduling**.  
- Mounted only when opened (or when Frequency = Custom).  
- Intended for administrators; plain-language unsupported-expression feedback.  
- Preset tokens `@hourly` / `@daily` / `@weekly` are not part of the primary customer workflow.  
- Shared `CronExpressionBuilder` remains available to Recurrence schedules with presets for that surface.

## Time-zone behavior

- Local controls use IANA zones via existing `iana-time-zone-select` helpers.  
- Wall-clock → UTC conversion uses `Intl` offsets (no hard-coded DST offsets).  
- Upcoming runs: server preview API (UTC), then formatted in the selected zone with UTC as secondary text.  
- **Limitation:** persistence is still a UTC cron expression; across DST transitions the local wall-clock time may shift by one hour until the schedule is recreated. True DST-stable local recurrence would require a backend time-zone field.

## Project-scope treatment

- Customer sees **Current project: {projectLabel}** from the workspace switcher.  
- No “Workspace project slug” field.  
- Stored `runProjectSlug` resolves to authority run-list key `"default"` when the scope project id is a GUID (matches `RunIdPicker` / reviews list practice).  
- Scopes “Selected project” / “All eligible projects” were **not** added — backend does not offer multi-project or all-projects advisory schedules.

## Sample-mode behavior

When `isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv()`:

- Create controls are disabled.  
- Banner explains schedules cannot be created for fabricated sample data.  
- CTA: **Start an evaluation**.  
- Public sample users cannot create background jobs through this UI.

## Internal operations visibility findings

Existing gates already hide **Internal Operations** when:

1. `NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV` is off, or  
2. Buyer-polished shell without full-operator experience.

**Finding:** A screenshot that shows Internal Operations alongside a sample-style advisory experience is consistent with an **authorized internal architect workspace** (feature flag on + full-architect experience), not with public sample / ordinary tenant nav. No valid role behavior was loosened.

Tests added/extended:

- Public sample does not see Internal Operations.  
- Ordinary tenant with admin-nav flag off does not see Internal Operations.  
- Authorized internal shells do see it (after expanding the section).  
- Direct unauthorized navigation to `/admin/rag-health` remains blocked in-page for non-admin callers (server policies remain authoritative).

## Recurrence-schedule relationship

| Surface | Responsibility |
|---------|----------------|
| **Advisory scans → Schedules** | Create/manage context for **advisory-scan** cadence |
| **Governance → Recurrence schedules** | Central view/manage for **architecture-review recurrence** jobs |

Copy/link: “Manage all recurrence schedules” with a one-line explanation. No second independent advisory schedule-management stack was added; preview reuses the recurrence preview API and shared advanced editor.

## Page identity and terminology

- Hierarchy: **Advisory scans** / **Schedule advisory scans**  
- Description: finalized-review lifecycle (aligned with Scans tab).  
- Removed customer-facing “Background worker polls every ~5 minutes” / project slug / primary cron workflow.  
- Timing note: “Scheduled scans may begin a few minutes after the selected time.”  
- Mutations gated to **Admin** rank in UI (matches API); readers get a useful read-only view without internal claim names.

## Unsupported actions (intentionally omitted)

Edit, Pause, Resume, Delete — no advisory-schedule HTTP APIs. Existing schedules show name, project, frequency (plain language), next/last run, status (Active/Paused from `isEnabled`), Run now, and View history only.

## Files changed

**New**

- `archlucid-ui/src/lib/advisory-schedule-form.ts` (+ test)  
- `archlucid-ui/src/lib/advisory-schedule-page-model.ts`  
- `archlucid-ui/src/lib/advisory-schedule-upcoming-preview.ts`  
- `archlucid-ui/src/components/advisory/AdvisoryScheduleCreateForm.tsx`  
- `archlucid-ui/src/components/advisory/AdvisorySchedulesContent.test.tsx`  
- `archlucid-ui/src/app/(operator)/admin/rag-health/_sections/RagHealthAdminPageClient.test.tsx`  
- `docs/architecture/advisory_scan_schedule_page_refinement.md`

**Modified**

- `AdvisorySchedulesContent.tsx`, `CronExpressionBuilder.tsx` (+ test), `AdvisoryHubClient.tsx`  
- `advisory-copy.ts`, `enterprise-controls-context-copy.ts`  
- `SidebarNav.system-administration.test.tsx`  
- `operator-client-pages-render-gate.test.tsx`

## Tests run

| Command | Result |
|---------|--------|
| `npx vitest run` (advisory schedule form/content, cron builder, SidebarNav system-admin, RagHealth unauthorized, operator render-gate) | **61 passed** |
| `npm run typecheck` | **Passed** |
| `eslint` on changed advisory schedule sources | **Passed** |
| `npm run build` (archlucid-ui production) | **Passed** (exit 0) |

## Remaining scheduler limitations

1. No update/pause/resume/delete APIs for advisory schedules.  
2. UTC-only persistence — local wall time can drift across DST.  
3. No multi-project / all-projects schedule scope.  
4. Create/run require AdminAuthority (Execute-only users are read-only in UI).  
5. Recurrence schedules page was not redesigned (cross-link only).  
6. Weekday schedules use UTC `1-5` with a converted hour; near timezone day boundaries edge cases remain inherent to UTC cron.

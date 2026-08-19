# Architecture digest schedule refinement — implementation report

**Date:** 2026-07-23  
**Route:** `/digests?tab=schedule`  
**Scope:** UI refinement of sponsor-digest scheduling only (no digest-generation engine, scheduler service, or email-delivery infrastructure replacement).

## Summary

Refined the Schedule tab into a clear customer workflow for configuring and validating the recurring **sponsor digest**: one activation control, configured-vs-active cadence, delivery-readiness checklist, direct-recipient chips with validation, sample-mode and permission-aware mutations, and honest preview/test guidance that matches backend capabilities.

Browse and Subscriptions were touched only for shared terminology and tab responsibility tooltips.

## Actual digest domain model discovered

Two separate pipelines exist:

| Pipeline | Customer name | Persistence / API | Recipients | Schedule | Content |
|----------|---------------|-------------------|------------|----------|---------|
| Sponsor email digest | **Sponsor digest** | `TenantExecDigestPreferences` via `GET/POST /v1/tenant/exec-digest-preferences` | `recipientEmails` (direct list) | Weekly: IANA zone + day of week + hour | Deterministic weekly rollup of architecture/review activity |
| Architecture digests | **Architecture digests** | Advisory scan + digest subscription destinations | Subscriptions tab destinations | Driven by advisory scan schedules / subscription delivery | Generated from advisory scans (may consume AI budget) |

**Enablement:** `emailEnabled` on exec-digest preferences is the single authoritative switch for sponsor scheduled delivery. There is no separate “schedule enabled” flag.

**Not available (and not invented):**

- Sponsor-digest compose-preview API  
- Sponsor-digest test-send API restricted to “send to me”  
- Deduplication of sponsor direct recipients against subscription destinations (lists are independent)

## Canonical terminology

| Layer | Term |
|-------|------|
| Product area | Architecture digests |
| Scheduled digest type (this tab) | Sponsor digest |
| Direct list on Schedule | Direct recipients |
| Subscriptions tab destinations | Digest subscriptions / subscription destinations |

Relationship copy (accurate to backend):

> An sponsor digest is a weekly rollup of architecture and review activity for sponsor recipients you configure here. Architecture digests generated from advisory scans are delivered separately to destinations on the Subscriptions tab.

Tab responsibilities:

- **Browse:** Read generated architecture digests.  
- **Subscriptions:** Manage who receives architecture digest delivery.  
- **Schedule:** Configure when the sponsor digest is generated and sent to direct recipients.

## Enablement-state correction

**Finding:** The prior UI presented overlapping “Enable digest” / “Send sponsor digest” style controls that mapped to the same `emailEnabled` field (case A — one global enabled state rendered twice).

**Correction:**

- Status: **Active** / **Paused** / **Setup incomplete**  
- Primary state actions: **Enable scheduled delivery** / **Pause scheduled delivery**  
- Schedule persistence: **Save schedule** (does not require enabling delivery)  
- Summary card and form no longer disagree on enablement

## Recipient-model explanation

- **Direct recipients** are free-form email addresses on the Schedule tab; they do **not** need to be workspace users.  
- **Subscription destinations** receive architecture digests after advisory scans; different content and schedule.  
- Lists are **not combined** for the sponsor email.  
- Duplicate addresses within the direct list are rejected in the draft before chips are updated.  
- Recipient summary states both counts and which pipeline each list feeds.  
- Sample / public views mask addresses where the presentation model already supports masking.  
- Managing schedule/recipients requires digest management authority (`ExecuteAuthority` on save); others see a read-only explanation.

## Schedule and time-zone behavior

- Controls: time zone (IANA), day of week, send hour (no cron).  
- Live summary: e.g. “Every Monday at 8:00 AM Eastern.”  
- When paused: configured cadence retained; **Next send** = “Not scheduled while delivery is paused.”  
- Default zone: browser IANA when preferences are unconfigured; UTC is not forced as the customer default.  
- Next-send formatting uses `Intl` (DST-aware) via existing form helpers.  
- UTC remains a selectable zone / secondary detail, not the primary customer framing.

## Preview behavior

- **Preview latest generated digest** links to the latest **architecture digest** in Browse when one exists.  
- It is **not** an sponsor-digest compose preview and does not apply unsaved schedule edits.  
- When none exists: control disabled with  
  “A preview will be available after the first architecture digest is generated.”  
- No “Generate preview” action was added — backend does not support exec-digest preview-without-send.

## Test-send behavior

- No sponsor-digest test-send API exists.  
- Schedule tab action **Generate architecture digest test** routes to `/advisory?tab=schedules` (Admin-gated there).  
- Copy states clearly that it may consume AI budget, targets subscription destinations (not sponsor direct recipients), and does not change the sponsor schedule.  
- Hidden in sample / buyer-polished non-full-shell mode.

## AI-budget implications

- Sponsor digest composition is deterministic — enabling/saving the sponsor schedule does **not** consume AI budget.  
- Architecture digest test/generation via advisory schedules **may** consume AI budget; Schedule tab warns before navigation.  
- Sample workspace cannot trigger that path from this tab.

## Sample-mode behavior

When buyer-polished shell and not full architect workspace:

- Schedule experience is read-only / illustrative for mutations.  
- Save, enable, pause, and recipient edits are disabled.  
- Explains: “Scheduling is unavailable in the sample workspace…” with evaluation / sign-in guidance.  
- Test-generation link is not shown.

## Internal operations visibility findings

- Internal Operations nav remains gated by `isArchLucidInternalOperatorShellEnv` / system-administration nav builders.  
- Ordinary tenant and public sample users must not see that group; server-side authorization still protects `/internal-operations/*`.  
- No digest-schedule change weakened authorization. Regression coverage for Internal Ops nav visibility and unauthorized internal routes remains in existing SidebarNav / RagHealth / render-gate tests from prior work; this change did not reopen those routes.

## Technical information removed

Removed the customer-visible **Technical details** card (schema version, internal version numbers, non-actionable implementation timestamps).

Retained customer-useful **Last schedule update** when preferences include `updatedUtc`.

## Files changed

| Area | Path |
|------|------|
| Schedule UI | `archlucid-ui/src/components/digests/ExecDigestScheduleContent.tsx` |
| Schedule tests | `archlucid-ui/src/components/digests/ExecDigestScheduleContent.test.tsx` |
| Hub tabs / responsibilities | `archlucid-ui/src/components/digests/DigestsHubClient.tsx` |
| Hub tests | `archlucid-ui/src/components/digests/DigestsHubClient.test.tsx` |
| Page model / copy | `archlucid-ui/src/lib/exec-digest-schedule-page-model.ts` |
| Page model tests | `archlucid-ui/src/lib/exec-digest-schedule-page-model.test.ts` |
| Form / TZ helpers | `archlucid-ui/src/lib/exec-digest-schedule-form.ts` |
| Form tests | `archlucid-ui/src/lib/exec-digest-schedule-form.test.ts` |
| Shared digests copy | `archlucid-ui/src/lib/digests-browse-copy.ts` |
| This report | `docs/architecture/architecture_digest_schedule_refinement.md` |

## Tests run

| Command | Result |
|---------|--------|
| `npx vitest run` on exec-digest form/page-model, `ExecDigestScheduleContent`, `DigestsHubClient` | **26 passed** |
| `npm run typecheck` | **Passed** |
| `eslint` on changed digest schedule sources | **Passed** |
| `npm run build` (archlucid-ui production) | **Passed** (exit 0) |

## Remaining digest limitations

1. No sponsor-digest preview-without-send or send-test-to-me API — UI cannot offer a true sponsor test email.  
2. Preview on Schedule points at architecture digests in Browse, not an sponsor compose artifact.  
3. Direct recipients and subscription destinations are never merged or deduplicated across pipelines.  
4. Architecture digest cadence remains on advisory schedules / subscriptions — not this form.  
5. Outbound email readiness is inferred from weekly-digest health setup gaps when available; full provider diagnostics stay out of the customer UI.  
6. Browse / Subscriptions were not redesigned beyond shared terminology and tab titles.

## Constraints honored

- Digest-generation engine unchanged  
- Scheduling service unchanged  
- Email-delivery infrastructure unchanged  
- No unsupported digest types or arbitrary recurrence rules  
- No customer-visible schema metadata  
- Authorization not weakened  

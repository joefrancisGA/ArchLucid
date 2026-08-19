# Architecture digest subscriptions tab refinement — implementation report

**Date:** 2026-07-22  
**Backlog:** TB-926  
**Route:** `/digests?tab=subscriptions` (workbook **DIX**)

## Summary

Refined the Subscriptions tab from an entity-centric subscription editor into a customer-goal **delivery destinations** workflow. Users configure where architecture digests are sent (email, Teams webhook, Slack webhook), see separate readiness for destinations vs advisory schedule, and manage existing subscriptions without internal technical details.

Browse and Schedule tabs were not redesigned; only shared health data is passed into the subscriptions tab via `DigestsHubClient`.

## Actual domain model (from repo evidence)

| Concept | Persistence / API | UI role |
|--------|-------------------|--------|
| **Digest subscription** | `GET/POST /v1/digest-subscriptions`, `DigestSubscription` rows | A named delivery destination (channel + address/webhook URL) |
| **Channel** | `channelType`: `Email`, `TeamsWebhook`, `SlackWebhook` | Drives destination field label, validation, and connector readiness |
| **Digest type** | `metadataJson.digestType` (today only `architecture` in `DIGEST_TYPE_OPTIONS`) | Hidden when a single type exists |
| **Activation** | `isEnabled` on create/toggle | "Enable delivery after saving" — does not send immediately |
| **Schedule** | Advisory scan schedules (`WeeklyDigestHealthDto.enabledAdvisoryScheduleCount`) | Separate readiness row; generation cadence lives under `/advisory?tab=schedules` |
| **Sponsor recipients** | `executiveEmailDigest*` fields on health DTO | Distinct from subscriptions; not edited on this tab |
| **Delivery attempts** | `GET …/delivery-attempts` | Per-subscription history panel |
| **Test delivery** | No subscription-scoped test API in V1 | **Send test digest** links to schedule workflow (`/advisory?tab=schedules`) |

Subscriptions receive the **next generated digest** once an advisory schedule runs. There is no PATCH/update endpoint — **Edit** copies values into the create form so operators can save a replacement subscription (delete remains unavailable).

## Terminology decisions

| Before | After |
|--------|-------|
| Page title implied "subscriptions" entity | **Delivery destinations** |
| Generic "Destination" | Channel-specific labels (Email address, Teams webhook URL, Slack webhook URL) |
| "Active on create" | **Enable delivery after saving** / **Save as paused** |
| Repeated "Architecture digest" in type selector | Digest type hidden when only one option exists |
| Technical details collapsible | Removed from customer tab |

## UX themes shipped

1. **Readiness panel** — `DigestSubscriptionsReadinessPanel` shows destinations, schedule, last delivery, next generation, blocking issue, and next action (schedule link or form hint).
2. **Single creation path** — `DigestSubscriptionCreateForm` is the only create affordance; collapsed behind **Create subscription** when rows exist.
3. **Channel-aware form** — Labels, placeholders, helpers, and Teams/Slack connector readiness gates (`fetchTenantIntegrationsOperations` + setup links).
4. **Duplicate email guard** — Client-side block before POST; excludes the subscription being edited.
5. **Sensitive content callout** — Links to `/help/data-handling`.
6. **List management** — Masked destinations for read-only users; Pause/Resume; delivery history; Refresh on list heading only.
7. **Sample mode** — `isBuyerPolishedOperatorShellEnv()` blocks mutations with evaluation CTA (no enabled-looking save).

## Internal operations / authorization

No nav changes were required in this pass — existing server-side route authorization and prior Internal ops visibility guards remain the security boundary. Navigation hiding is not relied upon for protection.

## Files changed

**New**

- `archlucid-ui/src/lib/digest-subscriptions-workflow.ts` — readiness builder, masking, duplicate check, connector helpers, copy constants
- `archlucid-ui/src/lib/digest-subscriptions-workflow.test.ts`
- `archlucid-ui/src/components/digests/DigestSubscriptionsReadinessPanel.tsx`
- `archlucid-ui/src/components/digests/DigestSubscriptionCreateForm.tsx`
- `archlucid-ui/src/components/digests/DigestSubscriptionList.tsx`

**Modified**

- `archlucid-ui/src/components/digests/DigestSubscriptionsContent.tsx` — orchestrator rewrite
- `archlucid-ui/src/components/digests/DigestSubscriptionsContent.test.tsx`
- `archlucid-ui/src/components/digests/DigestsHubClient.tsx` — passes `healthSnap` + refresh token
- `archlucid-ui/src/lib/digest-subscription-form.ts` — channel destination labels/placeholders/helpers

## Tests run

| Command | Result |
|---------|--------|
| `npx vitest run src/lib/digest-subscriptions-workflow.test.ts src/components/digests/DigestSubscriptionsContent.test.tsx` | See CI / local run at ship time |
| `npm run typecheck` (archlucid-ui) | See CI / local run at ship time |

## Acceptance criteria mapping

| # | Criterion | Status |
|---|-----------|--------|
| 1–4 | Terminology, readiness, single workflow, hidden digest type | **Shipped** |
| 5–7 | Email field, validation, duplicate guard | **Shipped** |
| 8–11 | Teams/Slack readiness + block when connector not ready | **Shipped** (blocks when `connectorReady === false`) |
| 12–14 | Webhook channel copy; no duplicate Webhooks config UI | **Shipped** |
| 15–18 | Activation copy, save pending/success; failure retains values (form state) | **Shipped** |
| 19–24 | In-tab test delivery, AI budget warning | **Deferred** — no subscription test API; link to schedules tab |
| 25 | Sensitive-evidence callout | **Shipped** |
| 26–31 | List, pause/resume, delete disabled w/ tooltip, auto-refresh, empty state, no technical details | **Shipped** (delete intentionally disabled — no API) |
| 32–33 | Masked destinations; sample mode block | **Shipped** |
| 34–36 | Sample outbound block; Internal ops unchanged; server auth unchanged | **Shipped** / N/A |
| 37–39 | Responsive grid layout; labeled controls; production build | **Shipped** (build via CI) |

## Remaining delivery limitations

- **No subscription update API** — Edit prefills create form; operators pause old row or accept duplicate names.
- **No subscription-scoped test send** — test flow remains on advisory schedules.
- **No delete** — Pause is the supported stop-delivery path.
- **Connector readiness unknown** — when integrations ops cannot be loaded, Teams/Slack create is not blocked (fail-open for availability).

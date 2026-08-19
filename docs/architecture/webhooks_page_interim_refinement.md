# Webhooks page interim refinement

**Route:** `/integrations/webhooks`  
**Date:** 2026-07-13  
**Scope:** Bounded page polish — copy, form hierarchy, discoverability, async feedback, and tests. No integration IA redesign, no Azure Boards, no delivery-engine changes.

## Files changed

| Path | Change |
|------|--------|
| `archlucid-ui/src/app/(operator)/integrations/webhooks/WebhooksSettingsClient.tsx` | Page layout, buyer-safe copy, grouped form, async save/test feedback, masked destinations, duplicate-save guard |
| `archlucid-ui/src/app/(operator)/integrations/webhooks/WebhooksAboutPanel.tsx` | **New** — compact About webhooks side panel |
| `archlucid-ui/src/app/(operator)/integrations/webhooks/page.test.tsx` | Expanded coverage (nav, copy, validation, async states, permissions, a11y labels) |
| `archlucid-ui/src/lib/webhooks-surface-icon.ts` | **New** — shared `WEBHOOKS_SURFACE_ICON` (lucide `Webhook`) |
| `archlucid-ui/src/lib/webhooks-page-copy.ts` | **New** — centralized page/nav copy and banned internal patterns |
| `archlucid-ui/src/lib/webhooks-destination-present.ts` | **New** — hostname-safe destination labels |
| `archlucid-ui/src/lib/webhooks-destination-present.test.ts` | **New** — destination masking tests |
| `archlucid-ui/src/lib/webhooks-page-error-present.ts` | **New** — customer-safe error sanitization |
| `archlucid-ui/src/lib/webhook-settings-form-schema.ts` | Validation messages; default name `""`; event catalog labels |
| `archlucid-ui/src/lib/webhook-subscription-connection-test.ts` | “Test event” toast copy |
| `archlucid-ui/src/lib/operate-integrations-nav-group-builder.ts` | Webhooks nav tier `extended`; shared icon |
| `archlucid-ui/src/lib/operate-integrations-nav-group-builder.test.ts` | Nav order, icon, tier assertions |

## Discoverability change

Webhooks was already registered in `OperateIntegrationsNavGroupBuilder` but at **`tier: "advanced"`**, which hid it behind a deeper disclosure than Jira, ServiceNow, Teams, and Slack.

**Change:** moved Webhooks to **`tier: "extended"`** (same as other product integrations) and kept it **after Slack** in link order. No new nested navigation. `requiredAuthority: "ExecuteAuthority"` unchanged — nav visibility still follows existing permission-aware rules.

## Icon handling

- Added `WEBHOOKS_SURFACE_ICON` in `webhooks-surface-icon.ts`.
- Used for both Integrations nav item and page heading (`WebhooksSettingsClient` header).
- Icon is `aria-hidden` beside the title; not duplicated with a different glyph.

## Terminology changes

| Before (examples) | After |
|-------------------|-------|
| Generic webhooks / product-specific notification setup | Customer intro + dedicated-integration cross-links |
| Webhook URL | **Destination URL** |
| Minimum alert severity | **Send alerts at or above** (alert events only) |
| Provider template (visible) | Removed from form — only `OnCallWebhook` is supported |
| Synthetic ping | **Send test event** / **Test event delivered** |
| Save (generic) | **Save subscription** / **Saving subscription…** |

Consistent label **Webhooks** across nav (`OPERATOR_NAV_LINK_LABELS.webhooks`), breadcrumb (`breadcrumb-map.ts`), route metadata (`page.tsx` title), and page heading.

## Dedicated-integration references

Cross-links shown when repository routes exist:

- **Jira** → `/integrations/jira` (work-management records)
- **ServiceNow** → `/integrations/servicenow` (service-management records)
- **Microsoft Teams** → `/integrations/teams` (collaboration notifications)
- **Slack** → `/integrations/slack` (collaboration notifications)

Copy states that webhooks send events to **another HTTPS endpoint** the customer operates. It does **not** imply Jira/ServiceNow/Teams/Slack consume generic webhook subscriptions from this page.

## Backend capabilities found

| Capability | API / behavior | UI treatment |
|------------|----------------|--------------|
| List subscriptions | `listAlertRoutingSubscriptions` | Active subscriptions list; auto-refresh after save/toggle |
| Create subscription | `createAlertRoutingSubscription` | New subscription form; secret in `metadataJson` |
| Enable / disable | `toggleAlertRoutingSubscription` | Enable / Disable per row |
| Test delivery | `POST /v1/webhooks/subscriptions/{id}/test` via `testWebhookSubscription` | **Save required first**; “Send test event” on saved rows only |
| Events | Alert lifecycle only: `archlucid.alert.recorded`, `.acknowledged`, `.resolved` | Checkbox list with customer labels; technical id in disclosure |
| Channel | `OnCallWebhook` for generic outbound | Other channel types filtered from this page’s list |
| Severity filter | `minimumSeverity` on subscription | Shown only when selected events are all `archlucid.alert.*` |
| Delivery history | `lastDeliveredUtc` on subscription DTO | Shown when present; otherwise em dash |
| Signing secret | Stored in metadata; never re-fetched for display | One-time entry; “Stored — copy is not shown” on cards |

## Unsupported functionality deliberately omitted

No UI for capabilities without a working client/API path in this workspace:

- Edit subscription (destination, events, secret rotation)
- Delete subscription
- Pause/resume distinct from enable/disable
- Payload format selector (only `OnCallWebhook` tested/supported)
- Pre-save destination test
- Latest failure / latest connection test timestamps (not on current DTO)
- Broad non-alert event platform

## Missing documentation

No in-repo help slug or product doc link for **outbound webhook payload schema** or **signature verification** was found. The About panel describes verification in prose only; **no link was fabricated**.

## Tests run

```text
npx vitest run \
  'src/app/(operator)/integrations/webhooks/page.test.tsx' \
  src/lib/operate-integrations-nav-group-builder.test.ts \
  src/lib/webhooks-destination-present.test.ts
```

```text
npm run typecheck   # archlucid-ui
npx eslint          # scoped webhooks-related paths
```

## Test results

| Suite | Result |
|-------|--------|
| `page.test.tsx` | **17 passed** — nav/icon, breadcrumb/title, dedicated links, banned copy, validation (required/HTTPS/secret/events), severity visibility, secret not redisplayed, duplicate save guard, duplicate name, empty state, masked destination, test success/failure, save failure sanitization, execute-capability gate, test pending label, field labels |
| `operate-integrations-nav-group-builder.test.ts` | **5 passed** |
| `webhooks-destination-present.test.ts` | **2 passed** |
| **Total** | **24 passed** |
| `npm run typecheck` | **Passed** |
| ESLint (scoped) | **Passed** (after removing unused import) |

## Remaining limitations

1. **Signature verification docs** — not linked; add a help topic when published.
2. **Subscription lifecycle** — no edit/delete/rotate in API surface used by this page.
3. **Delivery observability** — only `lastDeliveredUtc`; no failure history or retry UI.
4. **Responsive / axe** — covered via label association and layout classes; no dedicated axe snapshot added in this bounded pass.
5. **Full `next build`** — not run in this pass; `tsc --noEmit` typecheck validates compile-time safety for changed modules.

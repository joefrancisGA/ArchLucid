# SN-03 — Shared admin, auth, account, and integration copy

**Do not** globally replace `ArchLucid`. **Do not** rename `X-ArchLucid-Webhook-Signature` or SAML ACS **paths**. **Do not** change Architecture-only admin (model governance, AI usage, recycle bin). **Do not** rewrite help markdown pipeline (SN-04) or Trust Center legal entity (SN-06).

Depends on **SN-01**. If the display-name helper is missing, stop.

## Goal

Shared routes that **are** in the Security catalog (`product-line-catalog.ts` `both` + always-allowed `/account` `/auth` `/help` prefixes) use **SecureNow** when the Security product line is active, and **ArchLucid** when Architecture is active.

Protocol names shown in advanced disclosures (header `X-ArchLucid-Webhook-Signature`, config paths `ArchLucidAuth:` in internal diagnostics) stay as protocol/config identifiers. Consumer sentences around them use the display name (“Every delivery carries an HMAC signature header (`X-ArchLucid-Webhook-Signature`). SecureNow stores the secret…”).

## Why

Security consumers land on identity, webhooks, support, account security, and branding. Those strings currently say ArchLucid even after chrome is renamed.

## Context (edit copy modules; interpolate display name)

Auth / account / 403 leftovers not done in SN-01:

- `archlucid-ui/src/lib/account-security-page-copy.ts`
- `archlucid-ui/src/lib/auth-domains-page-copy.ts`
- `archlucid-ui/src/lib/oidc/oauth-callback-messages.ts`
- `archlucid-ui/src/lib/auth/post-auth-bootstrap-denial-copy.ts`
- `archlucid-ui/src/lib/workspace-switcher-teaching.ts`
- `archlucid-ui/src/app/(operator)/account/preferences/_sections/PreferencesSettingsPageView.tsx` — “Choose how ArchLucid appears”
- `archlucid-ui/src/components/operator/OperatorJwtBearerRoleMappingCallout.tsx`
- `archlucid-ui/src/components/ui/welcome-modal.tsx` / onboarding tour “Welcome to ArchLucid” **only if** those surfaces render in the Security shell; otherwise skip

Identity / SSO (Security catalog):

- `archlucid-ui/src/lib/identity-providers-settings-copy.ts` — “ArchLucid service provider values”, “ArchLucid workspace roles”, “ArchLucid entity ID (SP)” → display-name interpolations
- `archlucid-ui/src/lib/sso-wizard-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/identity-providers/_sections/ArchLucidSamlSpValuesCard.tsx` — **keep the component filename**; change visible title only
- `archlucid-ui/src/app/(operator)/administration/identity-providers/_sections/AuthTokenTestMappingCard.tsx`
- `archlucid-ui/src/app/(operator)/administration/identity-providers/_sections/diagnostics-settings-page-copy.ts`
- Do **not** rename `ArchLucidAuth:` keys in internal diagnostic tables; buyer-polished mode already hides them

Integrations:

- `archlucid-ui/src/lib/webhooks-page-copy.ts` — product sentences; keep `WEBHOOKS_SIGNATURE_HEADER_NAME = "X-ArchLucid-Webhook-Signature"`
- `archlucid-ui/src/lib/webhooks-integration-help-guide-content.ts`
- `archlucid-ui/src/lib/jira-integration-help-guide-content.ts`
- `archlucid-ui/src/lib/azure-boards-help-evidence-copy.ts`
- `archlucid-ui/src/app/(operator)/integrations/azure-boards/page.tsx` metadata `Azure Boards · ArchLucid` → title helper
- `archlucid-ui/src/lib/layer-guidance.ts` only rows visible in Security nav

Admin:

- `archlucid-ui/src/app/(operator)/administration/support/_sections/admin-support-page-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/api-keys/_sections/ApiKeysSettingsPageClient.tsx` — “will not show it again”
- SCIM copy that names the product
- Branding “Revert to ArchLucid defaults” if not finished in SN-01

Audit UI actor **display** of API strings “ArchLucid system” / “ArchLucid Automation”: if the Security audit page shows those, map to “SecureNow system” **in the UI only** (`audit-ui-helpers.ts`). Do not rewrite stored event payloads or `com.archlucid.*` event types.

## What to build

1. Thread `productLineDisplayName(resolveProductLineId())` (or env on RSC) through the copy modules above.
2. Keep protocol constants. Add a short helper line next to webhook signature copy if needed so consumers still see the real header name.
3. Vitest for each copy module you change + existing page tests/snapshots.

## Acceptance criteria

- With `NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`, identity/webhooks/account/support sentences say SecureNow.
- Same modules under architecture env still say ArchLucid.
- `X-ArchLucid-Webhook-Signature` string constant unchanged.
- SAML ACS path unchanged. Card **title** uses display name.
- No privacy/DPA/subprocessor legal-name edits (SN-06 / SN-08).

## Constraints

- Do not rename files `ArchLucidSamlSpValuesCard.tsx`. Visible copy only.
- Stage named copy + tests. Scoped Vitest. No full `npm test`.

# 72. UI BFF proxy session

Working GA (LK-06 P2) stores OIDC access, refresh, and id tokens **only** in the HttpOnly BFF session cookie (`archlucid-bff-session`). `sessionStorage` holds expiry and non-sensitive display/subject hints — not token material.

The Next BFF proxy (`/api/proxy/*`) resolves upstream auth in this order:

1. HttpOnly BFF session cookie (Working browser same-origin default).
2. Browser `Authorization` header (CLI / non-browser migration path only).
3. Server `ARCHLUCID_PROXY_BEARER_TOKEN` or API key fallback.

Marketing paths strip privileged upstream auth so anonymous funnels never inherit operator credentials.

**Signing secret:** `ARCHLUCID_BFF_SESSION_SIGNING_SECRET` (local/dev) or Key Vault secret `bff-session-signing-key` (Terraform: `infra/terraform-keyvault/bff_session_signing_secret.tf`).

**Routes:**

- `POST` / `DELETE` `/api/auth/bff-session` — issue / clear cookie on sign-in / sign-out
- `POST` `/api/auth/bff-session/refresh` — server-side refresh using cookie-held refresh token
- `POST` `/api/auth/bff-session/activity` — slide server idle activity (presenter / print keepalive)
- `GET` `/api/auth/bff-session/rp-logout-url` — OIDC RP-initiated logout URL (`id_token_hint`)

**LK-07 operations:**

- Server-enforced idle: 4h Working (`wm=1`) / 1h Guided (`wm=0`) via signed `la` last-activity timestamp in the cookie.
- CSRF: readable `archlucid-bff-csrf` cookie plus required `X-Archlucid-Bff-Csrf` header on mutating `/api/proxy` calls.
- Client `SessionIdleTimeoutGuard` remains UX; BFF idle is authoritative for API auth.

![UI BFF proxy session](../architecture_diagrams/archlucid-ui-bff-proxy-session.svg)

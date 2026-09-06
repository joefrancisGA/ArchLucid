> **Scope:** ADR 0059 — Plan to move SPA Bearer tokens out of `sessionStorage` toward BFF / HttpOnly cookies for public GA.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0059: SPA BFF / HttpOnly session plan (GA hardening)

**Status:** Accepted (P1 dual-mode shipped in repo; P2 removes client `sessionStorage` Bearer — LK-06)  
**Date:** 2026-07-18  
**Deciders:** Owner + Architecture review  
**Related:** Customer identity security assessment (H-10), `.local/owner/public_self_service_identity_gate.md`, ADR 0015 (trial auth)

## Implementation (2026-09-06 — LK-05 P1)

- **Next BFF cookie:** `archlucid-bff-session` — HttpOnly, Secure (production), SameSite=Lax; HMAC-signed payload using `ARCHLUCID_BFF_SESSION_SIGNING_SECRET` (Key Vault secret `bff-session-signing-key` via `infra/terraform-keyvault`).
- **Dual-mode proxy:** `buildProxyUpstreamHeaders` forwards browser `Authorization: Bearer` when present; otherwise resolves Bearer from the BFF session cookie (`archlucid-ui/src/lib/proxy/bff-session-cookie.ts`).
- **Issue / clear:** `POST` / `DELETE` `/api/auth/bff-session`; `persistTokenResponse` mirrors tokens into the cookie while `sessionStorage` Bearer remains until **LK-06**.
- **Residual:** XSS can still read `sessionStorage` access tokens in P1; CSRF hardening on mutating proxy routes is **LK-07**.

## Context

The architect workspace stores ArchLucid-issued access tokens in `sessionStorage` and sends them as `Authorization: Bearer` via the Next.js API proxy. This is acceptable for **controlled enterprise beta** and **invite-only trial**, but for **public self-service / GA** any XSS becomes full session theft. Idle timeout is also client-enforced only.

## Decision

1. **Near term (pre–public self-service):** keep Bearer + `sessionStorage`; keep access token TTL short; AuthVersion fail-closed for ArchLucid JWTs; document residual in the identity gate.
2. **GA target:** introduce a **Backend-for-Frontend (BFF)** session:
   - Browser holds an **HttpOnly, Secure, SameSite** session cookie issued by the Next.js (or dedicated) BFF.
   - Access tokens (and refresh, if any) stay **server-side** (encrypted cookie chunk or server session store).
   - UI calls same-origin `/api/proxy/*` only; no token readable from JS.
3. **Migration phases:**
   - **P0:** Document residual + shorten ArchLucid JWT TTL in staging/prod config.
   - **P1:** Dual-mode proxy: accept cookie session **or** Bearer (Bearer deprecated).
   - **P2:** Remove client `persistTokenResponse` / `sessionStorage` token path for GA builds.
4. **Non-goals for this ADR:** replacing Entra/Google IdP cookies; changing SAML ACS cookies; implementing refresh-token rotation design beyond “BFF owns refresh.”

## Consequences

- **Security:** XSS no longer exfiltrates Bearer; CSRF must be addressed (SameSite + anti-forgery on mutating proxy routes).
- **Scalability:** Server session store or encrypted cookie size limits; sticky sessions not required if cookie is self-contained/encrypted.
- **Reliability:** Session recovery UX must clear BFF cookie and re-auth cleanly.
- **Cost:** Extra engineering on Next proxy + session encryption keys in Key Vault; modest runtime cost vs XSS blast radius reduction.

## Trade-offs

| Option | Pros | Cons |
|--------|------|------|
| A. Keep SPA Bearer (status quo) | Simple; shipped | XSS = account takeover |
| B. BFF HttpOnly (this ADR) | Industry default for SPA+API | CSRF + session store complexity |
| C. Silent iframe / token broker | Familiar to Entra apps | Still JS-accessible tokens unless carefully designed |

**Chosen:** B for GA; A until public self-service gate goes GREEN on other P0s.

## Constraints

- Must preserve JwtBearer API for non-browser clients (CLI, integrations).
- Must not break invite-only / controlled beta before dual-mode ships.
- Terraform/Key Vault must represent session encryption keys (IaC).

## Expected impact

- Unblocks identity-gate High residual H-10 for public GA.
- No change to Controlled Beta / Invite-only GREEN posture until P2 forces cookie-only.

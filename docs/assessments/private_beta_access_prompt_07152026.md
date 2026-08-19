# Private-beta access-path assessment prompt (2026-07-15)

Perform a **private-beta access-path blocker assessment** of ArchLucid. This is **not** a general release-readiness, UX, or product assessment. The only question this assessment answers is:

> **Can an invited private-beta user reliably get from invitation to their first meaningful action, and recover when expected failures occur?**

## Mission

Prove — with reproduced evidence, not code reading alone — that an invited user can:

1. **Receive and use an invitation**
2. **Authenticate successfully**
3. **Enter the correct tenant/workspace**
4. **Reach the core workflows**
5. **Complete the first meaningful action** (create/start a review via `/reviews/new` and see it in `/reviews`)
6. **Recover from expected failures** (expired session, wrong tenant, missing role, dead link, expired invite)

Anything that does not block one of these six proofs is **out of scope**.

## Hard scope exclusions

Do **not** report, score, or generate backlog items for:

- Visual polish, layout, spacing, theming, or component styling
- Copy improvements, tone, terminology, or microcopy
- Feature requests or capability gaps unrelated to access
- Broad information-architecture or navigation-redesign work
- Performance tuning, cost, scalability, or observability improvements (unless a failure directly blocks the six proofs)
- Marketing/trial funnel pages (`/welcome`, `/try`, `/signup`, `/pricing`, etc.) except where they intercept an invited user's path into the architect workspace
- GTM rows M-90/M-44/M-91/M-92 must not resurface here in any form

If you notice a non-blocker issue while testing, put it in a single unranked appendix list ("Observed, out of scope") with one line each. No prompts, no priorities, no elaboration.

## Operating rules

- Work from the current repo state and live local environment only. No prior assessments, no historical scores.
- Do not use subagents or parallel agents.
- Do not interrupt to ask questions; collect blockers you cannot resolve in a "Blocked scenarios" section with the exact missing input.
- **A P0 must be confirmed, not inferred.** Confirmed means: you reproduced the failure (test run, HTTP call, or UI walkthrough) or you traced a hard contradiction in code (e.g., a UI call to an endpoint that provably does not exist in any controller or the OpenAPI contract). "Looks risky" or "might fail" is not P0 — put it under "Unconfirmed risks" with the exact experiment that would confirm it.
- Prefer running the existing live e2e infrastructure over writing throwaway scripts: `archlucid-ui` → `npm run test:e2e:live` (specs `archlucid-ui/e2e/live-api-*.spec.ts`), mock config via `npm run test:e2e`. Reference `docs/library/LIVE_E2E_HAPPY_PATH.md`, `LIVE_E2E_JWT_SETUP.md`, and `LIVE_E2E_AUTH_ASSUMPTIONS.md` for environment assumptions.
- Distinguish the three auth modes (`ApiKey`, `DevelopmentBypass`, `JwtBearer` per `CONFIGURATION_REFERENCE.md`) in every finding. A path that only works under `DevelopmentBypass` is **not proven** for private beta.

## Known repo facts (verify, do not assume)

Use these as starting hypotheses. Each must be re-verified against current state before it appears in a finding:

- Invite UI exists at `/settings/users/invite-reviewer` (`archlucid-ui/src/app/(operator)/settings/users/invite-reviewer/`, flow constants in `src/lib/invite-reviewer-flow.ts`), posting to `POST /api/proxy/v1/admin/users/invite`. As of the last repo scan, **no backend controller or OpenAPI entry serves this endpoint**, and the UI degrades 404/405/501 to a "preview-only" state. If still true, that is a candidate P0: the invitation step of the access path has no working implementation, and the de facto provisioning paths are SCIM (`ScimUsersController`, `/settings/scim-provisioning`) and IdP role claims.
- Authentication is custom browser OIDC with PKCE (`archlucid-ui/src/lib/oidc/`), not NextAuth. Key routes: `/auth/signin`, `/auth/callback`, `/auth/session-expired`, `/login` (shim), `/403` (signed-in, no recognized role).
- Canonical roles: `ArchLucid.Core/Authorization/ArchLucidRoles.cs` (Reader, Operator, Architect, ProjectAdmin, Reviewer, WorkspaceAdmin, Admin, Sponsor, PlatformOperator, Auditor). Policies in `ArchLucidPolicies.cs`; claims transformation in `ArchLucidRoleClaimsTransformation.cs`. The UI principal model is narrower (Admin | Operator | Reader | Auditor) — verify the mismatch does not strand a validly-provisioned backend role at `/403` or in a broken nav state.
- Tenant/workspace/project scope: `HttpScopeContextProvider.cs` (JWT claims override `x-tenant-id`/`x-workspace-id`/`x-project-id` headers), `ScopeIdentityBindingMiddleware.cs` (claim/header mismatch → 403), `ScopeResolutionGuardMiddleware.cs`, UI proxy at `archlucid-ui/src/app/api/proxy/[...path]/route.ts` with `proxy-scope-resolution.ts`, and `ScopeSwitcher.tsx`.
- First meaningful action: home → `/reviews/new` → review visible in `/reviews` (pilot spine in `e2e/live-api-core-pilot-path.spec.ts`).

## Assessment sections (execute in order)

### 1. Invitation scenarios

Test every way a private-beta user can be provisioned and told to show up:

- Admin sends invite from `/settings/users/invite-reviewer` for each assignable role (Admin, Operator, Reader, Auditor): what actually happens end to end? Does an email/token/accept link exist anywhere, or does the flow silently terminate?
- SCIM provisioning as the invite substitute: can an operator actually provision a beta user via `ScimUsersController` today, and what manual steps remain?
- Invite to an email that already has an account; invite with an invalid email; re-invite after a prior invite; invite by a non-admin role (must be denied).
- If token-based invites exist: expired token, reused token, token for a deleted tenant.
- **Deliverable:** a truthful statement of what the working invitation mechanism for private beta actually is (email invite, SCIM, IdP assignment, or manual), and a P0 for each gap that leaves an invited user with no way in.

### 2. Authentication and SSO

- Fresh OIDC sign-in via `/auth/signin` → IdP → `/auth/callback` for a provisioned user: prove it completes into the architect workspace under `JwtBearer` mode (Entra and/or generic OIDC authority).
- Callback failure modes: denied consent, state mismatch, clock-skewed/expired token, IdP error response — each must land on an actionable screen, not a blank page or loop.
- Session expiry: idle timeout → `/auth/session-expired` → re-sign-in returns the user to a working state (verify the post-re-auth landing).
- SSO configuration surfaces (`/settings/identity-providers` incl. `oidc`, `saml`, `role-mapping`, `diagnostics`; `/settings/identity/sso-wizard`): only test that a **misconfigured or half-configured IdP cannot lock every user out of the tenant** and that diagnostics identify the failure. Configuration UX quality is out of scope.
- SAML coexistence (`ArchLucidSaml2*`): confirm enabling it does not break the OIDC path.

### 3. Authorization and role testing

- For each canonical backend role, sign in and verify: (a) the user lands somewhere valid (not `/403`, unless the role legitimately has no operator access), (b) nav and API access match the role's policies (`ReadAuthority`, `ExecuteAuthority`, `AdminAuthority`, `RequireAuditor`), (c) the UI's four-role principal model does not misrender or block the six backend-only roles (Architect, ProjectAdmin, Reviewer, WorkspaceAdmin, Sponsor, PlatformOperator).
- A user with **no** recognized role reaches `/403` with a recovery path (who to contact / how to re-request access), not a dead end.
- Role changes mid-session (e.g., `PUT /v1/admin/users/{id}/role` if it exists): verify the change takes effect without stranding the session; if the endpoint is preview-only like the invite endpoint, record that as a finding under section 1's provisioning story, not a new P0.
- Confirm the API is authoritative: attempt privileged API calls with an under-privileged token (UI shaping must not be the only guard).

### 4. Routing and deep-link validation

- Deep-link every route an invited user will plausibly be sent in a beta email or Slack message while **signed out**: `/reviews`, `/reviews/[runId]`, `/reviews/new`, `/dashboard`, `/governance/findings`, `/onboarding`. Each must round-trip through sign-in and return to the original target (or a documented landing) — not `/welcome`, not a loop, not a 404.
- Legacy/shim routes: `/login` → `/auth/signin` (or `/auth/session-expired` when `reason=idle-timeout`), `/getting-started` → `/onboarding`. Verify redirects preserve intent.
- Signed-in deep links to resources in a **different** tenant (see section 5) and to nonexistent IDs (`/reviews/does-not-exist`): correct 403/404 experience with a way back.
- Verify the home gate (`OperatorHomeGate.tsx`) does not misroute a signed-in-but-slow-token user to marketing pages.

### 5. Tenant/workspace isolation

- Two-tenant test: provision users in tenants A and B. Prove user A cannot read or mutate B's reviews, findings, or settings via UI, deep link, or direct API call with forged `x-tenant-id`/`x-workspace-id` headers (claims must win per `HttpScopeContextProvider`; mismatch must 403 per `ScopeIdentityBindingMiddleware`).
- Verify the UI proxy (`api/proxy/[...path]`) cannot be induced to forward attacker-chosen scope headers.
- `ScopeSwitcher` correctness: switching workspace/project updates all subsequent data; no stale cross-scope data bleed after a switch.
- A user invited to tenant A who also exists in tenant B lands in the intended tenant on first sign-in.

### 6. Failure-state testing

For each, the bar is: the user understands what happened and has a working next step.

- API backend down or returning 5xx during sign-in, during `/reviews` load, and during review creation.
- Expired/revoked session mid-action (e.g., mid-form on `/reviews/new`) — is entered work communicated as lost or preserved?
- Invite/provisioning failure states from section 1 (expired, revoked, already-accepted).
- Browser refresh on `/auth/callback`; back-button after sign-in; two tabs with one signed-out.
- Reference and extend existing coverage: `live-api-error-states.spec.ts`, `live-api-negative-paths.spec.ts`.

### 7. Security validation (access path only)

Scope strictly to the beta access path — this is not a full pen test (TB-005 owns that; TB-135/136 stay parked):

- Token handling: PKCE verifier and tokens in sessionStorage — confirm no token leaks to URLs, logs, or non-proxy requests.
- Session fixation on the OIDC flow; `state`/`nonce` validation on `/auth/callback`.
- Authorization bypass attempts from sections 3 and 5 (privilege escalation via headers, role tampering in the UI principal, direct API calls).
- Invite/SCIM endpoints: unauthenticated and cross-tenant access attempts must fail closed.
- `DevelopmentBypass` mode must be provably unreachable in the beta deployment configuration.

### 8. Regression testing

- Run the existing release-gate live suite (`ui-e2e-live` per `.github/workflows/ci.yml`) and the auth specs (`live-api-jwt-auth.spec.ts`, `live-api-apikey-auth.spec.ts`, `live-api-auth-parity-spine.spec.ts`) against the current build. Report pass/fail with output.
- Identify which of the six proofs have **zero** automated coverage today (last scan: no browser-level OIDC login smoke and no invite-flow test exist). Each uncovered proof that a P0 fix will touch gets a companion test task inside that P0's backlog item — not as a separate "improve testing" item.
- Run the Schemathesis light profile against auth/admin/invite/SCIM endpoints if the contract covers them; note contract gaps (e.g., invite endpoint absent from OpenAPI).

### 9. Implementation-ready P0 backlog generation

Produce backlog items **only** for confirmed P0s — failures that block one of the six proofs for a real invited user under beta auth modes. For each:

- **Title** and the proof step it blocks (1–6)
- **Evidence:** the exact reproduction (command, spec run, HTTP trace, or file-level contradiction with paths)
- **A complete Cursor implementation prompt:** likely files/modules/routes, acceptance criteria, constraints, what not to change, and how to verify (including the companion e2e test from section 8)
- **Auth-mode matrix:** which of ApiKey/JwtBearer the fix must be proven under
- Keep each item independently shippable; do not batch unrelated auth-critical changes into one prompt

Do not pad the list. Zero confirmed P0s is a valid outcome; unconfirmed risks go in their own section with the confirming experiment, no prompts.

### 10. Final end-to-end private-beta smoke test

Define (and where the infrastructure allows, implement as a live Playwright spec, e.g. `e2e/live-api-private-beta-access.spec.ts`) the single canonical smoke test that must pass before any invite is sent:

1. Provision/invite a fresh user into a fresh or clean tenant (whatever section 1 proved is the real mechanism)
2. Sign in via the real beta auth mode (JwtBearer OIDC — not DevBypass)
3. Land in the correct tenant/workspace
4. Navigate to `/reviews/new` and create a review
5. See the review in `/reviews` and open it
6. Expire the session, recover via `/auth/session-expired`, and confirm the review is still reachable
7. Verify a deep link to that review from a signed-out browser round-trips through auth

State explicitly which steps are automated, which are manual, and which are currently impossible (each impossible step must map to a P0 from section 9).

## Report format

1. **Verdict:** one of `READY` (all six proofs pass under beta auth modes), `BLOCKED` (list which proofs fail), or `PARTIALLY PROVEN` (list which proofs passed only under non-beta modes or manually)
2. **Proof table:** the six proofs × (status, evidence, auth mode proven under)
3. **Confirmed P0 backlog** (section 9 format)
4. **Unconfirmed risks** (with confirming experiments)
5. **Blocked scenarios** (missing input/environment, exactly what is needed)
6. **Smoke test definition** (section 10)
7. **Observed, out of scope** (one-line appendix, no prompts)

Persist the report to `docs/assessments/latest_beta_access_YYYYMMDDHHMM.md` (EST, 24-hour) — this matches the gitignored `latest_*.md` pattern; do not commit it.

## Sequencing note

Run this assessment **before** any broader beta-readiness or release-readiness review. Until the P0 access path is dependable, findings from wider assessments are unactionable for the beta cohort; once this passes, expand into the standard weighted assessment (`new_prompt_06142026.md`) for the broader readiness picture.

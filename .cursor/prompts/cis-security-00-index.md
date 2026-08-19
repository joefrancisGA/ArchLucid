# Customer identity security — remaining launch blockers (prompt index)

**Source assessment:** `.local/owner/customer_identity_security_assessment.md` (2026-07-17)  
**Companion gate:** `.local/owner/public_self_service_identity_gate.md`  
**Prior batch:** [`.cursor/prompts/pss-identity-00-index.md`](pss-identity-00-index.md) (PSS-01…07 — mostly shipped)  
**Goal:** Close open **H-05**, **H-06**, **M-01**, and execute **E1** so public self-service can leave **RED** (at best → YELLOW after E1–E5; never GREEN without E6–E10).

**Do not** flip `Auth:PublicSignup:Mode` to `PublicSelfService` or enable `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` in these prompts.

## Sequence

Run in order. Each engineering step must leave compile/tests green for its scope before the next starts. Step 4 is owner/ops execution (agent prepares artifacts only unless owner directs a live staging run).

| Step | Prompt | Closes | Finding / Evidence |
|------|--------|--------|--------------------|
| 1 | [`cis-security-01-bot-challenge-verifier.md`](cis-security-01-bot-challenge-verifier.md) | Real CAPTCHA/Turnstile verifier | **H-05** / E1 enabler |
| 2 | [`cis-security-02-session-revocation.md`](cis-security-02-session-revocation.md) | Server-side token invalidation after identity removal | **H-06** |
| 3 | [`cis-security-03-hash-pepper-production.md`](cis-security-03-hash-pepper-production.md) | OTP hash pepper required in prod-like hosts | **M-01** |
| 4 | [`cis-security-04-otp-abuse-drill-execution.md`](cis-security-04-otp-abuse-drill-execution.md) | Measured OTP flood drill record | **E1** (OTP half) |

Optional follow-ons (not in this batch unless owner directs):

- Per-tenant SSO initiation vs host OIDC (**M-04**) — architecture decision  
- SSO + recovery live drill (**E3**) — `docs/runbooks/PLATFORM_IDENTITY_SUPPORT.md` (§ SSO enforcement and recovery drill)  
- Consumer-domain / ClientIp abuse options (**M-06**) — `pss-identity-02` residual  
- Billing return-URL allowlist (**M-07**)  

## Guardrails (every step)

1. Prefer reuse of existing `IEmailOtpBotChallengeVerifier`, `EmailOtpAuthOptions`, JWT/auth middleware, and audit types — do not invent a parallel auth stack.
2. Customer-facing errors stay buyer-safe (neutral OTP messages; no stack traces, SQL, or IdP payloads).
3. Tenant isolation per ADR 0037 — do not add SQL RLS; do not weaken scope binding.
4. One class per file; SQL DDL only via numbered migrations pattern already used.
5. Prefer concrete types over `var`; blank line before `if`/`foreach` unless first line in method; null checks.
6. Do not implement TB-135/TB-136 or GTM cohort rows M-90/M-44/M-91/M-92.
7. After each step: update `.local/owner/customer_identity_security_assessment.md` (finding status) and `.local/owner/public_self_service_identity_gate.md` (evidence row) with links to tests/runbook artifacts.

## Definition of done for the batch

- H-05, H-06, M-01 marked **FIXED** (or owner-accepted with compensating control documented).
- E1 OTP half has a pass/fail drill record (or explicit “staging unavailable” blocker note).
- Public self-service remains **RED** until E1–E5 Proven; do not claim GREEN.

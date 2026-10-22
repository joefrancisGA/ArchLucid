# Public self-service identity hard blockers — prompt index

**Source assessment:** `.local/owner/public_self_service_identity_gate.md` (2026-07-17)  
**Goal:** Close P0 hard blockers so public self-service can leave **RED** (at best → YELLOW after E1–E5; GREEN only after E1–E10 in that file).  
**Do not** flip open signup or `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` in these prompts.

## Sequence

Run in order. Each step must leave compile/tests green for its scope before the next starts.

| Step | Prompt | Closes | Evidence ID |
|------|--------|--------|-------------|
| 1 | [`pss-identity-01-otp-abuse-controls.md`](pss-identity-01-otp-abuse-controls.md) | Email-code abuse inadequate | E1 (OTP half) |
| 2 | [`pss-identity-02-trial-workspace-abuse.md`](pss-identity-02-trial-workspace-abuse.md) | Workspace / repeated-trial abuse | E1 (farm half) |
| 3 | [`pss-identity-03-identity-linking-adversarial.md`](pss-identity-03-identity-linking-adversarial.md) | Linking account takeover | E2 |
| 4 | [`pss-identity-04-sso-enforcement-recovery.md`](pss-identity-04-sso-enforcement-recovery.md) | SSO bypass + tenant lockout | E3 |
| 5 | [`pss-identity-05-platform-identity-runbooks.md`](pss-identity-05-platform-identity-runbooks.md) | Ops / support runbooks | E4 |
| 6 | [`pss-identity-06-invite-only-signup-gate.md`](pss-identity-06-invite-only-signup-gate.md) | Hard invite-only kill switch | E5 |
| 7 | [`pss-identity-07-auth-error-customer-safety.md`](pss-identity-07-auth-error-customer-safety.md) | Auth errors expose internals | (gate hard-blocker row) |

**Security follow-on batch (H-05 / H-06 / M-01 / E1):** [`.cursor/prompts/cis-security-00-index.md`](cis-security-00-index.md) — run after this batch; sourced from `.local/owner/customer_identity_security_assessment.md`.

Optional follow-ons (P1, not in this batch unless owner directs):

- Launch load drill execution (`docs/architecture/LAUNCH_LOAD_DRILL.md`) → E6  
- Public IdP copy vs env → E9  
- `/signup/verify` polish beyond step 07 → owner `signup_verify_assessment.md`  
- Cold-start pilot → E7  

## Guardrails (every step)

1. Prefer reuse of existing `ArchLucid.Application/Identity/*`, audit types, rate-limit policies, and trial funnel metrics — do not invent a parallel identity stack.
2. Customer-facing errors must stay buyer-safe (no stack traces, SQL, IdP raw payloads, or internal type names).
3. Tenant isolation per ADR 0037 — do not add SQL RLS; do not weaken scope binding.
4. One class per file; SQL DDL only in the single ArchLucid SQL file / numbered migrations pattern already used.
5. Prefer concrete types over `var`; blank line before `if`/`foreach` unless first line in method; null checks.
6. Do not implement TB-135/TB-136 or GTM cohort rows M-90/M-44/M-91/M-92.
7. After each step: update `.local/owner/public_self_service_identity_gate.md` checklist for the Evidence ID closed (status + link to PR/tests), or leave a short “Evidence still needed” note if owner-only drill remains.

## Definition of done for the batch

- All seven prompts’ acceptance criteria met in code/docs/tests.
- Gate file hard-blocker table updated; public self-service may move **YELLOW** only if E1–E5 are Proven — never claim GREEN without E6–E10.
)

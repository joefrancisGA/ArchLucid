> **Scope:** Sample of high-impact `(proven)` rows — not a claim that all high bugs are user-visible, and not a SOC 2 or pen-test control.

# `/al-bug` severity calibration audit

**Rows sampled:** 25
**Harm-named:** 0 (0%)
**Uncalibrated:** 15
**Skipped (no date):** 10

Closed harm tokens: `cross-tenant`+`200`; secret/password/apikey with summary/export/packet; `committed`+`manifest`; `200` with `403`/`404`.

## Uncalibrated citations

- `tenant-settings-sql` — Upsert during an in-flight cached read pins a stale miss after the write completes — **hit 2026-08-24:** `CachingTenantSettingsRepository` only removed the hybrid-cache key on upse
- `email-otp-auth` — Mixed-case invitation email on the row blocks acceptance after OTP verify — **hit 2026-08-24:** `TryAcceptInvitationAsync` compared `invitation.Email` to normalized sign-in email w
- `email-otp-auth` — Post-verify next step returns wrong workspace after invitation accept — **hit 2026-08-24:** `ResolveNextStepAsync` merged `acceptedInvitationId ?? challenge.InvitationId` and picke
- `email-otp-auth` — `EmailOtpAuthController.VerifyAsync` JWT/response tenant-workspace desync — **hit 2026-08-25:** response echoed null `result.TenantId`/`WorkspaceId` while JWT fell back to `TrialLo
- `email-otp-auth` — `EmailOtpAuthController.VerifyAsync` wrong verify audit event — **hit 2026-08-25:** HTTP verify logged `EmailOtpCodeRequested` with `email_otp_verify_http`, conflating challenge an
- `email-otp-auth` — `EmailOtpAuthService.VerifyCodeAsync` SSO-blocked verify missing audit — **hit 2026-08-25:** `RequireEnterpriseSso` path passed `emailCorrelation: null` to `FailWithAuditAsync`, sk
- `email-otp-auth` — `EmailOtpAuthController.RequestChallengeAsync` duplicate `EmailOtpCodeRequested` audit — **hit 2026-08-26:** HTTP challenge logged `EmailOtpCodeRequested` with `email_otp_challenge
- `auth-return-path` — Residual double-encoded slashes survive the eight-pass decode cap — **hit 2026-08-21:** `%252F%252F` residue evaded single-level `%2f` detection after the decode loop; regression i
- `auth-return-path` — Unicode slash homoglyphs bypass ASCII-only protocol-relative checks — **hit 2026-08-22:** fullwidth solidus (`／`, `%EF%BC%8F`) and fullwidth reverse solidus (`＼`) evaded `ContainsP
- `auth-return-path` — Additional Unicode slash homoglyphs bypass `IsSlashHomoglyph` — **hit 2026-08-23:** light diagonal (`╱`, `%E2%95%B1`), big solidus (`⧸`, `%E2%A7%B8`), and solidus overlay (`⧶`) eva
- `tenant-erasure` — Quarantine middleware lets mutating requests through after erasure has started — **hit 2026-08-23:** `TrialSeatReservationMiddleware` ran before `TenantErasureQuarantineMiddleware`
- `tenant-erasure` — Restore quarantine leaves stale `TenantErasureApprovedUtc` on in-memory tenants — **hit 2026-08-23:** `InMemoryTenantRepository` `CopyTenant(clearErasureQuarantine: true)` kept pri
- `tenant-erasure` — Quarantine middleware blocked tenant erasure lifecycle APIs — **hit 2026-08-24:** offboarded tenants received 403 on `POST /v1/tenant/erasure/approve` and `/legal-hold`, so `Tenant
- `tenant-scoped-analyzer` — Analyzer missed Dapper `QueryAsync` on tenant tables — **hit 2026-08-24:** `TryGetSqlArgument` always used `Arguments[0]` (connection) instead of the `sql`/`command` parameter; reg
- `tenant-scoped-analyzer` — Interpolated SQL treated as scoped when tenant predicate only appeared in a comment — **hit 2026-08-24:** predicate regex matched `/* TenantId = @TenantId ... */`; regression in `T

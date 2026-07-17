# SSO enforcement and recovery drill (Evidence E3)

**Environment:** staging tenant with test IdP.

## Checklist

1. [ ] Verify domain DNS TXT → routing test passes
2. [ ] Configure tenant IdP (SAML or OIDC) → activate
3. [ ] Add ≥2 recovery administrators; verify routing test for each
4. [ ] Enable SSO enforcement (recovery exception mode)
5. [ ] Attempt Email OTP for enforced domain → denied / SSO required
6. [ ] Sign in via IdP → success
7. [ ] Simulate IdP failure (bad metadata) → recovery admin Email OTP succeeds (audited bypass)
8. [ ] Attempt remove last recovery admin while enforced → **blocked**
9. [ ] Restore IdP → normal SSO works

Record: tenant ID, domain, audit event names, timestamps, operator.

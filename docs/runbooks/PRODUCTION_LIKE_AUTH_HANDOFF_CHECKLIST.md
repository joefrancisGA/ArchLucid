> **Scope:** Production-like auth handoff checklist - full detail, tables, and links in the sections below.

# Production-like auth handoff checklist

> **Scope:** PASS/HOLD checks before enterprise handoff. **Depth:** [`../security/`](../security/) · identity provider setup in operator UI.

## Entra / OIDC

- [ ] **PASS:** Discovery URL resolves; issuer and audience match staging/prod app registration.
- [ ] **PASS:** Role claim mapping documented; test user receives `ReadAuthority` minimum.
- [ ] **HOLD:** Dev bypass or `AllowAnonymous` enabled in production-like profile.

## SAML SP

- [ ] **PASS:** SP metadata exported; IdP signs assertions; clock skew within policy.
- [ ] **PASS:** `archlucid auth validate-saml --metadata … --claim-mapping …` succeeds locally.
- [ ] **HOLD:** Private key or IdP cert expiry within 30 days without rotation plan.

## API key automation

- [ ] **PASS:** Keys stored in secret manager; rotation runbook linked.
- [ ] **HOLD:** Long-lived keys emailed in plain text.

## SCIM + tenant claims

- [ ] **PASS:** `tenantId` / workspace / project claims map to scope headers or token claims.
- [ ] **PASS:** SCIM smoke test documented for pilot tenant.

## Diagnostics evidence to capture

```powershell
dotnet run --project ArchLucid.Cli -- auth diagnostics
dotnet run --project ArchLucid.Cli -- config lint --profile production-like-hosted-pilot --markdown-out artifacts/config-lint.md
```

Store `artifacts/config-lint.md` with release evidence — no secrets.

## Related

- Operator identity setup checklist (in-product **Settings → Identity providers**)
- [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md)

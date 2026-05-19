> **Scope:** Runbook — rotate the SAML 2.0 Service Provider signing certificate (`ArchLucidAuth:Saml2:SigningCertificateFile`) without SSO downtime; includes cert generation, host configuration, IdP coordination, and validation (not SAML middleware code changes).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Runbook: SAML SP signing certificate rotation

**Last reviewed:** 2026-05-19

**Priority:** P2 — Important (enterprise workforce SSO; certificate expiry causes hard sign-in failures)

## Summary

ArchLucid signs outbound SAML **AuthnRequests** with the PFX bound at **`ArchLucidAuth:Saml2:SigningCertificateFile`**. When SAML SP is enabled, that file is **required** at API startup (`AddArchLucidSaml2IfEnabled`). The customer **IdP** must trust the SP’s **public** signing certificate before cutover.

**Zero-downtime pattern:** add the **new** public certificate to the IdP **while the old cert is still trusted**, deploy the new PFX to ArchLucid, validate sign-in, then remove the **old** certificate from the IdP.

## Symptoms (plan before expiry)

- **`archlucid saml test-config`** reports **Warn** on `saml2.signingCertificate` (within 30 days) or **Fail** (expired / unloadable).
- **`GET /v1/admin/auth/saml-operational-health`** shows `spSigningCertificateNotAfterUtc` approaching expiry or `spSigningCertificateDiagnosticSummary` set.
- Daily email template **`saml-sp-signing-cert-expiry-warning`** (when `EmailNotification` is configured and expiry is within 30 days).
- Operator UI **Identity providers** settings may show an imminent-expiry banner (same health signal).

## Configuration reference

| Key | Purpose |
|-----|---------|
| **`ArchLucidAuth:Saml2:Enabled`** | Must be **`true`** for SAML SP. |
| **`ArchLucidAuth:Saml2:Issuer`** | SP entity ID (absolute URI); unchanged during cert-only rotation unless IdP mandates otherwise. |
| **`ArchLucidAuth:Saml2:IdPMetadata`** | HTTPS IdP federation metadata URL; unchanged for signing-cert rotation. |
| **`ArchLucidAuth:Saml2:SigningCertificateFile`** | PFX path (absolute recommended in production). |
| **`ArchLucidAuth:Saml2:SigningCertificatePassword`** | PFX password — **secret** (Key Vault / app setting / user secrets). |

Full matrix: **[CONFIGURATION_REFERENCE.md](../library/CONFIGURATION_REFERENCE.md)** · security context: **[SECURITY.md](../library/SECURITY.md)**.

## 1. Preconditions

1. **Change window** agreed with the customer IdP team (they must upload your new public cert).
2. **Non-production slice** available to smoke-test **`/Auth/Saml2/*`** sign-in before production promotion.
3. **Secret store** access to update PFX material and password without committing secrets to git.
4. **No SMB (port 445) exposure** for certificate distribution — use private blob mounts, Key Vault secret files, or secure CI artifact paths aligned with your landing zone.
5. Capture baseline: run **`archlucid saml test-config`** (from a host or build agent with the same merged config as the API) and save **`GET /v1/admin/auth/saml-operational-health`** JSON (Admin authority).

## 2. Generate or obtain a replacement signing certificate

ArchLucid expects a **PFX (PKCS#12)** containing the **private key** used to sign AuthnRequests.

### Option A — Azure Key Vault (preferred on Azure)

1. Create or import a certificate in **Azure Key Vault** (RSA 2048+; validity aligned to your PKI policy).
2. Export or sync the certificate to the API host as a **PFX file** on a path readable only by the app identity (Container Apps secret volume, App Service Key Vault reference as file, etc.).
3. Store the PFX password in Key Vault / app configuration — bind as **`ArchLucidAuth:Saml2:SigningCertificatePassword`**.

### Option B — OpenSSL (lab or customer-managed PKI)

From a secure admin workstation (not committed to the repo):

```bash
openssl req -x509 -newkey rsa:2048 \
  -keyout sp-signing.key -out sp-signing.crt -days 825 -nodes \
  -subj "/CN=your-sp-entity-name"

openssl pkcs12 -export -out sp-signing.pfx \
  -inkey sp-signing.key -in sp-signing.crt \
  -passout pass:REPLACE_WITH_STRONG_PASSWORD
```

Record **`NotAfter`** and protect **`sp-signing.pfx`** and the password like any TLS private key.

### Export public material for the IdP

Provide the IdP administrators **only** the public certificate (`.cer` / `.crt`), not the PFX or private key:

```bash
openssl pkcs12 -in sp-signing.pfx -nokeys -out sp-signing-public.crt -passin pass:REPLACE_WITH_STRONG_PASSWORD
```

## 3. Coordinate with the IdP (before ArchLucid cutover)

Steps vary by vendor; the invariant is: **the IdP must trust the new SP signing certificate before ArchLucid starts signing with it exclusively.**

| Step | Action |
|------|--------|
| 1 | Send **`sp-signing-public.crt`** (or vendor-specific metadata upload) to the IdP admin. |
| 2 | Ask them to **add** the new certificate to the existing SAML application / federation trust for your **`ArchLucidAuth:Saml2:Issuer`** entity ID — **do not remove the old cert yet** if the console supports multiple signing certs. |
| 3 | Confirm whether the IdP requires updated **SP metadata** upload vs. manual cert paste (Entra enterprise app, Okta SAML app, etc.). |
| 4 | Agree on a **cutover time** after ArchLucid rolling deploy completes. |

**JWT / OIDC-only tenants:** this runbook does not apply when **`ArchLucidAuth:Saml2:Enabled`** is **`false`**.

## 4. Stage configuration on the API host

1. Place **`sp-signing-new.pfx`** on disk (or replace in place if your mount strategy uses a stable path).
2. Update settings (example environment-variable style):

   ```text
   ArchLucidAuth__Saml2__SigningCertificateFile=/secrets/saml/sp-signing-new.pfx
   ArchLucidAuth__Saml2__SigningCertificatePassword=<from Key Vault>
   ```

3. Leave **`Issuer`**, **`IdPMetadata`**, and claim-mapping keys unchanged unless the IdP project explicitly requires them.
4. **Offline validate** before restart (from the deployment package directory or CI agent with the same `appsettings` merge):

   ```bash
   archlucid saml test-config
   ```

   Expect **Pass** on `saml2.signingCertificate` and no **Fail** rows.

## 5. Deploy without downtime (rolling cutover)

1. **Deploy / rolling restart** API replicas so `CertificateUtil.Load` binds the new PFX during startup (`PostConfigure` in `AddArchLucidSaml2IfEnabled`). There is no hot reload of the signing cert without a process recycle.
2. During a rolling update, replicas may briefly use **old** and **new** material; the IdP must accept **both** signing certificates during this window.
3. After all replicas report healthy readiness, run **production smoke**:
   - Browser SSO through **`/Auth/Saml2/*`** (initiate login from the operator UI or your documented SSO entry URL).
   - Confirm audit event **`Saml2ServiceProviderSignInSucceeded`** (not **`Saml2ServiceProviderSignInFailed`**) for a test principal.
4. Re-check **`GET /v1/admin/auth/saml-operational-health`** — `spSigningCertificateNotAfterUtc` should reflect the new cert; diagnostic summary should be null when load succeeds.

## 6. Retire the old certificate

1. After **24–48 hours** (or your session TTL policy) with no sign-in failures, ask the IdP admin to **remove** the previous SP signing certificate from the trust configuration.
2. Delete the retired PFX from host storage and revoke/archive the old Key Vault certificate version per your PKI policy.
3. Update your CMDB / ticket with new **`NotAfter`** and next rotation reminder.

## 7. Rollback

If sign-in fails immediately after cutover:

1. Revert **`SigningCertificateFile`** / password to the **previous** PFX settings.
2. Rolling restart API replicas.
3. Confirm IdP still trusts the **old** public cert (it should, if you followed §3 overlap).
4. Re-run **`archlucid saml test-config`** and SAML smoke login before closing the incident.

## 8. Security

- Never attach PFX files, passwords, or raw private keys to support tickets.
- Restrict filesystem ACLs / secret volume mounts to the API managed identity only.
- Correlation: use **`X-Correlation-ID`** and audit **`Saml2ServiceProviderSignInFailed`** payloads (`exceptionType`, `path`) — no assertion XML in audit.
- Storage for cert files must stay on **private** endpoints; no public SMB for distribution.

## 9. Reliability and cost

- **Reliability:** expired or mismatched certs cause **hard** SSO failure at startup (missing file) or at login (IdP signature verification). Proactive rotation avoids Sev-1 workforce lockout.
- **Scalability:** leader-elected daily expiry scan avoids duplicate warning emails across API replicas.
- **Cost:** negligible; operational cost is IdP coordination and a controlled deploy.

## References

- CLI validation: **[CLI_USAGE.md](../library/CLI_USAGE.md)** (`archlucid saml test-config`)
- Implementation (read-only for operators): `ArchLucid.Api/Auth/Services/ArchLucidSaml2ServiceExtensions.cs`, `ArchLucid.Core/Auth/Saml/SamlSpConfigurationDiagnostics.cs`
- Admin health: `GET /v1/admin/auth/saml-operational-health` (`AdminAuthDiagnosticsController`)
- Expiry notifications: `ArchLucid.Api/Hosting/SamlCertExpiryNotificationHostedService.cs`
- General secret rotation: [SECRET_AND_CERT_ROTATION.md](./SECRET_AND_CERT_ROTATION.md)
- OIDC (not SAML): [GENERIC_OIDC_SETUP.md](./GENERIC_OIDC_SETUP.md)

> **Scope:** Operators rotating SAML 2.0 SP signing material on ArchLucid API hosts configured under `ArchLucidAuth:Saml2`; procedural checklist — not IdP-vendor UX.

## Objective

Avoid SAML SSO outages caused by expired SP signing certificates when `ArchLucidAuth:Saml2:SignAuthnRequest` is required.

## Preconditions

- SAML SP integration enabled (`ArchLucidAuth:Saml2:Enabled=true`).
- Access to redeploy or reload configuration on the API host after rotating `SigningCertificateFile`.

## Rotation checklist

1. Issue or obtain a replacement signing certificate (PFX including private key) trusted by your IdP configuration for AuthnRequest signatures.
2. Stage the new PFX on the host filesystem referenced by `ArchLucidAuth:Saml2:SigningCertificateFile` (absolute path preferred).
3. Update `ArchLucidAuth:Saml2:SigningCertificatePassword` if it changed — treat as secret material (Key Vault / managed secret store).
4. Warm-cutover: deploy/restart so `CertificateUtil.Load` binds the new material during DI configuration (`AddArchLucidSaml2IfEnabled`).
5. Smoke-test SAML sign-in (`/Auth/Saml2/*` endpoints) in a non-production slice before promoting broadly.
6. Retire the prior PFX from disk once sessions started under the old cert have drained.

## Operational signals

Operators can monitor SP signing expiry via `GET /v1/admin/auth/saml-operational-health` (requires Admin authority). The Identity Providers settings surface surfaces an in-product banner when expiry is imminent.

## Constraints

- Never expose SMB file shares publicly for certificate distribution — align storage access with private endpoints and controlled boundaries.

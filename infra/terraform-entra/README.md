# Microsoft Entra ID (API app registration)

Optional Terraform root that registers an **application** in the customer tenant with **app roles** (**Admin**, **Operator**, **Reader**) matching **`ArchLucidRoles`** in ArchLucid.Api. Defaults **`enable_entra_api_app = false`**.

## Why customers care

- **Short-lived tokens** issued by Entra replace or complement long-lived **API keys**, improving revocation and audit posture.
- **Role assignment** is done in Entra (users, groups, or client applications) instead of sharing static secrets broadly.

## API configuration

After apply, set:

- **`ArchLucidAuth:Mode`** → **`JwtBearer`**
- **`ArchLucidAuth:Authority`** → `https://login.microsoftonline.com/<tenant-id>/v2.0`
- **`ArchLucidAuth:Audience`** → your **`api_identifier_uri`** (e.g. `api://archlucid-api-contoso`)
- **`ArchLucidAuth:NameClaimType`** → often **`preferred_username`** for human operators

See **`ArchLucid.Api/appsettings.Entra.sample.json`** and outputs from this stack (`application_id`, `identifier_uri`, etc.).

## Entra External ID (trial / CIAM)

`external_id.tf` gates **documentation-grade wiring** for self-service buyers without a federated workforce tenant:

- Set **`enable_external_id = true`** only after you have created (or imported) an **Entra External ID** directory and captured its **tenant id**.
- Map **`external_id_directory_tenant_id`** → ArchLucid **`Auth:Trial:ExternalIdTenantId`** when **`Auth:Trial:Modes`** includes **`MsaExternalId`**.
- User flows (MSA + Google + email/password) are configured in the External ID admin experience; Terraform here does **not** yet materialize those flows (provider gaps — track Graph/`azapi` follow-ups separately).

## Variables

See `variables.tf` and `terraform.tfvars.example`. **`expose_roles_in_tokens`** (default **true**) aligns JWT **`roles`** claims with **`RoleClaimType = "roles"`** in the API.

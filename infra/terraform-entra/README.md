# Microsoft Entra ID (API app registration)

Optional Terraform root that registers an **application** in the customer tenant with **app roles** (**Admin**, **Operator**, **Reader**) matching **`ArchiForgeRoles`** in ArchiForge.Api. Defaults **`enable_entra_api_app = false`**.

## Why customers care

- **Short-lived tokens** issued by Entra replace or complement long-lived **API keys**, improving revocation and audit posture.
- **Role assignment** is done in Entra (users, groups, or client applications) instead of sharing static secrets broadly.

## API configuration

After apply, set:

- **`ArchiForgeAuth:Mode`** → **`JwtBearer`**
- **`ArchiForgeAuth:Authority`** → `https://login.microsoftonline.com/<tenant-id>/v2.0`
- **`ArchiForgeAuth:Audience`** → your **`api_identifier_uri`** (e.g. `api://archiforge-api-contoso`)
- **`ArchiForgeAuth:NameClaimType`** → often **`preferred_username`** for human operators

See **`ArchiForge.Api/appsettings.Entra.sample.json`** and outputs from this stack (`application_id`, `identifier_uri`, etc.).

## Variables

See `variables.tf` and `terraform.tfvars.example`. **`expose_roles_in_tokens`** (default **true**) aligns JWT **`roles`** claims with **`RoleClaimType = "roles"`** in the API.

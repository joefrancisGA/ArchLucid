> **Scope:** Quickstart guide for setting up SCIM provisioning.

# SCIM provisioning quickstart

This quickstart summarizes how to configure SCIM provisioning with ArchLucid.

## Provisioning the ScimBearer token
To authenticate your SCIM client, you must provision a `ScimBearer` token. This token acts as a long-lived credential. Generate the token through the ArchLucid operator dashboard and provide it to your identity provider (e.g., Entra ID) as the secret token.

## Expected endpoints
ArchLucid implements the standard SCIM 2.0 endpoints for user and group management:
- `GET /scim/v2/Users`
- `POST /scim/v2/Users`
- `GET /scim/v2/Users/{id}`
- `PUT /scim/v2/Users/{id}`
- `PATCH /scim/v2/Users/{id}`

## Group-to-role mapping for Entra ID SCIM clients
When integrating with Entra ID, you can map Entra ID groups to ArchLucid roles. Configure your Entra ID SCIM enterprise application to map the group membership to the standard SCIM roles attribute. ArchLucid will automatically process the SCIM groups and apply the equivalent `Admin`, `Operator`, or `Reader` roles to the provisioned users.

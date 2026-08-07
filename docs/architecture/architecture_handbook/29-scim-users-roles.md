# 29. SCIM and users & roles

Inbound SCIM 2.0 (`/scim/v2/*`) uses per-tenant bearer tokens, maps groups to roles, and feeds seat accounting. Resulting users surface in operator users-and-roles; tokens become JWT/session claims for authZ policies.

![SCIM users roles](../architecture_diagrams/archlucid-scim-users-roles.svg)

ADR 0032 · `docs/integrations/SCIM_PROVISIONING.md`.

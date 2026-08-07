# 60. Entra role claims

Entra (or generic OIDC) app roles and SAML attributes are normalized onto `ArchLucidRoles` plus fine-grained `permission` claims. This is the claim-transform path behind the authn-route matrix—role sources, aliases, and diagnostics.

![Entra role claims](../architecture_diagrams/archlucid-entra-role-claims.svg)

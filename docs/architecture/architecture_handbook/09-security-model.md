# 9. Security model

Default deny on API controllers; Entra JWT or API keys; claims-based policies; production fail-closed on unsafe CORS, webhook HMAC gaps, billing misconfiguration, and `SingleCatalog`.

## Diagram

![Security model](../architecture_diagrams/archlucid-security-model.svg)

Secrets prefer Key Vault and managed identity. See also tenant isolation (chapter 7) and `docs/ARCHITECTURE_ON_ONE_PAGE.md` §7.

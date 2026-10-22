# 5. Secrets and Key Vault (security)

Runtime secrets resolve only through `ISecretProvider` (Key Vault or environment, optionally composed). ITSM and Teams store Key Vault *secret names*, not raw credentials. Hosted pilots emit Key Vault references from stack generation.

![Secrets Key Vault resolution](../../architecture_diagrams/archlucid-secrets-keyvault-resolution.svg)

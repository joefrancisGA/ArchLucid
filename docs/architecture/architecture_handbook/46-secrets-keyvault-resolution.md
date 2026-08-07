# 46. Secrets and Key Vault resolution

Runtime secrets resolve only through `ISecretProvider` (`EnvironmentVariable` or `KeyVault`, optionally composed). ITSM and Teams store Key Vault *secret names*, not raw credentials; stack generation emits `@Microsoft.KeyVault(...)` references for hosted pilots.

![Secrets Key Vault resolution](../architecture_diagrams/archlucid-secrets-keyvault-resolution.svg)

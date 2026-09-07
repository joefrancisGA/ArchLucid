namespace ArchLucid.Application.Findings;

public sealed record SecretsLifecycleInventoryRow(
    string SecretName,
    string VaultName,
    string InventoryResourceId,
    string Cloud,
    DateTimeOffset? LastRotatedUtc,
    DateTimeOffset? ExpiryUtc);

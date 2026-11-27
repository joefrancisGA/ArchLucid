namespace ArchLucid.Core.Agents;

public sealed record ProviderQualityKey(string ProviderId, string ModelId, string ModelVersion)
{
    public static ProviderQualityKey Create(string? providerId, string? modelId, string? modelVersion) =>
        new(Normalize(providerId), Normalize(modelId), Normalize(modelVersion));

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? "unknown" : value.Trim().ToLowerInvariant();
}

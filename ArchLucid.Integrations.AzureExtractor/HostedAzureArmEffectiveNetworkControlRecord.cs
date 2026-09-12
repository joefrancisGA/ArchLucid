namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Normalized effective network control row aligned with <c>effective-network-controls.json</c> (IE-RF-10).
/// </summary>
public sealed record HostedAzureArmEffectiveNetworkControlRecord(
    string NicResourceId,
    string Kind,
    string CollectionStatus,
    string? EffectiveResourceId,
    string? PayloadHashSha256);

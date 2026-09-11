namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Normalized network association row aligned with <c>network-associations.json</c> companion entries.
/// </summary>
public sealed record HostedAzureArmNetworkAssociationRecord(
    string FromResourceId,
    string ToResourceId,
    string AssociationType,
    string? RuleName = null);

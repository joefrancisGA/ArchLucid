namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Normalized ARM resource row aligned with <c>Get-ArchLucidAzurePackage.ps1</c> <c>resources.json</c> entries.
/// </summary>
public sealed record HostedAzureArmResourceRecord(
    string ResourceType,
    string ResourceId,
    string Name,
    string? Location,
    object? Sku,
    IReadOnlyDictionary<string, string>? Tags,
    IReadOnlyDictionary<string, object?> Properties);

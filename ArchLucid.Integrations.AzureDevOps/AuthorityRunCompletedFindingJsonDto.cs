namespace ArchLucid.Integrations.AzureDevOps;

/// <summary>JSON model for nested finding rows deserialized with <see cref="System.Text.Json.JsonSerializer" />.</summary>
internal sealed class AuthorityRunCompletedFindingJsonDto
{
    public string FindingId { get; init; } = "";

    public string DeepLinkUrl { get; init; } = "";

    public string? Severity { get; init; }
}

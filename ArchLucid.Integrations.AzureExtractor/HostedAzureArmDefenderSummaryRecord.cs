namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmDefenderSummaryRecord
{
    public string ResourceId { get; init; } = string.Empty;

    public int SecureScore { get; init; }
}

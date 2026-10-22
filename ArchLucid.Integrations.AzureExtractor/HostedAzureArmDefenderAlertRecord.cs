namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmDefenderAlertRecord
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string AlertId { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string Severity { get; init; } = string.Empty;

    public string Status { get; init; } = string.Empty;

    public string Intent { get; init; } = string.Empty;

    public string AlertType { get; init; } = string.Empty;

    public DateTime? StartTimeUtc { get; init; }

    public string ResourceId { get; init; } = string.Empty;
}

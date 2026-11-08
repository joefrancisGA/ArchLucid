namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmDefenderComplianceStandardRecord
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string StandardName { get; init; } = string.Empty;

    public string State { get; init; } = string.Empty;

    public int PassedControlCount { get; init; }

    public int FailedControlCount { get; init; }

    public int SkippedControlCount { get; init; }
}

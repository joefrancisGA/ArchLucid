namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmDefenderAssessmentCountRecord
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string AssessmentKey { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string Severity { get; init; } = "Unknown";

    public int HealthyCount { get; init; }

    public int UnhealthyCount { get; init; }

    public int NotApplicableCount { get; init; }
}

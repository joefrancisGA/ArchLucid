namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmDefenderAssessmentRecord
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string AssessmentKey { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string Severity { get; init; } = "Unknown";

    public string Status { get; init; } = "Unhealthy";

    public string StatusCause { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public string ResourceId { get; init; } = string.Empty;
}

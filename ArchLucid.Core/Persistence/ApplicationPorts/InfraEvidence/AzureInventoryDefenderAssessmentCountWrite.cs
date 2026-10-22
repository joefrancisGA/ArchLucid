namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderAssessmentCountWrite
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string AssessmentKey { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string Severity { get; init; } = string.Empty;

    public int HealthyCount { get; init; }

    public int UnhealthyCount { get; init; }

    public int NotApplicableCount { get; init; }

    public string? SourceEvidenceReference { get; init; }
}

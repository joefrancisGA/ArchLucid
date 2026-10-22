namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderAssessmentWrite
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string AssessmentKey { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string Severity { get; init; } = string.Empty;

    public string Status { get; init; } = string.Empty;

    public string StatusCause { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public string ResourceId { get; init; } = string.Empty;

    public string? SourceEvidenceReference { get; init; }
}

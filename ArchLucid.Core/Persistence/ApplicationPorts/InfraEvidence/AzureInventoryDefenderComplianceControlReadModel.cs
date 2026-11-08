namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderComplianceControlReadModel
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string StandardName { get; init; } = string.Empty;

    public string ControlName { get; init; } = string.Empty;

    public string State { get; init; } = string.Empty;

    public int FailedAssessmentCount { get; init; }

    public string? SourceEvidenceReference { get; init; }
}

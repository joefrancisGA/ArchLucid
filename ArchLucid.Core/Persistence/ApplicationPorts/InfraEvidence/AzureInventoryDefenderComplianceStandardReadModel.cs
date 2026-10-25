namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderComplianceStandardReadModel
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string StandardName { get; init; } = string.Empty;

    public string State { get; init; } = string.Empty;

    public int PassedControlCount { get; init; }

    public int FailedControlCount { get; init; }

    public int SkippedControlCount { get; init; }

    public string? SourceEvidenceReference { get; init; }
}

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderGovernanceAssignmentWrite
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string AssessmentKey { get; init; } = string.Empty;

    public string ResourceId { get; init; } = string.Empty;

    public string? Owner { get; init; }

    public DateTime? RemediationDueUtc { get; init; }

    public bool IsGracePeriod { get; init; }

    public string AssignmentStatus { get; init; } = string.Empty;

    public string? SourceEvidenceReference { get; init; }
}

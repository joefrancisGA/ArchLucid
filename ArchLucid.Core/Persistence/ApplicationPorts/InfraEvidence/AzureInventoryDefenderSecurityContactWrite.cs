namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderSecurityContactWrite
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string CollectionStatus { get; init; } = string.Empty;

    public int EmailCount { get; init; }

    public string Emails { get; init; } = string.Empty;

    public bool AlertsToAdmins { get; init; }

    public string MinimalSeverity { get; init; } = string.Empty;

    public string NotificationRoles { get; init; } = string.Empty;

    public string? SourceEvidenceReference { get; init; }
}

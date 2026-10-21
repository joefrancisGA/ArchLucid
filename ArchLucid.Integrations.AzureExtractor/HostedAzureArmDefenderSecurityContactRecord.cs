namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmDefenderSecurityContactRecord
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string CollectionStatus { get; init; } = "Unavailable";

    public int EmailCount { get; init; }

    public string Emails { get; init; } = string.Empty;

    public bool AlertsToAdmins { get; init; }

    public string MinimalSeverity { get; init; } = string.Empty;

    public string NotificationRoles { get; init; } = string.Empty;
}

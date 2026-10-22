namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmDefenderAttackPathRecord
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string AttackPathId { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string RiskLevel { get; init; } = string.Empty;

    public string EntryResourceIds { get; init; } = string.Empty;

    public string TargetResourceIds { get; init; } = string.Empty;
}

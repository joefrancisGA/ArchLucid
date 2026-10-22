namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureArmDefenderScoreControlRecord
{
    public string SubscriptionId { get; init; } = string.Empty;

    public string ScoreName { get; init; } = string.Empty;

    public string ControlName { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public int CurrentScore { get; init; }

    public int MaxScore { get; init; }

    public int Percentage { get; init; }

    public int Weight { get; init; }

    public int UnhealthyResourceCount { get; init; }

    public int HealthyResourceCount { get; init; }
}

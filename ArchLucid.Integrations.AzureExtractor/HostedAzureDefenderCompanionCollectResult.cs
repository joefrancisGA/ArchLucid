namespace ArchLucid.Integrations.AzureExtractor;

public sealed class HostedAzureDefenderCompanionCollectResult
{
    public IReadOnlyList<HostedAzureArmDefenderPricingRecord> Pricings { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderScoreControlRecord> ScoreControls { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderAssessmentRecord> Assessments { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderAssessmentCountRecord> AssessmentCounts { get; init; } = [];

    public IReadOnlyList<HostedAzureArmDefenderSecurityContactRecord> SecurityContacts { get; init; } = [];

    public IReadOnlyList<string> Warnings { get; init; } = [];
}

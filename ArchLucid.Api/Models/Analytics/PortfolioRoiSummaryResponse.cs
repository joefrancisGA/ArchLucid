namespace ArchLucid.Api.Models.Analytics;

public sealed class PortfolioRoiSummaryResponse
{
    public string DedupeKeyFormat { get; init; } = "{policyRuleId}:{normalizedFindingFingerprint}";

    public SponsorRoiAggregatesResponse DeduplicatedTotals { get; init; } = new();

    public SponsorRoiAggregatesResponse RawRunTotals { get; init; } = new();

    public int UniqueFindingCount { get; init; }

    public int RawFindingCount { get; init; }
}
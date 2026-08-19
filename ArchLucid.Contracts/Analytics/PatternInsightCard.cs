namespace ArchLucid.Contracts.Analytics;

/// <summary>Anonymized cross-tenant pattern card (ADR 0031 k-anon aggregates).</summary>
public sealed class PatternInsightCard
{
    public string PatternKey
    {
        get;
        init;
    } = string.Empty;

    public string IndustryVertical
    {
        get;
        init;
    } = string.Empty;

    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public int ContributingTenantCount
    {
        get;
        init;
    }
}

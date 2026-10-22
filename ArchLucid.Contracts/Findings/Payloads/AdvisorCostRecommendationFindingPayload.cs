namespace ArchLucid.Contracts.Findings.Payloads;

public class AdvisorCostRecommendationFindingPayload
{
    public string ExtractorArtifactFileName
    {
        get;
        set;
    } = "advisor-cost.json";

    public int EntryIndex
    {
        get;
        set;
    }

    public string RecommendationId
    {
        get;
        set;
    } = null!;

    public string Title
    {
        get;
        set;
    } = null!;

    public string Category
    {
        get;
        set;
    } = null!;

    public decimal? EstimatedAnnualSavingsUsd
    {
        get;
        set;
    }
}

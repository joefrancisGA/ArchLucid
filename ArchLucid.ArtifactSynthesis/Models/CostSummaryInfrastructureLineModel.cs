namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>Serializable infrastructure cost line surfaced in synthesized cost summaries.</summary>
public sealed class CostSummaryInfrastructureLineModel
{
    public string LineKind
    {
        get;
        set;
    } = string.Empty;

    public string DisplayName
    {
        get;
        set;
    } = string.Empty;

    public string RuntimePlatform
    {
        get;
        set;
    } = string.Empty;

    public string AzureProductLabel
    {
        get;
        set;
    } = string.Empty;

    public decimal EstimatedUsdPerMonth
    {
        get;
        set;
    }

    public string PriceSource
    {
        get;
        set;
    } = string.Empty;
}

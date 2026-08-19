namespace ArchLucid.ArtifactSynthesis.Models;

public class CostSummaryArtifactModel
{
    /// <summary>Best-effort USD/month derived from topology + optional Retail API sizing.</summary>
    public decimal? TopologyInferredInfrastructureUsdPerMonth
    {
        get;
        set;
    }

    /// <summary>Human-readable note about probe strategy (illustrative vs Retail blend).</summary>
    public string InfrastructureSummaryNote
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Per-line infrastructure estimates for transparency.</summary>
    public List<CostSummaryInfrastructureLineModel> InfrastructureLines
    {
        get;
        set;
    } = [];

    public decimal? MaxMonthlyCost
    {
        get;
        set;
    }

    public List<string> Risks
    {
        get;
        set;
    } = [];

    public List<string> Notes
    {
        get;
        set;
    } = [];
}

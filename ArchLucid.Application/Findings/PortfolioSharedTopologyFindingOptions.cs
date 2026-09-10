namespace ArchLucid.Application.Findings;

/// <summary>Options for <see cref="PortfolioSharedTopologyFindingEngine" />.</summary>
public sealed class PortfolioSharedTopologyFindingOptions
{
    public const string SectionPath = "ArchLucid:Findings:PortfolioSharedTopology";

    public bool Enabled
    {
        get;
        set;
    }

    public int MaxSystemsScanned
    {
        get;
        set;
    } = 50;

    public int MaxFindings
    {
        get;
        set;
    } = 8;
}

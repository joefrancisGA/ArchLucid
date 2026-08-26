namespace ArchLucid.Application.Findings;

/// <summary>Options for <see cref="PortfolioRecurrenceFindingEngine" />.</summary>
public sealed class PortfolioRecurrenceFindingOptions
{
    public const string SectionPath = "ArchLucid:Findings:PortfolioRecurrence";

    public bool Enabled
    {
        get;
        set;
    } = false;

    public int MinSystemCountToReport
    {
        get;
        set;
    } = 3;

    public int MaxSystemsScanned
    {
        get;
        set;
    } = 50;

    public int MaxFindings
    {
        get;
        set;
    } = 10;
}

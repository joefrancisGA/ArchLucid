namespace ArchLucid.Contracts.Roi;

/// <summary>Time series for one top systemic issue grouped by stable finding identity.</summary>
public sealed class ExecutiveRoiSystemicIssueTrendSeries
{
    public string Category
    {
        get;
        set;
    } = string.Empty;

    public string Severity
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Representative <see cref="ArchitectureFinding.FindingId" /> for the series.</summary>
    public string FindingId
    {
        get;
        set;
    } = string.Empty;

    public List<ExecutiveRoiSystemicIssueTrendPoint> Points
    {
        get;
        set;
    } = [];
}

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Roi;

/// <summary>Time series for one top systemic issue grouped by stable finding identity.</summary>
public sealed class SponsorRoiSystemicIssueTrendSeries
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

    private List<SponsorRoiSystemicIssueTrendPoint> points = [];

    public List<SponsorRoiSystemicIssueTrendPoint> Points
    {
        get => points;
        set => points = ContractCollectionDefaults.Coalesce(value);
    }
}

namespace ArchLucid.Application.Roi;

/// <summary>Per-month rollup while building <see cref="SponsorRoiHistoryResponse"/> (TB-239).</summary>
internal sealed class SponsorRoiHistoryMonthAggregate
{
    public decimal Savings
    {
        get;
        set;
    }

    public int CriticalCount
    {
        get;
        set;
    }

    public DateTime LatestUtc
    {
        get;
        set;
    }

    public int RealRunCount
    {
        get;
        set;
    }

    public int SimulatorRunCount
    {
        get;
        set;
    }
}

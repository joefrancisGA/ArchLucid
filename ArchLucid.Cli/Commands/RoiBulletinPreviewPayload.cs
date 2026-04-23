using ArchLucid.Core.GoToMarket;

namespace ArchLucid.Cli.Commands;

/// <summary>JSON shape returned by <c>GET /v1/admin/roi-bulletin-preview</c>.</summary>
internal sealed class RoiBulletinPreviewPayload
{
    public string? Quarter
    {
        get;
        init;
    }

    public int TenantCount
    {
        get;
        init;
    }

    public decimal? MeanBaselineHours
    {
        get;
        init;
    }

    public decimal? MedianBaselineHours
    {
        get;
        init;
    }

    public decimal? P90BaselineHours
    {
        get;
        init;
    }

    internal static RoiBulletinPreviewPayload FromAggregate(RoiBulletinAggregateReadResult result)
    {
        return new RoiBulletinPreviewPayload
        {
            Quarter = result.QuarterLabel,
            TenantCount = result.TenantCount,
            MeanBaselineHours = result.MeanBaselineHours,
            MedianBaselineHours = result.MedianBaselineHours,
            P90BaselineHours = result.P90BaselineHours
        };
    }
}

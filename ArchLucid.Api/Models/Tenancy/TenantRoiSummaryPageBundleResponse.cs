using ArchLucid.Application.Pilots;

namespace ArchLucid.Api.Models.Tenancy;

/// <summary>ROI summary page: pilot-to-date and rolling-window reports plus pre-commit block counts.</summary>
public sealed class TenantRoiSummaryPageBundleResponse
{
    public PilotValueReport PilotToDate
    {
        get;
        init;
    } = new();

    public PilotValueReport RollingWindow
    {
        get;
        init;
    } = new();

    public AuditEventCountResponse PilotToDatePreCommitBlocks
    {
        get;
        init;
    } = new();

    public AuditEventCountResponse RollingWindowPreCommitBlocks
    {
        get;
        init;
    } = new();
}

/// <summary>Exact audit event count for a scoped filter (replaces client-side paging).</summary>
public sealed class AuditEventCountResponse
{
    public int Count
    {
        get;
        init;
    }

    public bool Exact
    {
        get;
        init;
    } = true;
}

namespace ArchLucid.Persistence.Data.Repositories.LlmDailyTenantTokenWindow;

/// <summary>Materialized row for <c>dbo.LlmDailyTenantTokenWindowState</c> (UTC calendar day bucket).</summary>
public sealed class LlmDailyTenantTokenWindowStateReadModel
{
    public long TotalTokens
    {
        get;
        init;
    }

    public bool WarnedApproaching
    {
        get;
        init;
    }

    public byte[] RowVersion
    {
        get;
        init;
    } = Array.Empty<byte>();
}

namespace ArchLucid.Core.Tenancy;

/// <summary>Options for <see cref="ITenantHardPurgeService" />.</summary>
public sealed class TenantHardPurgeOptions
{
    public bool DryRun
    {
        get;
        init;
    }

    public int MaxRowsPerStatement
    {
        get;
        init;
    } = 5000;

    /// <summary>
    ///     When true, also deletes <c>dbo.AuditEvents</c> for the tenant (right-to-be-forgotten offboarding). Trial
    ///     lifecycle purges keep these rows per retention policy.
    /// </summary>
    public bool DeleteTenantScopedAuditEvents
    {
        get;
        init;
    }
}

namespace ArchLucid.Application.Tenancy;

/// <summary>
/// Operator-facing maintenance copy shared by migration orchestration and UI banners (TB-2068 / TB-2069).
/// </summary>
public static class TenantMigrationMaintenanceMessages
{
    public const string DefaultSuspendMessage =
        "Tenant catalog migration in progress — operator reads may be stale and new writes are suspended until verification completes.";
}

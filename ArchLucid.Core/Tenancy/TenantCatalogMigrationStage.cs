namespace ArchLucid.Core.Tenancy;

/// <summary>Fan-out stage for tenant catalog migration per <c>TENANT_MIGRATION_FANOUT.md</c>.</summary>
public enum TenantCatalogMigrationStage
{
    ScopeFreeze = 0,
    CatalogAttachDetach = 1,
    ProjectionRefresh = 2,
    Verification = 3,
    Complete = 4,
}

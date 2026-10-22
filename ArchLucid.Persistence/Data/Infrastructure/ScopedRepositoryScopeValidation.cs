using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>
///     Fail-fast guards for tenant-scoped Dapper repositories. Prevents cross-tenant reads/writes when
///     <see cref="ScopeContext.TenantId" /> or entity <c>TenantId</c> was not set by the service layer.
/// </summary>
internal static class ScopedRepositoryScopeValidation
{
    /// <summary>Trusted jobs (backfill, migration) skip repository scope predicates when tenant is empty.</summary>
    internal static readonly ScopeContext TrustedJobScope = new();
    internal static void RequireScopedTenant(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (scope.TenantId == Guid.Empty)
            throw new InvalidOperationException(
                "ScopeContext.TenantId must be set for tenant-scoped repository operations.");
    }

    internal static void RequireEntityTenant(Guid tenantId)
    {
        if (tenantId == Guid.Empty)
            throw new InvalidOperationException("TenantId must be set for tenant-scoped repository operations.");
    }
}

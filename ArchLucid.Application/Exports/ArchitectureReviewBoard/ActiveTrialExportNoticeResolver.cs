using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Resolves active-trial export notice copy for the current tenant scope.</summary>
public static class ActiveTrialExportNoticeResolver
{
    public static async Task<string?> ResolveAsync(
        IScopeContextProvider scopeContextProvider,
        ITenantRepository tenantRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(tenantRepository);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return null;

        TenantRecord? tenant = await tenantRepository
            .GetByIdAsync(scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        return ActiveTrialExportNoticeFormatter.Format(tenant);
    }
}

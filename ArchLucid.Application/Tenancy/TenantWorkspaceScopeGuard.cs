using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>Application-layer tenant + workspace existence checks for scope-bound HTTP facades.</summary>
public static class TenantWorkspaceScopeGuard
{
    public static async Task<TenantWorkspaceScopeResult> RequireTenantAndWorkspaceAsync(
        IScopeContextProvider scopeProvider,
        ITenantRepository tenantRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(tenantRepository);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        TenantRecord? tenant = await tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
        {
            return new TenantWorkspaceScopeResult
            {
                Outcome = TenantWorkspaceScopeOutcome.TenantNotFound,
            };
        }

        bool workspaceExists = await WorkspaceExistsAsync(tenantRepository, scope.TenantId, scope.WorkspaceId, cancellationToken)
            .ConfigureAwait(false);

        if (!workspaceExists)
        {
            return new TenantWorkspaceScopeResult
            {
                Outcome = TenantWorkspaceScopeOutcome.WorkspaceNotFound,
            };
        }

        return new TenantWorkspaceScopeResult
        {
            Outcome = TenantWorkspaceScopeOutcome.Success,
            Scope = scope,
        };
    }

    private static async Task<bool> WorkspaceExistsAsync(
        ITenantRepository tenantRepository,
        Guid tenantId,
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        if (tenantRepository is IWorkspaceQueryTenantRepository workspaceQuery)
            return await workspaceQuery.WorkspaceExistsAsync(tenantId, workspaceId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await tenantRepository.ListWorkspacesAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return workspaces.Any(workspace => workspace.WorkspaceId == workspaceId);
    }
}

public enum TenantWorkspaceScopeOutcome
{
    Success,
    TenantNotFound,
    WorkspaceNotFound,
}

public sealed record TenantWorkspaceScopeResult
{
    public required TenantWorkspaceScopeOutcome Outcome { get; init; }

    public ScopeContext? Scope { get; init; }
}

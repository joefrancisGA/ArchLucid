using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class InMemoryArchitectureIdentityRepository
{
    public Task<bool> TrySetRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        bool restrictToShares,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        if (!_byId.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.FromResult(false);

        if (record.TenantId != scope.TenantId ||
            record.WorkspaceId != scope.WorkspaceId ||
            record.ScopeProjectId != scope.ProjectId)
            return Task.FromResult(false);

        record.RestrictToShares = restrictToShares;
        record.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return Task.FromResult(true);
    }

    private async Task<List<ArchitectureIdentityRecord>> FilterByShareVisibilityAsync(
        ScopeContext scope,
        List<ArchitectureIdentityRecord> identities,
        string? actorOidForShareFilter,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(actorOidForShareFilter) || _shareRepository is null)
            return identities;

        string actorOid = actorOidForShareFilter.Trim();
        List<ArchitectureIdentityRecord> visible = [];

        foreach (ArchitectureIdentityRecord identity in identities)
        {
            if (!identity.RestrictToShares)
            {
                visible.Add(identity);

                continue;
            }

            ArchitectureShareRecord? share = await _shareRepository.TryGetAsync(
                scope,
                identity.ArchitectureId,
                actorOid,
                cancellationToken);

            if (share is not null)
                visible.Add(identity);
        }

        return visible;
    }
}

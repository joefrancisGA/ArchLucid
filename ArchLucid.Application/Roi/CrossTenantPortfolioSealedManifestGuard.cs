using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Roi;

/// <summary>Wave-77 suggestion 914: cross-tenant portfolio rollup fail-closed on sealed hash per contributing run.</summary>
public static class CrossTenantPortfolioSealedManifestGuard
{
    public static async Task EnsureAccessiblePortfolioRunsSealedOrThrowAsync(
        string userDirectoryKey,
        ScopeContext callerScope,
        ITenantRepository tenantRepository,
        IScimUserRepository scimUserRepository,
        SponsorRoiRunCollector runCollector,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userDirectoryKey);
        ArgumentNullException.ThrowIfNull(callerScope);
        ArgumentNullException.ThrowIfNull(tenantRepository);
        ArgumentNullException.ThrowIfNull(scimUserRepository);
        ArgumentNullException.ThrowIfNull(runCollector);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        IReadOnlyList<TenantRecord> allTenants = await tenantRepository.ListAsync(cancellationToken).ConfigureAwait(false);
        List<Guid> accessibleTenantIds = [];

        foreach (TenantRecord tenant in allTenants)
        {
            if (tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
                continue;

            ScimUserRecord? user =
                await scimUserRepository.GetByExternalIdAsync(tenant.Id, userDirectoryKey, cancellationToken)
                    .ConfigureAwait(false);

            if (user is not null && user.DirectoryRemovedUtc is null && user.Active)
                accessibleTenantIds.Add(tenant.Id);
        }

        if (accessibleTenantIds.Count < 5)
            return;

        HashSet<string> sealedRunIds = [];

        foreach (Guid tenantId in accessibleTenantIds)
        {
            using IDisposable overrideScope = AmbientScopeContext.Push(new ScopeContext { TenantId = tenantId });

            Dictionary<string, RunSummary> latestBySystem =
                await runCollector.CollectLatestCommittedRunPerSystemAsync(cancellationToken).ConfigureAwait(false);

            foreach (RunSummary summary in latestBySystem.Values)
            {
                if (!string.IsNullOrWhiteSpace(summary.RunId))
                    sealedRunIds.Add(summary.RunId.Trim());
            }
        }

        await SponsorRoiBoardPackSealedManifestGuard.EnsureRunIdsSealedOrThrowAsync(
            sealedRunIds,
            callerScope,
            authorityQueryService,
            manifestHashService,
            cancellationToken).ConfigureAwait(false);
    }
}

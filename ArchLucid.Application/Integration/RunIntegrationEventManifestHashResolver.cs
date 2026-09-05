using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Integration;

/// <summary>Wave-28 suggestions 293–297: resolve verified manifestHash for run-scoped integration event payloads.</summary>
public static class RunIntegrationEventManifestHashResolver
{
    public static async Task<string?> TryResolveVerifiedManifestHashAsync(
        Guid runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (runId == Guid.Empty)
            return null;

        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        return detail?.GoldenManifest?.ManifestHash;
    }

    public static async Task<string?> TryResolveVerifiedManifestHashOrNullAsync(
        Guid runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        try
        {
            return await TryResolveVerifiedManifestHashAsync(
                runId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
        catch (ConflictException)
        {
            return null;
        }
    }
}

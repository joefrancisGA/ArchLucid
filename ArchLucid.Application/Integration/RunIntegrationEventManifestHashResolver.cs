using ArchLucid.Application.Governance;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Integration;

/// <summary>Wave-28 suggestions 293–297: resolve verified manifestHash for run-scoped integration event payloads.</summary>
public static class RunIntegrationEventManifestHashResolver
{
    /// <summary>
    ///     Resolves manifest hash from the in-flight authority pipeline manifest. Avoids
    ///     <see cref="GovernanceDispositionSealedManifestGuard" /> during finalize when the golden manifest
    ///     is not yet visible to <see cref="IAuthorityQueryService" /> read models.
    /// </summary>
    public static string ResolvePipelineManifestHashForIntegrationEvent(
        ManifestDocument manifest,
        IManifestHashService manifestHashService)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!string.IsNullOrWhiteSpace(manifest.ManifestHash))
            return manifest.ManifestHash;

        return manifestHashService.ComputeHash(manifest);
    }

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

    /// <summary>
    ///     Wave-30 suggestion 362: emit verified hash when a golden manifest exists; omit hash for pre-commit runs.
    /// </summary>
    public static async Task<string?> TryResolveVerifiedManifestHashWhenCommittedOrNullAsync(
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

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        if (detail?.GoldenManifest is null)
            return null;

        return await TryResolveVerifiedManifestHashAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
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

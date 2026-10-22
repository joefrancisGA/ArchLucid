using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.ExecDigest;

/// <summary>Wave-25 suggestion 249: exec digest sponsor deep-link read fail-closed on sealed hash.</summary>
public static class ExecDigestSponsorDeepLinkSealedManifestGuard
{
    public static Task EnsureDashboardCompositionReadyOrThrowAsync(
        Guid tenantId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        IReadOnlyList<Guid> highlightedRunIds,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);
        ArgumentNullException.ThrowIfNull(highlightedRunIds);

        if (highlightedRunIds.Count == 0)
            return Task.CompletedTask;

        return EnsureRunsSealedOrThrowAsync(scope, authorityQueryService, manifestHashService, highlightedRunIds, cancellationToken);
    }

    public static Task EnsureRunCollateralReadyOrThrowAsync(
        string runIdHex,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdHex);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!Guid.TryParse(runIdHex.Trim(), out Guid runGuid))
        {
            throw new ConflictException(
                $"Exec digest sponsor deep link blocked: run id '{runIdHex}' is not a valid GUID.");
        }

        return ManifestDecisionReceiptExportBinder.EnsureSealedExportReceiptVerifiedOrThrowAsync(
            runGuid,
            runIdHex.Trim(),
            authorityQueryService,
            manifestHashService,
            scope,
            cancellationToken);
    }

    private static async Task EnsureRunsSealedOrThrowAsync(
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        IReadOnlyList<Guid> runIds,
        CancellationToken cancellationToken)
    {
        foreach (Guid runId in runIds)
        {
            await ExecDigestSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}

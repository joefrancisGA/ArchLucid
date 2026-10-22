using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-25 suggestion 245: golden manifest GET/export/diagram fail-closed on sealed hash.</summary>
public static class ManifestGoldenReadSealedManifestHashGuard
{
    public static async Task EnsureGoldenManifestRunSealedHashOrThrowAsync(
        GoldenManifest manifest,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!AuthorityRunIdentifier.TryParse(manifest.RunId, out Guid runGuid))
        {
            throw new ConflictException(
                $"Manifest read blocked: run id '{manifest.RunId}' is not a valid GUID.");
        }

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runGuid, cancellationToken);

        if (detail?.GoldenManifest is null)
        {
            throw new ConflictException(
                $"Manifest read blocked for run '{manifest.RunId}': committed golden manifest is missing.");
        }

        SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
            detail.GoldenManifest,
            manifest.RunId,
            manifestHashService);
    }
}

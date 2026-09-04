using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-24 suggestion 240: export get/diff/replay fail-closed on sealed <see cref="ManifestDocument.ManifestHash"/>.</summary>
public static class RunExportSealedManifestHashGuard
{
    public static async Task EnsureRunSealedManifestHashOrThrowAsync(
        string runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!Guid.TryParse(runId, out Guid runGuid))
        {
            throw new ConflictException(
                $"Export blocked: run id '{runId}' is not a valid GUID.");
        }

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runGuid, cancellationToken);

        if (detail?.GoldenManifest is null)
        {
            throw new ConflictException(
                $"Export blocked for run '{runId}': committed golden manifest is missing.");
        }

        ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
            detail.GoldenManifest,
            runId,
            manifestHashService);
    }
}

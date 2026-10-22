using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-22 suggestion 218: governance disposition fail-closed without run-scoped sealed <see cref="ManifestDocument.ManifestHash"/>.</summary>
public static class GovernanceDispositionSealedManifestGuard
{
    public static async Task EnsureRunSealedManifestHashOrThrowAsync(
        Guid runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (runId == Guid.Empty)
            return;

        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        // Missing runs fail closed so ingest and other shared callers cannot persist against an unknown runId.
        // Stickiness HTTP maps unknown runs to 404 by loading the run itself before calling the sync helper.

        if (detail is null)
        {
            throw new ConflictException(
                $"Governance disposition blocked for run '{runId:D}': committed golden manifest is missing.");
        }

        EnsureRunSealedManifestHashOrThrow(detail.GoldenManifest, runId.ToString("D"), manifestHashService);
    }

    public static void EnsureRunSealedManifestHashOrThrow(
        ManifestDocument? goldenManifest,
        string runIdLabel,
        IManifestHashService manifestHashService)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runIdLabel);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (goldenManifest is null)
        {
            throw new ConflictException(
                $"Governance disposition blocked for run '{runIdLabel}': committed golden manifest is missing.");
        }

        ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
            goldenManifest,
            runIdLabel,
            manifestHashService);
    }

    public static async Task EnsureDistinctRunsSealedManifestHashOrThrowAsync(
        IReadOnlyList<Guid> runIds,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runIds);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        List<Guid> distinctRunIds = runIds
            .Where(runId => runId != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctRunIds.Count == 0)
            return;

        IReadOnlyList<RunManifestCompareSliceDto> slices =
            await authorityQueryService.ListRunManifestCompareSlicesAsync(scope, distinctRunIds, cancellationToken);

        Dictionary<Guid, RunManifestCompareSliceDto> sliceByRunId = slices.ToDictionary(slice => slice.RunId);

        foreach (Guid runId in distinctRunIds)
        {
            if (!sliceByRunId.TryGetValue(runId, out RunManifestCompareSliceDto? slice)
                || slice.GoldenManifest is null)
            {
                throw new ConflictException(
                    $"Governance disposition blocked for run '{runId:D}': committed golden manifest is missing.");
            }

            ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
                slice.GoldenManifest,
                runId.ToString("D"),
                manifestHashService);
        }
    }
}

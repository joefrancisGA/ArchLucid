using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

/// <summary>
///     Shared slim authority run-detail loads for internal export/compare callers (TB-931).
/// </summary>
internal static class AuthorityRunDetailInternalLoader
{
    public static async Task<RunDetailDto?> LoadForExportAsync(
        RunRecord? run,
        IDecisionTraceRepository decisionTraceRepository,
        IGoldenManifestRepository goldenManifestRepository,
        ScopeContext scope,
        CancellationToken ct)
    {
        if (run is null)
            return null;

        Task<DecisionTraceDto?> traceTask = run.DecisionTraceId.HasValue
            ? decisionTraceRepository.GetByIdAsync(scope, run.DecisionTraceId.Value, ct)
            : Task.FromResult<DecisionTraceDto?>(null);
        Task<ManifestDocument?> manifestTask = run.GoldenManifestId.HasValue
            ? goldenManifestRepository.GetByIdAsync(scope, run.GoldenManifestId.Value, ct)
            : Task.FromResult<ManifestDocument?>(null);

        await Task.WhenAll(traceTask, manifestTask);

        return new RunDetailDto
        {
            Run = run,
            AuthorityTrace = await traceTask,
            GoldenManifest = await manifestTask,
        };
    }

    public static async Task<RunDetailDto?> LoadForManifestCompareAsync(
        RunRecord? run,
        IGoldenManifestRepository goldenManifestRepository,
        ScopeContext scope,
        CancellationToken ct)
    {
        if (run is null)
            return null;

        ManifestDocument? manifest = run.GoldenManifestId.HasValue
            ? await goldenManifestRepository.GetByIdAsync(scope, run.GoldenManifestId.Value, ct)
            : null;

        return new RunDetailDto
        {
            Run = run,
            GoldenManifest = manifest,
        };
    }
}

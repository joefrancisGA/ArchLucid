using System.Text.Json;

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IRecommendationImproveLoopEvidencePersister
{
    Task PersistAsync(
        ScopeContext scope,
        Guid runId,
        RecommendationImproveLoopResult? improveLoop,
        IReadOnlyList<string>? mergedFindingIds = null,
        CancellationToken cancellationToken = default);
}

public sealed class RecommendationImproveLoopEvidencePersister(
    IRunRepository runRepository) : IRecommendationImproveLoopEvidencePersister
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task PersistAsync(
        ScopeContext scope,
        Guid runId,
        RecommendationImproveLoopResult? improveLoop,
        IReadOnlyList<string>? mergedFindingIds = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return;

        if (improveLoop is null)
        {
            run.ImproveLoopEvidenceJson = null;
            await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);

            return;
        }

        RecommendationImproveLoopEvidenceRecord? record = RecommendationImproveLoopEvidenceRecord.FromImproveLoopResult(
            improveLoop,
            mergedFindingIds ?? improveLoop.MergedFindingIds);

        run.ImproveLoopEvidenceJson = record is null
            ? null
            : JsonSerializer.Serialize(record, JsonOptions);

        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }
}

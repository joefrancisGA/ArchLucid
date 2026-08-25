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
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (improveLoop is null)
            return;

        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        if (run is null)
            return;

        run.ImproveLoopEvidenceJson = JsonSerializer.Serialize(improveLoop, JsonOptions);
        await runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }
}

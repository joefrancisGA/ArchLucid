namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

/// <summary>Closed-loop <c>recommendation</c> stage — recommendation synthesis, diff apply, and incremental re-review.</summary>
public interface IClosedLoopRecommendationStage
{
    Task ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken);
}

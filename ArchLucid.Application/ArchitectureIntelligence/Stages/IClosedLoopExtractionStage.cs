namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

/// <summary>Closed-loop <c>extraction</c> stage — source ingest and knowledge-model build.</summary>
public interface IClosedLoopExtractionStage
{
    Task ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken);
}

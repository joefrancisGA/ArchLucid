namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

/// <summary>Closed-loop <c>review</c> stage — specialist, evidence validation, and adversarial review.</summary>
public interface IClosedLoopReviewStage
{
    Task ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken);
}

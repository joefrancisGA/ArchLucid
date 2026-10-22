namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

/// <summary>Closed-loop <c>interview</c> stage — progressive framing and evidence-driven questions.</summary>
public interface IClosedLoopInterviewStage
{
    Task ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken);
}

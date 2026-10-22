using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

/// <summary>Closed-loop <c>publish</c> stage — trust gate, persistence, product publish, and cache storage.</summary>
public interface IClosedLoopPublishStage
{
    Task<ClosedLoopReasoningResult> ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken);
}

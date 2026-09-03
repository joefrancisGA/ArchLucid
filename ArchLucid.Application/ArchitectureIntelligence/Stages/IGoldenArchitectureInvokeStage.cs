using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public interface IGoldenArchitectureInvokeStage
{
    Task<GoldenArchitectureInvokeStageResult> InvokeAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default);
}

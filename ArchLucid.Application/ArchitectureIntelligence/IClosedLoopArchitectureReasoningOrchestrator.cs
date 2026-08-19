using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IClosedLoopArchitectureReasoningOrchestrator
{
    Task<ClosedLoopReasoningResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default);
}

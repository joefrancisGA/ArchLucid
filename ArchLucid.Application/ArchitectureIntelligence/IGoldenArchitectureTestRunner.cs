using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IGoldenArchitectureTestRunner
{
    Task<GoldenArchitectureTestResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default);
}

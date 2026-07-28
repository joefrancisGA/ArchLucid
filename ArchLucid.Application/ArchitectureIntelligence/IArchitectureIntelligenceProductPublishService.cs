using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureIntelligenceProductPublishService
{
    Task<ArchitectureIntelligencePublishResult> PublishAsync(
        ClosedLoopReasoningResult result,
        string tenantId,
        string workspaceId,
        string projectId,
        string runId,
        CancellationToken cancellationToken = default);
}

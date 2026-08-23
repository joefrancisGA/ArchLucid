using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Application.Governance.Posture;

public interface IArchitecturePostureService
{
    Task<ArchitecturePostureSummary> GetSummaryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        bool packAssignmentsAvailable = true,
        CancellationToken cancellationToken = default);
}

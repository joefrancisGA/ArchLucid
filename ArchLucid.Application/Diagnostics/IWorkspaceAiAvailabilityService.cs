using ArchLucid.Contracts.Diagnostics;

namespace ArchLucid.Application.Diagnostics;

/// <summary>Live workspace-scoped AI availability probes for review failure recovery UI.</summary>
public interface IWorkspaceAiAvailabilityService
{
    Task<WorkspaceAiAvailabilityResponse> ProbeAsync(CancellationToken cancellationToken = default);
}

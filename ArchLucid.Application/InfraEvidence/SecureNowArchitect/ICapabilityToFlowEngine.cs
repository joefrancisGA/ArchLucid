using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public interface ICapabilityToFlowEngine
{
    Task<PrivilegePathEngineResult> RunAsync(
        ScopeContext scope,
        Guid snapshotId,
        string actorId,
        CancellationToken cancellationToken = default);
}

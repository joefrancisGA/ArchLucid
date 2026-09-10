using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public interface IToxicCombinationEngine
{
    Task<PrivilegePathEngineResult> RunAsync(
        ScopeContext scope,
        Guid snapshotId,
        string actorId,
        CancellationToken cancellationToken = default,
        SecureNowArchitectEngineRunScope? runScope = null);
}

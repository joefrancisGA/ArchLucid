using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Current caller's run-share decision for run citations found during an infrastructure evidence read.</summary>
public interface IInfraEvidenceRunReadAccess
{
    Task<bool> CanReadRunAsync(ScopeContext scope, Guid runId, CancellationToken cancellationToken);
}

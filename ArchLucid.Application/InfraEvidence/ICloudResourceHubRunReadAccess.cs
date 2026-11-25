using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Current caller's run-share decision for run citations found during an Evidence Hub read.</summary>
public interface ICloudResourceHubRunReadAccess
{
    Task<bool> CanReadRunAsync(ScopeContext scope, Guid runId, CancellationToken cancellationToken);
}

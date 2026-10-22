using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public interface IRemediationPathNarrativeBuilder
{
    Task<RemediationPathNarrative?> TryBuildAsync(
        ScopeContext scope,
        OperationalSecurityFindingRecord finding,
        RemediationPatternVersionRecord patternVersion,
        CancellationToken cancellationToken = default);
}

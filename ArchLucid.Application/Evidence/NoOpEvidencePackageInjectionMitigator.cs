using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Evidence;

/// <summary>Pass-through mitigator for tests and hosts that disable evidence mutation.</summary>
public sealed class NoOpEvidencePackageInjectionMitigator : IEvidencePackageInjectionMitigator
{
    /// <inheritdoc />
    public Task<int> RedactKnownInjectionPatternsAsync(AgentEvidencePackage evidence, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(0);
    }
}

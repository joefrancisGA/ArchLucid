using ArchLucid.Contracts.Agents;

namespace ArchLucid.Application.Evidence;

/// <summary>
///     Applies deterministic injection-pattern mitigation to evidence text fields that flow into agent prompts.
/// </summary>
public interface IEvidencePackageInjectionMitigator
{
    /// <summary>
    ///     Redacts fields whose text matches shared injection heuristics; returns the number of scalar fields rewritten.
    /// </summary>
    Task<int> RedactKnownInjectionPatternsAsync(AgentEvidencePackage evidence, CancellationToken cancellationToken);
}

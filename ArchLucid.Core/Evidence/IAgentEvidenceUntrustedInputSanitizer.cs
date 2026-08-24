using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Core.Evidence;

/// <summary>Wraps untrusted cloud metadata before LLM prompts are built.</summary>
public interface IAgentEvidenceUntrustedInputSanitizer
{
    /// <summary>
    ///     Sanitizes free-text and tag fields on the evidence package and the live
    ///     <see cref="ArchitectureRequest" /> used to compose agent user prompts.
    /// </summary>
    Task SanitizeAsync(
        AgentEvidencePackage evidence,
        ArchitectureRequest request,
        CancellationToken cancellationToken = default);
}

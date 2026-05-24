using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.Application.Evidence;

/// <summary>Wraps untrusted cloud metadata before LLM prompts are built.</summary>
public interface IAgentEvidenceUntrustedInputSanitizer
{
    /// <summary>Sanitizes free-text and tag fields on the evidence package in place.</summary>
    Task SanitizeAsync(AgentEvidencePackage evidence, CancellationToken cancellationToken = default);
}

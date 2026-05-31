using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Evidence;

namespace ArchLucid.Application.Evidence;

/// <summary>No-op sanitizer for tests and disabled deployments.</summary>
public sealed class NoOpAgentEvidenceUntrustedInputSanitizer : IAgentEvidenceUntrustedInputSanitizer
{
    /// <inheritdoc />
    public Task SanitizeAsync(AgentEvidencePackage evidence, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

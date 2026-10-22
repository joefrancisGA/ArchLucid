using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Trust;

namespace ArchLucid.Application.Trust;

/// <summary>Builds <see cref="RunTrustEvidenceCard" /> for committed architecture runs (read-only; no new persistence).</summary>
public interface IRunTrustEvidenceCardBuilder
{
    Task<RunTrustEvidenceCard?> BuildAsync(
        ArchitectureRunDetail detail,
        string? hostAgentExecutionMode,
        CancellationToken cancellationToken);
}

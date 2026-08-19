using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IEvidenceValidationPipeline
{
    EvidenceValidationResult Validate(
        string findingId,
        IReadOnlyList<string> citedArtifactIds,
        IReadOnlyList<string> citedQuotes,
        IImmutableSourceStore sourceStore,
        string claimedConclusion);

    Task<EvidenceValidationResult> ValidateAsync(
        string findingId,
        IReadOnlyList<string> citedArtifactIds,
        IReadOnlyList<string> citedQuotes,
        IImmutableSourceStore sourceStore,
        string claimedConclusion,
        CancellationToken cancellationToken = default);
}

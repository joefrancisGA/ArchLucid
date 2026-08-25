using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Concurrency;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface ISpecialistFindingsSubstantiationService
{
    Task<SpecialistFindingsSubstantiationResult> SubstantiateAsync(
        IReadOnlyList<SpecialistReviewFinding> specialistFindings,
        CancellationToken cancellationToken = default);
}

public sealed class SpecialistFindingsSubstantiationResult
{
    public IReadOnlyList<SpecialistReviewFinding> SubstantiatedFindings
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AdversarialChallenge> Challenges
    {
        get;
        init;
    } = [];
}

public sealed class SpecialistFindingsSubstantiationService(
    IEvidenceValidationPipeline evidenceValidationPipeline,
    IAsyncAdversarialReviewService adversarialReviewService,
    IImmutableSourceStore sourceStore) : ISpecialistFindingsSubstantiationService
{
    private const int EvidenceValidationMaxConcurrent = 4;

    private readonly IEvidenceValidationPipeline _evidenceValidationPipeline =
        evidenceValidationPipeline ?? throw new ArgumentNullException(nameof(evidenceValidationPipeline));

    private readonly IAsyncAdversarialReviewService _adversarialReviewService =
        adversarialReviewService ?? throw new ArgumentNullException(nameof(adversarialReviewService));

    private readonly IImmutableSourceStore _sourceStore =
        sourceStore ?? throw new ArgumentNullException(nameof(sourceStore));

    public async Task<SpecialistFindingsSubstantiationResult> SubstantiateAsync(
        IReadOnlyList<SpecialistReviewFinding> specialistFindings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(specialistFindings);

        if (specialistFindings.Count == 0)
            return new SpecialistFindingsSubstantiationResult();

        List<EvidenceValidationResult> validationResults = await ValidateFindingsAsync(
            specialistFindings,
            cancellationToken).ConfigureAwait(false);

        Dictionary<string, EvidenceValidationResult> validationByFindingId = validationResults
            .ToDictionary(result => result.FindingId, StringComparer.Ordinal);

        foreach (SpecialistReviewFinding finding in specialistFindings)
        {
            if (!validationByFindingId.TryGetValue(finding.FindingId, out EvidenceValidationResult? validation))
                continue;

            EvidenceSupportTierResolver.ApplyToFinding(finding, validation);
        }

        HashSet<string> integrityPassedIds = validationResults
            .Where(result => result.OverallPassedIntegrity)
            .Select(result => result.FindingId)
            .ToHashSet(StringComparer.Ordinal);

        AdversarialReviewResult adversarial = await _adversarialReviewService
            .ReviewAsync(specialistFindings, integrityPassedIds, cancellationToken)
            .ConfigureAwait(false);

        return new SpecialistFindingsSubstantiationResult
        {
            SubstantiatedFindings = adversarial.SubstantiatedFindings,
            Challenges = adversarial.Challenges,
        };
    }

    private async Task<List<EvidenceValidationResult>> ValidateFindingsAsync(
        IReadOnlyList<SpecialistReviewFinding> findings,
        CancellationToken cancellationToken)
    {
        EvidenceValidationResult[] validationResults = await BoundedParallelMap.MapAsync(
            findings,
            EvidenceValidationMaxConcurrent,
            async (finding, ct) =>
            {
                List<string> citedArtifactIds = finding.EvidenceArtifactIds
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct(StringComparer.Ordinal)
                    .ToList();

                List<string> citedQuotes = [];

                if (finding.Provenance.PassageLocator is not null
                    && !string.IsNullOrWhiteSpace(finding.Provenance.PassageLocator.Quote))
                {
                    citedQuotes.Add(finding.Provenance.PassageLocator.Quote);
                }

                citedQuotes = EvidenceValidationSourceReread.AugmentCitedQuotesForHighSeverity(
                    finding,
                    citedQuotes,
                    _sourceStore);

                string claimedConclusion = $"{finding.Conclusion}:{finding.Severity}:{finding.Title}";

                return await _evidenceValidationPipeline.ValidateAsync(
                    finding.FindingId,
                    citedArtifactIds,
                    citedQuotes,
                    _sourceStore,
                    claimedConclusion,
                    ct).ConfigureAwait(false);
            },
            cancellationToken).ConfigureAwait(false);

        return validationResults.ToList();
    }
}

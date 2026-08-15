using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// LLM-backed adversarial lane with heuristic fallback (mirrors specialist pattern).
/// </summary>
public sealed class LlmBackedAdversarialReviewService : IAsyncAdversarialReviewService
{
    private readonly IArchitectureIntelligenceLlmGateway _gateway;
    private readonly AdversarialReviewService _heuristicService;

    public LlmBackedAdversarialReviewService(
        IArchitectureIntelligenceLlmGateway gateway,
        AdversarialReviewService heuristicService)
    {
        _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
        _heuristicService = heuristicService ?? throw new ArgumentNullException(nameof(heuristicService));
    }

    public async Task<AdversarialReviewResult> ReviewAsync(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlySet<string>? integrityPassedFindingIds = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findings);

        AdversarialReviewResult heuristic = _heuristicService.Review(findings, integrityPassedFindingIds);

        List<SpecialistReviewFinding> challengeCandidates = findings
            .Where(finding => integrityPassedFindingIds is null
                || !integrityPassedFindingIds.Contains(finding.FindingId))
            .Where(finding => finding.Conclusion != ReviewConclusion.Pass)
            .ToList();

        if (integrityPassedFindingIds is not null)
        {
            foreach (SpecialistReviewFinding finding in findings)
            {
                if (!integrityPassedFindingIds.Contains(finding.FindingId))
                {
                    continue;
                }

                if (!SelectiveHighSeverityAdversarialPolicy.RequiresRecheck(finding))
                {
                    continue;
                }

                challengeCandidates.Add(finding);
            }
        }

        if (challengeCandidates.Count == 0)
        {
            return heuristic;
        }

        IReadOnlyList<AdversarialChallenge>? llmChallenges =
            await _gateway.GenerateAdversarialChallengesAsync(challengeCandidates, cancellationToken);

        if (llmChallenges is null || llmChallenges.Count == 0)
        {
            return heuristic;
        }

        List<AdversarialChallenge> mergedChallenges = llmChallenges
            .Where(challenge => !challenge.Suppressed)
            .Where(challenge => !string.IsNullOrWhiteSpace(challenge.FalsificationEvidenceNeeded))
            .ToList();

        List<AdversarialChallenge> selectiveChallenges = heuristic.Challenges
            .Where(challenge => !string.IsNullOrWhiteSpace(challenge.SourceFindingId))
            .Where(challenge =>
                challenge.Hypothesis.StartsWith("Selective High/Critical re-check:", StringComparison.Ordinal))
            .ToList();

        foreach (AdversarialChallenge selective in selectiveChallenges)
        {
            if (mergedChallenges.Any(challenge =>
                    string.Equals(challenge.SourceFindingId, selective.SourceFindingId, StringComparison.Ordinal)))
            {
                continue;
            }

            mergedChallenges.Add(selective);
        }

        if (mergedChallenges.Count == 0)
        {
            return heuristic;
        }

        return new AdversarialReviewResult
        {
            SubstantiatedFindings = heuristic.SubstantiatedFindings,
            Challenges = mergedChallenges,
            FalsePositiveRateByLane = heuristic.FalsePositiveRateByLane,
        };
    }

    public IReadOnlyList<string> ToOpenQuestions(AdversarialReviewResult adversarialResult)
    {
        return _heuristicService.ToOpenQuestions(adversarialResult);
    }
}

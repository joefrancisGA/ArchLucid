using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class AdversarialReviewService : IAdversarialReviewService
{
    public AdversarialReviewResult Review(IReadOnlyList<SpecialistReviewFinding> findings)
    {
        return Review(findings, integrityPassedFindingIds: null);
    }

    public AdversarialReviewResult Review(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlySet<string>? integrityPassedFindingIds)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<SpecialistReviewFinding> substantiatedFindings = [];
        List<AdversarialChallenge> challenges = [];

        foreach (SpecialistReviewFinding finding in findings)
        {
            bool substantiated = integrityPassedFindingIds?.Contains(finding.FindingId) == true;

            if (substantiated)
            {
                substantiatedFindings.Add(finding);

                if (SelectiveHighSeverityAdversarialPolicy.RequiresRecheck(finding))
                {
                    challenges.Add(SelectiveHighSeverityAdversarialPolicy.CreateRecheckChallenge(finding));
                }

                continue;
            }

            AdversarialChallenge challenge = CreateChallenge(finding);

            if (AdversarialChallengeLaneGuard.ShouldDropChallenge(challenge))
                continue;

            challenges.Add(challenge);
        }

        return new AdversarialReviewResult
        {
            SubstantiatedFindings = substantiatedFindings,
            Challenges = challenges,
            // No independently adjudicated labels are available for this review.
        };
    }

    public IReadOnlyList<string> ToOpenQuestions(AdversarialReviewResult adversarialResult)
    {
        ArgumentNullException.ThrowIfNull(adversarialResult);

        return adversarialResult.Challenges
            .Where(challenge => !challenge.Suppressed)
            .Select(challenge =>
                $"{challenge.Hypothesis} — falsify/confirm with: {challenge.FalsificationEvidenceNeeded}")
            .ToList();
    }

    private static AdversarialChallenge CreateChallenge(SpecialistReviewFinding finding)
    {
        string falsificationEvidence = BuildFalsificationEvidenceNeeded(finding);
        bool suppressed = string.IsNullOrWhiteSpace(falsificationEvidence);

        return new AdversarialChallenge
        {
            ChallengeId = Guid.NewGuid().ToString("N"),
            SourceFindingId = finding.FindingId,
            Hypothesis = $"Challenge finding: {finding.Title}",
            FalsificationEvidenceNeeded = falsificationEvidence,
            Confidence = finding.Confidence,
            Lane = AdversarialLane.AdversarialChallenge,
            Suppressed = suppressed,
            SuppressionReason = suppressed
                ? "Challenge suppressed because falsification evidence was not specified."
                : null,
        };
    }

    private static string BuildFalsificationEvidenceNeeded(SpecialistReviewFinding finding)
    {
        if (finding.Conclusion == ReviewConclusion.Pass)
        {
            return string.Empty;
        }

        return $"Provide artifact-backed evidence that disproves or supports: {finding.Rationale}";
    }
}

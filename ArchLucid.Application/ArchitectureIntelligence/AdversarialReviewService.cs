using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class AdversarialReviewService : IAdversarialReviewService
{
    public AdversarialReviewResult Review(IReadOnlyList<SpecialistReviewFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<SpecialistReviewFinding> substantiatedFindings = [];
        List<AdversarialChallenge> challenges = [];

        foreach (SpecialistReviewFinding finding in findings)
        {
            if (finding.EvidenceArtifactIds.Count > 0)
            {
                substantiatedFindings.Add(finding);
                continue;
            }

            AdversarialChallenge challenge = CreateChallenge(finding);
            challenges.Add(challenge);
        }

        return new AdversarialReviewResult
        {
            SubstantiatedFindings = substantiatedFindings,
            Challenges = challenges.Where(challenge => !challenge.Suppressed).ToList(),
            FalsePositiveRateByLane = new Dictionary<AdversarialLane, double>
            {
                [AdversarialLane.SubstantiatedFinding] = 0.0,
                [AdversarialLane.AdversarialChallenge] = 0.0,
            },
        };
    }

    private static AdversarialChallenge CreateChallenge(SpecialistReviewFinding finding)
    {
        string falsificationEvidence = BuildFalsificationEvidenceNeeded(finding);
        bool suppressed = string.IsNullOrWhiteSpace(falsificationEvidence);

        return new AdversarialChallenge
        {
            ChallengeId = Guid.NewGuid().ToString("N"),
            Hypothesis = $"Challenge finding: {finding.Title}",
            FalsificationEvidenceNeeded = falsificationEvidence,
            Confidence = finding.Confidence,
            Lane = AdversarialLane.AdversarialChallenge,
            Suppressed = suppressed,
            SuppressionReason = suppressed ? "Challenge suppressed because falsification evidence was not specified." : null,
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

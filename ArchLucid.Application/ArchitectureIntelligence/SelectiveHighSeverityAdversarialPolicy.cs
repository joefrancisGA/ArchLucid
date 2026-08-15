using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Selective adversarial re-check for substantiated High/Critical findings (TB-2340 item 45).</summary>
internal static class SelectiveHighSeverityAdversarialPolicy
{
    internal static bool RequiresRecheck(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.Conclusion == ReviewConclusion.Pass)
        {
            return false;
        }

        return IsHighOrCriticalSeverity(finding.Severity);
    }

    internal static bool IsHighOrCriticalSeverity(string severity)
    {
        return severity.Equals("Critical", StringComparison.OrdinalIgnoreCase)
            || severity.Equals("High", StringComparison.OrdinalIgnoreCase);
    }

    internal static AdversarialChallenge CreateRecheckChallenge(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return new AdversarialChallenge
        {
            ChallengeId = Guid.NewGuid().ToString("N"),
            SourceFindingId = finding.FindingId,
            Hypothesis = $"Selective High/Critical re-check: {finding.Title}",
            FalsificationEvidenceNeeded =
                $"Provide artifact-backed evidence that substantiates or falsifies this {finding.Severity} finding: {finding.Rationale}",
            Confidence = finding.Confidence,
            Lane = AdversarialLane.AdversarialChallenge,
            Suppressed = false,
        };
    }
}

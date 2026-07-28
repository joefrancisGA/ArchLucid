using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class MustNotFailEnforcer : IMustNotFailEnforcer
{
    private static readonly string[] CloudProviderNames = ["Azure", "AWS", "GCP"];

    public IReadOnlyList<MustNotFailViolation> Evaluate(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(recommendations);

        List<MustNotFailViolation> violations = [];

        violations.AddRange(findings.SelectMany(EvaluateFinding));
        violations.AddRange(recommendations.SelectMany(EvaluateRecommendation));

        return violations;
    }

    private static IEnumerable<MustNotFailViolation> EvaluateFinding(SpecialistReviewFinding finding)
    {
        if (finding.Provenance.SupportStatus == SupportStatus.DirectlyEstablished)
        {
            foreach (string artifactId in finding.EvidenceArtifactIds)
            {
                if (string.IsNullOrWhiteSpace(artifactId)
                    || !artifactId.StartsWith(ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix, StringComparison.Ordinal))
                {
                    yield return new MustNotFailViolation
                    {
                        Class = MustNotFailClass.FabricatedCitation,
                        Message = $"Finding '{finding.Title}' cites an invalid artifact id '{artifactId}'.",
                        Blocked = true,
                    };
                }
            }

            if (finding.EvidenceArtifactIds.Count == 0)
            {
                yield return new MustNotFailViolation
                {
                    Class = MustNotFailClass.FabricatedCitation,
                    Message = $"Finding '{finding.Title}' claims DirectlyEstablished support without artifact ids.",
                    Blocked = true,
                };
            }
        }

        if (ContainsInventedRegulation(finding.Rationale, finding.Provenance))
        {
            yield return new MustNotFailViolation
            {
                Class = MustNotFailClass.InventedRegulation,
                Message = $"Finding '{finding.Title}' appears to invent a regulatory citation.",
                Blocked = true,
            };
        }
    }

    private static IEnumerable<MustNotFailViolation> EvaluateRecommendation(ArchitectureRecommendation recommendation)
    {
        if (MentionsCloudProvider(recommendation.ProposedChange)
            && !ContainsAssumptionNote(recommendation))
        {
            yield return new MustNotFailViolation
            {
                Class = MustNotFailClass.UnlabeledCloudSpecificRecommendation,
                Message = $"Recommendation '{recommendation.Problem}' mentions a cloud provider without an explicit assumption note.",
                Blocked = true,
            };
        }

        if (ContainsInventedRegulation(recommendation.Evidence, recommendation.Provenance))
        {
            yield return new MustNotFailViolation
            {
                Class = MustNotFailClass.InventedRegulation,
                Message = $"Recommendation '{recommendation.Problem}' appears to invent a regulatory citation.",
                Blocked = true,
            };
        }
    }

    private static bool ContainsInventedRegulation(string text, ClaimProvenance provenance)
    {
        if (!text.Contains("requires GDPR Article", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return provenance.Origin != ClaimOrigin.ExternallySourced;
    }

    private static bool MentionsCloudProvider(string text)
    {
        return CloudProviderNames.Any(provider => text.Contains(provider, StringComparison.OrdinalIgnoreCase));
    }

    private static bool ContainsAssumptionNote(ArchitectureRecommendation recommendation)
    {
        if (recommendation.Provenance.Notes is not null
            && recommendation.Provenance.Notes.Contains("assumption", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return recommendation.Alternatives.Any(
            alternative => alternative.Contains("assumption", StringComparison.OrdinalIgnoreCase));
    }
}

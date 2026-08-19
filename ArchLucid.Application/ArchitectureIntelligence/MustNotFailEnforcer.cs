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
        violations.AddRange(DetectContradictoryArtifacts(findings));

        return violations;
    }

    private static IEnumerable<MustNotFailViolation> EvaluateFinding(SpecialistReviewFinding finding)
    {
        if (finding.Provenance.SupportStatus == SupportStatus.DirectlyEstablished)
        {
            foreach (string artifactId in finding.EvidenceArtifactIds)
            {
                if (string.IsNullOrWhiteSpace(artifactId)
                    || !artifactId.StartsWith(
                        ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix,
                        StringComparison.Ordinal))
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

        if (TreatsAbsenceAsDefect(finding))
        {
            yield return new MustNotFailViolation
            {
                Class = MustNotFailClass.AbsenceTreatedAsDefect,
                Message =
                    $"Finding '{finding.Title}' treats missing information as a confirmed defect without an Indeterminate/Insufficient state.",
                Blocked = true,
            };
        }

        if (SilentlyOverridesApprovedDecision(finding))
        {
            yield return new MustNotFailViolation
            {
                Class = MustNotFailClass.SilentOverrideOfApprovedDecision,
                Message =
                    $"Finding '{finding.Title}' appears to override an approved decision without an ExceptionGranted disposition.",
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
                Message =
                    $"Recommendation '{recommendation.Problem}' mentions a cloud provider without an explicit assumption note.",
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

        if (SilentlyOverridesApprovedDecision(recommendation))
        {
            yield return new MustNotFailViolation
            {
                Class = MustNotFailClass.SilentOverrideOfApprovedDecision,
                Message =
                    $"Recommendation '{recommendation.Problem}' appears to override an approved decision without explicit approval.",
                Blocked = true,
            };
        }
    }

    private static IEnumerable<MustNotFailViolation> DetectContradictoryArtifacts(
        IReadOnlyList<SpecialistReviewFinding> findings)
    {
        List<SpecialistReviewFinding> withEvidence = findings
            .Where(finding => finding.EvidenceArtifactIds.Count > 0)
            .ToList();

        for (int leftIndex = 0; leftIndex < withEvidence.Count; leftIndex++)
        {
            SpecialistReviewFinding left = withEvidence[leftIndex];

            for (int rightIndex = leftIndex + 1; rightIndex < withEvidence.Count; rightIndex++)
            {
                SpecialistReviewFinding right = withEvidence[rightIndex];
                bool sharesArtifact = left.EvidenceArtifactIds
                    .Intersect(right.EvidenceArtifactIds, StringComparer.Ordinal)
                    .Any();

                if (!sharesArtifact)
                {
                    continue;
                }

                if (left.Conclusion == ReviewConclusion.Pass && right.Conclusion == ReviewConclusion.Fail
                    || left.Conclusion == ReviewConclusion.Fail && right.Conclusion == ReviewConclusion.Pass)
                {
                    yield return new MustNotFailViolation
                    {
                        Class = MustNotFailClass.ContradictoryArtifacts,
                        Message =
                            $"Findings '{left.Title}' and '{right.Title}' reach opposite conclusions from overlapping evidence artifacts.",
                        Blocked = true,
                    };
                }
            }
        }
    }

    private static bool TreatsAbsenceAsDefect(SpecialistReviewFinding finding)
    {
        if (finding.Conclusion is ReviewConclusion.Indeterminate or ReviewConclusion.Pass)
        {
            return false;
        }

        if (finding.EvidenceCondition is EvidenceCondition.Insufficient or EvidenceCondition.Unverified)
        {
            // Honest insufficient/absent evidence with Fail is the anti-pattern: absence as defect.
            return finding.Conclusion == ReviewConclusion.Fail
                && (finding.Rationale.Contains("no ", StringComparison.OrdinalIgnoreCase)
                    || finding.Rationale.Contains("missing", StringComparison.OrdinalIgnoreCase)
                    || finding.Rationale.Contains("not found", StringComparison.OrdinalIgnoreCase)
                    || finding.Rationale.Contains("absent", StringComparison.OrdinalIgnoreCase));
        }

        return false;
    }

    private static bool SilentlyOverridesApprovedDecision(SpecialistReviewFinding finding)
    {
        bool mentionsApprovedDecision = finding.Rationale.Contains("approved decision", StringComparison.OrdinalIgnoreCase)
            || finding.Title.Contains("override approved", StringComparison.OrdinalIgnoreCase);

        if (!mentionsApprovedDecision)
        {
            return false;
        }

        return finding.GovernanceDisposition != GovernanceDisposition.ExceptionGranted;
    }

    private static bool SilentlyOverridesApprovedDecision(ArchitectureRecommendation recommendation)
    {
        bool mentionsApprovedDecision = recommendation.ProposedChange.Contains(
                "override approved decision",
                StringComparison.OrdinalIgnoreCase)
            || recommendation.Problem.Contains("override approved", StringComparison.OrdinalIgnoreCase);

        if (!mentionsApprovedDecision)
        {
            return false;
        }

        return recommendation.Provenance.Origin != ClaimOrigin.HumanApproved;
    }

    private static bool ContainsInventedRegulation(string text, ClaimProvenance provenance)
    {
        if (!text.Contains("requires GDPR Article", StringComparison.OrdinalIgnoreCase)
            && !text.Contains("HIPAA §", StringComparison.OrdinalIgnoreCase)
            && !text.Contains("PCI-DSS Requirement", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // Externally sourced with Unverified notes is allowed when explicitly labeled unverified.
        if (provenance.Origin == ClaimOrigin.ExternallySourced
            && provenance.Notes is not null
            && provenance.Notes.Contains("unverified", StringComparison.OrdinalIgnoreCase))
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
        if (ContainsAssumptionToken(recommendation.Provenance.Notes))
        {
            return true;
        }

        if (recommendation.AlternativeOptions is not null
            && recommendation.AlternativeOptions.Any(option =>
                ContainsAssumptionToken(option.Path)
                || ContainsAssumptionToken(option.ValidationCriteria)))
        {
            return true;
        }

        return recommendation.Alternatives is not null
            && recommendation.Alternatives.Any(ContainsAssumptionToken);
    }

    private static bool ContainsAssumptionToken(string? text)
    {
        return text is not null
            && text.Contains("assumption", StringComparison.OrdinalIgnoreCase);
    }
}

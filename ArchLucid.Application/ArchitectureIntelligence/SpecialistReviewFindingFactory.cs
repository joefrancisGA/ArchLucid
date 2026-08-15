using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Shared specialist finding builders (TB-2338).</summary>
internal static class SpecialistReviewFindingFactory
{
    internal static SpecialistReviewFinding CreatePassFinding(
        ArchitectureKnowledgeModel model,
        QualityDimension dimension,
        string title,
        string rationale,
        ArchitectureModelElement? supportingElement = null)
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Dimension = dimension,
            Title = title,
            Rationale = rationale,
            Conclusion = ReviewConclusion.Pass,
            EvidenceCondition = EvidenceCondition.Sufficient,
            GovernanceDisposition = GovernanceDisposition.Open,
            Confidence = 0.8,
            Severity = "Low",
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.ModelInferred,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = 0.8,
            },
        };

        return AttachModelEvidence(finding, model, supportingElement);
    }

    internal static SpecialistReviewFinding CreateIndeterminateFinding(
        ArchitectureKnowledgeModel model,
        QualityDimension dimension,
        string title,
        string rationale)
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Dimension = dimension,
            Title = title,
            Rationale = rationale,
            Conclusion = ReviewConclusion.Indeterminate,
            EvidenceCondition = EvidenceCondition.Insufficient,
            GovernanceDisposition = GovernanceDisposition.Open,
            Confidence = 0.5,
            Severity = "Medium",
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.ModelInferred,
                SupportStatus = SupportStatus.Unsupported,
                Confidence = 0.5,
                Notes = "Insufficient evidence; absence is not treated as a confirmed defect.",
            },
        };

        return AttachModelEvidence(finding, model, supportingElement: null);
    }

    internal static SpecialistReviewFinding CreateFailFinding(
        ArchitectureKnowledgeModel model,
        QualityDimension dimension,
        string title,
        string rationale,
        string severity)
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Dimension = dimension,
            Title = title,
            Rationale = rationale,
            Conclusion = ReviewConclusion.Fail,
            EvidenceCondition = EvidenceCondition.Sufficient,
            GovernanceDisposition = GovernanceDisposition.Open,
            Confidence = 0.75,
            Severity = severity,
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.ModelInferred,
                SupportStatus = SupportStatus.PartiallySupported,
                Confidence = 0.75,
                Notes = "Inferred from extracted model fields against stated constraints.",
            },
        };

        return AttachModelEvidence(finding, model, supportingElement: null);
    }

    private static SpecialistReviewFinding AttachModelEvidence(
        SpecialistReviewFinding finding,
        ArchitectureKnowledgeModel model,
        ArchitectureModelElement? supportingElement)
    {
        List<string> artifactIds = [];

        if (supportingElement is not null)
        {
            artifactIds.AddRange(supportingElement.SourcePassageIds);
        }

        if (artifactIds.Count == 0)
        {
            artifactIds.AddRange(
                model.Elements
                    .SelectMany(element => element.SourcePassageIds)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct(StringComparer.Ordinal)
                    .Take(2));
        }

        finding.EvidenceArtifactIds = artifactIds;

        if (artifactIds.Count > 0 && finding.Provenance.SupportStatus == SupportStatus.IndirectlySupported)
        {
            finding.Provenance.SupportStatus = SupportStatus.PartiallySupported;
            finding.Provenance.Origin = ClaimOrigin.DirectlyExtracted;
        }

        return finding;
    }
}

using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class SpecialistReviewService : ISpecialistReviewService
{
    private static readonly IReadOnlyList<QualityDimension> DefaultDimensions =
    [
        QualityDimension.Reliability,
        QualityDimension.Security,
        QualityDimension.Cost,
    ];

    public SpecialistReviewResult Review(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<QualityDimension>? dimensions = null)
    {
        ArgumentNullException.ThrowIfNull(model);

        IReadOnlyList<QualityDimension> reviewDimensions = dimensions ?? DefaultDimensions;
        List<SpecialistReviewFinding> findings = [];
        List<string> openQuestions = [];

        foreach (QualityDimension dimension in reviewDimensions)
        {
            findings.AddRange(ReviewDimension(model, dimension, openQuestions));
        }

        return new SpecialistReviewResult
        {
            Dimension = reviewDimensions.First(),
            Findings = findings,
            OpenQuestions = openQuestions,
        };
    }

    private static IEnumerable<SpecialistReviewFinding> ReviewDimension(
        ArchitectureKnowledgeModel model,
        QualityDimension dimension,
        List<string> openQuestions)
    {
        switch (dimension)
        {
            case QualityDimension.Reliability:
                yield return ReviewReliability(model, openQuestions);
                break;
            case QualityDimension.Security:
                yield return ReviewSecurity(model, openQuestions);
                break;
            case QualityDimension.Cost:
                yield return ReviewCost(model, openQuestions);
                break;
            default:
                yield return CreateIndeterminateFinding(
                    model,
                    dimension,
                    $"No specialist rules configured for {dimension}.",
                    "Specialist coverage is not yet implemented for this dimension.");
                break;
        }
    }

    private static SpecialistReviewFinding ReviewReliability(
        ArchitectureKnowledgeModel model,
        List<string> openQuestions)
    {
        ArchitectureModelElement? recoveryObjective = model.Elements.FirstOrDefault(
            element => element.Kind == ArchitectureElementKind.RecoveryObjective);

        if (recoveryObjective is not null)
        {
            return CreatePassFinding(
                model,
                QualityDimension.Reliability,
                "Recovery objectives are documented.",
                "At least one recovery objective element exists in the model.",
                recoveryObjective);
        }

        openQuestions.Add("What are the RTO/RPO targets for critical workloads?");

        return CreateIndeterminateFinding(
            model,
            QualityDimension.Reliability,
            "Recovery objectives are missing",
            "No RecoveryObjective element was extracted from the available sources.");
    }

    private static SpecialistReviewFinding ReviewSecurity(
        ArchitectureKnowledgeModel model,
        List<string> openQuestions)
    {
        ArchitectureModelElement? publicEndpoint = model.Elements.FirstOrDefault(
            element => element.Kind == ArchitectureElementKind.Interface
                && element.Name.Contains("public", StringComparison.OrdinalIgnoreCase));

        bool hasTrustBoundary = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.TrustBoundary);

        if (publicEndpoint is not null && !hasTrustBoundary)
        {
            openQuestions.Add("How is the public endpoint authenticated and authorized?");

            return AttachModelEvidence(
                new SpecialistReviewFinding
                {
                    FindingId = Guid.NewGuid().ToString("N"),
                    Dimension = QualityDimension.Security,
                    Title = "Public endpoint lacks documented trust boundary",
                    Rationale = "A public endpoint was identified without a corresponding trust boundary element.",
                    Conclusion = ReviewConclusion.Fail,
                    // Model contains the public interface element — evidence is model-derived, not absent.
                    EvidenceCondition = EvidenceCondition.Sufficient,
                    // Conclusion ≠ disposition: Fail stays Open until a human accepts/exceptions.
                    GovernanceDisposition = GovernanceDisposition.Open,
                    Confidence = 0.7,
                    Severity = "High",
                    Provenance = new ClaimProvenance
                    {
                        Origin = ClaimOrigin.ModelInferred,
                        SupportStatus = SupportStatus.PartiallySupported,
                        Confidence = 0.7,
                        Notes = "Inferred from model elements; support is partial until source passages are cited.",
                    },
                },
                model,
                publicEndpoint);
        }

        return CreatePassFinding(
            model,
            QualityDimension.Security,
            "No immediate public exposure gap detected",
            "Security review did not identify a public endpoint without trust boundary context.");
    }

    private static SpecialistReviewFinding ReviewCost(
        ArchitectureKnowledgeModel model,
        List<string> openQuestions)
    {
        ArchitectureModelElement? costDriver = model.Elements.FirstOrDefault(
            element => element.Kind == ArchitectureElementKind.CostDriver);

        if (costDriver is not null)
        {
            return CreatePassFinding(
                model,
                QualityDimension.Cost,
                "Cost drivers are documented.",
                "At least one cost driver element exists in the model.",
                costDriver);
        }

        openQuestions.Add("What are the primary cost drivers for this architecture?");

        return CreateIndeterminateFinding(
            model,
            QualityDimension.Cost,
            "Cost drivers are missing",
            "No CostDriver element was extracted from the available sources.");
    }

    private static SpecialistReviewFinding CreatePassFinding(
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
            // Pass is a review conclusion, not a governance acceptance (TB-1985).
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

    private static SpecialistReviewFinding CreateIndeterminateFinding(
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

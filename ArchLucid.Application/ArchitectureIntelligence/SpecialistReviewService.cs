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
        bool hasRecoveryObjective = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.RecoveryObjective);

        if (hasRecoveryObjective)
        {
            return CreatePassFinding(
                QualityDimension.Reliability,
                "Recovery objectives are documented.",
                "At least one recovery objective element exists in the model.");
        }

        openQuestions.Add("What are the RTO/RPO targets for critical workloads?");

        return CreateIndeterminateFinding(
            QualityDimension.Reliability,
            "Recovery objectives are missing",
            "No RecoveryObjective element was extracted from the available sources.");
    }

    private static SpecialistReviewFinding ReviewSecurity(
        ArchitectureKnowledgeModel model,
        List<string> openQuestions)
    {
        bool hasPublicEndpoint = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.Interface
                && element.Name.Contains("public", StringComparison.OrdinalIgnoreCase));

        bool hasTrustBoundary = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.TrustBoundary);

        if (hasPublicEndpoint && !hasTrustBoundary)
        {
            openQuestions.Add("How is the public endpoint authenticated and authorized?");

            return new SpecialistReviewFinding
            {
                FindingId = Guid.NewGuid().ToString("N"),
                Dimension = QualityDimension.Security,
                Title = "Public endpoint lacks documented trust boundary",
                Rationale = "A public endpoint was identified without a corresponding trust boundary element.",
                Conclusion = ReviewConclusion.Fail,
                EvidenceCondition = EvidenceCondition.Insufficient,
                GovernanceDisposition = GovernanceDisposition.Open,
                Confidence = 0.7,
                Severity = "High",
            };
        }

        return CreatePassFinding(
            QualityDimension.Security,
            "No immediate public exposure gap detected",
            "Security review did not identify a public endpoint without trust boundary context.");
    }

    private static SpecialistReviewFinding ReviewCost(
        ArchitectureKnowledgeModel model,
        List<string> openQuestions)
    {
        bool hasCostDriver = model.Elements.Any(
            element => element.Kind == ArchitectureElementKind.CostDriver);

        if (hasCostDriver)
        {
            return CreatePassFinding(
                QualityDimension.Cost,
                "Cost drivers are documented.",
                "At least one cost driver element exists in the model.");
        }

        openQuestions.Add("What are the primary cost drivers for this architecture?");

        return CreateIndeterminateFinding(
            QualityDimension.Cost,
            "Cost drivers are missing",
            "No CostDriver element was extracted from the available sources.");
    }

    private static SpecialistReviewFinding CreatePassFinding(
        QualityDimension dimension,
        string title,
        string rationale)
    {
        return new SpecialistReviewFinding
        {
            FindingId = Guid.NewGuid().ToString("N"),
            Dimension = dimension,
            Title = title,
            Rationale = rationale,
            Conclusion = ReviewConclusion.Pass,
            EvidenceCondition = EvidenceCondition.Sufficient,
            GovernanceDisposition = GovernanceDisposition.Accepted,
            Confidence = 0.8,
            Severity = "Low",
        };
    }

    private static SpecialistReviewFinding CreateIndeterminateFinding(
        QualityDimension dimension,
        string title,
        string rationale)
    {
        return new SpecialistReviewFinding
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
        };
    }
}

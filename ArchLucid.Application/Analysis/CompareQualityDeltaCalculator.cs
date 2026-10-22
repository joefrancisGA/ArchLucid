using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Analysis;

/// <summary>Builds API-backed compare quality delta counts from knowledge models and run findings.</summary>
public static class CompareQualityDeltaCalculator
{
    public static CompareQualityDeltaCounts? Build(
        ArchitectureKnowledgeModel? leftModel,
        IReadOnlyList<ArchitectureFinding> leftFindings,
        ArchitectureKnowledgeModel? rightModel,
        IReadOnlyList<ArchitectureFinding> rightFindings)
    {
        ArgumentNullException.ThrowIfNull(leftFindings);
        ArgumentNullException.ThrowIfNull(rightFindings);

        if (leftModel is null || rightModel is null)
            return null;

        ArchitectureKnowledgeModel left = leftModel;
        ArchitectureKnowledgeModel right = rightModel;
        List<SpecialistReviewFinding> leftSpecialist = MapFindings(leftFindings);
        List<SpecialistReviewFinding> rightSpecialist = MapFindings(rightFindings);
        Dictionary<string, int> leftMetrics = ArchitectureKnowledgeModelMetrics.CountMetrics(left, leftSpecialist);
        Dictionary<string, int> rightMetrics = ArchitectureKnowledgeModelMetrics.CountMetrics(right, rightSpecialist);

        return new CompareQualityDeltaCounts
        {
            UnsupportedAssumptionsBefore = leftMetrics[ArchitectureKnowledgeModelMetrics.CriticalUnsupportedAssumptions],
            UnsupportedAssumptionsAfter = rightMetrics[ArchitectureKnowledgeModelMetrics.CriticalUnsupportedAssumptions],
            HighSeverityBefore = leftMetrics[ArchitectureKnowledgeModelMetrics.HighSeverityFindings],
            HighSeverityAfter = rightMetrics[ArchitectureKnowledgeModelMetrics.HighSeverityFindings],
            UncoveredMandatoryBefore = ComputeUncoveredMandatoryRequirements(left, leftMetrics),
            UncoveredMandatoryAfter = ComputeUncoveredMandatoryRequirements(right, rightMetrics),
            EvidenceBackedDecisionsBefore = leftMetrics[ArchitectureKnowledgeModelMetrics.EvidenceBackedDecisions],
            EvidenceBackedDecisionsAfter = rightMetrics[ArchitectureKnowledgeModelMetrics.EvidenceBackedDecisions],
        };
    }

    private static int ComputeUncoveredMandatoryRequirements(
        ArchitectureKnowledgeModel model,
        Dictionary<string, int> metrics)
    {
        int requirements = model.Elements.Count(
            element => element.Kind == ArchitectureElementKind.FunctionalRequirement);
        int covered = metrics[ArchitectureKnowledgeModelMetrics.RequirementsWithDesignCoverage];

        return Math.Max(0, requirements - covered);
    }

    private static List<SpecialistReviewFinding> MapFindings(IReadOnlyList<ArchitectureFinding> findings)
    {
        List<SpecialistReviewFinding> mapped = [];

        foreach (ArchitectureFinding finding in findings)
        {
            if (finding.IsMuted)
                continue;

            mapped.Add(new SpecialistReviewFinding
            {
                FindingId = finding.FindingId,
                Title = finding.Message,
                Rationale = finding.ReasoningTrace ?? finding.Message,
                Severity = MapSeverity(finding.Severity),
                Dimension = QualityDimension.Reliability,
                Conclusion = ReviewConclusion.Fail,
                EvidenceCondition = EvidenceCondition.Unverified,
            });
        }

        return mapped;
    }

    private static string MapSeverity(FindingSeverity severity)
    {
        switch (severity)
        {
            case FindingSeverity.Critical:
                return "Critical";
            case FindingSeverity.Error:
                return "High";
            case FindingSeverity.Warning:
                return "Medium";
            default:
                return "Low";
        }
    }
}

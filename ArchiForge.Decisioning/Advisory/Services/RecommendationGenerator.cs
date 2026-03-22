using ArchiForge.Decisioning.Advisory.Models;

namespace ArchiForge.Decisioning.Advisory.Services;

public sealed class RecommendationGenerator : IRecommendationGenerator
{
    public IReadOnlyList<ImprovementRecommendation> Generate(IReadOnlyList<ImprovementSignal> signals)
    {
        var recommendations = new List<ImprovementRecommendation>();

        foreach (var signal in signals)
        {
            recommendations.Add(new ImprovementRecommendation
            {
                Title = BuildTitle(signal),
                Category = signal.Category,
                Rationale = signal.Description,
                SuggestedAction = BuildSuggestedAction(signal),
                Urgency = MapUrgency(signal.Severity),
                ExpectedImpact = BuildImpact(signal),
                SupportingFindingIds = signal.FindingIds.ToList(),
                SupportingDecisionIds = signal.DecisionIds.ToList(),
                PriorityScore = ComputePriority(signal)
            });
        }

        return recommendations
            .OrderByDescending(x => x.PriorityScore)
            .ThenBy(x => x.Title, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string BuildTitle(ImprovementSignal signal) =>
        signal.SignalType switch
        {
            "UncoveredRequirement" => "Cover an uncovered requirement",
            "SecurityGap" => "Close a security protection gap",
            "ComplianceGap" => "Address a compliance control gap",
            "TopologyGap" => "Improve topology completeness",
            "CostRisk" => "Reduce a cost risk",
            "SecurityRegression" => "Reverse a security regression",
            "CostIncrease" => "Reduce increased projected cost",
            "UnresolvedIssue" => $"Resolve: {signal.Title}",
            "DecisionRemoved" => "Restore or replace removed architecture decision",
            _ => signal.Title
        };

    private static string BuildSuggestedAction(ImprovementSignal signal) =>
        signal.SignalType switch
        {
            "UncoveredRequirement" =>
                "Add architecture components or decisions that explicitly satisfy the uncovered requirement.",
            "SecurityGap" => "Introduce or apply missing security controls to the affected resources.",
            "ComplianceGap" =>
                "Map the required control to architecture resources and add enforcement coverage.",
            "TopologyGap" => "Add missing topology categories or required platform components.",
            "CostRisk" =>
                "Review sizing, deployment choices, and service selection to reduce projected cost risk.",
            "SecurityRegression" =>
                "Review the changed control posture and restore the stronger security baseline where appropriate.",
            "CostIncrease" =>
                "Review the decision changes that increased cost and consider lower-cost alternatives.",
            "UnresolvedIssue" =>
                "Triage the issue, assign ownership, and update the architecture or context to close the gap.",
            "DecisionRemoved" =>
                "Confirm whether the removal was intentional; if not, reinstate the decision or document replacement rationale.",
            _ => "Review this signal and determine the most appropriate architecture correction."
        };

    private static string BuildImpact(ImprovementSignal signal) =>
        signal.Category switch
        {
            "Security" => "Reduces security exposure and improves control posture.",
            "Compliance" => "Improves audit readiness and lowers compliance risk.",
            "Requirement" => "Improves requirement satisfaction and business alignment.",
            "Topology" => "Improves architectural completeness and implementation readiness.",
            "Cost" => "Reduces spend risk and improves financial efficiency.",
            "Risk" => "Reduces delivery and operational risk from open issues.",
            _ => "Improves architecture quality."
        };

    private static string MapUrgency(string severity) =>
        severity.ToLowerInvariant() switch
        {
            "critical" => "Critical",
            "high" => "High",
            "medium" => "Medium",
            _ => "Low"
        };

    private static int ComputePriority(ImprovementSignal signal)
    {
        var score = signal.Category switch
        {
            "Security" => 90,
            "Compliance" => 85,
            "Requirement" => 80,
            "Risk" => 75,
            "Topology" => 65,
            "Cost" => 60,
            _ => 50
        };

        score += signal.Severity.ToLowerInvariant() switch
        {
            "critical" => 20,
            "high" => 10,
            "medium" => 5,
            _ => 0
        };

        return score;
    }
}

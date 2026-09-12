using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ClosedLoopManifestMerger : IClosedLoopManifestMerger
{
    private const string ClosedLoopIssueType = "ClosedLoopFinding";
    private const string ClosedLoopCoverageStatus = "ClosedLoopStrengthened";

    public ClosedLoopManifestMergeResult MergeStrengtheningResult(
        ManifestDocument manifest,
        ClosedLoopReasoningResult result,
        ArchitectureRequest? architectureRequest)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(result);

        List<string> groundingDropLog = [];
        List<ArchitectureRecommendation> groundedRecommendations =
            ClosedLoopRecommendationBriefGroundingFilter.FilterGroundedRecommendations(
                result.Recommendations,
                architectureRequest,
                groundingDropLog);

        int mergedFindingCount = MergeFindings(manifest, result.ProductFindings);
        int mergedRecommendationCount = MergeRecommendations(manifest, groundedRecommendations);

        if (mergedFindingCount > 0 || mergedRecommendationCount > 0 || groundingDropLog.Count > 0)
        {
            manifest.Warnings.Add(
                $"Closed-loop strengthening merged {mergedRecommendationCount} recommendation(s), "
                + $"{mergedFindingCount} finding(s)"
                + (groundingDropLog.Count > 0
                    ? $", and dropped {groundingDropLog.Count} brief-contradicting recommendation(s)."
                    : "."));
        }

        return new ClosedLoopManifestMergeResult
        {
            MergedRecommendationCount = mergedRecommendationCount,
            MergedFindingCount = mergedFindingCount,
            GroundingDropCount = groundingDropLog.Count,
        };
    }

    private static int MergeFindings(ManifestDocument manifest, IReadOnlyList<Finding> productFindings)
    {
        if (productFindings.Count == 0)
            return 0;

        HashSet<string> existingFindingIds = manifest.UnresolvedIssues.Items
            .SelectMany(static issue => issue.SupportingFindingIds)
            .ToHashSet(StringComparer.Ordinal);

        int mergedCount = 0;

        foreach (Finding finding in productFindings)
        {
            if (finding is null || string.IsNullOrWhiteSpace(finding.FindingId))
                continue;

            if (existingFindingIds.Contains(finding.FindingId))
                continue;

            manifest.UnresolvedIssues.Items.Add(new ManifestIssue
            {
                IssueType = ClosedLoopIssueType,
                Title = finding.Title,
                Description = finding.Rationale,
                Severity = finding.Severity.ToString(),
                SupportingFindingIds = [finding.FindingId],
            });

            existingFindingIds.Add(finding.FindingId);
            mergedCount++;
        }

        return mergedCount;
    }

    private static int MergeRecommendations(
        ManifestDocument manifest,
        IReadOnlyList<ArchitectureRecommendation> recommendations)
    {
        if (recommendations.Count == 0)
            return 0;

        HashSet<string> existingNames = manifest.Requirements.Uncovered
            .Select(static item => item.RequirementName)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        int mergedCount = 0;

        foreach (ArchitectureRecommendation recommendation in recommendations)
        {
            if (recommendation is null || string.IsNullOrWhiteSpace(recommendation.RecommendationId))
                continue;

            string requirementName = string.IsNullOrWhiteSpace(recommendation.AffectedRequirementOrQualityAttribute)
                ? recommendation.RecommendationId
                : recommendation.AffectedRequirementOrQualityAttribute.Trim();

            if (existingNames.Contains(requirementName))
                continue;

            manifest.Requirements.Uncovered.Add(new RequirementCoverageItem
            {
                RequirementName = requirementName,
                RequirementText = recommendation.ProposedChange,
                IsMandatory = recommendation.RequiresHumanApproval,
                CoverageStatus = ClosedLoopCoverageStatus,
                SupportingFindingIds = [],
            });

            existingNames.Add(requirementName);
            mergedCount++;
        }

        return mergedCount;
    }
}

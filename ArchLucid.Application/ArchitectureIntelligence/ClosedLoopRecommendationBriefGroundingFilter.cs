using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Drops closed-loop recommendations whose proposed change contradicts confirmed structured-brief
///     constraints (TB-2349 guardrails for TB-2352).
/// </summary>
public static class ClosedLoopRecommendationBriefGroundingFilter
{
    public static List<ArchitectureRecommendation> FilterGroundedRecommendations(
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        ArchitectureRequest? architectureRequest,
        IList<string>? dropLog = null)
    {
        ArgumentNullException.ThrowIfNull(recommendations);

        if (architectureRequest is null || recommendations.Count == 0)
            return recommendations.ToList();

        ArchitectureRequestBriefGroundingRules rules = BuildBriefGroundingRules(architectureRequest);

        if (!rules.HasAnyRules)
            return recommendations.ToList();

        List<ArchitectureRecommendation> grounded = [];

        foreach (ArchitectureRecommendation recommendation in recommendations)
        {
            if (recommendation is null)
                continue;

            if (TryDescribeBriefGroundingDrop(recommendation, rules, out string? reason))
            {
                dropLog?.Add($"{recommendation.RecommendationId}: {reason}");
                continue;
            }

            grounded.Add(recommendation);
        }

        return grounded;
    }

    private static bool TryDescribeBriefGroundingDrop(
        ArchitectureRecommendation recommendation,
        ArchitectureRequestBriefGroundingRules rules,
        out string? reason)
    {
        string text = BuildRecommendationText(recommendation);

        if (rules.RequiresHttps && TextSuggestsPlainHttp(text))
        {
            reason = "Proposed change contradicts confirmed HTTPS-only brief constraint.";
            return true;
        }

        if (rules.RequiresPrivateNetworking && TextSuggestsPublicExposure(text))
        {
            reason = "Proposed change contradicts confirmed private-networking brief constraint.";
            return true;
        }

        if (rules.RequiresEncryptionAtRest && TextSuggestsMissingEncryptionAtRest(text))
        {
            reason = "Proposed change contradicts confirmed encryption-at-rest brief capability.";
            return true;
        }

        reason = null;
        return false;
    }

    private static string BuildRecommendationText(ArchitectureRecommendation recommendation) =>
        string.Join(
            ' ',
            new[]
            {
                recommendation.Problem,
                recommendation.ProposedChange,
                recommendation.Evidence,
                recommendation.ConsequenceOfInaction,
            }.Where(static value => !string.IsNullOrWhiteSpace(value)));

    private static bool TextSuggestsPlainHttp(string text) =>
        text.Contains("http://", StringComparison.OrdinalIgnoreCase)
        || text.Contains("plaintext http", StringComparison.OrdinalIgnoreCase)
        || text.Contains("unencrypted http", StringComparison.OrdinalIgnoreCase);

    private static bool TextSuggestsPublicExposure(string text) =>
        text.Contains("public access", StringComparison.OrdinalIgnoreCase)
        || text.Contains("public endpoint", StringComparison.OrdinalIgnoreCase)
        || text.Contains("internet-facing", StringComparison.OrdinalIgnoreCase);

    private static bool TextSuggestsMissingEncryptionAtRest(string text) =>
        text.Contains("unencrypted", StringComparison.OrdinalIgnoreCase)
        || text.Contains("without encryption", StringComparison.OrdinalIgnoreCase)
        || text.Contains("plaintext storage", StringComparison.OrdinalIgnoreCase);

    private static ArchitectureRequestBriefGroundingRules BuildBriefGroundingRules(ArchitectureRequest request)
    {
        List<string> confirmedConstraints = request.Constraints
            .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
            .Select(static constraint => constraint.Trim())
            .ToList();

        List<string> confirmedCapabilities = request.RequiredCapabilities
            .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
            .Select(static capability => capability.Trim())
            .ToList();

        return ArchitectureRequestBriefGroundingRules.FromConfirmedBriefEntries(
            confirmedConstraints,
            confirmedCapabilities);
    }
}

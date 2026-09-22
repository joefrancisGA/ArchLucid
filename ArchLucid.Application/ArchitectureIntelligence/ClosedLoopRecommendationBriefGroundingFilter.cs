using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;

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

        BriefGroundingRules rules = BriefGroundingRules.FromRequest(architectureRequest);

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
        BriefGroundingRules rules,
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

    private static bool ConstraintRequiresHttps(string constraint) =>
        constraint.Contains("https", StringComparison.OrdinalIgnoreCase)
        && !constraint.Contains("http://", StringComparison.OrdinalIgnoreCase);

    private static bool ConstraintRequiresPrivateNetworking(string constraint) =>
        constraint.Contains("private", StringComparison.OrdinalIgnoreCase)
        || constraint.Contains("vnet", StringComparison.OrdinalIgnoreCase)
        || constraint.Contains("private endpoint", StringComparison.OrdinalIgnoreCase);

    private static bool CapabilityRequiresEncryptionAtRest(string capability) =>
        capability.Contains("encryption", StringComparison.OrdinalIgnoreCase)
        && capability.Contains("rest", StringComparison.OrdinalIgnoreCase);

    private sealed record BriefGroundingRules(
        bool RequiresHttps,
        bool RequiresPrivateNetworking,
        bool RequiresEncryptionAtRest)
    {
        public bool HasAnyRules =>
            RequiresHttps || RequiresPrivateNetworking || RequiresEncryptionAtRest;

        public static BriefGroundingRules FromRequest(ArchitectureRequest request)
        {
            List<string> confirmedConstraints = request.Constraints
                .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
                .Select(static constraint => constraint.Trim())
                .ToList();

            List<string> confirmedCapabilities = request.RequiredCapabilities
                .Where(ArchitectureDraftStructuredBrief.IsConfirmedBriefEntry)
                .Select(static capability => capability.Trim())
                .ToList();

            return new BriefGroundingRules(
                confirmedConstraints.Any(ConstraintRequiresHttps),
                confirmedConstraints.Any(ConstraintRequiresPrivateNetworking),
                confirmedCapabilities.Any(CapabilityRequiresEncryptionAtRest));
        }
    }
}

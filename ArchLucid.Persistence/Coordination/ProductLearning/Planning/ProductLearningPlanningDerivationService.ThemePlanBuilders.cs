using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

public sealed partial class ProductLearningPlanningDerivationService
{
    private static ProductLearningImprovementThemeRecord BuildTheme(
        ProductLearningScope scope,
        string themeKey,
        ImprovementOpportunity opportunity,
        string? createdByUserId)
    {
        return new ProductLearningImprovementThemeRecord
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ThemeKey = themeKey,
            SourceAggregateKey = TruncateNullable(opportunity.SourceAggregateKey, ThemeKeyMaxChars),
            PatternKey = TruncateNullable(opportunity.PatternKey, ThemeKeyMaxChars),
            Title = Truncate(opportunity.Title, ProductLearningPlanningRepositoryValidation.MaxTitleLength),
            Summary = BuildThemeSummary(opportunity),
            AffectedArtifactTypeOrWorkflowArea = Truncate(
                opportunity.AffectedArtifactTypeOrWorkflowArea,
                ProductLearningPlanningRepositoryValidation.MaxTitleLength),
            SeverityBand = opportunity.Severity,
            EvidenceSignalCount = opportunity.EvidenceSignalCount,
            DistinctRunCount = opportunity.DistinctRunCount,
            AverageTrustScore = opportunity.AverageTrustScore,
            DerivationRuleVersion = DerivationRuleVersion[..Math.Min(DerivationRuleVersion.Length,
                    ProductLearningPlanningRepositoryValidation.MaxDerivationRuleVersionLength)],
            CreatedByUserId = createdByUserId
        };
    }

    private static ProductLearningImprovementPlanRecord BuildPlan(
        ProductLearningScope scope,
        Guid themeId,
        ImprovementOpportunity opportunity,
        string? createdByUserId)
    {
        const string planTitlePrefix = "Plan: ";

        string titleSeed = opportunity.Title;

        string title =
            Truncate(planTitlePrefix + titleSeed, ProductLearningPlanningRepositoryValidation.MaxTitleLength);

        if (title.Length <= planTitlePrefix.Length)

            title = Truncate(planTitlePrefix + themeId.ToString("N"), ProductLearningPlanningRepositoryValidation.MaxTitleLength);


        return new ProductLearningImprovementPlanRecord
        {
            TenantId = scope.TenantId,

            WorkspaceId = scope.WorkspaceId,

            ProjectId = scope.ProjectId,

            ThemeId = themeId,

            Title = title,

            Summary = Truncate(
                $"Bounded improvement draft from ranked opportunity (priorityRank={opportunity.PriorityRank}). {opportunity.Summary}",
                4_000),

            ActionSteps =
            [
                new ProductLearningImprovementPlanActionStep

                {

                    Ordinal = 1,

                    ActionType = "Review",

                    Description =
                        "Review the linked pilot signals and rollup context on the Product learning dashboard; confirm the theme still matches operational reality.",

                    AcceptanceCriteria = "Operators agree whether the pilot pattern is materially correct.",

                },
                new ProductLearningImprovementPlanActionStep

                {

                    Ordinal = 2,

                    ActionType = "Decide",

                    Description =
                        "Decide whether to file engineering work (bug, UX, governance, or agent tuning) versus documentation-only clarification.",

                    AcceptanceCriteria =
                        "A recorded decision exists in your normal backlog or governance process (outside ArchLucid automation).",

                },

                new ProductLearningImprovementPlanActionStep

                {

                    Ordinal = 3,

                    ActionType = "Close",

                    Description =
                        "When complete, deprecate this plan row in your internal process (ArchLucid does not auto-close drafts).",

                    AcceptanceCriteria = "Plan status intentionally updated outside this deterministic generator.",

                }

            ],

            PriorityScore = ProductLearningOpportunityScoring.ComputePlanPriorityScore(opportunity),

            PriorityExplanation = ProductLearningOpportunityScoring.BuildPlanPriorityExplanation(opportunity),

            CreatedByUserId = createdByUserId,
        };
    }

    private static string BuildThemeSummary(ImprovementOpportunity opportunity)
    {
        string body =
            $"Pilot feedback rollup opportunity (rank {opportunity.PriorityRank}). {opportunity.Summary}".Trim();

        const int maxSummaryUtf16Chars = 4_096;

        return body.Length <= maxSummaryUtf16Chars ? body : body[..maxSummaryUtf16Chars];
    }

    private static string NormalizeThemeKey(string? aggregateKey, string? patternFallback, string titleFallback)
    {
        string? raw = aggregateKey;

        if (string.IsNullOrWhiteSpace(raw))
            raw = patternFallback;

        if (string.IsNullOrWhiteSpace(raw))
            raw = SlugFromTitleFallback(titleFallback);

        string trimmed = raw.Trim();

        return trimmed.Length <= ThemeKeyMaxChars ? trimmed : trimmed[..ThemeKeyMaxChars];

    }

    private static string SlugFromTitleFallback(string title)

    {

        string t = title.Trim();


        return t.Length == 0 ? "opp:untitled-rollup" : "opp:title:" + t[..Math.Min(t.Length, ThemeKeyMaxChars - 15)];

    }

    private static string? TruncateNullable(string? value, int maxChars)

    {

        if (string.IsNullOrWhiteSpace(value))
            return null;

        string t = value.Trim();


        return t.Length <= maxChars ? t : t[..maxChars];

    }

    private static string Truncate(string value, int maxChars)

    {

        string t = value.Trim();


        return t.Length <= maxChars ? t : t[..maxChars];

    }
}

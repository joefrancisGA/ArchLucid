using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

/// <inheritdoc />
public sealed class ProductLearningPlanningDerivationService(
    IProductLearningFeedbackAggregationService aggregationService,
    IProductLearningImprovementOpportunityService opportunityService,
    IProductLearningPilotSignalRepository signalRepository,
    IProductLearningPlanningRepository planningRepository)
    : IProductLearningPlanningDerivationService
{
    private const int MaxTakeThemeKeysPrefetch = ProductLearningPlanningRepositoryValidation.MaxTake;

    private const int MaxPilotSignalsHydrate = 8_000;

    private const int MaxSignalLinksPerPlan = 200;

    private const int ThemeKeyMaxChars = ProductLearningPlanningRepositoryValidation.MaxThemeKeyLength;

    private const string DerivationRuleVersion = "59R-v1";

    /// <inheritdoc />
    public async Task<ProductLearningPlanningMaterializeResult> MaterializeFromRankedOpportunitiesAsync(
        ProductLearningScope scope,
        ProductLearningTriageOptions options,
        string? createdByUserId,
        int maxPlansToCreate,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        ArgumentNullException.ThrowIfNull(options);

        int cap = Math.Clamp(maxPlansToCreate, 1, 50);

        ProductLearningAggregationSnapshot snapshot =
            await aggregationService.GetSnapshotAsync(scope, options, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<ImprovementOpportunity> opportunities =
            await opportunityService
                .BuildRankedOpportunitiesAsync(snapshot, options, cancellationToken)
                .ConfigureAwait(false);

        IReadOnlyList<ProductLearningImprovementThemeRecord> existingThemes =
            await planningRepository
                .ListThemesAsync(scope, MaxTakeThemeKeysPrefetch, cancellationToken)
                .ConfigureAwait(false);

        HashSet<string> existingKeys =
            existingThemes.Select(static t => t.ThemeKey).ToHashSet(StringComparer.Ordinal);

        IReadOnlyList<ProductLearningPilotSignalRecord> hydrated =
            await HydratePilotSignalsForScopeAsync(signalRepository, scope, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<ProductLearningPilotSignalRecord> scopedSignals = hydrated
            .Where(r =>
                options.SinceUtc is null ||
                r.RecordedUtc >= options.SinceUtc.Value)
            .ToList();

        int themesInserted = 0;

        int plansInserted = 0;

        int skippedExisting = 0;

        int signalLinksInserted = 0;

        List<PlanningMaterializeCitation> citations = [];

        foreach (ImprovementOpportunity opportunity in opportunities)
        {
            if (themesInserted >= cap)
                break;

            string themeKey = NormalizeThemeKey(opportunity.SourceAggregateKey, opportunity.PatternKey, opportunity.Title);

            if (existingKeys.Contains(themeKey))

            {
                skippedExisting++;

                continue;
            }

            ProductLearningImprovementThemeRecord themeRecord = BuildTheme(scope, themeKey, opportunity, createdByUserId);

            await planningRepository.InsertThemeAsync(themeRecord, cancellationToken).ConfigureAwait(false);

            ProductLearningImprovementThemeRecord? storedTheme =
                (await planningRepository.ListThemesAsync(scope, 50, cancellationToken).ConfigureAwait(false))
                .FirstOrDefault(t =>
                    string.Equals(t.ThemeKey, themeKey, StringComparison.Ordinal));

            if (storedTheme is null)
                continue;

            ProductLearningImprovementPlanRecord planRecord =
                BuildPlan(scope, storedTheme.ThemeId, opportunity, createdByUserId);

            await planningRepository.InsertPlanAsync(planRecord, cancellationToken).ConfigureAwait(false);

            ProductLearningImprovementPlanRecord? storedPlan =
                (await planningRepository.ListPlansAsync(scope, 80, cancellationToken).ConfigureAwait(false))
                    .Where(p =>
                        p.ThemeId ==
                        storedTheme.ThemeId)

                    .OrderByDescending(static p => p.CreatedUtc)
                    .ThenBy(static p => p.PlanId)
                    .FirstOrDefault();


            if (storedPlan is null)
                continue;

            (int linked, IReadOnlyList<PlanningMaterializeCitation> planCitations) = await LinkSignalsAsync(
                planningRepository,
                scopedSignals,
                opportunity,
                storedPlan.PlanId,
                cancellationToken).ConfigureAwait(false);

            signalLinksInserted += linked;

            foreach (PlanningMaterializeCitation citation in planCitations)
            {
                if (citations.Count >= 40)
                    break;

                if (citations.All(c => c.SignalId != citation.SignalId))
                    citations.Add(citation);
            }

            themesInserted++;

            plansInserted++;

            existingKeys.Add(themeKey);
        }

        return new ProductLearningPlanningMaterializeResult
        {
            ThemesInserted = themesInserted,

            PlansInserted = plansInserted,

            SkippedExistingThemeKeys = skippedExisting,

            SignalLinksInserted = signalLinksInserted,

            Citations = citations
        };
    }

    /// <summary>Fetches capped recent pilot signals for the scope via <see cref="IProductLearningPilotSignalRepository" />.</summary>
    private static Task<IReadOnlyList<ProductLearningPilotSignalRecord>> HydratePilotSignalsForScopeAsync(
        IProductLearningPilotSignalRepository repository,
        ProductLearningScope scope,
        CancellationToken cancellationToken) =>
        repository.ListRecentForScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            MaxPilotSignalsHydrate,
            cancellationToken);

    private static async Task<(int Inserted, IReadOnlyList<PlanningMaterializeCitation> Citations)> LinkSignalsAsync(
        IProductLearningPlanningRepository repository,
        IReadOnlyList<ProductLearningPilotSignalRecord> scopedSignals,
        ImprovementOpportunity opportunity,
        Guid planId,
        CancellationToken cancellationToken)
    {
        List<ProductLearningPilotSignalRecord> matches =
            MatchSignalsForOpportunity(scopedSignals, opportunity).OrderBy(static s => s.SignalId).ToList();

        int budget = MaxSignalLinksPerPlan;

        int inserted = 0;

        List<PlanningMaterializeCitation> citations = [];

        foreach (ProductLearningPilotSignalRecord row in matches.TakeWhile(_ => budget-- > 0))
        {
            await repository
                .AddPlanSignalLinkAsync(
                    new ProductLearningImprovementPlanSignalLinkRecord
                    {
                        PlanId = planId,
                        SignalId = row.SignalId,
                        TriageStatusSnapshot = null
                    },
                    cancellationToken)
                .ConfigureAwait(false);

            inserted++;

            citations.Add(ToCitation(row));
        }

        return (inserted, citations);
    }

    private static PlanningMaterializeCitation ToCitation(ProductLearningPilotSignalRecord row)
    {
        string? comment = row.CommentShort;

        if (!string.IsNullOrWhiteSpace(comment) && comment.Length > 240)
            comment = comment[..240];

        return new PlanningMaterializeCitation
        {
            SignalId = row.SignalId,
            Subject = row.SubjectType,
            CommentSnippet = comment
        };
    }

    private static IEnumerable<ProductLearningPilotSignalRecord> MatchSignalsForOpportunity(
        IReadOnlyList<ProductLearningPilotSignalRecord> scoped,
        ImprovementOpportunity opportunity)
    {
        string? aggregateKey = opportunity.SourceAggregateKey;

        if (string.IsNullOrWhiteSpace(aggregateKey))

            yield break;


        if (aggregateKey.StartsWith("trend:", StringComparison.Ordinal))
        {
            string trendKey = aggregateKey["trend:".Length..];

            foreach (ProductLearningPilotSignalRecord row in scoped)
            {
                string built = ProductLearningSignalAggregations.BuildTrendKey(row.SubjectType, row.ArtifactHint);

                if (string.Equals(built, trendKey, StringComparison.Ordinal))

                    yield return row;
            }

            yield break;
        }

        foreach (ProductLearningPilotSignalRecord row in scoped)
        {
            string built = ProductLearningSignalAggregations.BuildAggregateKey(
                row.PatternKey,
                row.SubjectType,
                row.ArtifactHint);

            if (string.Equals(built, aggregateKey, StringComparison.Ordinal))

                yield return row;
        }
    }

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

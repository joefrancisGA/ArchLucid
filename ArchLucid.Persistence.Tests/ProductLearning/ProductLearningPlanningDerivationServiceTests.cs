using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Tests.ProductLearning;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
[Trait("ChangeSet", "59R")]
public sealed class ProductLearningPlanningDerivationServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task MaterializeFromRankedOpportunitiesAsync_inserts_theme_plan_and_signal_links()
    {
        InMemoryProductLearningPilotSignalRepository pilot = new();

        DateTime utc = new DateTime(2026, 4, 2, 0, 0, 0, DateTimeKind.Utc);

        await pilot.InsertAsync(
                Signal(ProductLearningDispositionValues.Rejected, "bad-pattern", "run-1", utc),
                CancellationToken.None);

        await pilot.InsertAsync(
                Signal(ProductLearningDispositionValues.NeedsFollowUp, "bad-pattern", "run-2",
                    utc.AddMinutes(1)),
                CancellationToken.None);

        ProductLearningPlanningDerivationService svc = CreateService(pilot);

        ProductLearningPlanningMaterializeResult first =
            await svc.MaterializeFromRankedOpportunitiesAsync(
                    Scope(),
                    TriageOptions(),
                    "actor-dev",
                    5,
                    CancellationToken.None)
                ;

        first.ThemesInserted.Should().Be(1);

        first.PlansInserted.Should().Be(1);

        first.SkippedExistingThemeKeys.Should().Be(0);

        first.SignalLinksInserted.Should().Be(2);

        ProductLearningPlanningMaterializeResult second =
            await svc.MaterializeFromRankedOpportunitiesAsync(
                    Scope(),
                    TriageOptions(),
                    "actor-dev",
                    5,
                    CancellationToken.None)
                ;

        second.ThemesInserted.Should().Be(0);

        second.SkippedExistingThemeKeys.Should().BeGreaterThan(0);

        second.SignalLinksInserted.Should().Be(0);
    }

    private static ProductLearningPlanningDerivationService CreateService(InMemoryProductLearningPilotSignalRepository pilot)
    {
        ProductLearningFeedbackAggregationService aggregation = new(pilot);

        ProductLearningImprovementOpportunityService opportunityService = new();

        InMemoryProductLearningPlanningRepository planning = new();


        return new ProductLearningPlanningDerivationService(
            aggregation,
            opportunityService,
            pilot,

            planning);
    }


    private static ProductLearningScope Scope()
    {


        return new ProductLearningScope
        {


            TenantId = TenantId,


            WorkspaceId = WorkspaceId,


            ProjectId = ProjectId

        };


    }


    private static ProductLearningTriageOptions TriageOptions()
    {


        return new ProductLearningTriageOptions

        {


            MinSignalsPerAggregate = 2,


            MinAggregateBadScoreForOpportunity = 2,

            MinNegativeOutcomesOnArtifactTrend = 99,


            MaxImprovementOpportunities = 10,


            MaxTriageQueueItems = 10,


            MinCommentOccurrencesForTriageQueue = 99

        };


    }

    private static ProductLearningPilotSignalRecord Signal(string disposition, string patternKey, string runId,
        DateTime recordedUtc)
    {


        return new ProductLearningPilotSignalRecord


        {


            TenantId = TenantId,


            WorkspaceId = WorkspaceId,


            ProjectId = ProjectId,


            SubjectType = ProductLearningSubjectTypeValues.RunOutput,


            Disposition = disposition,


            PatternKey = patternKey,


            ArchitectureRunId = runId,

            RecordedUtc = recordedUtc,

        };


    }


}

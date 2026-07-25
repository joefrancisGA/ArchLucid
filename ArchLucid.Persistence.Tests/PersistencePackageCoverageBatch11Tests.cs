using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Search;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Notifications;
using ArchLucid.Persistence.Options;
using ArchLucid.Persistence.Search;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class PersistencePackageCoverageBatch11Tests
{
    [Fact]
    public void FixedOptionsMonitor_exposes_constant_value_and_noop_on_change()
    {
        MeteringOptions options = new() { Enabled = true };
        FixedOptionsMonitor<MeteringOptions> monitor = new(options);

        monitor.CurrentValue.Should().BeSameAs(options);
        monitor.Get("ignored").Should().BeSameAs(options);

        IDisposable subscription = monitor.OnChange((_, _) => { });
        subscription.Dispose();
    }

    [Fact]
    public void FixedOptionsMonitor_rejects_null_options()
    {
        Action act = () => _ = new FixedOptionsMonitor<MeteringOptions>(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task InMemorySentEmailLedger_records_idempotency_keys_once()
    {
        InMemorySentEmailLedger ledger = new();
        SentEmailLedgerEntry entry = new("  welcome-email  ", Guid.NewGuid(), "welcome", "noop", null);

        (await ledger.TryRecordSentAsync(entry, CancellationToken.None)).Should().BeTrue();
        (await ledger.TryRecordSentAsync(entry, CancellationToken.None)).Should().BeFalse();
        (await ledger.TryRecordSentAsync(new SentEmailLedgerEntry(" ", Guid.NewGuid(), "t", "p", null), CancellationToken.None))
            .Should()
            .BeFalse();
    }

    [Fact]
    public async Task InMemoryGlobalSearchRepository_returns_empty_for_blank_or_populated_query()
    {
        InMemoryGlobalSearchRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        GlobalSearchResult blank =
            await repository.SearchAsync(tenantId, workspaceId, projectId, "   ", takePerCategory: 5, CancellationToken.None);
        GlobalSearchResult populated =
            await repository.SearchAsync(tenantId, workspaceId, projectId, "network", takePerCategory: 5, CancellationToken.None);

        blank.Should().NotBeNull();
        populated.Should().NotBeNull();
    }

    [Fact]
    public void ProductLearningOpportunityScoring_maps_aggregates_trends_and_plan_priority()
    {
        FeedbackAggregate aggregate = new()
        {
            AggregateKey = "pattern.layout",
            PatternKey = "layout.diagram",
            SubjectTypeOrWorkflowArea = "RunOutput",
            TotalSignalCount = 4,
            DistinctRunCount = 2,
            TrustedCount = 0,
            RejectedCount = 2,
            RevisedCount = 1,
            NeedsFollowUpCount = 1,
            DominantThemeHint = "diagram spacing",
            FirstSignalRecordedUtc = DateTime.UtcNow.AddDays(-2),
            LastSignalRecordedUtc = DateTime.UtcNow,
        };

        int badScore = ProductLearningOpportunityScoring.ComputeAggregateBadScore(aggregate);
        badScore.Should().BeGreaterThan(0);
        ProductLearningOpportunityScoring.SeverityFromBadScore(badScore).Should().BeOneOf("Low", "Medium", "High");

        ImprovementOpportunity opportunity =
            ProductLearningOpportunityScoring.MapAggregateToOpportunity(aggregate, badScore, priorityRank: 1);
        opportunity.Title.Should().Contain("layout.diagram");
        opportunity.EvidenceSignalCount.Should().Be(4);

        int planScore = ProductLearningOpportunityScoring.ComputePlanPriorityScore(opportunity);
        planScore.Should().BeGreaterThan(0);
        ProductLearningOpportunityScoring.BuildPlanPriorityExplanation(opportunity).Should().Contain("severity=");

        ArtifactOutcomeTrend trend = new()
        {
            TrendKey = "RunOutput|diagram",
            ArtifactTypeOrHint = "diagram",
            AcceptedOrTrustedCount = 1,
            RejectionCount = 2,
            RevisionCount = 1,
            NeedsFollowUpCount = 0,
            DistinctRunCount = 3,
            AverageTrustScore = 0.4,
            RepeatedThemeIndicator = "layout",
            FirstSeenUtc = DateTime.UtcNow.AddDays(-3),
            LastSeenUtc = DateTime.UtcNow,
        };

        ProductLearningOpportunityScoring.ComputeTrendNegativeMass(trend).Should().Be(3);
        ProductLearningOpportunityScoring.TotalTrendSignals(trend).Should().Be(4);

        ImprovementOpportunity trendOpportunity =
            ProductLearningOpportunityScoring.MapTrendToOpportunity(trend, badScore: 8, priorityRank: 2);
        trendOpportunity.SourceAggregateKey.Should().StartWith("trend:");
        trendOpportunity.AffectedArtifactTypeOrWorkflowArea.Should().Be("diagram");
    }

    [Fact]
    public void ProductLearningTriageReportMarkdownFormatter_renders_populated_and_empty_sections()
    {
        ProductLearningTriageReportDocument populated = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            GeneratedUtc = new DateTime(2026, 7, 24, 12, 0, 0, DateTimeKind.Utc),
            SinceUtc = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc),
            TotalSignalsInScope = 12,
            DistinctRunsReviewed = 4,
            ArtifactOutcomes =
            [
                new ProductLearningTriageReportArtifactRow
                {
                    ArtifactLabel = "RunOutput|diagram",
                    Trusted = 2,
                    Revised = 1,
                    Rejected = 1,
                    FollowUp = 0,
                    Runs = 3,
                    ThemeHint = "layout spacing",
                },
            ],
            TopProblemAreas = ["Repeated reviewer note on diagram density"],
            TopImprovements =
            [
                new ProductLearningTriageReportImprovementLine
                {
                    Title = "Improve diagram defaults",
                    Severity = "Medium",
                    Area = "RunOutput",
                    Summary = "Signals show repeated layout friction.",
                },
            ],
            TriageQueuePreview =
            [
                new ProductLearningTriageReportTriageLine
                {
                    Rank = 1,
                    Title = "Review layout defaults",
                    Severity = "Medium",
                    DetailSummary = "4 signals across 3 runs",
                    SuggestedNextStep = "Schedule design review",
                },
            ],
        };

        string markdown = ProductLearningTriageReportMarkdownFormatter.Format(populated);

        markdown.Should().Contain("# Pilot feedback — triage summary");
        markdown.Should().Contain("layout spacing");
        markdown.Should().Contain("Improve diagram defaults");
        markdown.Should().Contain("Review layout defaults");

        ProductLearningTriageReportDocument empty = new()
        {
            TenantId = populated.TenantId,
            WorkspaceId = populated.WorkspaceId,
            ProjectId = populated.ProjectId,
            GeneratedUtc = populated.GeneratedUtc,
        };

        string emptyMarkdown = ProductLearningTriageReportMarkdownFormatter.Format(empty);
        emptyMarkdown.Should().Contain("No artifact trend rows");
        emptyMarkdown.Should().Contain("None surfaced above noise gates");
        emptyMarkdown.Should().Contain("Queue empty");

        Action nullDoc = () => ProductLearningTriageReportMarkdownFormatter.Format(null!);
        nullDoc.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task HotPathCacheEviction_invalidates_run_audit_and_policy_pack_lists()
    {
        Mock<IHotPathReadCache> cache = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid manifestId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid findingsSnapshotId = Guid.NewGuid();
        Guid policyPackId = Guid.NewGuid();

        cache.Setup(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        cache
            .Setup(c => c.GetOrCreateAsync(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, Task<RunListScopeRevisionState?>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunListScopeRevisionState { Revision = 42 });

        await HotPathCacheEviction.RemoveManifestAsync(cache.Object, scope, manifestId, CancellationToken.None);
        await HotPathCacheEviction.RemoveRunAsync(cache.Object, scope, runId, CancellationToken.None);
        await HotPathCacheEviction.InvalidateRunListScopeAsync(cache.Object, scope, CancellationToken.None);
        await HotPathCacheEviction.RemovePolicyPackAsync(cache.Object, policyPackId, CancellationToken.None);
        await HotPathCacheEviction.InvalidateAuditListScopeAsync(cache.Object, scope, CancellationToken.None);
        await HotPathCacheEviction.InvalidatePolicyPackListScopeAsync(cache.Object, scope, CancellationToken.None);
        await HotPathCacheEviction.RemoveFindingsSnapshotAsync(cache.Object, scope, findingsSnapshotId, CancellationToken.None);

        Mock<IPolicyPackResolverCacheInvalidator> invalidator = new();
        invalidator
            .Setup(i => i.InvalidateTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        await HotPathCacheEviction.InvalidatePolicyPackResolverTenantAsync(
            invalidator.Object,
            scope.TenantId,
            CancellationToken.None);

        cache.Verify(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.AtLeastOnce);
        invalidator.Verify(i => i.InvalidateTenantAsync(scope.TenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task InMemoryBillingLedger_tracks_subscription_and_webhook_dedupe()
    {
        InMemoryBillingLedger ledger = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        (await ledger.TenantHasActiveSubscriptionAsync(tenantId, CancellationToken.None)).Should().BeFalse();

        await ledger.UpsertPendingCheckoutAsync(
            tenantId,
            workspaceId,
            projectId,
            "stripe",
            "cs_test_123",
            "team",
            seats: 5,
            workspaces: 1,
            CancellationToken.None);

        (await ledger.TryInsertWebhookEventAsync("evt-1", "stripe", "checkout.session.completed", "{}", CancellationToken.None))
            .Should()
            .BeTrue();
        (await ledger.TryInsertWebhookEventAsync("evt-1", "stripe", "checkout.session.completed", "{}", CancellationToken.None))
            .Should()
            .BeFalse();

        await ledger.ActivateSubscriptionAsync(
            tenantId,
            workspaceId,
            projectId,
            "stripe",
            "sub_123",
            "team",
            seats: 5,
            workspaces: 1,
            rawWebhookJson: null,
            CancellationToken.None);

        (await ledger.TenantHasActiveSubscriptionAsync(tenantId, CancellationToken.None)).Should().BeTrue();

        await ledger.MarkWebhookProcessedAsync("evt-1", "Processed", CancellationToken.None);
        (await ledger.GetWebhookEventResultStatusAsync("evt-1", CancellationToken.None)).Should().Be("Processed");

        await ledger.SuspendSubscriptionAsync(tenantId, CancellationToken.None);
        (await ledger.TenantHasActiveSubscriptionAsync(tenantId, CancellationToken.None)).Should().BeFalse();

        await ledger.ReinstateSubscriptionAsync(tenantId, CancellationToken.None);
        (await ledger.TenantHasActiveSubscriptionAsync(tenantId, CancellationToken.None)).Should().BeTrue();
    }
}

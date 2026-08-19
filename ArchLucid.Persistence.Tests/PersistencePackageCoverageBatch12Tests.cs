using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Coordination.ProductLearning;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Metering;
using ArchLucid.Persistence.Options;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class PersistencePackageCoverageBatch12Tests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task InMemoryBillingLedger_pending_checkout_overwrites_active_subscription_row()
    {
        InMemoryBillingLedger ledger = new();
        Guid tenantId = Guid.NewGuid();

        await ledger.ActivateSubscriptionAsync(
            tenantId,
            WorkspaceId,
            ProjectId,
            "stripe",
            "sub_active",
            "team",
            seats: 3,
            workspaces: 1,
            rawWebhookJson: null,
            CancellationToken.None);

        await ledger.UpsertPendingCheckoutAsync(
            tenantId,
            WorkspaceId,
            ProjectId,
            "stripe",
            "cs_pending_456",
            "enterprise",
            seats: 10,
            workspaces: 2,
            CancellationToken.None);

        (await ledger.TenantHasActiveSubscriptionAsync(tenantId, CancellationToken.None)).Should().BeFalse();
        (await ledger.TryGetProviderSubscriptionIdAsync(tenantId, CancellationToken.None)).Should().Be("cs_pending_456");

        BillingSubscriptionSnapshot? snapshot =
            await ledger.TryGetSubscriptionAsync(tenantId, CancellationToken.None);

        snapshot.Should().NotBeNull();
        snapshot!.Status.Should().Be("Pending");
        snapshot.TierCode.Should().Be("enterprise");
        snapshot.SeatsPurchased.Should().Be(10);
    }

    [Fact]
    public async Task InMemoryBillingLedger_change_plan_and_quantity_no_op_when_tenant_missing()
    {
        InMemoryBillingLedger ledger = new();
        Guid missingTenant = Guid.NewGuid();

        await ledger.ChangePlanAsync(missingTenant, "enterprise", null, CancellationToken.None);
        await ledger.ChangeQuantityAsync(missingTenant, 99, null, CancellationToken.None);
        await ledger.ReinstateSubscriptionAsync(missingTenant, CancellationToken.None);
        await ledger.CancelSubscriptionAsync(missingTenant, CancellationToken.None);

        (await ledger.TryGetSubscriptionAsync(missingTenant, CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task InMemoryBillingLedger_state_history_is_scoped_to_tenant()
    {
        InMemoryBillingLedger ledger = new();
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();

        await ledger.ActivateSubscriptionAsync(
            tenantA,
            WorkspaceId,
            ProjectId,
            "stripe",
            "sub_a",
            "team",
            seats: 1,
            workspaces: 1,
            rawWebhookJson: null,
            CancellationToken.None);

        await ledger.ActivateSubscriptionAsync(
            tenantB,
            WorkspaceId,
            ProjectId,
            "stripe",
            "sub_b",
            "team",
            seats: 1,
            workspaces: 1,
            rawWebhookJson: null,
            CancellationToken.None);

        await ledger.SuspendSubscriptionAsync(tenantA, CancellationToken.None);

        IReadOnlyList<BillingSubscriptionStateHistoryEntry> tenantAHistory =
            await ledger.GetSubscriptionStateHistoryAsync(tenantA, maxRows: 10, CancellationToken.None);
        IReadOnlyList<BillingSubscriptionStateHistoryEntry> tenantBHistory =
            await ledger.GetSubscriptionStateHistoryAsync(tenantB, maxRows: 10, CancellationToken.None);

        tenantAHistory.Should().Contain(entry => entry.ChangeKind == "Suspend");
        tenantBHistory.Should().NotContain(entry => entry.ChangeKind == "Suspend");
    }

    [Fact]
    public async Task UsageMeteringService_enabled_path_persists_and_summarizes_events()
    {
        InMemoryUsageEventRepository repository = new();
        FixedOptionsMonitor<MeteringOptions> options = new(new MeteringOptions { Enabled = true });
        UsageMeteringService service = new(repository, options);
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset recordedUtc = DateTimeOffset.UtcNow;

        await service.RecordAsync(
            new UsageEvent
            {
                TenantId = tenantId,
                Kind = UsageMeterKind.LlmPromptTokens,
                Quantity = 120,
                RecordedUtc = recordedUtc,
                IdempotencyKey = "batch12-prompt",
            },
            CancellationToken.None);

        await service.RecordAsync(
            new UsageEvent
            {
                TenantId = tenantId,
                Kind = UsageMeterKind.LlmCompletionTokens,
                Quantity = 80,
                RecordedUtc = recordedUtc,
                IdempotencyKey = "batch12-completion",
            },
            CancellationToken.None);

        IReadOnlyList<TenantUsageSummary> summary =
            await service.GetSummaryAsync(
                tenantId,
                recordedUtc.AddMinutes(-5),
                recordedUtc.AddMinutes(5),
                CancellationToken.None);

        summary.Should().HaveCount(2);
        summary.Single(s => s.Kind == UsageMeterKind.LlmPromptTokens).TotalQuantity.Should().Be(120);
        summary.Single(s => s.Kind == UsageMeterKind.LlmCompletionTokens).TotalQuantity.Should().Be(80);
    }

    [Fact]
    public async Task UsageMeteringService_enabled_path_skips_duplicate_idempotency_keys()
    {
        InMemoryUsageEventRepository repository = new();
        FixedOptionsMonitor<MeteringOptions> options = new(new MeteringOptions { Enabled = true });
        UsageMeteringService service = new(repository, options);
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset recordedUtc = DateTimeOffset.UtcNow;
        UsageEvent usageEvent = new()
        {
            TenantId = tenantId,
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = recordedUtc,
            IdempotencyKey = "dup-key",
        };

        await service.RecordAsync(usageEvent, CancellationToken.None);
        await service.RecordAsync(usageEvent, CancellationToken.None);

        IReadOnlyList<UsageEvent> stored =
            await repository.ListAsync(
                tenantId,
                recordedUtc.AddMinutes(-1),
                recordedUtc.AddMinutes(1),
                UsageMeterKind.ApiRequest,
                take: 10,
                CancellationToken.None);

        stored.Should().ContainSingle();
    }

    [Theory]
    [InlineData(5, "Low")]
    [InlineData(6, "Medium")]
    [InlineData(11, "Medium")]
    [InlineData(12, "High")]
    public void ProductLearningOpportunityScoring_severity_from_bad_score_honors_boundaries(int badScore, string expected)
    {
        ProductLearningOpportunityScoring.SeverityFromBadScore(badScore).Should().Be(expected);
    }

    [Fact]
    public void ProductLearningOpportunityScoring_build_plan_priority_explanation_rejects_null()
    {
        Action act = () => ProductLearningOpportunityScoring.BuildPlanPriorityExplanation(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ProductLearningSignalAggregations_normalize_comment_theme_key_returns_null_for_blank(string? commentShort)
    {
        ProductLearningSignalAggregations.NormalizeCommentThemeKey(commentShort).Should().BeNull();
    }

    [Fact]
    public void ProductLearningSignalAggregations_empty_scope_returns_empty_rollups_and_trends()
    {
        List<ProductLearningPilotSignalRecord> empty = [];

        ProductLearningSignalAggregations.BuildRunFeedbackAggregates(empty, maxAggregates: 5).Should().BeEmpty();
        ProductLearningSignalAggregations.BuildArtifactOutcomeTrends(empty, windowLabel: "7d", maxTrends: 5)
            .Should()
            .BeEmpty();
        ProductLearningSignalAggregations.BuildRepeatedCommentThemes(empty, minOccurrences: 2, take: 5).Should()
            .BeEmpty();
        ProductLearningSignalAggregations.BuildTopRejectedRevisedRollups(empty, take: 5).Should().BeEmpty();
        ProductLearningSignalAggregations.BuildImprovementOpportunityCandidates(
                empty,
                minPoorOutcomeSignals: 1,
                minRevisedSignals: 1,
                take: 5)
            .Should()
            .BeEmpty();
    }

    [Fact]
    public void ProductLearningSignalAggregations_filter_scope_without_since_returns_all_matching_rows()
    {
        DateTime recordedUtc = new(2026, 7, 20, 12, 0, 0, DateTimeKind.Utc);
        List<ProductLearningPilotSignalRecord> source =
        [
            CreateSignal("older", ProductLearningDispositionValues.Trusted, recordedUtc.AddDays(-10)),
            CreateSignal("newer", ProductLearningDispositionValues.Trusted, recordedUtc),
        ];

        IEnumerable<ProductLearningPilotSignalRecord> filtered =
            ProductLearningSignalAggregations.FilterScope(source, TenantId, WorkspaceId, ProjectId, sinceUtc: null);

        filtered.Should().HaveCount(2);
    }

    [Fact]
    public async Task InMemoryComparisonRecordRepository_get_by_run_id_matches_left_or_right()
    {
        InMemoryComparisonRecordRepository repository = new();
        DateTime createdUtc = new(2026, 7, 24, 12, 0, 0, DateTimeKind.Utc);
        ComparisonRecord leftMatch = CreateComparisonRecord("cmp-left", createdUtc, leftRunId: "run-left");
        ComparisonRecord rightMatch = CreateComparisonRecord("cmp-right", createdUtc.AddMinutes(1), rightRunId: "run-right");
        ComparisonRecord unrelated = CreateComparisonRecord("cmp-other", createdUtc.AddMinutes(2), leftRunId: "run-other");

        await repository.CreateAsync(leftMatch, CancellationToken.None);
        await repository.CreateAsync(rightMatch, CancellationToken.None);
        await repository.CreateAsync(unrelated, CancellationToken.None);

        IReadOnlyList<ComparisonRecord> byLeft =
            await repository.GetByRunIdAsync("run-left", CancellationToken.None);
        IReadOnlyList<ComparisonRecord> byRight =
            await repository.GetByRunIdAsync("run-right", CancellationToken.None);

        byLeft.Should().ContainSingle(record => record.ComparisonRecordId == "cmp-left");
        byRight.Should().ContainSingle(record => record.ComparisonRecordId == "cmp-right");
    }

    [Fact]
    public async Task InMemoryComparisonRecordRepository_search_filters_by_tags_and_updates_label()
    {
        InMemoryComparisonRecordRepository repository = new();
        DateTime createdUtc = new(2026, 7, 24, 12, 0, 0, DateTimeKind.Utc);
        ComparisonRecord tagged = CreateComparisonRecord("cmp-tag", createdUtc, tags: ["security", "regression"]);
        ComparisonRecord plain = CreateComparisonRecord("cmp-plain", createdUtc.AddMinutes(1));

        await repository.CreateAsync(tagged, CancellationToken.None);
        await repository.CreateAsync(plain, CancellationToken.None);

        IReadOnlyList<ComparisonRecord> filtered =
            await repository.SearchAsync(
                comparisonType: null,
                leftRunId: null,
                rightRunId: null,
                createdFromUtc: null,
                createdToUtc: null,
                leftExportRecordId: null,
                rightExportRecordId: null,
                label: null,
                tags: ["security"],
                sortBy: "createdUtc",
                sortDir: "desc",
                skip: 0,
                limit: 10,
                CancellationToken.None);

        filtered.Should().ContainSingle(record => record.ComparisonRecordId == "cmp-tag");

        bool updated =
            await repository.UpdateLabelAndTagsAsync("cmp-tag", "security diff", ["reviewed"], CancellationToken.None);

        updated.Should().BeTrue();
        ComparisonRecord? loaded = await repository.GetByIdAsync("cmp-tag", CancellationToken.None);
        loaded!.Label.Should().Be("security diff");
        loaded.Tags.Should().ContainSingle(tag => tag == "reviewed");
    }

    [Fact]
    public async Task InMemoryComparisonRecordRepository_search_by_cursor_rejects_unsupported_sort_column()
    {
        InMemoryComparisonRecordRepository repository = new();

        Func<Task> act = async () =>
            await repository.SearchByCursorAsync(
                comparisonType: null,
                leftRunId: null,
                rightRunId: null,
                createdFromUtc: null,
                createdToUtc: null,
                leftExportRecordId: null,
                rightExportRecordId: null,
                label: null,
                tags: null,
                sortBy: "label",
                sortDir: "desc",
                cursorCreatedUtc: null,
                cursorComparisonRecordId: null,
                limit: 10,
                CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*sortBy=createdUtc only*");
    }

    private static ProductLearningPilotSignalRecord CreateSignal(
        string commentShort,
        string disposition,
        DateTime recordedUtc)
    {
        return new ProductLearningPilotSignalRecord
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SubjectType = ProductLearningSubjectTypeValues.RunOutput,
            Disposition = disposition,
            CommentShort = commentShort,
            PatternKey = "layout.diagram",
            RecordedUtc = recordedUtc,
            SignalId = Guid.NewGuid(),
        };
    }

    private static ComparisonRecord CreateComparisonRecord(
        string id,
        DateTime createdUtc,
        string leftRunId = "left-run",
        string rightRunId = "right-run",
        List<string>? tags = null)
    {
        return new ComparisonRecord
        {
            ComparisonRecordId = id,
            ComparisonType = "run-diff",
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
            Format = "json",
            SummaryMarkdown = "summary",
            PayloadJson = "{}",
            CreatedUtc = createdUtc,
            Tags = tags ?? [],
        };
    }
}

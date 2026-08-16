using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.Agents;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Notifications;
using ArchLucid.Persistence.Notifications.Email;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Value;
using ArchLucid.Persistence.WeeklyDigest;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class PersistenceNoOpStubCoverageTestsBatch4
{
    [Fact]
    public async Task InMemorySentEmailLedger_rejects_blank_idempotency_key()
    {
        InMemorySentEmailLedger sut = new();

        bool recorded = await sut.TryRecordSentAsync(
            new SentEmailLedgerEntry("  ", Guid.NewGuid(), "template", "noop", null),
            CancellationToken.None);

        recorded.Should().BeFalse();
    }

    [Fact]
    public async Task InMemorySentEmailLedger_records_first_key_only_once()
    {
        InMemorySentEmailLedger sut = new();
        SentEmailLedgerEntry entry = new("key-1", Guid.NewGuid(), "template", "noop", null);

        (await sut.TryRecordSentAsync(entry, CancellationToken.None)).Should().BeTrue();
        (await sut.TryRecordSentAsync(entry, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task NoOpAgentOutputEvaluationResultRepository_completes_append()
    {
        NoOpAgentOutputEvaluationResultRepository sut = new();

        await sut.Invoking(
                s => s.AppendAsync(
                    new AgentOutputEvaluationResultRecord
                    {
                        RunId = Guid.NewGuid().ToString("N"),
                        CaseId = "case",
                        AgentType = AgentType.Critic,
                    },
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpAgentOutputEvaluationRepository_completes_append()
    {
        NoOpAgentOutputEvaluationRepository sut = new();

        await sut.Invoking(
                s => s.AppendAsync(
                    new AgentOutputEvaluationInsert
                    {
                        RunId = Guid.NewGuid().ToString("N"),
                        PromptTemplateName = "template",
                        PromptVariantKey = "default",
                    },
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpHostLeaderLeaseRepository_returns_success_and_empty_list()
    {
        NoOpHostLeaderLeaseRepository sut = new();

        (await sut.TryAcquireOrRenewAsync("lease", "instance", 30, CancellationToken.None)).Should().BeTrue();
        await sut.Invoking(s => s.TryReleaseAsync("lease", "instance", CancellationToken.None)).Should().NotThrowAsync();
        (await sut.ListAllAsync(CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpRiskExceptionRepository_exposes_noop_paths()
    {
        NoOpRiskExceptionRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid riskExceptionId = Guid.NewGuid();
        RiskExceptionRecord record = new()
        {
            RiskExceptionId = riskExceptionId,
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            FindingId = "finding-1",
            OwnerUserId = "owner",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedByUserId = "creator",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            Status = RiskExceptionStatus.Active,
        };

        await sut.Invoking(s => s.CreateAsync(record, CancellationToken.None)).Should().NotThrowAsync();
        (await sut.GetByIdAsync(tenantId, riskExceptionId, CancellationToken.None)).Should().BeNull();
        (await sut.ListActiveForTenantAsync(tenantId, projectId: null, CancellationToken.None)).Should().BeEmpty();
        await sut.Invoking(
                s => s.RevokeAsync(tenantId, riskExceptionId, "revoker", DateTimeOffset.UtcNow, CancellationToken.None))
            .Should()
            .NotThrowAsync();
        (await sut.MarkExpiredAsync(tenantId, DateTimeOffset.UtcNow, CancellationToken.None)).Should().BeEmpty();
        await sut.Invoking(
                s => s.RenewAsync(
                    tenantId,
                    riskExceptionId,
                    DateTimeOffset.UtcNow.AddDays(60),
                    "renewer",
                    rationale: null,
                    evidenceRef: null,
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
        (await sut.ListRetiredSinceUtcAsync(tenantId, projectId: null, DateTimeOffset.UtcNow.AddDays(-1), CancellationToken.None))
            .Should()
            .BeEmpty();
    }

    [Fact]
    public async Task NoOpTenantCuratedEvidenceRepository_returns_empty_list_and_new_guid()
    {
        NoOpTenantCuratedEvidenceRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        (await sut.ListByTenantAsync(tenantId, CancellationToken.None)).Should().BeEmpty();

        Guid inserted = await sut.InsertPromotedEntryAsync(
            tenantId,
            entryType: "type",
            catalogEntryId: "cat",
            title: "title",
            description: "desc",
            rationale: "why",
            sourceResultId: "src",
            CancellationToken.None);

        inserted.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task NoOpPromptVariantStatsRepository_returns_empty_stats()
    {
        NoOpPromptVariantStatsRepository sut = new();

        (await sut.GetStatsByTemplateAsync("template", CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpImportedArchitectureRequestRepository_completes_insert()
    {
        NoOpImportedArchitectureRequestRepository sut = new();

        await sut.Invoking(s => s.InsertAsync(new ImportedArchitectureRequestRecord(), CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpFindingReviewTrailRepository_returns_empty_lists()
    {
        NoOpFindingReviewTrailRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        await sut.Invoking(s => s.AppendAsync(new FindingReviewEventRecord(), CancellationToken.None)).Should().NotThrowAsync();
        (await sut.ListByFindingAsync(tenantId, "finding", CancellationToken.None)).Should().BeEmpty();
        (await sut.ListSinceUtcAsync(tenantId, DateTimeOffset.UtcNow.AddDays(-1), CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpCloudInventoryExtractorPackageRepository_returns_null_probes()
    {
        NoOpCloudInventoryExtractorPackageRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        await sut.Invoking(s => s.InsertAsync(new CloudInventoryExtractorPackageRecord(), CancellationToken.None))
            .Should()
            .NotThrowAsync();
        (await sut.TryGetDownloadByPackageIdAsync(scope, CloudProvider.Aws, Guid.NewGuid(), CancellationToken.None))
            .Should()
            .BeNull();
        (await sut.TryGetLatestProvenanceByRunIdAsync(scope, Guid.NewGuid(), CloudProvider.Gcp, CancellationToken.None))
            .Should()
            .BeNull();
    }

    [Fact]
    public async Task NoOpAzureExtractorPackageRepository_returns_false_and_null_probes()
    {
        NoOpAzureExtractorPackageRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        await sut.Invoking(s => s.InsertAsync(new AzureExtractorPackageRecord(), CancellationToken.None)).Should().NotThrowAsync();
        (await sut.TryGetLatestProvenanceByRunIdAsync(scope, Guid.NewGuid(), CancellationToken.None)).Should().BeNull();
        (await sut.HasAnyInWorkspaceAsync(scope, CancellationToken.None)).Should().BeFalse();
        (await sut.TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CancellationToken.None)).Should().BeNull();
        (await sut.TryGetDownloadByPackageIdAsync(scope, Guid.NewGuid(), CancellationToken.None)).Should().BeNull();
        (await sut.TryGetLatestDownloadInScopeAsync(scope, CancellationToken.None)).Should().BeNull();
        (await sut.TryGetLatestScriptVersionInScopeAsync(scope, CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task NoOpAgentConfidenceCalibrationSampleRepository_returns_empty_recent_rows()
    {
        NoOpAgentConfidenceCalibrationSampleRepository sut = new();

        await sut.Invoking(s => s.AppendAsync(AgentType.Critic, 0.5, 0.6, CancellationToken.None)).Should().NotThrowAsync();
        (await sut.GetRecentByAgentTypeAsync(AgentType.Critic, maxCount: 5, CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NullExecutiveSummaryRecipientLookup_returns_empty_mailboxes()
    {
        NullSponsorReportRecipientLookup sut = new();

        (await sut.ListRecipientMailboxesAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task InMemoryValueReportMetricsReader_returns_zero_metrics()
    {
        InMemoryValueReportMetricsReader sut = new();

        ValueReportRawMetrics metrics = await sut.ReadAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-7),
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        metrics.RunsCompletedCount.Should().Be(0);
        metrics.RunStatusCounts.Should().BeEmpty();
    }

    [Fact]
    public async Task InMemoryWeeklyArchitectureCriticalFindingSummaryRepository_returns_empty_slice()
    {
        InMemoryWeeklyArchitectureCriticalFindingSummaryRepository sut = new();

        WeeklyArchitectureCriticalFindingsSlice slice =
            await sut.ListRecentCriticalAsync(DateTime.UtcNow.AddDays(-7), "Critical", maxSampleRows: 10, CancellationToken.None);

        slice.ApproximateMatchingCount.Should().Be(0);
        slice.SampleRows.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpTenantHardPurgeService_returns_empty_result()
    {
        NoOpTenantHardPurgeService sut = new();

        TenantHardPurgeResult result = await sut.PurgeTenantAsync(
            Guid.NewGuid(),
            new TenantHardPurgeOptions(),
            CancellationToken.None);

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task NoopEmailProvider_completes_send()
    {
        NoopEmailProvider sut = new();

        sut.ProviderName.Should().NotBeNullOrWhiteSpace();

        await sut.Invoking(
                s => s.SendAsync(
                    new EmailMessage
                    {
                        To = "user@example.com",
                        Subject = "subject",
                        HtmlBody = "<p>body</p>",
                        IdempotencyKey = "email-key",
                    },
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }
}

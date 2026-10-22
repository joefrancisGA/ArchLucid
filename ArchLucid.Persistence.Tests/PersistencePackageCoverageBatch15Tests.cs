using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Marketing;
using ArchLucid.Contracts.Persistence.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatch15Tests
{
    [Fact]
    public async Task NoOpTenantSqlCatalogProvisioner_completes_without_side_effects()
    {
        NoOpTenantSqlCatalogProvisioner sut = new();

        await sut.ProvisionTenantCatalogAsync(Guid.NewGuid(), "tenant-catalog", CancellationToken.None);
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
    public async Task NoOpArchitectureProjectRetentionPurgeService_returns_empty_deletions()
    {
        NoOpArchitectureProjectRetentionPurgeService sut = new();

        IReadOnlyList<ArchitectureProjectPurgeDeletion> deletions =
            await sut.PurgeExpiredAsync(DateTimeOffset.UtcNow, CancellationToken.None);

        deletions.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpMarketingPricingQuoteRequestRepository_returns_null_insert_result()
    {
        NoOpMarketingPricingQuoteRequestRepository sut = new();

        MarketingPricingQuoteRequestInsertResult? result = await sut.AppendAsync(
            "buyer@example.com",
            "Acme",
            "team",
            "hello",
            clientIpSha256: null,
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task NoOpMarketingEarlyAccessRequestRepository_returns_null_insert_result()
    {
        NoOpMarketingEarlyAccessRequestRepository sut = new();

        MarketingEarlyAccessRequestInsertResult? result = await sut.AppendAsync(
            "buyer@example.com",
            companyName: "Acme",
            role: "architect",
            utmSource: "web",
            utmMedium: "cta",
            utmCampaign: "launch",
            clientIpSha256: null,
            CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task NoOpMarketingPricingQuoteRequestFollowUpRepository_returns_false_on_acknowledge_and_close()
    {
        NoOpMarketingPricingQuoteRequestFollowUpRepository sut = new();

        (await sut.AcknowledgeAsync(Guid.NewGuid(), assignedOwner: "owner", CancellationToken.None)).Should().BeFalse();
        (await sut.CloseAsync(Guid.NewGuid(), CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task NoOpMarketingPricingQuoteRequestAgingReader_returns_empty_rows()
    {
        NoOpMarketingPricingQuoteRequestAgingReader sut = new();

        IReadOnlyList<MarketingPricingQuoteRequestAgingRow> rows =
            await sut.ListAsync(CancellationToken.None);

        rows.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpArchitectureDecisionRegisterQuery_returns_empty_register()
    {
        NoOpArchitectureDecisionRegisterQuery sut = new();

        IReadOnlyList<ArchitectureDecisionRegisterEntry> entries = await sut.ListAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            projectId: null,
            maxRows: 10,
            filters: null,
            CancellationToken.None);

        entries.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpArchitectureRiskRegisterQuery_returns_empty_register()
    {
        NoOpArchitectureRiskRegisterQuery sut = new();

        IReadOnlyList<ArchitectureRiskRegisterEntry> entries = await sut.ListAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            projectId: null,
            maxRows: 10,
            options: null,
            CancellationToken.None);

        entries.Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpAdminNotificationsRepository_completes_without_side_effects()
    {
        NoOpAdminNotificationsRepository sut = new();

        await sut.InsertAsync("kind", "summary", dataJson: null, CancellationToken.None);
    }

    [Fact]
    public async Task NoOpPlatformAuditRepository_completes_without_side_effects()
    {
        NoOpPlatformAuditRepository sut = new();
        PlatformAuditEvent auditEvent = new()
        {
            EventType = "test.event",
            ActorUserId = "user-1",
            ActorUserName = "User One",
            SubjectTenantId = Guid.NewGuid(),
            DataJson = "{}",
        };

        await sut.AppendAsync(auditEvent, CancellationToken.None);
    }

    [Fact]
    public async Task NoOpTenantBlobPrefixDeletionService_returns_empty_result()
    {
        NoOpTenantBlobPrefixDeletionService sut = new();

        TenantBlobPrefixDeletionResult result =
            await sut.DeleteAllTenantPrefixesAsync(Guid.NewGuid(), CancellationToken.None);

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task NoOpCosmosGraphSnapshotOutboxRepository_completes_enqueue_and_dequeue_paths()
    {
        NoOpCosmosGraphSnapshotOutboxRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        await sut.EnqueueAsync(
            graphSnapshotId: Guid.NewGuid(),
            runId: Guid.NewGuid(),
            tenantId: tenantId,
            workspaceId: Guid.NewGuid(),
            projectId: Guid.NewGuid(),
            CancellationToken.None);

        IReadOnlyList<CosmosGraphSnapshotOutboxEntry> pending =
            await sut.DequeuePendingAsync(maxBatch: 5, leaseDurationSeconds: 30, CancellationToken.None);

        pending.Should().BeEmpty();

        await sut.MarkProcessedAsync(Guid.NewGuid(), CancellationToken.None);
        await sut.RecordBackoffAfterProcessingFailureAsync(
            Guid.NewGuid(),
            DateTime.UtcNow.AddMinutes(5),
            "failed",
            CancellationToken.None);
        await sut.RecordDeadLetterAsync(Guid.NewGuid(), "dead-letter", CancellationToken.None);
    }

    [Fact]
    public async Task NoOpAgentOutputEvaluationRepository_completes_append()
    {
        NoOpAgentOutputEvaluationRepository sut = new();

        await sut.AppendAsync(
            new AgentOutputEvaluationInsert
            {
                RunId = Guid.NewGuid().ToString("N"),
                PromptTemplateName = "template",
                PromptVariantKey = "default",
            },
            CancellationToken.None);
    }

    [Fact]
    public async Task NoOpAgentOutputEvaluationResultRepository_completes_append()
    {
        NoOpAgentOutputEvaluationResultRepository sut = new();

        await sut.AppendAsync(
            new AgentOutputEvaluationResultRecord
            {
                RunId = Guid.NewGuid().ToString("N"),
                CaseId = "case-1",
                AgentType = AgentType.Topology,
            },
            CancellationToken.None);
    }
}

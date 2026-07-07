using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class NoOpRepositoryStubCoverageTests
{
    [Fact]
    public async Task NoOpRiskExceptionRepository_returns_empty_results_and_completes_mutations()
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
            Rationale = "rationale",
            ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(30),
            Status = RiskExceptionStatus.Active,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedByUserId = "creator",
        };

        await sut.CreateAsync(record, CancellationToken.None);

        (await sut.GetByIdAsync(tenantId, riskExceptionId, CancellationToken.None)).Should().BeNull();
        (await sut.ListActiveForTenantAsync(tenantId, null, CancellationToken.None)).Should().BeEmpty();
        (await sut.MarkExpiredAsync(tenantId, DateTimeOffset.UtcNow, CancellationToken.None)).Should().BeEmpty();
        (await sut.ListRetiredSinceUtcAsync(tenantId, null, DateTimeOffset.UtcNow.AddDays(-1), CancellationToken.None))
            .Should()
            .BeEmpty();

        await sut.RevokeAsync(tenantId, riskExceptionId, "revoker", DateTimeOffset.UtcNow, CancellationToken.None);
        await sut.RenewAsync(
            tenantId,
            riskExceptionId,
            DateTimeOffset.UtcNow.AddDays(60),
            "renewer",
            "renewed",
            "evidence",
            CancellationToken.None);
    }

    [Fact]
    public async Task NoOpTenantCuratedEvidenceRepository_returns_empty_list_and_new_promoted_id()
    {
        NoOpTenantCuratedEvidenceRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        (await sut.ListByTenantAsync(tenantId, CancellationToken.None)).Should().BeEmpty();

        Guid promotedId = await sut.InsertPromotedEntryAsync(
            tenantId,
            "policy",
            "catalog-1",
            "title",
            "description",
            "rationale",
            "result-1",
            CancellationToken.None);

        promotedId.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task NoOpPlatformAuditRepository_appends_when_event_is_present()
    {
        NoOpPlatformAuditRepository sut = new();

        await sut.Invoking(
                s => s.AppendAsync(
                    new PlatformAuditEvent
                    {
                        EventType = "tenant.deleted",
                        ActorUserId = "actor",
                        ActorUserName = "Actor",
                        SubjectTenantId = Guid.NewGuid(),
                    },
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpPromptVariantStatsRepository_returns_empty_stats()
    {
        NoOpPromptVariantStatsRepository sut = new();

        (await sut.GetStatsByTemplateAsync("template", CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpCloudInventoryExtractorPackageRepository_completes_insert_and_returns_null_download()
    {
        NoOpCloudInventoryExtractorPackageRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        CloudInventoryExtractorPackageRecord record = new()
        {
            PackageId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            CreatedUtc = DateTime.UtcNow,
            CloudProvider = CloudProvider.Aws,
            SchemaVersion = 1,
            ScopeId = "scope",
            OriginalFileName = "inventory.zip",
            ManifestJson = "{}",
            PackageBytes = [1, 2, 3],
        };

        await sut.InsertAsync(record, CancellationToken.None);

        (await sut.TryGetDownloadByPackageIdAsync(scope, CloudProvider.Aws, record.PackageId, CancellationToken.None))
            .Should()
            .BeNull();
    }

    [Fact]
    public async Task NoOpAzureExtractorPackageRepository_returns_negative_probes()
    {
        NoOpAzureExtractorPackageRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        AzureExtractorPackageRecord record = new()
        {
            PackageId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            OriginalFileName = "azure.zip",
            ManifestJson = "{}",
            PackageBytes = [1],
        };

        await sut.InsertAsync(record, CancellationToken.None);

        (await sut.TryGetLatestProvenanceByRunIdAsync(scope, record.RunId!.Value, CancellationToken.None)).Should().BeNull();
        (await sut.HasAnyInWorkspaceAsync(scope, CancellationToken.None)).Should().BeFalse();
        (await sut.TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CancellationToken.None)).Should().BeNull();
        (await sut.TryGetDownloadByPackageIdAsync(scope, record.PackageId, CancellationToken.None)).Should().BeNull();
        (await sut.TryGetLatestDownloadInScopeAsync(scope, CancellationToken.None)).Should().BeNull();
        (await sut.TryGetLatestScriptVersionInScopeAsync(scope, CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task NoOpFindingReviewTrailRepository_completes_append_and_returns_empty_lists()
    {
        NoOpFindingReviewTrailRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        FindingReviewEventRecord reviewEvent = new()
        {
            EventId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            FindingId = "finding-1",
            ReviewerUserId = "reviewer",
            Action = FindingReviewAction.Approve,
            OccurredAtUtc = DateTimeOffset.UtcNow,
        };

        await sut.AppendAsync(reviewEvent, CancellationToken.None);

        (await sut.ListByFindingAsync(tenantId, "finding-1", CancellationToken.None)).Should().BeEmpty();
        (await sut.ListSinceUtcAsync(tenantId, DateTimeOffset.UtcNow.AddHours(-1), CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpAgentOutputEvaluationRepository_completes_append()
    {
        NoOpAgentOutputEvaluationRepository sut = new();

        await sut.AppendAsync(
            new AgentOutputEvaluationInsert
            {
                RunId = "run-1",
                PromptTemplateName = "template",
                PromptVariantKey = "variant",
                AgentType = AgentType.Topology,
                SemanticScore = 0.9,
                QualityGatePassed = true,
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);
    }

    [Fact]
    public async Task NoOpCosmosGraphSnapshotOutboxRepository_completes_lifecycle_methods()
    {
        NoOpCosmosGraphSnapshotOutboxRepository sut = new();
        Guid outboxId = Guid.NewGuid();

        await sut.EnqueueAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);
        (await sut.DequeuePendingAsync(10, 120, CancellationToken.None)).Should().BeEmpty();
        await sut.MarkProcessedAsync(outboxId, CancellationToken.None);
        await sut.RecordBackoffAfterProcessingFailureAsync(outboxId, DateTime.UtcNow.AddMinutes(1), "error", CancellationToken.None);
        await sut.RecordDeadLetterAsync(outboxId, "dead", CancellationToken.None);
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
    public async Task NoOpAuditEventChangeFeedHandler_completes_handle()
    {
        NoOpAuditEventChangeFeedHandler sut = new();

        await sut.HandleAsync([], CancellationToken.None);
    }
}

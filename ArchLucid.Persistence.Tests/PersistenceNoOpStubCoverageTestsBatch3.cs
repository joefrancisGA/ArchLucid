using ArchLucid.Core.Marketing;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.AdminNotifications;
using ArchLucid.Persistence.AzureExtractorChunkUpload;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Pilots;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class PersistenceNoOpStubCoverageTestsBatch3
{
    [Fact]
    public async Task NoOpMarketingEarlyAccessRequestRepository_returns_null_insert_result()
    {
        NoOpMarketingEarlyAccessRequestRepository sut = new();

        (await sut.AppendAsync(
                "user@example.com",
                "Acme",
                "Architect",
                "web",
                "organic",
                "launch",
                clientIpSha256: null,
                CancellationToken.None))
            .Should()
            .BeNull();
    }

    [Fact]
    public async Task NoOpMarketingPricingQuoteRequestRepository_returns_null_insert_result()
    {
        NoOpMarketingPricingQuoteRequestRepository sut = new();

        (await sut.AppendAsync(
                "buyer@example.com",
                "Acme",
                "Enterprise",
                "Need pricing",
                clientIpSha256: null,
                CancellationToken.None))
            .Should()
            .BeNull();
    }

    [Fact]
    public async Task NoOpMarketingPricingQuoteRequestAgingReader_returns_empty_rows()
    {
        NoOpMarketingPricingQuoteRequestAgingReader sut = new();

        (await sut.ListAsync(CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpMarketingPricingQuoteRequestFollowUpRepository_returns_false_for_mutations()
    {
        NoOpMarketingPricingQuoteRequestFollowUpRepository sut = new();
        Guid requestId = Guid.NewGuid();

        (await sut.AcknowledgeAsync(requestId, "owner", CancellationToken.None)).Should().BeFalse();
        (await sut.CloseAsync(requestId, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task NoOpTenantMarketingAttributionRepository_returns_false_for_first_touch()
    {
        NoOpTenantMarketingAttributionRepository sut = new();

        bool inserted = await sut.TryInsertFirstTouchAsync(
            Guid.NewGuid(),
            new MarketingAttributionSnapshot { UtmSource = "web", UtmMedium = "organic" },
            coarseMedium: "organic",
            coarsePlatform: "web",
            CancellationToken.None);

        inserted.Should().BeFalse();
    }

    [Fact]
    public async Task NoOpArchitectureRiskRegisterQuery_returns_empty_register()
    {
        NoOpArchitectureRiskRegisterQuery sut = new();

        (await sut.ListAsync(Guid.NewGuid(), Guid.NewGuid(), projectId: null, maxRows: 10, options: null, CancellationToken.None))
            .Should()
            .BeEmpty();
    }

    [Fact]
    public async Task NoOpArchitectureDecisionRegisterQuery_returns_empty_register()
    {
        NoOpArchitectureDecisionRegisterQuery sut = new();

        (await sut.ListAsync(
                Guid.NewGuid(),
                projectId: null,
                maxRows: 10,
                filters: null,
                CancellationToken.None))
            .Should()
            .BeEmpty();
    }

    [Fact]
    public async Task NoOpAdminNotificationsRepository_completes_insert()
    {
        NoOpAdminNotificationsRepository sut = new();

        await sut.Invoking(s => s.InsertAsync("kind", "summary", dataJson: null, CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task NoOpArchitectureProjectRetentionPurgeService_returns_empty_deletions()
    {
        NoOpArchitectureProjectRetentionPurgeService sut = new();

        (await sut.PurgeExpiredAsync(DateTimeOffset.UtcNow, CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NullPilotScorecardMetricsReader_returns_zero_metrics()
    {
        NullPilotScorecardMetricsReader sut = new();

        PilotScorecardTenantMetrics metrics = await sut.GetAsync(Guid.NewGuid(), CancellationToken.None);

        metrics.TotalRunsCommitted.Should().Be(0);
        metrics.AverageTimeToManifestMinutes.Should().BeNull();
    }

    [Fact]
    public async Task NullArtifactBlobStore_read_paths_return_null_and_write_throws()
    {
        NullArtifactBlobStore sut = new();

        (await sut.ReadAsync("https://blob.example/container/name", CancellationToken.None)).Should().BeNull();
        (await sut.TryGetExistingUriAsync("container", "logical", CancellationToken.None)).Should().BeNull();

        Func<Task> write = () => sut.WriteAsync("container", "blob", "content", CancellationToken.None);

        await write.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Artifact blob offload is disabled*");
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
    public async Task NullAzureExtractorChunkSessionStore_reports_unavailable_and_throws_on_mutations()
    {
        NullAzureExtractorChunkSessionStore sut = new();

        sut.IsAvailable.Should().BeFalse();

        Func<Task> create = () => sut.CreateSessionAsync(
            new AzureExtractorChunkSessionDescriptor(
                new ScopeContext
                {
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                },
                originalFileName: "inventory.zip",
                totalChunks: 2,
                declaredTotalBytes: 1024),
            CancellationToken.None);

        await create.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*chunked upload requires*");

        await sut.Invoking(s => s.DeleteSessionAsync(Guid.NewGuid(), CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }
}

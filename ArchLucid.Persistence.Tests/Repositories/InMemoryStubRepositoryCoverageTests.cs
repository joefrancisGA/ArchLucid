using System.Data;

using ArchLucid.Core.Marketing;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryStubRepositoryCoverageTests
{
    [Fact]
    public async Task InMemoryReferenceEvidenceRunLookup_returns_empty_list()
    {
        InMemoryReferenceEvidenceRunLookup sut = new();

        (await sut.ListRecentCommittedRunsAsync(Guid.NewGuid(), take: 10, includeDemo: false, CancellationToken.None))
            .Should()
            .BeEmpty();
    }

    [Fact]
    public async Task InMemoryManifestFinalizationSqlRepository_throws_not_supported()
    {
        InMemoryManifestFinalizationSqlRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IDbConnection> connection = new();
        Mock<IDbTransaction> transaction = new();

        Func<Task> lockAct = () =>
            sut.LockRunForFinalizationAsync(scope, Guid.NewGuid(), connection.Object, transaction.Object, CancellationToken.None);

        await lockAct.Should().ThrowAsync<NotSupportedException>()
            .WithMessage("*in-memory storage mode*");
    }

    [Fact]
    public async Task NoOpTenantMarketingAttributionRepository_returns_false()
    {
        NoOpTenantMarketingAttributionRepository sut = new();
        MarketingAttributionSnapshot snapshot = new()
        {
            UtmSource = "source",
            UtmMedium = "medium",
            UtmCampaign = "campaign",
            CapturedUtc = DateTimeOffset.UtcNow,
        };

        bool inserted = await sut.TryInsertFirstTouchAsync(
            Guid.NewGuid(),
            snapshot,
            coarseMedium: "paid",
            coarsePlatform: "web",
            CancellationToken.None);

        inserted.Should().BeFalse();
    }

    [Fact]
    public async Task NoOpMarketingPricingQuoteRequestFollowUpRepository_returns_false_for_mutations()
    {
        NoOpMarketingPricingQuoteRequestFollowUpRepository sut = new();
        Guid requestId = Guid.NewGuid();

        (await sut.AcknowledgeAsync(requestId, "owner", CancellationToken.None)).Should().BeFalse();
        (await sut.CloseAsync(requestId, CancellationToken.None)).Should().BeFalse();
    }
}

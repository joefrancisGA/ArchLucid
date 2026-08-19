using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;
using ArchLucid.Retrieval.ProductLearning;
using ArchLucid.Retrieval.Queries;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Retrieval.Tests.ProductLearning;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProductLearningPlanningRetrievalContributorTests
{
    private static readonly Guid TenantA = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid TenantB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private static readonly Guid SignalId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task IndexPilotSignalsAsync_skips_cross_scope_signals()
    {
        Mock<IRetrievalIndexingService> indexing = new();
        Mock<IRetrievalQueryService> query = new();
        Mock<IOptionsMonitor<ProductLearningPlanningRetrievalOptions>> options = EnabledOptions();

        ProductLearningPlanningRetrievalContributor contributor = new(
            indexing.Object,
            query.Object,
            options.Object);

        ProductLearningScope scope = Scope(TenantA);

        await contributor.IndexPilotSignalsAsync(
            scope,
            [
                new ProductLearningPilotSignalRecord
                {
                    TenantId = TenantB,
                    WorkspaceId = WorkspaceId,
                    ProjectId = ProjectId,
                    SignalId = SignalId,
                    SubjectType = "run-output",
                    Disposition = "rejected",
                    RecordedUtc = DateTime.UtcNow,
                },
            ],
            CancellationToken.None);

        indexing.Verify(
            s => s.IndexDocumentsAsync(It.IsAny<IReadOnlyList<RetrievalDocument>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RetrievePriorsForOpportunityAsync_returns_pilot_feedback_citations_only()
    {
        Mock<IRetrievalIndexingService> indexing = new();
        Mock<IRetrievalQueryService> query = new();
        Mock<IOptionsMonitor<ProductLearningPlanningRetrievalOptions>> options = EnabledOptions();

        query
            .Setup(q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    CorpusKind = nameof(CorpusKind.PilotFeedback),
                    SourceId = SignalId.ToString("N"),
                    Text = "Prior pilot signal about gateway latency",
                },
                new RetrievalHit
                {
                    CorpusKind = nameof(CorpusKind.KnowledgeGraphNode),
                    SourceId = Guid.NewGuid().ToString("N"),
                    Text = "Should be ignored",
                },
            ]);

        ProductLearningPlanningRetrievalContributor contributor = new(
            indexing.Object,
            query.Object,
            options.Object);

        IReadOnlyList<PlanningRetrievalCitation> citations = await contributor.RetrievePriorsForOpportunityAsync(
            Scope(TenantA),
            new ImprovementOpportunity
            {
                Title = "Gateway latency",
                Summary = "Operators flagged slow BFF paths",
                SourceAggregateKey = "pattern:api-gateway",
            },
            CancellationToken.None);

        citations.Should().ContainSingle();
        citations[0].SignalId.Should().Be(SignalId);
        citations[0].ThemeKey.Should().Be("pattern:api-gateway");
        citations[0].Snippet.Should().Contain("gateway latency");

        query.Verify(
            q => q.SearchAsync(
                It.Is<RetrievalQuery>(r =>
                    r.TenantId == TenantA
                    && r.WorkspaceId == WorkspaceId
                    && r.ProjectId == ProjectId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RetrievePriorsForOpportunityAsync_returns_empty_when_disabled()
    {
        Mock<IRetrievalIndexingService> indexing = new();
        Mock<IRetrievalQueryService> query = new();
        Mock<IOptionsMonitor<ProductLearningPlanningRetrievalOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ProductLearningPlanningRetrievalOptions { Enabled = false });

        ProductLearningPlanningRetrievalContributor contributor = new(
            indexing.Object,
            query.Object,
            options.Object);

        IReadOnlyList<PlanningRetrievalCitation> citations = await contributor.RetrievePriorsForOpportunityAsync(
            Scope(TenantA),
            new ImprovementOpportunity { Title = "Any", Summary = "Any" },
            CancellationToken.None);

        citations.Should().BeEmpty();
        query.Verify(
            q => q.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static Mock<IOptionsMonitor<ProductLearningPlanningRetrievalOptions>> EnabledOptions()
    {
        Mock<IOptionsMonitor<ProductLearningPlanningRetrievalOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new ProductLearningPlanningRetrievalOptions { Enabled = true });

        return options;
    }

    private static ProductLearningScope Scope(Guid tenantId) =>
        new()
        {
            TenantId = tenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };
}

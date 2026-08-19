using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Explanation;

[Trait("Suite", "Core")]
public sealed class RunRetrievalGroundingServiceTests
{
    [SkippableFact]
    public async Task BuildAsync_WhenRunIdNotGuid_ReturnsNull()
    {
        RunRetrievalGroundingService sut = CreateSut(out _, out _, out _);

        RunRetrievalGroundingResponse? result = await sut.BuildAsync("not-a-guid");

        result.Should().BeNull();
    }

    [SkippableFact]
    public async Task BuildAsync_WhenRunMissingInScope_ReturnsNullAndDoesNotReadGrounding()
    {
        RunRetrievalGroundingService sut = CreateSut(
            out Mock<IAuthorityQueryService> authority,
            out _,
            out Mock<IRetrievalGroundingTraceReader> grounding);
        Guid runGuid = Guid.Parse("11111111-1111-1111-1111-111111111111");
        authority.Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        RunRetrievalGroundingResponse? result = await sut.BuildAsync(runGuid.ToString("D"));

        result.Should().BeNull();
        grounding.Verify(
            g => g.GetByRunIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task BuildAsync_UsesCurrentScopeAndProjectsRedactionSafeRows()
    {
        ScopeContext expectedScope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
        Guid runGuid = Guid.Parse("22222222-2222-2222-2222-222222222222");
        RunRetrievalGroundingService sut = CreateSut(
            out Mock<IAuthorityQueryService> authority,
            out Mock<IScopeContextProvider> scope,
            out Mock<IRetrievalGroundingTraceReader> grounding);
        scope.Setup(s => s.GetCurrentScope()).Returns(expectedScope);
        authority.Setup(a => a.GetRunDetailAsync(expectedScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MinimalDetail(runGuid));
        grounding.Setup(g => g.GetByRunIdAsync(
                expectedScope.TenantId,
                expectedScope.WorkspaceId,
                expectedScope.ProjectId,
                runGuid,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalGroundingTraceRecord
                {
                    TraceId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    RunId = runGuid,
                    TenantId = expectedScope.TenantId,
                    WorkspaceId = expectedScope.WorkspaceId,
                    ProjectId = expectedScope.ProjectId,
                    AgentName = "Compliance",
                    CorpusKind = "PolicyPack",
                    RetrievedChunkIds = ["chunk-a", "chunk-b"],
                    DocumentIdsJson = "[\"doc-a\",\"doc-b\"]",
                    ScoresJson = "[{\"chunkId\":\"chunk-a\",\"score\":0.9123}]",
                    CitationCoverage = 0.75,
                    TokensIn = 120,
                    TokensOut = 40,
                    TopK = 5,
                    AgentExecutionTraceId = "trace-1",
                    QueryText = "must not be projected",
                    CreatedUtc = new DateTime(2026, 5, 28, 1, 2, 3, DateTimeKind.Utc),
                },
            ]);

        RunRetrievalGroundingResponse? result = await sut.BuildAsync(runGuid.ToString("N"));

        result.Should().NotBeNull();
        result!.TraceCount.Should().Be(1);
        result.HasDegradedMetadata.Should().BeFalse();
        RunRetrievalGroundingRow row = result.Rows.Should().ContainSingle().Subject;
        row.AgentName.Should().Be("Compliance");
        row.CorpusKind.Should().Be("PolicyPack");
        row.RetrievedChunkIds.Should().Equal("chunk-a", "chunk-b");
        row.DocumentIds.Should().Equal("doc-a", "doc-b");
        row.ScoreSummaries.Should().ContainSingle().Which.Score.Should().Be(0.9123);
        row.RetrievedChunkCount.Should().Be(2);
        row.CitationCoverage.Should().Be(0.75);
        row.TokensIn.Should().Be(120);
        row.TokensOut.Should().Be(40);
        row.TopK.Should().Be(5);
        row.AgentExecutionTraceId.Should().Be("trace-1");
    }

    [SkippableFact]
    public async Task BuildAsync_WhenPersistedMetadataMalformed_ReturnsDegradedFlags()
    {
        Guid runGuid = Guid.Parse("44444444-4444-4444-4444-444444444444");
        RunRetrievalGroundingService sut = CreateSut(
            out Mock<IAuthorityQueryService> authority,
            out _,
            out Mock<IRetrievalGroundingTraceReader> grounding);
        authority.Setup(a => a.GetRunDetailAsync(It.IsAny<ScopeContext>(), runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(MinimalDetail(runGuid));
        grounding.Setup(g => g.GetByRunIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                runGuid,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalGroundingTraceRecord
                {
                    TraceId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    AgentName = "Compliance",
                    RetrievedChunkIds = [],
                    DocumentIdsJson = "{bad",
                    ScoresJson = "{bad",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                },
            ]);

        RunRetrievalGroundingResponse? result = await sut.BuildAsync(runGuid.ToString("D"));

        result.Should().NotBeNull();
        result!.HasDegradedMetadata.Should().BeTrue();
        RunRetrievalGroundingRow row = result.Rows.Should().ContainSingle().Subject;
        row.DocumentMetadataMalformed.Should().BeTrue();
        row.ScoreMetadataMalformed.Should().BeTrue();
        row.DocumentIds.Should().BeEmpty();
        row.ScoreSummaries.Should().BeEmpty();
    }

    private static RunRetrievalGroundingService CreateSut(
        out Mock<IAuthorityQueryService> authority,
        out Mock<IScopeContextProvider> scope,
        out Mock<IRetrievalGroundingTraceReader> grounding)
    {
        authority = new Mock<IAuthorityQueryService>();
        scope = new Mock<IScopeContextProvider>();
        grounding = new Mock<IRetrievalGroundingTraceReader>();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        grounding.Setup(g => g.GetByRunIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return new RunRetrievalGroundingService(authority.Object, scope.Object, grounding.Object);
    }

    private static RunDetailDto MinimalDetail(Guid runGuid)
    {
        return new RunDetailDto
        {
            Run = new RunRecord
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ScopeProjectId = Guid.NewGuid(),
                RunId = runGuid,
                ProjectId = "default",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
        };
    }
}

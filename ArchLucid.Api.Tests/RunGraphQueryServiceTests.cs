using ArchLucid.Api.Services.Authority;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Trust;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunGraphQueryServiceTests
{
    [Fact]
    public async Task GetRunRoiEstimateAsync_returns_not_found_for_whitespace_run_id_like_GetRunDetail()
    {
        Mock<IRunDetailQueryService> detail = new();
        RunGraphQueryService sut = CreateService(detail.Object);

        RunRoiEstimateQueryResult result = await sut.GetRunRoiEstimateAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.NotFound);
        result.ProblemDetail.Should().ContainEquivalentOf("not found");
        detail.Verify(
            d => d.GetRunDetailForOperatorEnrichAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetRunDetailAsync_returns_not_found_for_whitespace_run_id_without_throwing()
    {
        Mock<IRunDetailQueryService> detail = new();
        RunGraphQueryService sut = CreateService(detail.Object);

        RunGraphDetailQueryResult result = await sut.GetRunDetailAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.NotFound);
        detail.Verify(
            d => d.GetRunDetailForOperatorEnrichAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetRunStageTimelineAsync_returns_not_found_for_whitespace_run_id_like_GetRunDetail()
    {
        Mock<IRunRepository> runs = new();
        RunGraphQueryService sut = CreateService(Mock.Of<IRunDetailQueryService>(), runs.Object);

        RunStageTimelineQueryResult result = await sut.GetRunStageTimelineAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.NotFound);
        result.ProblemDetail.Should().ContainEquivalentOf("not found");
        runs.Verify(
            r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task GetInteractiveGraphSnapshotAsync_returns_not_found_for_whitespace_run_id_like_GetRunDetail()
    {
        Mock<IAuthorityQueryService> authorityQuery = new();
        RunGraphQueryService sut = CreateService(Mock.Of<IRunDetailQueryService>(), Mock.Of<IRunRepository>(), authorityQuery.Object);

        RunInteractiveGraphQueryResult result =
            await sut.GetInteractiveGraphSnapshotAsync("   ", CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.NotFound);
        result.ProblemDetail.Should().ContainEquivalentOf("not found");
        authorityQuery.Verify(
            q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static RunGraphQueryService CreateService(IRunDetailQueryService runDetailQueryService) =>
        CreateService(runDetailQueryService, Mock.Of<IRunRepository>());

    private static RunGraphQueryService CreateService(
        IRunDetailQueryService runDetailQueryService,
        IRunRepository authorityRunRepository) =>
        CreateService(runDetailQueryService, authorityRunRepository, Mock.Of<IAuthorityQueryService>());

    private static RunGraphQueryService CreateService(
        IRunDetailQueryService runDetailQueryService,
        IRunRepository authorityRunRepository,
        IAuthorityQueryService authorityQueryService) =>
        new(
            runDetailQueryService,
            Mock.Of<IRunRoiEstimator>(),
            authorityRunRepository,
            Mock.Of<IRunStageOutcomesRepository>(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IRunTrustEvidenceCardBuilder>(),
            Mock.Of<ILlmCostEstimator>(),
            authorityQueryService,
            Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<IDbConnectionFactory>());
}

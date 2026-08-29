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

    private static RunGraphQueryService CreateService(IRunDetailQueryService runDetailQueryService) =>
        new(
            runDetailQueryService,
            Mock.Of<IRunRoiEstimator>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IRunStageOutcomesRepository>(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IRunTrustEvidenceCardBuilder>(),
            Mock.Of<ILlmCostEstimator>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IEffectiveAgentExecutionModeAccessor>(),
            Mock.Of<IAgentExecutionTraceRepository>(),
            Mock.Of<IDbConnectionFactory>());
}

using ArchLucid.Api.Services.Authority;
using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Application.Trust;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Persistence.ApplicationPorts.Agents;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
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
    public async Task CompareQuality_GetRunDetailAsync_includes_llm_cost_when_traces_use_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("89898989-8989-8989-8989-898989898989");
        string routeRunId = runGuid.ToString("D").ToUpperInvariant();
        string legacyUpper = runGuid.ToString("N").ToUpperInvariant();
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        RunRecord runHeader = new()
        {
            RunId = runGuid,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "default",
            RowVersion = [1, 2, 3, 4, 5, 6, 7, 8],
        };

        ArchitectureRunDetail architectureDetail = new()
        {
            Run = new ArchitectureRun { RunId = runGuid.ToString("N") },
            Tasks = [],
            Results = [],
        };

        Mock<IRunDetailQueryService> detail = new();
        detail
            .Setup(d => d.GetRunDetailForOperatorEnrichAsync(routeRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(architectureDetail);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(scope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runHeader);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-legacy-run-graph",
                RunId = legacyUpper,
                ModelDeploymentName = "gpt-4o",
                InputTokenCount = 120,
                OutputTokenCount = 30,
            },
            CancellationToken.None);

        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(e => e.EstimateUsd(120, 30, 0, "gpt-4o"))
            .Returns(0.55m);

        Mock<IEffectiveAgentExecutionModeAccessor> executionMode = new();
        executionMode.Setup(a => a.GetEffectiveMode()).Returns("Real");

        RunGraphQueryService sut = new(
            detail.Object,
            Mock.Of<IRunRoiEstimator>(),
            runs.Object,
            Mock.Of<IRunStageOutcomesRepository>(),
            scopeProvider.Object,
            Mock.Of<IRunTrustEvidenceCardBuilder>(),
            estimator.Object,
            Mock.Of<IAuthorityQueryService>(),
            executionMode.Object,
            traceRepository,
            Mock.Of<IDbConnectionFactory>());

        RunGraphDetailQueryResult result = await sut.GetRunDetailAsync(routeRunId, CancellationToken.None);

        result.Outcome.Should().Be(RunGraphQueryOutcome.Success);
        result.Response!.AgentExecutionLlmCostEstimate.Should().NotBeNull();
        result.Response.AgentExecutionLlmCostEstimate!.EstimatedCostUsd.Should().Be(0.55m);
        result.Response.AgentExecutionLlmCostEstimate.TokenCounts.Prompt.Should().Be(120);
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

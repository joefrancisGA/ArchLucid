using ArchLucid.Application.Agents;
using ArchLucid.Application.Billing;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Billing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantLlmCostTopRunRankerTests
{
    [Fact]
    public async Task RankAsync_orders_runs_by_estimated_trace_cost_descending()
    {
        Guid runA = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runB = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            WorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ProjectId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(static service => service.ListRunsByProjectAsync(
                It.IsAny<ScopeContext>(),
                "default",
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunSummaryDto
                {
                    RunId = runA,
                    ProjectId = "default",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
                new RunSummaryDto
                {
                    RunId = runB,
                    ProjectId = "default",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
            ]);

        string runAHex = runA.ToString("N");
        string runBHex = runB.ToString("N");

        Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> slicesByRunId =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [runAHex] =
                [
                    new AgentExecutionTraceLlmCostSlice
                    {
                        InputTokenCount = 100,
                        OutputTokenCount = 50,
                        ModelDeploymentName = "gpt-test",
                    },
                ],
                [runBHex] =
                [
                    new AgentExecutionTraceLlmCostSlice
                    {
                        InputTokenCount = 500,
                        OutputTokenCount = 200,
                        ModelDeploymentName = "gpt-test",
                    },
                ],
            };

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdsAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<IReadOnlyCollection<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(slicesByRunId);

        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(static est => est.EstimateUsd(100, 50, 0, "gpt-test"))
            .Returns(0.10m);
        estimator
            .Setup(static est => est.EstimateUsd(500, 200, 0, "gpt-test"))
            .Returns(1.25m);

        TenantLlmCostTopRunRanker ranker = new(
            scopeProvider.Object,
            authority.Object,
            traces.Object,
            estimator.Object);

        IReadOnlyList<ArchLucid.Contracts.Billing.LlmCostTopRunRowResponse> rows =
            await ranker.RankAsync(maxRunsToScan: 5, take: 2);

        rows.Should().HaveCount(2);
        rows[0].RunId.Should().Be(runB.ToString("N"));
        rows[0].EstimatedCostUsd.Should().Be(1.25m);
        rows[1].RunId.Should().Be(runA.ToString("N"));

        // Guards the N+1 regression: every scanned run must be covered by a single batched query.
        traces.Verify(
            repository => repository.GetLlmCostSlicesByRunIdsAsync(
                It.IsAny<ScopeContext>(),
                It.Is<IReadOnlyCollection<string>>(ids => ids.Count == 2),
                It.IsAny<CancellationToken>()),
            Times.Once);

        traces.Verify(
            repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RankAsync_skips_runs_with_no_trace_slices()
    {
        Guid runWithoutTraces = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            WorkspaceId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            ProjectId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(static service => service.ListRunsByProjectAsync(
                It.IsAny<ScopeContext>(),
                "default",
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RunSummaryDto
                {
                    RunId = runWithoutTraces,
                    ProjectId = "default",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
            ]);

        // Batch result omits the run entirely, which is what the SQL grouping returns for a run with no traces.
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdsAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<IReadOnlyCollection<string>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>>(
                StringComparer.OrdinalIgnoreCase));

        Mock<ILlmCostEstimator> estimator = new();

        TenantLlmCostTopRunRanker ranker = new(
            scopeProvider.Object,
            authority.Object,
            traces.Object,
            estimator.Object);

        IReadOnlyList<ArchLucid.Contracts.Billing.LlmCostTopRunRowResponse> rows =
            await ranker.RankAsync(maxRunsToScan: 5, take: 2);

        rows.Should().BeEmpty();
    }
}

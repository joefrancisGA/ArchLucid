using ArchLucid.Application.Agents;
using ArchLucid.Application.Analysis;
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
            .Setup(static service => service.ListRunsInScopeKeysetAsync(
                It.IsAny<ScopeContext>(),
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
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
            ],
            false));

        string runAHex = runA.ToString("N");
        string runBHex = runB.ToString("N");

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runAHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    InputTokenCount = 100,
                    OutputTokenCount = 50,
                    ModelDeploymentName = "gpt-test",
                },
            ]);
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runBHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    InputTokenCount = 500,
                    OutputTokenCount = 200,
                    ModelDeploymentName = "gpt-test",
                },
            ]);

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

        traces.Verify(
            repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runAHex,
                It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
        traces.Verify(
            repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runBHex,
                It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task CompareQuality_RankAsync_includes_run_when_traces_use_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("dadadada-dada-dada-dada-dadadadadada");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("eaeaeaea-eaea-eaea-eaea-eaeaeaeaeaea"),
            WorkspaceId = Guid.Parse("fafafafa-fafa-fafa-fafa-fafafafafafa"),
            ProjectId = Guid.Parse("abababab-abab-abab-abab-abababababab"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(static service => service.ListRunsInScopeKeysetAsync(
                It.IsAny<ScopeContext>(),
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
            [
                new RunSummaryDto
                {
                    RunId = runGuid,
                    ProjectId = "legacy-trace",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
            ],
            false));

        InMemoryAgentExecutionTraceRepository traces = new();
        await traces.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-ranker-legacy",
                RunId = legacyUpper,
                ModelDeploymentName = "gpt-test",
                InputTokenCount = 400,
                OutputTokenCount = 100,
            },
            CancellationToken.None);

        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(static est => est.EstimateUsd(400, 100, 0, "gpt-test"))
            .Returns(2.50m);

        TenantLlmCostTopRunRanker ranker = new(
            scopeProvider.Object,
            authority.Object,
            traces,
            estimator.Object);

        IReadOnlyList<ArchLucid.Contracts.Billing.LlmCostTopRunRowResponse> rows =
            await ranker.RankAsync(maxRunsToScan: 5, take: 1);

        rows.Should().ContainSingle();
        rows[0].RunId.Should().Be(canonicalRunId);
        rows[0].EstimatedCostUsd.Should().Be(2.50m);
    }

    [Fact]
    public async Task RankAsync_includes_runs_whose_project_slug_is_not_default()
    {
        Guid runId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            WorkspaceId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            ProjectId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(static service => service.ListRunsInScopeKeysetAsync(
                It.IsAny<ScopeContext>(),
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
            [
                new RunSummaryDto
                {
                    RunId = runId,
                    ProjectId = "REQ-AUTH-LIST-SCOPE-001",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
            ],
            false));
        authority
            .Setup(static service => service.ListRunsByProjectAsync(
                It.IsAny<ScopeContext>(),
                "default",
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<RunSummaryDto>());

        string runHex = runId.ToString("N");

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    InputTokenCount = 200,
                    OutputTokenCount = 100,
                    ModelDeploymentName = "gpt-test",
                },
            ]);

        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(static est => est.EstimateUsd(200, 100, 0, "gpt-test"))
            .Returns(0.55m);

        TenantLlmCostTopRunRanker ranker = new(
            scopeProvider.Object,
            authority.Object,
            traces.Object,
            estimator.Object);

        IReadOnlyList<ArchLucid.Contracts.Billing.LlmCostTopRunRowResponse> rows =
            await ranker.RankAsync(maxRunsToScan: 5, take: 1);

        rows.Should().ContainSingle();
        rows[0].RunId.Should().Be(runHex);
        rows[0].EstimatedCostUsd.Should().Be(0.55m);

        authority.Verify(
            service => service.ListRunsByProjectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
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
            .Setup(static service => service.ListRunsInScopeKeysetAsync(
                It.IsAny<ScopeContext>(),
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
            [
                new RunSummaryDto
                {
                    RunId = runWithoutTraces,
                    ProjectId = "default",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
            ],
            false));

        string runHex = runWithoutTraces.ToString("N");
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

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

    [Fact]
    public async Task RankAsync_includes_reasoning_only_runs_when_cost_rate_is_unavailable()
    {
        Guid runId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            WorkspaceId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            ProjectId = Guid.Parse("66666666-7777-8888-9999-000000000000"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(static service => service.ListRunsInScopeKeysetAsync(
                It.IsAny<ScopeContext>(),
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
            [
                new RunSummaryDto
                {
                    RunId = runId,
                    ProjectId = "reasoning-project",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
            ],
            false));

        string runHex = runId.ToString("N");
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                runHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    ReasoningTokenCount = 300,
                    ModelDeploymentName = "unpriced-reasoning-model",
                },
            ]);

        TenantLlmCostTopRunRanker ranker = new(
            scopeProvider.Object,
            authority.Object,
            traces.Object,
            Mock.Of<ILlmCostEstimator>());

        IReadOnlyList<ArchLucid.Contracts.Billing.LlmCostTopRunRowResponse> rows =
            await ranker.RankAsync(maxRunsToScan: 5, take: 1);

        rows.Should().ContainSingle();
        rows[0].RunId.Should().Be(runHex);
        rows[0].LlmCallCount.Should().Be(1);
        rows[0].EstimatedCostUsd.Should().Be(0m);
        rows[0].ReasoningTokens.Should().Be(300);
        rows[0].PromptTokens.Should().Be(0);
        rows[0].CompletionTokens.Should().Be(0);
    }

    [Fact]
    public async Task RankAsync_ranks_unpriced_reasoning_only_run_above_smaller_prompt_run()
    {
        Guid reasoningRunId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        Guid promptRunId = Guid.Parse("88888888-8888-8888-8888-888888888888");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            WorkspaceId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
            ProjectId = Guid.Parse("66666666-7777-8888-9999-000000000000"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(scope);

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(static service => service.ListRunsInScopeKeysetAsync(
                It.IsAny<ScopeContext>(),
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
            [
                new RunSummaryDto
                {
                    RunId = promptRunId,
                    ProjectId = "small-prompt",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
                new RunSummaryDto
                {
                    RunId = reasoningRunId,
                    ProjectId = "reasoning-project",
                    CreatedUtc = DateTime.UtcNow.AddMinutes(-1),
                    GoldenManifestId = Guid.NewGuid(),
                },
            ],
            false));

        string promptHex = promptRunId.ToString("N");
        string reasoningHex = reasoningRunId.ToString("N");
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                promptHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    InputTokenCount = 1,
                    ModelDeploymentName = "unpriced-prompt-model",
                },
            ]);
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                reasoningHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    ReasoningTokenCount = 300,
                    ModelDeploymentName = "unpriced-reasoning-model",
                },
            ]);

        TenantLlmCostTopRunRanker ranker = new(
            scopeProvider.Object,
            authority.Object,
            traces.Object,
            Mock.Of<ILlmCostEstimator>());

        IReadOnlyList<ArchLucid.Contracts.Billing.LlmCostTopRunRowResponse> rows =
            await ranker.RankAsync(maxRunsToScan: 5, take: 1);

        rows.Should().ContainSingle();
        rows[0].RunId.Should().Be(reasoningHex);
    }

    [Fact]
    public async Task RankAsync_breaks_cost_and_token_ties_by_run_id_descending()
    {
        Guid runLower = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid runHigher = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
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
            .Setup(static service => service.ListRunsInScopeKeysetAsync(
                It.IsAny<ScopeContext>(),
                null,
                null,
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
            [
                new RunSummaryDto
                {
                    RunId = runLower,
                    ProjectId = "tie-a",
                    CreatedUtc = DateTime.UtcNow,
                    GoldenManifestId = Guid.NewGuid(),
                },
                new RunSummaryDto
                {
                    RunId = runHigher,
                    ProjectId = "tie-b",
                    CreatedUtc = DateTime.UtcNow.AddMinutes(-1),
                    GoldenManifestId = Guid.NewGuid(),
                },
            ],
            false));

        string lowerHex = runLower.ToString("N");
        string higherHex = runHigher.ToString("N");

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                lowerHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    InputTokenCount = 40,
                    OutputTokenCount = 10,
                    ModelDeploymentName = "unpriced-model",
                },
            ]);
        traces
            .Setup(repository => repository.GetLlmCostSlicesByRunIdAsync(
                It.IsAny<ScopeContext>(),
                higherHex,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTraceLlmCostSlice
                {
                    InputTokenCount = 40,
                    OutputTokenCount = 10,
                    ModelDeploymentName = "unpriced-model",
                },
            ]);

        TenantLlmCostTopRunRanker ranker = new(
            scopeProvider.Object,
            authority.Object,
            traces.Object,
            Mock.Of<ILlmCostEstimator>());

        IReadOnlyList<ArchLucid.Contracts.Billing.LlmCostTopRunRowResponse> rows =
            await ranker.RankAsync(maxRunsToScan: 5, take: 2);

        rows.Should().HaveCount(2);
        rows[0].RunId.Should().Be(higherHex);
        rows[1].RunId.Should().Be(lowerHex);
    }
}

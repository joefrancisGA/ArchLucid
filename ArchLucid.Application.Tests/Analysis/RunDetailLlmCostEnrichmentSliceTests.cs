using ArchLucid.Application.Runs.Enrichment;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RunDetailLlmCostEnrichmentSliceTests
{
    [Fact]
    public async Task CompareQuality_EnrichAsync_loads_llm_cost_when_trace_run_id_uses_parentheses_guid()
    {
        Guid runGuid = Guid.Parse("37373737-3737-3737-3737-373737373737");
        string traceRunId = runGuid.ToString("P").ToUpperInvariant();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-p-format",
                RunId = traceRunId,
                ModelDeploymentName = "gpt-4o",
                InputTokenCount = 200,
                OutputTokenCount = 50,
            },
            CancellationToken.None);

        Mock<ILlmCostEstimator> llmCostEstimator = new();
        llmCostEstimator
            .Setup(e => e.EstimateUsd(200, 50, 0, "gpt-4o"))
            .Returns(1.25m);

        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runGuid,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ScopeProjectId = projectId,
            },
        };

        RunDetailLlmCostEnrichmentSlice slice = new(traceRepository, llmCostEstimator.Object);
        await slice.EnrichAsync(
            new RunDetailEnrichmentContext { Detail = detail },
            CancellationToken.None);

        detail.AgentExecutionLlmCostEstimate.Should().NotBeNull();
        detail.AgentExecutionLlmCostEstimate!.EstimatedCostUsd.Should().Be(1.25m);
    }

    [Fact]
    public async Task CompareQuality_EnrichAsync_loads_llm_cost_when_trace_run_id_differs_only_by_casing()
    {
        Guid runGuid = Guid.Parse("efefefef-efef-efef-efef-efefefefefef");
        string runN = runGuid.ToString("N");
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        InMemoryAgentExecutionTraceRepository traceRepository = new();
        await traceRepository.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-operator-cost-casing",
                RunId = runN.ToUpperInvariant(),
                ModelDeploymentName = "gpt-4o",
                InputTokenCount = 100,
                OutputTokenCount = 20,
            },
            CancellationToken.None);

        Mock<ILlmCostEstimator> llmCostEstimator = new();
        llmCostEstimator
            .Setup(e => e.EstimateUsd(100, 20, 0, "gpt-4o"))
            .Returns(0.42m);

        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runGuid,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ScopeProjectId = projectId,
            },
        };

        RunDetailLlmCostEnrichmentSlice slice = new(traceRepository, llmCostEstimator.Object);
        await slice.EnrichAsync(
            new RunDetailEnrichmentContext { Detail = detail },
            CancellationToken.None);

        detail.AgentExecutionLlmCostEstimate.Should().NotBeNull();
        detail.AgentExecutionLlmCostEstimate!.EstimatedCostUsd.Should().Be(0.42m);
    }
}

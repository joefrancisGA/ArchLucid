using ArchLucid.Api.Models;
using ArchLucid.Api.Support;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests.Support;

[Trait("Category", "Unit")]
public sealed class RunAgentExecutionLlmCostEstimateAppenderTests
{
    [Fact]
    public async Task CompareQuality_AppendAsync_tolerates_null_slice_list_from_repository()
    {
        const string runId = "fafafafafafafafafafafafafafafafa";
        ScopeContext scope = new();

        Mock<IAgentExecutionTraceRepository> traceRepository = new();
        traceRepository
            .Setup(r => r.GetLlmCostSlicesByRunIdAsync(scope, runId, It.IsAny<CancellationToken>()))
            .Returns(Task.FromResult<IReadOnlyList<AgentExecutionTraceLlmCostSlice>>(null!));

        Mock<ILlmCostEstimator> costEstimator = new();
        costEstimator
            .Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .Returns(0m);

        RunDetailsResponse response = new();

        await RunAgentExecutionLlmCostEstimateAppender.AppendAsync(
            response,
            runId,
            scope,
            traceRepository.Object,
            costEstimator.Object,
            CancellationToken.None);

        response.AgentExecutionLlmCostEstimate.Should().NotBeNull();
        response.AgentExecutionLlmCostEstimate!.TokenCounts.Prompt.Should().Be(0);
        response.AgentExecutionLlmCostEstimate.TokenCounts.Completion.Should().Be(0);
    }
}

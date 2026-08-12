using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceProjectionMapperTests
{
    private static readonly Guid FirstSqlRunId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid SecondSqlRunId = Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa");

    private static string FirstContractRunId => FirstSqlRunId.ToString("N");

    private static string SecondContractRunId => SecondSqlRunId.ToString("N");

    [Fact]
    public void DeserializeTraces_round_trips_stored_blobs_in_row_order()
    {
        IReadOnlyList<AgentExecutionTrace> traces = AgentExecutionTraceProjectionMapper.DeserializeTraces(
            [SerializeTrace("t-1"), SerializeTrace("t-2")],
            "run 'r-1'");

        traces.Select(static trace => trace.TraceId).Should().Equal("t-1", "t-2");
    }

    [Fact]
    public void DeserializeTraces_fails_loudly_when_a_stored_blob_is_corrupt()
    {
        Action act = () => AgentExecutionTraceProjectionMapper.DeserializeTraces(["{not json"], "run 'r-1'");

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*run 'r-1'*")
            .WithInnerException<JsonException>();
    }

    [Fact]
    public void DeserializeTraces_fails_loudly_when_a_stored_blob_is_the_json_null_literal()
    {
        Action act = () => AgentExecutionTraceProjectionMapper.DeserializeTraces(["null"], "task 'task-1'");

        act.Should().Throw<InvalidOperationException>().WithMessage("*task 'task-1'*");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void DeserializeOptionalTrace_treats_an_absent_row_as_no_trace(string? rowJson) =>
        AgentExecutionTraceProjectionMapper.DeserializeOptionalTrace(rowJson).Should().BeNull();

    [Fact]
    public void DeserializeOptionalTrace_reads_a_present_row() =>
        AgentExecutionTraceProjectionMapper
            .DeserializeOptionalTrace(SerializeTrace("t-9"))!
            .TraceId.Should()
            .Be("t-9");

    [Fact]
    public void MapSummaries_projects_the_dual_written_columns()
    {
        List<AgentExecutionTraceSummary> summaries = AgentExecutionTraceProjectionMapper.MapSummaries(
        [
            new AgentExecutionTraceSummaryPageRow
            {
                TraceId = "t-1",
                RunId = FirstSqlRunId,
                TaskId = "task-1",
                AgentType = nameof(AgentType.Compliance),
                ParseSucceeded = true,
                CreatedUtc = new DateTime(2026, 8, 11, 0, 0, 0, DateTimeKind.Utc),
                ModelDeploymentName = "gpt-deployment",
                BlobUploadFailed = true,
                InputTokenCount = 11,
                OutputTokenCount = 22,
                EstimatedCostUsd = 0.42m,
                ModelAlias = "alias",
                QualityWarning = true,
                QualityRejected = false,
                TotalCount = 7,
            },
        ]);

        summaries.Should().ContainSingle();
        summaries[0].TraceId.Should().Be("t-1");
        summaries[0].RunId.Should().Be(FirstContractRunId);
        summaries[0].AgentType.Should().Be(AgentType.Compliance);
        summaries[0].BlobUploadFailed.Should().BeTrue();
        summaries[0].InputTokenCount.Should().Be(11);
        summaries[0].OutputTokenCount.Should().Be(22);
        summaries[0].EstimatedCostUsd.Should().Be(0.42m);
        summaries[0].ModelAlias.Should().Be("alias");
        summaries[0].QualityWarning.Should().BeTrue();
        summaries[0].QualityRejected.Should().BeFalse();
    }

    [Fact]
    public void MapSummaries_rejects_a_persisted_agent_type_that_is_no_longer_known()
    {
        Action act = () => AgentExecutionTraceProjectionMapper.MapSummaries(
        [
            new AgentExecutionTraceSummaryPageRow
            {
                TraceId = "t-1",
                RunId = FirstSqlRunId,
                AgentType = "RetiredAgent",
            },
        ]);

        act.Should().Throw<InvalidOperationException>().WithMessage("*RetiredAgent*");
    }

    [Fact]
    public void GroupCostSlices_keys_slices_by_contract_run_id()
    {
        IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> grouped =
            AgentExecutionTraceProjectionMapper.GroupCostSlices(
                [
                    CostSliceRow(FirstSqlRunId, "deployment-a", 10),
                    CostSliceRow(FirstSqlRunId, "deployment-b", 20),
                    CostSliceRow(SecondSqlRunId, "deployment-c", 30),
                ],
                [FirstContractRunId, SecondContractRunId]);

        grouped[FirstContractRunId].Select(static slice => slice.ModelDeploymentName)
            .Should()
            .Equal("deployment-a", "deployment-b");

        grouped[SecondContractRunId].Single().InputTokenCount.Should().Be(30);
    }

    [Fact]
    public void GroupCostSlices_returns_an_empty_list_for_a_requested_run_with_no_traces()
    {
        IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> grouped =
            AgentExecutionTraceProjectionMapper.GroupCostSlices([], [FirstContractRunId]);

        grouped.Should().ContainKey(FirstContractRunId);
        grouped[FirstContractRunId].Should().BeEmpty();
    }

    [Fact]
    public void GroupFallbackAgentTypes_de_duplicates_and_orders_each_run()
    {
        IReadOnlyDictionary<string, IReadOnlyList<string>> grouped =
            AgentExecutionTraceProjectionMapper.GroupFallbackAgentTypes(
                [
                    FallbackRow(FirstSqlRunId, "Security"),
                    FallbackRow(FirstSqlRunId, " compliance "),
                    FallbackRow(FirstSqlRunId, "security"),
                    FallbackRow(SecondSqlRunId, "Cost"),
                ],
                [FirstContractRunId, SecondContractRunId]);

        grouped[FirstContractRunId].Should().Equal("compliance", "Security");
        grouped[SecondContractRunId].Should().Equal("Cost");
    }

    [Fact]
    public void GroupFallbackAgentTypes_ignores_blank_agent_types()
    {
        IReadOnlyDictionary<string, IReadOnlyList<string>> grouped =
            AgentExecutionTraceProjectionMapper.GroupFallbackAgentTypes(
                [FallbackRow(FirstSqlRunId, "   ")],
                [FirstContractRunId]);

        grouped[FirstContractRunId].Should().BeEmpty();
    }

    [Fact]
    public void GroupFallbackAgentTypes_returns_an_empty_list_for_a_run_with_no_fallback_rows() =>
        AgentExecutionTraceProjectionMapper
            .GroupFallbackAgentTypes([], [FirstContractRunId])[FirstContractRunId]
            .Should()
            .BeEmpty();

    private static AgentExecutionTraceLlmCostSliceRow CostSliceRow(
        Guid runId,
        string deployment,
        int inputTokens) =>
        new()
        {
            RunId = runId,
            ModelDeploymentName = deployment,
            InputTokenCount = inputTokens,
            OutputTokenCount = inputTokens + 1,
            ReasoningTokenCount = inputTokens + 2,
        };

    private static AgentExecutionTraceLlmFallbackRow FallbackRow(Guid runId, string agentType) =>
        new()
        {
            RunId = runId,
            AgentType = agentType,
        };

    private static string SerializeTrace(string traceId) =>
        JsonSerializer.Serialize(
            new AgentExecutionTrace
            {
                TraceId = traceId,
            },
            ContractJson.Default);
}

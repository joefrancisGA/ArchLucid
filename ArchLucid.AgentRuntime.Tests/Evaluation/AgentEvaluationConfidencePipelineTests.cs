using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentEvaluationConfidencePipelineTests
{
    [Theory]
    [InlineData("trace-abc-123", "trace-abc-123")]
    [InlineData("TRACE-ABC-123", "trace-abc-123")]
    public void TraceIdsLikelyMatch_returns_true_for_exact_ids(string persistedTraceId, string findingKey)
    {
        AgentEvaluationConfidencePipeline.TraceIdsLikelyMatch(persistedTraceId, findingKey).Should().BeTrue();
    }

    [Fact]
    public void TraceIdsLikelyMatch_returns_true_for_matching_32_character_prefix()
    {
        string prefix = new('a', 32);
        string persistedTraceId = prefix + "suffix-one";
        string findingKey = prefix + "suffix-two";

        AgentEvaluationConfidencePipeline.TraceIdsLikelyMatch(persistedTraceId, findingKey).Should().BeTrue();
    }

    [Theory]
    [InlineData("", "trace")]
    [InlineData("trace", "")]
    public void TraceIdsLikelyMatch_returns_false_for_empty_ids(string persistedTraceId, string findingKey)
    {
        AgentEvaluationConfidencePipeline.TraceIdsLikelyMatch(persistedTraceId, findingKey).Should().BeFalse();
    }

    [Fact]
    public void ResolveTraceForSnapshotFinding_uses_prefix_trace_id_match_before_engine_type_fallback()
    {
        const string sharedPrefix = "11111111111111111111111111111111";
        AgentExecutionTrace matchingTrace = new()
        {
            TraceId = sharedPrefix + "persisted",
            TaskId = "task-a",
            RunId = "run",
            AgentType = AgentType.Topology,
            ParseSucceeded = true,
            ParsedResultJson = "{}",
        };

        AgentExecutionTrace otherTopologyTrace = new()
        {
            TraceId = "trace-other",
            TaskId = "task-b",
            RunId = "run",
            AgentType = AgentType.Topology,
            ParseSucceeded = false,
            ParsedResultJson = null,
        };

        AgentEvaluationConfidenceRunContext context = new()
        {
            Scope = new ScopeContext
            {
                TenantId = Guid.Parse("10101010-1010-1010-1010-101010101010"),
                WorkspaceId = Guid.Parse("20202020-2020-2020-2020-202020202020"),
                ProjectId = Guid.Parse("30303030-3030-3030-3030-303030303030"),
            },
            LatestTraces = [matchingTrace, otherTopologyTrace],
            TraceByAgentType = new Dictionary<AgentType, AgentExecutionTrace>
            {
                [AgentType.Topology] = otherTopologyTrace,
            },
            TraceByTaskId = new Dictionary<string, AgentExecutionTrace>(StringComparer.OrdinalIgnoreCase)
            {
                [matchingTrace.TaskId] = matchingTrace,
                [otherTopologyTrace.TaskId] = otherTopologyTrace,
            },
            CalibratedConfidenceByTaskId = new Dictionary<string, double?>(StringComparer.Ordinal),
        };

        Finding finding = new()
        {
            FindingId = "finding-prefix",
            EngineType = AgentType.Topology.ToString(),
            AgentExecutionTraceId = sharedPrefix + "finding-key",
        };

        AgentExecutionTrace? resolved =
            AgentEvaluationConfidencePipeline.ResolveTraceForSnapshotFinding(finding, context);

        resolved.Should().BeSameAs(matchingTrace);
    }
}

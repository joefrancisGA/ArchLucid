using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class InMemoryAgentExecutionTraceLlmCostLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_GetLlmCostSlicesByRunIdsAsync_merges_slices_when_traces_use_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("12121212-1212-1212-1212-121212121212");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("13131313-1313-1313-1313-131313131313"),
            WorkspaceId = Guid.Parse("14141414-1414-1414-1414-141414141414"),
            ProjectId = Guid.Parse("15151515-1515-1515-1515-151515151515"),
        };

        InMemoryAgentExecutionTraceRepository traces = new();
        await traces.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-batch-legacy",
                RunId = legacyUpper,
                ModelDeploymentName = "gpt-test",
                InputTokenCount = 90,
                OutputTokenCount = 10,
            },
            CancellationToken.None);

        IReadOnlyDictionary<string, IReadOnlyList<AgentExecutionTraceLlmCostSlice>> slicesByRun =
            await traces.GetLlmCostSlicesByRunIdsAsync(scope, [canonicalRunId], CancellationToken.None);

        slicesByRun.Should().ContainKey(canonicalRunId);
        slicesByRun[canonicalRunId].Should().ContainSingle(slice => slice.InputTokenCount == 90);
    }

    [Fact]
    public async Task CompareQuality_GetLlmCostSlicesByRunIdAsync_merges_slices_when_traces_use_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("16161616-1616-1616-1616-161616161616");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        InMemoryAgentExecutionTraceRepository traces = new();
        await traces.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-single-legacy",
                RunId = legacyUpper,
                ModelDeploymentName = "gpt-test",
                InputTokenCount = 42,
                OutputTokenCount = 8,
            },
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices =
            await traces.GetLlmCostSlicesByRunIdAsync(scope, canonicalRunId, CancellationToken.None);

        slices.Should().ContainSingle(slice => slice.InputTokenCount == 42);
    }
}

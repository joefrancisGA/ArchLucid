using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
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

    [Fact]
    public async Task CompareQuality_LoadMergedLlmCostSlicesByRunIdAsync_merges_slices_when_loader_returns_rows_on_legacy_key_only()
    {
        Guid runGuid = Guid.Parse("17171717-1717-1717-1717-171717171717");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        IReadOnlyList<AgentExecutionTraceLlmCostSlice> slices =
            await AgentExecutionTraceQueryPatchCore.LoadMergedLlmCostSlicesByRunIdAsync(
                canonicalRunId,
                (lookupKey, _) => Task.FromResult<IReadOnlyList<AgentExecutionTraceLlmCostSlice>>(
                    string.Equals(lookupKey, legacyUpper, StringComparison.Ordinal)
                        ?
                        [
                            new AgentExecutionTraceLlmCostSlice
                            {
                                ModelDeploymentName = "gpt-test",
                                InputTokenCount = 77,
                                OutputTokenCount = 11,
                            },
                        ]
                        : []),
                CancellationToken.None);

        slices.Should().ContainSingle(slice => slice.InputTokenCount == 77);
    }

    [Fact]
    public async Task CompareQuality_GetByRunIdAsync_merges_traces_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("18181818-1818-1818-1818-181818181818");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();
        ScopeContext scope = new();

        InMemoryAgentExecutionTraceRepository traces = new();
        await traces.CreateAsync(
            new AgentExecutionTrace
            {
                TraceId = "trace-get-by-run-legacy",
                RunId = legacyUpper,
                AgentType = AgentType.Topology,
            },
            CancellationToken.None);

        IReadOnlyList<AgentExecutionTrace> list =
            await traces.GetByRunIdAsync(scope, canonicalRunId, CancellationToken.None);

        list.Should().ContainSingle(trace => trace.TraceId == "trace-get-by-run-legacy");
    }

    [Fact]
    public async Task CompareQuality_LoadMergedTracesByRunIdAsync_merges_traces_when_loader_returns_rows_on_legacy_key_only()
    {
        Guid runGuid = Guid.Parse("19191919-1919-1919-1919-191919191919");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        IReadOnlyList<AgentExecutionTrace> merged =
            await AgentExecutionTraceQueryPatchCore.LoadMergedTracesByRunIdAsync(
                canonicalRunId,
                (lookupKey, _) => Task.FromResult<IReadOnlyList<AgentExecutionTrace>>(
                    string.Equals(lookupKey, legacyUpper, StringComparison.Ordinal)
                        ?
                        [
                            new AgentExecutionTrace
                            {
                                TraceId = "trace-cosmos-merge",
                                RunId = legacyUpper,
                                AgentType = AgentType.Topology,
                            },
                        ]
                        : []),
                CancellationToken.None);

        merged.Should().ContainSingle(trace => trace.TraceId == "trace-cosmos-merge");
    }
}

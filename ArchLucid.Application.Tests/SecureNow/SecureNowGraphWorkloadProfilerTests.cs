using ArchLucid.Application.SecureNow;
using FluentAssertions;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
public sealed class SecureNowGraphWorkloadProfilerTests
{
    [Fact]
    public async Task Records_actual_structural_counts_and_nonnegative_process_deltas()
    {
        var result = await SecureNowGraphWorkloadProfiler.MeasureAsync(
            "fixture-v1",
            _ => Task.FromResult(new SecureNowTopologyCardinalityForecast.Result(
                5, 8, 3, false, "TOPOLOGY_STRUCTURAL_ONLY")));
        result.WorkloadRevision.Should().Be("fixture-v1");
        result.PrefixCount.Should().Be(5);
        result.TraversedEdges.Should().Be(8);
        result.VisitedNodes.Should().Be(3);
        result.ProcessCpuMillisecondsDelta.Should().BeGreaterThanOrEqualTo(0);
        result.ElapsedMilliseconds.Should().BeGreaterThanOrEqualTo(0);
        result.WorkingSetObservedMaxBytes.Should().BeGreaterThanOrEqualTo(result.WorkingSetBeforeBytes);
        result.EvidenceStatus.Should().Be("SAMPLED_PROCESS_MEMORY_NOT_TRUE_PEAK_OR_OPERATION_ISOLATED");
        result.ManagedAllocatedBytes.Should().BeGreaterThanOrEqualTo(0);
        result.MaximumSampledWorkingSetBytes.Should().BeGreaterThanOrEqualTo(result.WorkingSetBeforeBytes);
    }

    [Fact]
    public async Task Cancelled_operation_does_not_claim_measurement()
    {
        using CancellationTokenSource cancel = new();
        cancel.Cancel();
        Func<Task> run = () => SecureNowGraphWorkloadProfiler.MeasureAsync(
            "fixture-v1", _ => Task.FromResult(
                new SecureNowTopologyCardinalityForecast.Result(0, 0, 0, false, "")), cancel.Token);
        await run.Should().ThrowAsync<OperationCanceledException>();
    }
}

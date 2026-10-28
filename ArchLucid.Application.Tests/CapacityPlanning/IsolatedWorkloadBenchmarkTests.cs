using ArchLucid.Application.CapacityPlanning;
using FluentAssertions;

namespace ArchLucid.Application.Tests.CapacityPlanning;

[Trait("Category", "Unit")]
public sealed class IsolatedWorkloadBenchmarkTests
{
    [Fact]
    public async Task Dedicated_benchmark_produces_importable_but_not_peak_memory_evidence()
    {
        var result = await IsolatedWorkloadBenchmark.MeasureAsync("rev", "ArchitectureReview", 2m,
            async ct => await Task.Delay(30, ct), TimeSpan.FromMilliseconds(10), true);
        result.Observation.MeasurementScope.Should().Be("ISOLATED_OPERATION");
        result.Observation.MemoryIsTruePeak.Should().BeFalse();
        result.MaximumSampledWorkingSetBytes.Should().BeGreaterThanOrEqualTo(result.WorkingSetStartBytes);
        result.MemoryEvidenceStatus.Should().Be("SAMPLED_WORKING_SET_NOT_TRUE_PEAK");
        var imported = WorkloadCalibrationImport.Parse(
            IsolatedWorkloadBenchmark.ToCalibrationJson(result), "ArchitectureReview", "rev");
        imported.Accepted.Should().BeTrue();
        imported.Assessment.Status.Should().Be("MEMORY_NOT_PEAK");
    }

    [Fact]
    public async Task Shared_process_measurement_does_not_qualify_as_calibration()
    {
        var result = await IsolatedWorkloadBenchmark.MeasureAsync("rev", "Retrieval", 1m,
            _ => Task.CompletedTask, TimeSpan.FromMilliseconds(10), false);
        WorkloadCalibration.Assess(result.Observation).Valid.Should().BeFalse();
    }

    [Fact]
    public async Task Failed_operation_never_returns_success_evidence()
    {
        Func<Task> run = async () => await IsolatedWorkloadBenchmark.MeasureAsync("rev", "Retrieval", 1m,
            _ => throw new InvalidOperationException("fixture failure"),
            TimeSpan.FromMilliseconds(10), false);
        await run.Should().ThrowAsync<InvalidOperationException>();
    }
}

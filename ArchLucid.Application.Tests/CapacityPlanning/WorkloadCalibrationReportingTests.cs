using ArchLucid.Application.CapacityPlanning;
using FluentAssertions;

namespace ArchLucid.Application.Tests.CapacityPlanning;

[Trait("Category", "Unit")]
public sealed class WorkloadCalibrationReportingTests
{
    [Fact]
    public void Import_requires_matching_cohort_and_isolated_operation()
    {
        const string json = """
            {"SchemaVersion":1,"Revision":"rev1","Workload":"ArchitectureReview",
             "WorkUnits":10,"CpuSeconds":20,"WorkerSeconds":30,
             "MemoryObservedGiB":2,"MemoryIsTruePeak":false,"MeasurementScope":"ISOLATED_OPERATION"}
            """;
        var accepted = WorkloadCalibrationImport.Parse(json, "ArchitectureReview", "rev1");
        accepted.Accepted.Should().BeTrue();
        accepted.Assessment.CpuSecondsPerUnit.Should().Be(2m);
        accepted.Assessment.Status.Should().Be("MEMORY_NOT_PEAK");
        WorkloadCalibrationImport.Parse(json, "Retrieval", "rev1").Accepted.Should().BeFalse();
        WorkloadCalibrationImport.Parse(json.Replace("ISOLATED_OPERATION", "PROCESS_WIDE"),
            "ArchitectureReview", "rev1").Accepted.Should().BeFalse();
    }

    [Fact]
    public void Import_fails_closed_on_malformed_or_extra_fields()
    {
        WorkloadCalibrationImport.Parse("{", "x", "rev").Accepted.Should().BeFalse();
        WorkloadCalibrationImport.Parse(new string('a', 65537), "x", "rev")
            .Status.Should().Be("ARTIFACT_TOO_LARGE");
        const string extra = """
            {"SchemaVersion":1,"Revision":"rev","Workload":"x",
            "WorkUnits":1,"CpuSeconds":1,"WorkerSeconds":1,"MemoryObservedGiB":1,
            "MemoryIsTruePeak":true,"MeasurementScope":"ISOLATED_OPERATION","Unknown":9}
            """;
        WorkloadCalibrationImport.Parse(extra, "x", "rev").Accepted.Should().BeFalse();
    }

    [Fact]
    public void Error_report_is_versioned_and_never_invents_zero_denominator_percentage()
    {
        var report = WorkloadForecastReport.Build(
            [new("rev1", "review", "cpu", "seconds", 8m, 10m),
             new("rev1", "review", "memory", "GiB", 2m, 0m)], 10m);
        report.Rows[0].AdvisoryExceeded.Should().BeTrue();
        report.Rows[1].AbsolutePercentageError.Should().BeNull();
        WorkloadForecastReport.ToJson(report).Should().Contain("SchemaVersion");
        WorkloadForecastReport.ToMarkdown(report).Should().Contain("n/a");
    }
}

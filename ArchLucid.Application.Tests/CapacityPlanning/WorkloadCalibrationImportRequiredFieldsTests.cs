using System.Text.Json.Nodes;

using ArchLucid.Application.CapacityPlanning;

using FluentAssertions;

namespace ArchLucid.Application.Tests.CapacityPlanning;

[Trait("Category", "Unit")]
public sealed class WorkloadCalibrationImportRequiredFieldsTests
{
    private const string CalibrationJson = """
        {"SchemaVersion":1,"Revision":"rev1","Workload":"ArchitectureReview",
         "WorkUnits":10,"CpuSeconds":0,"WorkerSeconds":30,
         "MemoryObservedGiB":0,"MemoryIsTruePeak":false,"MeasurementScope":"ISOLATED_OPERATION"}
        """;

    [Theory]
    [InlineData("CpuSeconds")]
    [InlineData("WorkerSeconds")]
    [InlineData("MemoryObservedGiB")]
    [InlineData("MemoryIsTruePeak")]
    public void Import_rejects_missing_measurements(string field)
    {
        JsonObject observation = JsonNode.Parse(CalibrationJson)!.AsObject();
        observation.Remove(field);

        var result = WorkloadCalibrationImport.Parse(observation.ToJsonString(), "ArchitectureReview", "rev1");

        result.Accepted.Should().BeFalse();
        result.Status.Should().Be("INVALID_JSON");
        result.Observation.Should().BeNull();
    }

    [Fact]
    public void Import_accepts_measured_zero()
    {
        var result = WorkloadCalibrationImport.Parse(CalibrationJson, "ArchitectureReview", "rev1");

        result.Accepted.Should().BeTrue();
        result.Assessment.CpuSecondsPerUnit.Should().Be(0m);
    }
}

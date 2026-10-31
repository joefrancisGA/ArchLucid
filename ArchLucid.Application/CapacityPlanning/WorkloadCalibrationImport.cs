using System.Text.Json;

namespace ArchLucid.Application.CapacityPlanning;

/// <summary>Bounded import of isolated-operation benchmark evidence, without fabricating calibrations.</summary>
public static class WorkloadCalibrationImport
{
    public sealed record ImportResult(bool Accepted, string Status,
        WorkloadCalibration.Observation? Observation, WorkloadCalibration.Assessment Assessment);

    public static ImportResult Parse(string json, string expectedWorkload, string expectedRevision)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(json);
        ArgumentException.ThrowIfNullOrWhiteSpace(expectedWorkload);
        ArgumentException.ThrowIfNullOrWhiteSpace(expectedRevision);
        if (json.Length > 65536) return Reject("ARTIFACT_TOO_LARGE");
        WorkloadCalibration.Observation? item;
        try
        {
            item = JsonSerializer.Deserialize<WorkloadCalibration.Observation>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true,
                    MaxDepth = 8, UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Disallow });
        }
        catch (JsonException) { return Reject("INVALID_JSON"); }
        if (item is null) return Reject("EMPTY_ARTIFACT");
        if (!string.Equals(item.Workload, expectedWorkload, StringComparison.Ordinal) ||
            !string.Equals(item.Revision, expectedRevision, StringComparison.Ordinal))
            return Reject("COHORT_OR_REVISION_MISMATCH");
        WorkloadCalibration.Assessment assessment = WorkloadCalibration.Assess(item);
        return new(assessment.Valid, assessment.Status, assessment.Valid ? item : null, assessment);
    }

    private static ImportResult Reject(string status) =>
        new(false, status, null, new(false, status, null, null));
}

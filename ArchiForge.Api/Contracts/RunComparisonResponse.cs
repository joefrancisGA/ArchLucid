namespace ArchiForge.Api.Contracts;

public class RunComparisonResponse
{
    public Guid LeftRunId { get; set; }
    public Guid RightRunId { get; set; }
    public List<DiffItemResponse> RunLevelDiffs { get; set; } = new();
    public ManifestComparisonResponse? ManifestComparison { get; set; }
}

namespace ArchiForge.Api.HttpContracts;

public class ManifestComparisonResponse
{
    public Guid LeftManifestId { get; set; }
    public Guid RightManifestId { get; set; }
    public string LeftManifestHash { get; set; } = default!;
    public string RightManifestHash { get; set; } = default!;
    public int AddedCount { get; set; }
    public int RemovedCount { get; set; }
    public int ChangedCount { get; set; }
    public List<DiffItemResponse> Diffs { get; set; } = new();
}

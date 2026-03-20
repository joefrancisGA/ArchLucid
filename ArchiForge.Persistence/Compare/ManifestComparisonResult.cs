namespace ArchiForge.Persistence.Compare;

public class ManifestComparisonResult
{
    public Guid LeftManifestId { get; set; }
    public Guid RightManifestId { get; set; }

    public string LeftManifestHash { get; set; } = default!;
    public string RightManifestHash { get; set; } = default!;

    public List<DiffItem> Diffs { get; set; } = new();

    public int AddedCount => Diffs.Count(x => x.DiffKind == DiffKind.Added);
    public int RemovedCount => Diffs.Count(x => x.DiffKind == DiffKind.Removed);
    public int ChangedCount => Diffs.Count(x => x.DiffKind == DiffKind.Changed);
}

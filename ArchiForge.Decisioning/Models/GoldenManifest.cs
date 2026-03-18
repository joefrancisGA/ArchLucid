namespace ArchiForge.Decisioning.Models;

public class GoldenManifest
{
    public Guid ManifestId { get; set; }
    public Guid RunId { get; set; }
    public Guid ContextSnapshotId { get; set; }
    public Guid GraphSnapshotId { get; set; }
    public Guid FindingsSnapshotId { get; set; }
    public Guid DecisionTraceId { get; set; }

    public DateTime CreatedUtc { get; set; }

    public string ManifestHash { get; set; } = default!;

    public List<ResolvedArchitectureDecision> Decisions { get; set; } = new();
    public List<string> Assumptions { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}


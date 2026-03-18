namespace ArchiForge.Decisioning.Models;

public class FindingsSnapshot
{
    public Guid FindingsSnapshotId { get; set; }
    public Guid RunId { get; set; }
    public Guid ContextSnapshotId { get; set; }
    public Guid GraphSnapshotId { get; set; }
    public DateTime CreatedUtc { get; set; }

    public List<Finding> Findings { get; set; } = new();
}


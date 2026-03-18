namespace ArchiForge.ContextIngestion.Models;

public class ContextSnapshot
{
    public Guid SnapshotId { get; set; }

    public Guid RunId { get; set; }

    public DateTime CreatedUtc { get; set; }

    public List<object> CanonicalObjects { get; set; } = new();

    public string? DeltaSummary { get; set; }

    public List<string> Warnings { get; set; } = new();

    public List<string> Errors { get; set; } = new();

    public Dictionary<string, string> SourceHashes { get; set; } = new();
}


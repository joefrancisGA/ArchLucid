namespace ArchiForge.Decisioning.Advisory.Scheduling;

public class ArchitectureDigest
{
    public Guid DigestId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid ProjectId { get; set; }

    public Guid? RunId { get; set; }
    public Guid? ComparedToRunId { get; set; }

    public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

    public string Title { get; set; } = default!;
    public string Summary { get; set; } = default!;
    public string ContentMarkdown { get; set; } = default!;

    public string MetadataJson { get; set; } = "{}";
}

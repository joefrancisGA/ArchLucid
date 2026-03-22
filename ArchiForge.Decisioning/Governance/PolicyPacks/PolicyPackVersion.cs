namespace ArchiForge.Decisioning.Governance.PolicyPacks;

public class PolicyPackVersion
{
    public Guid PolicyPackVersionId { get; set; } = Guid.NewGuid();
    public Guid PolicyPackId { get; set; }

    public string Version { get; set; } = default!;
    public string ContentJson { get; set; } = default!;

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public bool IsPublished { get; set; }
}

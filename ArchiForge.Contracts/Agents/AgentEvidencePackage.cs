namespace ArchiForge.Contracts.Agents;

public sealed class AgentEvidencePackage
{
    public string EvidencePackageId { get; set; } = Guid.NewGuid().ToString("N");

    public string RunId { get; set; } = string.Empty;

    public string RequestId { get; set; } = string.Empty;

    public string SystemName { get; set; } = string.Empty;

    public string Environment { get; set; } = string.Empty;

    public string CloudProvider { get; set; } = string.Empty;

    public RequestEvidence Request { get; set; } = new();

    public List<PolicyEvidence> Policies { get; set; } = [];

    public List<ServiceCatalogEvidence> ServiceCatalog { get; set; } = [];

    public List<PatternEvidence> Patterns { get; set; } = [];

    public PriorManifestEvidence? PriorManifest
    {
        get; set;
    }

    public List<EvidenceNote> Notes { get; set; } = [];

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}

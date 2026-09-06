namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidRenderResponse
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    public string Mode
    {
        get;
        set;
    } = string.Empty;

    public string? FallbackKey
    {
        get;
        set;
    }

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public string? Mermaid
    {
        get;
        set;
    }

    public InfraEvidenceMermaidComplexityMetrics? Metrics
    {
        get;
        set;
    }

    public List<InfraEvidenceMermaidFallbackArtifactSummary> FallbackArtifacts
    {
        get;
        set;
    } = [];
}

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidModePreview
{
    public string Mode
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public int NodeCount
    {
        get;
        set;
    }

    public int EdgeCount
    {
        get;
        set;
    }

    public string? Mermaid
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

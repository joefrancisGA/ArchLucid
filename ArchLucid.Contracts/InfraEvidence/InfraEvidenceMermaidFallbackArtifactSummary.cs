namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceMermaidFallbackArtifactSummary
{
    public string Key
    {
        get;
        set;
    } = string.Empty;

    public string Label
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
}

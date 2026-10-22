namespace ArchLucid.Contracts.Architecture;

public sealed class VisionDiagramIngestRequest
{
    public string Name
    {
        get;
        set;
    } = string.Empty;

    public string Format
    {
        get;
        set;
    } = string.Empty;

    public string ContentBase64
    {
        get;
        set;
    } = string.Empty;

    public bool UseSimulator
    {
        get;
        set;
    }
}

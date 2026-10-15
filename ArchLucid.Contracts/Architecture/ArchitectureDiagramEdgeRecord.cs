namespace ArchLucid.Contracts.Architecture;

public sealed class ArchitectureDiagramEdgeRecord
{
    public string Id
    {
        get;
        set;
    } = string.Empty;

    public string SourceId
    {
        get;
        set;
    } = string.Empty;

    public string TargetId
    {
        get;
        set;
    } = string.Empty;

    public string Label
    {
        get;
        set;
    } = string.Empty;

    public string Provenance
    {
        get;
        set;
    } = ArchitectureDiagramProvenanceKinds.Inferred;

    public bool Removed
    {
        get;
        set;
    }

    /// <summary>Optional parser metadata (stroke color, dash style, etc.) — never compiled as protocol facts (AS-021).</summary>
    private Dictionary<string, string> properties = new(StringComparer.Ordinal);

    public Dictionary<string, string> Properties
    {
        get => properties;
        set => properties = value ?? new Dictionary<string, string>(StringComparer.Ordinal);
    }
}

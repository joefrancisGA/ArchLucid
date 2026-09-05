namespace ArchLucid.Contracts.Architecture;

public sealed class StructuredDiagramIngestResult
{
    public ArchitectureDiagramModelRecord Model
    {
        get;
        init;
    } = new();

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];

    public string ExtractionMethod
    {
        get;
        init;
    } = DiagramExtractionMethods.StructuredParse;

    public IReadOnlyList<string> SourceFingerprints
    {
        get;
        init;
    } = [];
}

namespace ArchLucid.Contracts.Architecture;

public sealed class VisionDiagramIngestResult
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
    } = DiagramExtractionMethods.VisionAi;

    public string InterpretationHonestyLabel
    {
        get;
        init;
    } = VisionDiagramHonestyLabels.InterpretationDisclaimer;

    public double? InterpretationConfidence
    {
        get;
        init;
    }

    public string SourceFingerprint
    {
        get;
        init;
    } = string.Empty;
}

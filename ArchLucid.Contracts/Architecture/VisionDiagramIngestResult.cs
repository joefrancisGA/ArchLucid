using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

public sealed class VisionDiagramIngestResult
{
    private ArchitectureDiagramModelRecord model = new();

    public ArchitectureDiagramModelRecord Model
    {
        get => model;
        init => model = value ?? new ArchitectureDiagramModelRecord();
    }

    private IReadOnlyList<string> warnings = [];

    public IReadOnlyList<string> Warnings
    {
        get => warnings;
        init => warnings = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

public sealed class StructuredDiagramIngestResult
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
    } = DiagramExtractionMethods.StructuredParse;

    private IReadOnlyList<string> sourceFingerprints = [];

    public IReadOnlyList<string> SourceFingerprints
    {
        get => sourceFingerprints;
        init => sourceFingerprints = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}

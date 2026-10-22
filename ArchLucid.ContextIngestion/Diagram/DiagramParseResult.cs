using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class DiagramParseResult
{
    public ArchitectureDiagramModelRecord Model
    {
        get;
        init;
    } = new();

    public List<string> Warnings
    {
        get;
        init;
    } = [];

    public double? LabelOnlyInferenceConfidence
    {
        get;
        init;
    }
}

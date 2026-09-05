using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

public sealed class VisionDiagramInterpretationResult
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

    public double InterpretationConfidence
    {
        get;
        init;
    }
}

public interface IVisionDiagramInterpreter
{
    VisionDiagramInterpretationResult Interpret(VisionDiagramIngestRequest request);
}

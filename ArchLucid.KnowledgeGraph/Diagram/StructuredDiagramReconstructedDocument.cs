using ArchLucid.Contracts.Architecture;

namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Structured diagram model rebuilt from canonical objects plus compile-time label-only confidence (AS-017).
/// </summary>
public sealed class StructuredDiagramReconstructedDocument
{
    public required ArchitectureDiagramModelRecord Model
    {
        get;
        init;
    }

    public double LabelOnlyInferenceConfidence
    {
        get;
        init;
    } = StructuredDiagramLabelOnlyInferenceDefaults.StandardConfidence;
}

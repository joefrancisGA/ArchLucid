namespace ArchLucid.KnowledgeGraph.Diagram;

public sealed class StructuredDiagramGraphCompileOptions
{
    public Guid RunId
    {
        get;
        init;
    }

    public Guid ContextSnapshotId
    {
        get;
        init;
    }

    public Guid GraphSnapshotId
    {
        get;
        init;
    }

    public required DateTime CreatedUtc
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

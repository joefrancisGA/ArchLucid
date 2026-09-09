using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Compiles structured diagram models into graph nodes/edges for authority pipeline merge (AS-016).
/// </summary>
public sealed class StructuredDiagramGraphMerger(IArchitectureDiagramToGraphCompiler compiler)
{
    private readonly IArchitectureDiagramToGraphCompiler compiler =
        compiler ?? throw new ArgumentNullException(nameof(compiler));

    public StructuredDiagramGraphMergeResult Merge(ContextSnapshot contextSnapshot)
    {
        ArgumentNullException.ThrowIfNull(contextSnapshot);

        IReadOnlyList<StructuredDiagramReconstructedDocument> documents =
            StructuredDiagramCanonicalModelReconstructor.ReconstructDocuments(contextSnapshot.CanonicalObjects);

        if (documents.Count == 0)
        {
            return new StructuredDiagramGraphMergeResult();
        }

        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        List<string> warnings = [];
        Guid graphSnapshotId = Guid.NewGuid();

        foreach (StructuredDiagramReconstructedDocument document in documents)
        {
            StructuredDiagramGraphCompileResult compileResult = this.compiler.Compile(
                document.Model,
                new StructuredDiagramGraphCompileOptions
                {
                    RunId = contextSnapshot.RunId,
                    ContextSnapshotId = contextSnapshot.SnapshotId,
                    GraphSnapshotId = graphSnapshotId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    LabelOnlyInferenceConfidence = document.LabelOnlyInferenceConfidence,
                });

            if (compileResult.Warnings.Count > 0)
            {
                warnings.AddRange(compileResult.Warnings);
            }

            if (compileResult.Snapshot.Nodes.Count == 0)
            {
                continue;
            }

            nodes.AddRange(compileResult.Snapshot.Nodes);
            edges.AddRange(compileResult.Snapshot.Edges);
        }

        return new StructuredDiagramGraphMergeResult
        {
            Nodes = nodes,
            Edges = edges,
            Warnings = warnings,
        };
    }
}

public sealed class StructuredDiagramGraphMergeResult
{
    public IReadOnlyList<GraphNode> Nodes
    {
        get;
        init;
    } = [];

    public IReadOnlyList<GraphEdge> Edges
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];
}

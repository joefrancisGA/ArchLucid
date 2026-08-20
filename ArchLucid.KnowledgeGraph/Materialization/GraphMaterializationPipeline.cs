namespace ArchLucid.KnowledgeGraph.Materialization;

public sealed class GraphMaterializationPipeline
{
    private readonly IReadOnlyList<IGraphMaterializationStage> _stages;

    public GraphMaterializationPipeline(IEnumerable<IGraphMaterializationStage> stages)
    {
        ArgumentNullException.ThrowIfNull(stages);

        _stages = stages.ToList();

        if (_stages.Count == 0)
            throw new ArgumentException("At least one graph materialization stage is required.", nameof(stages));
    }

    public IReadOnlyList<IGraphMaterializationStage> Stages => _stages;

    public async Task RunAsync(GraphMaterializationContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        foreach (IGraphMaterializationStage stage in _stages)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await stage.ApplyAsync(context, cancellationToken).ConfigureAwait(false);
        }
    }
}

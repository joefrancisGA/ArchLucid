using System.Diagnostics;

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

    public Task<GraphMaterializationRunResult> RunAsync(
        GraphMaterializationContext context,
        CancellationToken cancellationToken)
    {
        return RunAsync(context, cancellationToken, GraphMaterializationPipelineOptions.Default);
    }

    public async Task<GraphMaterializationRunResult> RunAsync(
        GraphMaterializationContext context,
        CancellationToken cancellationToken,
        GraphMaterializationPipelineOptions options)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(options);

        List<GraphMaterializationStageOutcome> stageOutcomes = options.CaptureStageTelemetry
            ? new List<GraphMaterializationStageOutcome>(_stages.Count)
            : [];

        Stopwatch totalStopwatch = Stopwatch.StartNew();

        foreach (IGraphMaterializationStage stage in _stages)
        {
            cancellationToken.ThrowIfCancellationRequested();

            context.BeginStage();

            int nodeCountBefore = context.Nodes.Count;
            Stopwatch stageStopwatch = Stopwatch.StartNew();

            using Activity? activity = GraphMaterializationTelemetry.StartStageActivity(stage.Name);

            try
            {
                await stage.ApplyAsync(context, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (options.FailFastOnStageException)
            {
                throw new GraphMaterializationStageException(stage.Name, ex);
            }

            stageStopwatch.Stop();

            int nodesAdded = context.Nodes.Count - nodeCountBefore;

            activity?.SetTag("graph.materialization.nodes_added", nodesAdded);
            activity?.SetTag("graph.materialization.skipped", context.WasStageSkipped);

            if (options.CaptureStageTelemetry)
            {
                stageOutcomes.Add(new GraphMaterializationStageOutcome
                {
                    StageName = stage.Name,
                    ElapsedMilliseconds = stageStopwatch.ElapsedMilliseconds,
                    NodesAdded = nodesAdded,
                    Skipped = context.WasStageSkipped,
                });
            }

            if (options.StopAfterStageName is not null
                && string.Equals(stage.Name, options.StopAfterStageName, StringComparison.Ordinal))
            {
                break;
            }
        }

        totalStopwatch.Stop();

        return new GraphMaterializationRunResult
        {
            StageOutcomes = stageOutcomes,
            TotalElapsedMilliseconds = totalStopwatch.ElapsedMilliseconds,
        };
    }
}

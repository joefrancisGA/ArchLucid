namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Controls graph materialization pipeline execution. Fail-fast and stop-after-stage options support focused unit tests
///     without mocking <see cref="Builders.DefaultGraphBuilder" /> (TB-2370).
/// </summary>
public sealed class GraphMaterializationPipelineOptions
{
    public static GraphMaterializationPipelineOptions Default { get; } = new();

    /// <summary>
    ///     When true, per-stage timing and node deltas are captured on <see cref="GraphMaterializationRunResult" />.
    /// </summary>
    public bool CaptureStageTelemetry { get; init; } = true;

    /// <summary>
    ///     When true, stage exceptions are wrapped in <see cref="GraphMaterializationStageException" /> with the stage name.
    /// </summary>
    public bool FailFastOnStageException { get; init; } = true;

    /// <summary>
    ///     When set, the pipeline stops after the named stage completes (inclusive). Used to isolate stage interactions in tests.
    /// </summary>
    public string? StopAfterStageName { get; init; }
}

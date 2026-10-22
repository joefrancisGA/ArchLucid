namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Raised when a graph materialization stage fails and <see cref="GraphMaterializationPipelineOptions.FailFastOnStageException" />
///     is enabled (TB-2370).
/// </summary>
public sealed class GraphMaterializationStageException : Exception
{
    public GraphMaterializationStageException(string stageName, Exception innerException)
        : base($"Graph materialization stage '{stageName}' failed.", innerException)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stageName);
        ArgumentNullException.ThrowIfNull(innerException);

        StageName = stageName;
    }

    public string StageName { get; }
}

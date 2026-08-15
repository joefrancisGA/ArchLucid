namespace ArchLucid.KnowledgeGraph;

/// <summary>
///     Optional <see cref="Models.GraphNode.Properties" /> keys on the context snapshot root node
///     that scope topology coverage expectations for downstream finding engines.
/// </summary>
public static class ContextGraphPropertyKeys
{
    public const string RequiredCapabilities = "requiredCapabilities";

    public const string TopologyHints = "topologyHints";

    public const string Constraints = "constraints";

    /// <summary>Pipe-separated topology categories from the prior committed context snapshot.</summary>
    public const string PriorTopologyCategories = "priorTopologyCategories";

    /// <summary>Pipe-separated requirement names from the prior committed context snapshot.</summary>
    public const string PriorRequirementNames = "priorRequirementNames";
}

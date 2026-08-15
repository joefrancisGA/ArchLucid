namespace ArchLucid.Contracts.Persistence.Context;

/// <summary>
///     Well-known <see cref="ContextSnapshot.SourceHashes" /> keys copied onto the knowledge-graph context node.
/// </summary>
public static class ContextScopeMetadataKeys
{
    public const string RequiredCapabilities = "archlucid:requiredCapabilities";

    public const string TopologyHints = "archlucid:topologyHints";

    public const string Constraints = "archlucid:constraints";

    public const string PriorTopologyCategories = "archlucid:priorTopologyCategories";

    public const string PriorRequirementNames = "archlucid:priorRequirementNames";
}

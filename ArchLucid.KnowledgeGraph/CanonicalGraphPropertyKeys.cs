namespace ArchLucid.KnowledgeGraph;

/// <summary>
///     Optional <see cref="ArchLucid.ContextIngestion.Models.CanonicalObject.Properties" /> keys
///     that narrow graph inference when set. Values are comma-separated <see cref="Models.GraphNode.NodeId" />
///     strings (e.g. <c>obj-abc123</c>, <c>context-…</c> is not a topology target).
/// </summary>
/// <remarks>
///     When absent for policies, security baselines, or requirements, inference only links a single topology anchor
///     (one resource) or skips scope edges until explicit IDs are provided.
/// </remarks>
public static class CanonicalGraphPropertyKeys
{
    /// <summary>Policy control nodes: explicit topology resources this policy applies to.</summary>
    public const string ApplicableTopologyNodeIds = "applicableTopologyNodeIds";

    /// <summary>Requirement nodes: explicit topology resources this requirement relates to.</summary>
    public const string RelatedTopologyNodeIds = "relatedTopologyNodeIds";

    /// <summary>Security baseline nodes: explicit topology resources in scope for this control.</summary>
    public const string ProtectedTopologyNodeIds = "protectedTopologyNodeIds";

    /// <summary>Topology resource nodes: explicit upstream dependencies (comma-separated node ids).</summary>
    public const string DependsOnNodeIds = "dependsOnNodeIds";

    /// <summary>Topology resource nodes: explicit downstream exposure targets (comma-separated node ids).</summary>
    public const string ExposesToNodeIds = "exposesToNodeIds";

    /// <summary>
    ///     Topology resource sensitivity label for baseline scoping — see <see cref="TopologySensitivityLevels" />.
    /// </summary>
    public const string TopologySensitivity = "topologySensitivity";

    /// <summary>Security baseline nodes: sensitivity scope when explicit protected ids are absent.</summary>
    public const string BaselineScope = "baselineScope";
}

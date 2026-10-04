using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Models;

public class DiagramNode
{
    public string NodeId
    {
        get;
        set;
    } = null!;

    public string Label
    {
        get;
        set;
    } = null!;

    public string NodeType
    {
        get;
        set;
    } = null!;

    public string? SubgraphId
    {
        get;
        set;
    }

    public int OrderKey
    {
        get;
        set;
    }

    public Guid? CloudResourceId
    {
        get;
        set;
    }

    /// <summary>Canonical ARM resource id used for topology containment and diagram grouping.</summary>
    public string? ArmResourceId
    {
        get;
        set;
    }

    /// <summary>
    ///     Original inventory graph node id used as the Dependency neighborhood seed.
    ///     Distinct from <see cref="NodeId" />, which is the sanitized mermaid identifier.
    /// </summary>
    public string? SeedNodeId
    {
        get;
        set;
    }

    public string? ArmResourceType
    {
        get;
        set;
    }

    public string? ArmResourceKind
    {
        get;
        set;
    }

    /// <summary>ADF or Synapse connector type for a synthetic external linked-service node.</summary>
    public string? ExternalLinkedServiceType
    {
        get;
        set;
    }

    public string? ExternalFactoryName
    {
        get;
        set;
    }

    public string? ExternalTargetHost
    {
        get;
        set;
    }

    public string? ExternalIntegrationRuntime
    {
        get;
        set;
    }

    public bool ExternalHostInKeyVault
    {
        get;
        set;
    }

    /// <summary>True when this node represents a repeated-card rollup on a data-flow canvas.</summary>
    public bool IsDataFlowRollup
    {
        get;
        set;
    }

    /// <summary>Stable one-based marker used to identify this rollup in exports.</summary>
    public int DataFlowRollupOrdinal
    {
        get;
        set;
    }

    /// <summary>Original node ids represented by a data-flow rollup card.</summary>
    public List<string> DataFlowRollupMemberIds
    {
        get;
        set;
    } = [];

    /// <summary>Human-readable member details for data-flow rollup focus and export.</summary>
    public List<string> DataFlowRollupMemberNames
    {
        get;
        set;
    } = [];

    /// <summary>Aggregated consumer status painted on a data-flow rollup card.</summary>
    public string? DataFlowRollupStatusLine
    {
        get;
        set;
    }

    public string? ArmResourceGroup
    {
        get;
        set;
    }

    /// <summary>Shows the resource-group name in the painted card when it crossed a VNet boundary.</summary>
    public bool IncludeResourceGroupInCaption
    {
        get;
        set;
    }

    /// <summary>
    ///     True when inventory shows a private endpoint reaching this resource (lock badge on forest canvases).
    /// </summary>
    public bool HasPrivateEndpointAccess
    {
        get;
        set;
    }

    /// <summary>
    ///     Synthetic Executive rollup ("+N more …") kept in Mermaid for the Nodes outline, but omitted from painted canvases.
    /// </summary>
    public bool IsExecutiveOverflow
    {
        get;
        set;
    }

    /// <summary>
    ///     Unresolved NSG policy (NR-02) kept in Mermaid for the Nodes outline, but omitted from painted canvases.
    /// </summary>
    public bool IsUnresolvedPolicyOutlineOnly
    {
        get;
        set;
    }

    /// <summary>Child resources attached to this parent after NR-03 parent-property projection.</summary>
    public List<string> ParentAttachmentDetails
    {
        get;
        set;
    } = [];

    /// <summary>Standalone posture after NR-05 orphaned-state projection.</summary>
    public InventoryDiagramConnectionState? ConnectionState
    {
        get;
        set;
    }

    /// <summary>Missing requirement when <see cref="ConnectionState" /> is orphaned.</summary>
    public string? ConnectionStateMessage
    {
        get;
        set;
    }

    /// <summary>Optional policy-pack explanation for a resource requiring human review.</summary>
    public DiagramQuestionableAttention? QuestionableAttention
    {
        get;
        set;
    }

    /// <summary>Partially unresolved relationships that do not orphan the resource (e.g. workflow actions).</summary>
    public List<string> UnresolvedRelationshipDetails
    {
        get;
        set;
    } = [];

    /// <summary>Collapsed Azure Virtual Desktop boundary representing hidden AVD internals (NR-06).</summary>
    public bool IsAvdCollapsedBoundary
    {
        get;
        set;
    }

    /// <summary>Cited traversal-hop evidence shown on data-flow canvases (NR-07).</summary>
    public List<string> DataFlowTraversalHopEvidenceDetails
    {
        get;
        set;
    } = [];

    /// <summary>Inbound allow-rule chips painted on the visible NSG owner (NR-13).</summary>
    public List<DiagramNsgInboundRuleChip> NsgInboundRuleChips
    {
        get;
        set;
    } = [];
}

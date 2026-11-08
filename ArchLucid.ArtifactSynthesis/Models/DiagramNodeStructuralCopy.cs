namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>
///     Deep structural copy for <see cref="DiagramNode" /> so repairers and rollup paths cannot drop fields silently.
/// </summary>
public static class DiagramNodeStructuralCopy
{
    public static DiagramNode Clone(DiagramNode source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new DiagramNode
        {
            NodeId = source.NodeId,
            Label = source.Label,
            NodeType = source.NodeType,
            SubgraphId = source.SubgraphId,
            OrderKey = source.OrderKey,
            CloudResourceId = source.CloudResourceId,
            ArmResourceId = source.ArmResourceId,
            SeedNodeId = source.SeedNodeId,
            ArmResourceType = source.ArmResourceType,
            ArmResourceKind = source.ArmResourceKind,
            ExternalLinkedServiceType = source.ExternalLinkedServiceType,
            ExternalFactoryName = source.ExternalFactoryName,
            ExternalFactoryNames = source.ExternalFactoryNames.ToList(),
            ExternalTargetHost = source.ExternalTargetHost,
            ExternalTargetHosts = source.ExternalTargetHosts.ToList(),
            ExternalIntegrationRuntime = source.ExternalIntegrationRuntime,
            ExternalIntegrationRuntimes = source.ExternalIntegrationRuntimes.ToList(),
            ExternalHostInKeyVault = source.ExternalHostInKeyVault,
            IsDataFlowRollup = source.IsDataFlowRollup,
            IsCollapsedResourceGroupTail = source.IsCollapsedResourceGroupTail,
            CollapsedResourceGroupTailMemberNames = source.CollapsedResourceGroupTailMemberNames.ToList(),
            DataFlowRollupOrdinal = source.DataFlowRollupOrdinal,
            DataFlowRollupMemberIds = source.DataFlowRollupMemberIds.ToList(),
            DataFlowRollupMemberNames = source.DataFlowRollupMemberNames.ToList(),
            DataFlowRollupStatusLine = source.DataFlowRollupStatusLine,
            ArmResourceGroup = source.ArmResourceGroup,
            IncludeResourceGroupInCaption = source.IncludeResourceGroupInCaption,
            HasPrivateEndpointAccess = source.HasPrivateEndpointAccess,
            PrivateEndpointAccessName = source.PrivateEndpointAccessName,
            HasPublicInternetExposure = source.HasPublicInternetExposure,
            HiddenPublicIpAddress = source.HiddenPublicIpAddress,
            RollupMultipleHiddenPublicIpAddresses = source.RollupMultipleHiddenPublicIpAddresses,
            RollupMultiplePrivateEndpointAccessNames = source.RollupMultiplePrivateEndpointAccessNames,
            IsExecutiveOverflow = source.IsExecutiveOverflow,
            IsUnresolvedPolicyOutlineOnly = source.IsUnresolvedPolicyOutlineOnly,
            ParentAttachmentDetails = source.ParentAttachmentDetails.ToList(),
            ConnectionState = source.ConnectionState,
            ConnectionStateMessage = source.ConnectionStateMessage,
            QuestionableAttention = source.QuestionableAttention,
            UnresolvedRelationshipDetails = source.UnresolvedRelationshipDetails.ToList(),
            IsAvdCollapsedBoundary = source.IsAvdCollapsedBoundary,
            DataFlowTraversalHopEvidenceDetails = source.DataFlowTraversalHopEvidenceDetails.ToList(),
            NsgInboundRuleChips = source.NsgInboundRuleChips
                .Select(chip => new DiagramNsgInboundRuleChip(chip.Text, chip.IsRisky))
                .ToList(),
        };
    }

    public static DiagramNode With(DiagramNode source, Action<DiagramNode> configure)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(configure);

        DiagramNode clone = Clone(source);
        configure(clone);

        return clone;
    }
}

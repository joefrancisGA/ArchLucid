using System.Net;

using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class PublicIpAssessmentProjection
{
    private const string PublicIpType = "Microsoft.Network/publicIPAddresses";
    private const string NsgType = "Microsoft.Network/networkSecurityGroups";

    public static PublicIpAssessmentResponse Build(
        AzureInventorySnapshotDetailReadModel snapshot, int page, int pageSize, CancellationToken cancellationToken)
    {
        AzureInventorySnapshotRecord header = snapshot.Header;
        // Only use rows owned by this snapshot. Never consume tags, Defender, identity, or operator-authored edges.
        AzureInventoryResourceRecord[] resources = snapshot.Resources
            .Where(row => row.TenantId == header.TenantId && row.SnapshotId == header.SnapshotId
                && row.ResourceRowId != Guid.Empty && !string.IsNullOrWhiteSpace(row.AzureResourceId))
            .ToArray();
        HashSet<Guid> ownedRows = resources.Select(row => row.ResourceRowId).ToHashSet();
        ILookup<Guid, AzureInventoryResourcePropertyReadModel> properties = snapshot.Properties
            .Where(row => ownedRows.Contains(row.ResourceRowId)).ToLookup(row => row.ResourceRowId);
        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(new()
        {
            Header = header,
            Resources = resources,
            Properties = properties.SelectMany(group => group
                    .Where(row => IsControlProperty(row.PropertyKey))
                    .GroupBy(row => row.PropertyKey, StringComparer.OrdinalIgnoreCase))
                .Where(group => !group.Any(row => row.IsRedacted)
                    && group.Select(row => row.PropertyValue).Distinct(StringComparer.Ordinal).Count() == 1)
                .Select(group => group.First()).ToArray(),
            Relationships = snapshot.Relationships.Where(row => row.DeclaredConnectionId is null
                && row.ProvenanceKind == ProvenanceKind.ObservedFact
                && (IsPublicIpAttachment(row.RelationshipType, row.InferenceSource)
                    || row.RelationshipType == GraphEdgeTypes.ConnectsTo
                    && row.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet)).ToArray(),
        });

        bool hasCaptureGaps = header.CaptureStatus != AzureInventoryCaptureStatus.Succeeded
            || header.WarningCount > 0 || header.ErrorCount > 0 || header.CapturedUtc is null
            || resources.Length != header.ResourceCount;
        string[] ids = graph.PublicIpArmIds
            .Where(id => IsResourceType(graph.ResourcesByArmId[id], PublicIpType))
            .OrderBy(id => id, StringComparer.OrdinalIgnoreCase).ToArray();
        (page, pageSize) = PaginationDefaults.Normalize(page, pageSize);
        List<PublicIpAssessmentItem> items = [];
        foreach (string id in ids.Skip(PaginationDefaults.ToSkip(page, pageSize)).Take(pageSize))
        {
            cancellationToken.ThrowIfCancellationRequested();
            items.Add(Assess(graph, graph.ResourcesByArmId[id], properties, hasCaptureGaps));
        }

        return new PublicIpAssessmentResponse(
            header.SnapshotId, header.CapturedUtc, header.CaptureStatus.ToString(), hasCaptureGaps,
            "notAssessed", page, pageSize, ids.Length, items);
    }

    private static PublicIpAssessmentItem Assess(
        InventoryReachabilityPathGraphSnapshot graph,
        AzureInventoryResourceRecord publicIp,
        ILookup<Guid, AzureInventoryResourcePropertyReadModel> properties,
        bool hasCaptureGaps)
    {
        string? address = ReadIpAddress(properties[publicIp.ResourceRowId]);
        List<PublicIpAssessmentEvidence> evidence = [Citation(publicIp, "publicIpInventory")];
        if (address is not null)
            evidence.Add(Citation(publicIp, "ipAddress"));

        string[] targetIds = GetEdges(graph, publicIp.AzureResourceId)
            .Where(edge => IsPublicIpAttachment(edge.EdgeType, edge.InferenceSource))
            .Select(edge => edge.ToNodeId).Distinct(StringComparer.OrdinalIgnoreCase).Take(2).ToArray();

        // Attachment and public network controls describe stored configuration, not a live packet path.
        if (targetIds.Length == 1 && graph.ResourcesByArmId.TryGetValue(targetIds[0], out AzureInventoryResourceRecord? target)
            && !target.AzureResourceId.Equals(publicIp.AzureResourceId, StringComparison.OrdinalIgnoreCase)
            && !IsResourceType(target, PublicIpType)
            && !AzureInventoryNeverShowArmTypes.ShouldOmitResource(target.ResourceType, target.AzureResourceId))
        {
            evidence.Add(Citation(publicIp, "inventoryPublicIpAttachment"));
            evidence.Add(Citation(target, "attachmentTargetInventory"));

            if (HasDisabledPublicAccess(graph, target))
                evidence.Add(Citation(target, "publicNetworkAccessDisabled"));

            foreach (AzureInventoryResourceRecord nsg in FindAttachedNsgs(graph, target).DistinctBy(row => row.ResourceRowId))
                if (HasStoredInboundDeny(graph, nsg))
                    evidence.Add(Citation(nsg, "inboundDenyRulePresent"));

            string intended = evidence.Any(item => item.Kind is "publicNetworkAccessDisabled" or "inboundDenyRulePresent")
                ? "restrictiveControlPresent" : "insufficientEvidence";
            return new PublicIpAssessmentItem(publicIp.AzureResourceId, address, "attached", target.AzureResourceId, intended, evidence);
        }

        bool noAttachmentObserved = targetIds.Length == 0 && !hasCaptureGaps && address is not null
            && !properties[publicIp.ResourceRowId].Any(HasPotentialAttachment)
            && string.IsNullOrWhiteSpace(publicIp.ParentResourceId);
        return new PublicIpAssessmentItem(publicIp.AzureResourceId, address,
            noAttachmentObserved ? "noAttachmentObserved" : "unknown", null,
            noAttachmentObserved ? "noAttachmentInEvidence" : "insufficientEvidence", evidence);
    }

    private static bool HasPotentialAttachment(AzureInventoryResourcePropertyReadModel row) =>
        (row.PropertyKey.Equals("ipConfiguration.id", StringComparison.OrdinalIgnoreCase)
            || row.PropertyKey.Equals("ipConfigurationId", StringComparison.OrdinalIgnoreCase)
            || row.PropertyKey.Equals("natGateway.id", StringComparison.OrdinalIgnoreCase)
            || row.PropertyKey.Equals("ipConfiguration", StringComparison.OrdinalIgnoreCase)
            || row.PropertyKey.Equals("natGateway", StringComparison.OrdinalIgnoreCase))
        && (row.IsRedacted || !string.IsNullOrWhiteSpace(row.PropertyValue)
            && !row.PropertyValue.Equals("null", StringComparison.OrdinalIgnoreCase));

    private static string? ReadIpAddress(IEnumerable<AzureInventoryResourcePropertyReadModel> rows)
    {
        string? address = null;
        foreach (AzureInventoryResourcePropertyReadModel row in rows.Where(
            item => item.PropertyKey.Equals("ipAddress", StringComparison.OrdinalIgnoreCase)))
        {
            if (row.IsRedacted || !IPAddress.TryParse(row.PropertyValue, out IPAddress? parsed)
                || row.PropertyValue!.Contains('%', StringComparison.Ordinal))
                return null;

            string current = parsed.ToString();
            if (address is not null && !string.Equals(address, current, StringComparison.Ordinal))
                return null;

            address = current;
        }

        return address;
    }

    private static bool HasDisabledPublicAccess(
        InventoryReachabilityPathGraphSnapshot graph, AzureInventoryResourceRecord resource) =>
        AzureInventoryPublicNetworkAccessResolver.ResolvePublicAccess(
            graph.ReachabilityResourcesByArmId[resource.AzureResourceId].Properties)
        == AzureInventoryPublicNetworkAccessResolver.ObservedPublicAccess.Disabled;

    private static IEnumerable<AzureInventoryResourceRecord> FindAttachedNsgs(
        InventoryReachabilityPathGraphSnapshot graph, AzureInventoryResourceRecord target)
    {
        if (!IsResourceType(target, "Microsoft.Network/networkInterfaces"))
            yield break;

        if (TryGetNsg(graph, target.AzureResourceId) is { } directNsg)
            yield return directNsg;

        // A NIC may have multiple IP configurations. A subnet is only relevant here
        // when the stored NIC relationships unambiguously identify one subnet.
        string[] subnets = GetEdges(graph, target.AzureResourceId)
            .Where(edge => edge.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet)
            .Select(edge => edge.ToNodeId).Distinct(StringComparer.OrdinalIgnoreCase).Take(2).ToArray();
        if (subnets.Length == 1 && InventoryReachabilityPathGraph.IsSubnetNode(subnets[0])
            && TryGetNsg(graph, subnets[0]) is { } subnetNsg)
            yield return subnetNsg;
    }

    private static AzureInventoryResourceRecord? TryGetNsg(InventoryReachabilityPathGraphSnapshot graph, string id) =>
        graph.ReachabilityResourcesByArmId.TryGetValue(id, out AzureInventoryReachabilityResourceProperties? scopedResource)
        && scopedResource.Properties.TryGetValue("networkSecurityGroup.id", out string? nsgId)
        && graph.ResourcesByArmId.TryGetValue(ArmResourceIdNormalizer.Normalize(nsgId), out AzureInventoryResourceRecord? nsg)
        && IsResourceType(nsg, NsgType) ? nsg : null;

    private static bool HasStoredInboundDeny(InventoryReachabilityPathGraphSnapshot graph, AzureInventoryResourceRecord nsg)
    {
        try
        {
            return AzureInventoryNsgSecurityRuleParser.Parse(graph.ReachabilityResourcesByArmId[nsg.AzureResourceId].Properties)
                .Any(rule => string.Equals(rule.Direction, "Inbound", StringComparison.OrdinalIgnoreCase)
                    && string.Equals(rule.Access, "Deny", StringComparison.OrdinalIgnoreCase));
        }
        catch (InvalidOperationException)
        {
            // A malformed JSON member is not evidence of an effective denial.
            return false;
        }
    }

    private static IEnumerable<PrivilegePathEdge> GetEdges(InventoryReachabilityPathGraphSnapshot graph, string id) =>
        graph.OutgoingEdges.TryGetValue(id, out List<PrivilegePathEdge>? edges) ? edges : [];

    private static bool IsPublicIpAttachment(string edgeType, string? inferenceSource) =>
        edgeType == GraphEdgeTypes.Exposes && inferenceSource == GraphEdgeInferenceSources.InventoryPublicIp;

    private static bool IsResourceType(AzureInventoryResourceRecord row, string type) =>
        string.Equals(row.ResourceType, type, StringComparison.OrdinalIgnoreCase);

    private static PublicIpAssessmentEvidence Citation(AzureInventoryResourceRecord row, string kind) =>
        new(row.ResourceRowId, kind, nameof(ProvenanceKind.ObservedFact));

    private static bool IsControlProperty(string key) =>
        key.Equals("publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
        || key.Equals("properties.publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
        || key.Equals("enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
        || key.Equals("properties.enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
        || key.Equals("networkSecurityGroup.id", StringComparison.OrdinalIgnoreCase)
        || key.Equals("securityRules", StringComparison.OrdinalIgnoreCase)
        || key.StartsWith(InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix, StringComparison.OrdinalIgnoreCase);
}

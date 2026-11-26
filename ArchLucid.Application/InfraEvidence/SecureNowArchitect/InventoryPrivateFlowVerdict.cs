using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Evaluates the evidence available to the resource-level graph.
/// A resource pair has no concrete traffic tuple or authenticated measurement,
/// so even an approved endpoint with a DNS topology join remains indeterminate.</summary>
internal static class InventoryPrivateFlowVerdict
{
    public static AzurePrivateConnectivityState Evaluate(
        AzureInventoryPrivateEndpointDnsJoinIndex index,
        string sourceArmId,
        string targetArmId,
        IReadOnlyDictionary<string, AzureInventoryReachabilityResourceProperties> resources)
    {
        var approvals = index.MatchingEndpointIds(sourceArmId, targetArmId)
            .Select(endpoint => AzurePrivateConnectivityEvidence.ResolveApproval(targetArmId,
                resources.TryGetValue(endpoint, out var resource) ? resource.Properties : null))
            .ToArray();

        var approval = approvals.Contains(AzurePrivateConnectivityCheck.Supported)
            ? AzurePrivateConnectivityCheck.Supported
            : approvals.Length > 0 && approvals.All(value => value == AzurePrivateConnectivityCheck.Blocked)
                ? AzurePrivateConnectivityCheck.Blocked : AzurePrivateConnectivityCheck.Unknown;

        // Topology, approval and configuration associations are not scoped DNS answers,
        // resolver, effective route, NSG or measurement evidence.
        return AzurePrivateConnectivityEvidence.Evaluate(approval,
            AzurePrivateConnectivityCheck.Unknown, AzurePrivateConnectivityCheck.Unknown,
            AzurePrivateConnectivityCheck.Unknown, AzurePrivateConnectivityCheck.Unknown);
    }
}

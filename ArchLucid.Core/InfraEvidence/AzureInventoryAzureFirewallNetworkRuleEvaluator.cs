using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>Evaluates parsed Azure Firewall network rules for a modeled flow (SN-APR-05).</summary>
public static class AzureInventoryAzureFirewallNetworkRuleEvaluator
{
    public static AzureInventoryNetworkEdgeControlDecision Evaluate(
        IReadOnlyList<AzureInventoryAzureFirewallNetworkRule> rules,
        bool hasUnevaluatedApplicationRules,
        string sourceAddress,
        string destinationAddress,
        int destinationPort,
        string protocol)
    {
        if (rules.Count == 0)
        {
            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        foreach (AzureInventoryAzureFirewallNetworkRule rule in rules.OrderBy(static rule => rule.Priority))
        {
            if (!ProtocolMatches(rule.Protocols, protocol))
            {
                continue;
            }

            if (!PortMatches(rule.DestinationPorts, destinationPort))
            {
                continue;
            }

            if (!AddressMatches(rule.SourceAddresses, sourceAddress))
            {
                continue;
            }

            if (!AddressMatches(rule.DestinationAddresses, destinationAddress))
            {
                continue;
            }

            if (rule.Action.Equals("Deny", StringComparison.OrdinalIgnoreCase))
            {
                return AzureInventoryNetworkEdgeControlDecision.Deny;
            }

            if (rule.Action.Equals("Allow", StringComparison.OrdinalIgnoreCase))
            {
                return AzureInventoryNetworkEdgeControlDecision.Allow;
            }

            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        if (hasUnevaluatedApplicationRules)
        {
            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        return AzureInventoryNetworkEdgeControlDecision.Deny;
    }

    private static bool ProtocolMatches(IReadOnlyList<string> protocols, string protocol)
    {
        if (protocols.Count == 0)
        {
            return true;
        }

        foreach (string candidate in protocols)
        {
            if (candidate.Equals("*", StringComparison.OrdinalIgnoreCase)
                || candidate.Equals("Any", StringComparison.OrdinalIgnoreCase)
                || candidate.Equals(protocol, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static bool PortMatches(IReadOnlyList<string> destinationPorts, int destinationPort)
    {
        if (destinationPorts.Count == 0)
        {
            return true;
        }

        foreach (string candidate in destinationPorts)
        {
            if (candidate.Equals("*", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (int.TryParse(candidate, out int port) && port == destinationPort)
            {
                return true;
            }
        }

        return false;
    }

    private static bool AddressMatches(IReadOnlyList<string> prefixes, string address)
    {
        if (prefixes.Count == 0)
        {
            return true;
        }

        foreach (string prefix in prefixes)
        {
            if (InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsWildcard(prefix))
            {
                return true;
            }

            if (InventoryDiagramDataFlowNsgAddressPrefixMatcher.IsCidrOrIp(prefix)
                && InventoryDiagramDataFlowNsgAddressPrefixMatcher.Contains(prefix, address))
            {
                return true;
            }
        }

        return false;
    }
}

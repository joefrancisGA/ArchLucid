using System.Net;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>Conservative evaluation of complete effective rules for one NSG and one flow direction.</summary>
public static class AzurePrivateFlowNsgEvaluator
{
    public static AzurePrivateConnectivityCheck Evaluate(
        IReadOnlyList<AzureInventoryNsgSecurityRule>? rules, bool complete,
        string direction, string sourceIp, int sourcePort, string destinationIp, int destinationPort, string protocol)
    {
        if (!complete || rules is null || !IPAddress.TryParse(sourceIp, out var source)
            || !IPAddress.TryParse(destinationIp, out var destination)
            || sourcePort is < 1 or > 65535 || destinationPort is < 1 or > 65535
            || !(Is(direction, "Inbound") || Is(direction, "Outbound"))
            || !(Is(protocol, "Tcp") || Is(protocol, "Udp")))
            return AzurePrivateConnectivityCheck.Unknown;
        var candidates = new List<(int Priority, AzurePrivateConnectivityCheck Decision)>();
        foreach (var rule in rules)
        {
            if (!(Is(rule.Direction, "Inbound") || Is(rule.Direction, "Outbound")))
                return AzurePrivateConnectivityCheck.Unknown;
            if (!Is(rule.Direction, direction))
                continue;
            if (!int.TryParse(rule.Priority, out int priority) || priority is < 0 or > 65535)
                return AzurePrivateConnectivityCheck.Unknown;
            bool? protocolMatch = Is(rule.Protocol, "*") || Is(rule.Protocol, "Any") || Is(rule.Protocol, protocol)
                ? true : Is(rule.Protocol, "Tcp") || Is(rule.Protocol, "Udp") || Is(rule.Protocol, "Icmp")
                ? false : null;
            bool?[] matches = [protocolMatch,
                AddressMatch(rule.SourceAddressPrefix, rule.SourceAddressPrefixes, source),
                AddressMatch(rule.DestinationAddressPrefix, rule.DestinationAddressPrefixes, destination),
                PortMatch(rule.SourcePortRange, [], sourcePort),
                PortMatch(rule.DestinationPortRange, rule.DestinationPortRanges, destinationPort)];
            if (matches.Contains(false))
                continue;
            var verdict = matches.Contains(null) ? AzurePrivateConnectivityCheck.Unknown
                : Is(rule.Access, "Allow") ? AzurePrivateConnectivityCheck.Supported
                : Is(rule.Access, "Deny") ? AzurePrivateConnectivityCheck.Blocked : AzurePrivateConnectivityCheck.Unknown;
            candidates.Add((priority, verdict));
        }
        if (candidates.Count == 0)
            return AzurePrivateConnectivityCheck.Unknown;
        var first = candidates.Where(c => c.Priority == candidates.Min(x => x.Priority)).Select(c => c.Decision).Distinct().ToArray();
        return first.Length == 1 ? first[0] : AzurePrivateConnectivityCheck.Unknown;
    }

    private static bool Is(string? a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    private static bool? AddressMatch(string? single, IReadOnlyList<string> multiple, IPAddress address) =>
        MatchAny(single, multiple, value =>
        {
            if (value == "*") return true;
            string[] parts = value.Split('/');
            if (!IPAddress.TryParse(parts[0], out var network)) return null; // service tags / ASGs require independent expansion
            byte[] a = address.GetAddressBytes(), n = network.GetAddressBytes();
            int length = n.Length * 8;
            if (parts.Length > 2 || (parts.Length == 2 && (!int.TryParse(parts[1], out length) || length < 0 || length > n.Length * 8)))
                return null;
            if (a.Length != n.Length) return false;
            for (int i = 0; i < length; i++)
                if ((a[i / 8] & (128 >> (i % 8))) != (n[i / 8] & (128 >> (i % 8)))) return false;
            return true;
        });

    private static bool? PortMatch(string? single, IReadOnlyList<string> multiple, int port) =>
        MatchAny(single, multiple, value =>
        {
            if (value == "*") return true;
            string[] parts = value.Split('-');
            if (!int.TryParse(parts[0], out int start) || start is < 0 or > 65535 || parts.Length > 2) return null;
            int end = start;
            if (parts.Length == 2 && (!int.TryParse(parts[1], out end) || end < start || end > 65535)) return null;
            return port >= start && port <= end;
        });

    private static bool? MatchAny(string? single, IReadOnlyList<string> multiple, Func<string, bool?> match)
    {
        var values = multiple.Concat(string.IsNullOrWhiteSpace(single) ? [] : new[] { single! }).ToArray();
        if (values.Length == 0) return null;
        var results = values.Select(match).ToArray();
        return results.Contains(true) ? true : results.Contains(null) ? null : false;
    }
}

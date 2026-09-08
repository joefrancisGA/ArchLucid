using System.Text.RegularExpressions;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Parses NSG / security group / NetworkPolicy property blobs for internet-exposed admin inbound ports (DX-07).
///     Fail-open on unparseable blobs.
/// </summary>
public static partial class SegmentationRuleParser
{
    public static readonly int[] RiskyDestinationPorts = [22, 3389, 1433, 3306, 5432];

    [GeneratedRegex(
        @"source\s*=\s*[""']?\*",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex K8sWildcardSourceRegex();

    public static IReadOnlyList<SegmentationRiskyRule> ParseRiskyRules(IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        List<SegmentationRiskyRule> rules = [];
        HashSet<int> seenPorts = [];

        foreach (KeyValuePair<string, string> property in properties)
        {
            if (string.IsNullOrWhiteSpace(property.Value))
            {
                continue;
            }

            if (!TryParseRiskyRule(property.Value, out int port))
            {
                continue;
            }

            if (!seenPorts.Add(port))
            {
                continue;
            }

            rules.Add(new SegmentationRiskyRule(port, property.Key));
        }

        return rules;
    }

    public static bool TryParseRiskyRule(string propertyText, out int destinationPort)
    {
        destinationPort = 0;

        if (string.IsNullOrWhiteSpace(propertyText))
        {
            return false;
        }

        if (!TryGetRiskyPort(propertyText, out destinationPort))
        {
            return false;
        }

        if (!HasInternetSource(propertyText))
        {
            return false;
        }

        return true;
    }

    private static bool TryGetRiskyPort(string propertyText, out int destinationPort)
    {
        string normalized = propertyText.ToLowerInvariant();

        foreach (int port in RiskyDestinationPorts)
        {
            if (ContainsIsolatedPort(normalized, port))
            {
                destinationPort = port;

                return true;
            }
        }

        destinationPort = 0;

        return false;
    }

    private static bool HasInternetSource(string propertyText)
    {
        string normalized = propertyText.ToLowerInvariant();

        if (normalized.Contains("0.0.0.0/0", StringComparison.Ordinal))
        {
            return true;
        }

        if (normalized.Contains("source_address_prefix", StringComparison.Ordinal)
            && (normalized.Contains("=*", StringComparison.Ordinal)
                || normalized.Contains("= *", StringComparison.Ordinal)
                || normalized.Contains("internet", StringComparison.Ordinal)))
        {
            return true;
        }

        if (normalized.Contains("cidr_blocks", StringComparison.Ordinal)
            && normalized.Contains("0.0.0.0/0", StringComparison.Ordinal))
        {
            return true;
        }

        if (K8sWildcardSourceRegex().IsMatch(normalized))
        {
            return true;
        }

        if (normalized.Contains(" from ", StringComparison.Ordinal)
            && normalized.Contains('*', StringComparison.Ordinal))
        {
            return true;
        }

        if (ContainsPrivateSourceOnly(normalized))
        {
            return false;
        }

        return normalized.Contains(" internet", StringComparison.Ordinal)
            || normalized.Contains("source=*", StringComparison.Ordinal);
    }

    private static bool ContainsPrivateSourceOnly(string normalized)
    {
        if (normalized.Contains("10.0.0.0/8", StringComparison.Ordinal)
            || normalized.Contains("172.16.", StringComparison.Ordinal)
            || normalized.Contains("192.168.", StringComparison.Ordinal))
        {
            return !normalized.Contains("0.0.0.0/0", StringComparison.Ordinal)
                && !normalized.Contains("internet", StringComparison.Ordinal)
                && !normalized.Contains("source=*", StringComparison.Ordinal)
                && !normalized.Contains("=*", StringComparison.Ordinal);
        }

        return false;
    }

    private static bool ContainsIsolatedPort(string normalized, int port)
    {
        string portText = port.ToString();

        for (int index = 0; index <= normalized.Length - portText.Length; index++)
        {
            if (!normalized.AsSpan(index, portText.Length).SequenceEqual(portText))
            {
                continue;
            }

            bool beforeIsDigit = index > 0 && char.IsDigit(normalized[index - 1]);
            int afterIndex = index + portText.Length;

            if (beforeIsDigit)
            {
                continue;
            }

            if (afterIndex < normalized.Length && char.IsDigit(normalized[afterIndex]))
            {
                continue;
            }

            return true;
        }

        return false;
    }
}

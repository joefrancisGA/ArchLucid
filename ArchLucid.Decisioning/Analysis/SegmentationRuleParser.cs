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

    /// <summary>
    ///     Azure NSG rules set <c>source_port_range</c> and <c>destination_address_prefix</c> to
    ///     <c>*</c> even when the source is a private CIDR. Only <c>source_address_prefix</c> or
    ///     the list form <c>source_address_prefixes</c> decides whether the rule admits the internet.
    /// </summary>
    [GeneratedRegex(
        @"(?<![A-Za-z0-9_])source_address_prefix(?:es)?\s*=\s*(?<value>\[[^\]]*\]|[^\s,;]+)",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex SourceAddressPrefixRegex();

    /// <summary>
    ///     Admin-port digits also appear in addresses (<c>10.22.0.0/16</c>) and priorities.
    ///     Only destination port fields, including AWS <c>from_port</c> / <c>to_port</c>, count.
    /// </summary>
    [GeneratedRegex(
        @"(?<![A-Za-z0-9_])(?:destination_port_ranges?|from_port|to_port)\s*=\s*(?<value>\[[^\]]*\]|[^\s,;]+)",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex DestinationPortRegex();

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
        string dequoted = propertyText.ToLowerInvariant()
            .Replace("\"", string.Empty, StringComparison.Ordinal)
            .Replace("'", string.Empty, StringComparison.Ordinal);

        foreach (Match match in DestinationPortRegex().Matches(dequoted))
        {
            if (ValueContainsRiskyPort(match.Groups["value"].Value, out destinationPort))
            {
                return true;
            }
        }

        destinationPort = 0;

        return false;
    }

    private static bool ValueContainsRiskyPort(string raw, out int destinationPort)
    {
        string value = raw.Trim().TrimEnd(',', ';');

        if (value.Length >= 2 && value[0] == '[' && value[^1] == ']')
        {
            value = value[1..^1];
        }

        foreach (string part in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            string token = part.Trim().TrimEnd(',', ';');

            foreach (int port in RiskyDestinationPorts)
            {
                if (ContainsIsolatedPort(token, port))
                {
                    destinationPort = port;

                    return true;
                }
            }
        }

        destinationPort = 0;

        return false;
    }

    private static bool HasInternetSource(string propertyText)
    {
        string normalized = propertyText.ToLowerInvariant();
        // Terraform nested blocks keep quoted wildcards (`"*"`); strip quotes so `= *` still matches.
        string dequoted = normalized.Replace("\"", string.Empty, StringComparison.Ordinal)
            .Replace("'", string.Empty, StringComparison.Ordinal);

        if (dequoted.Contains("0.0.0.0/0", StringComparison.Ordinal))
        {
            return true;
        }

        if (SourceAddressPrefixAllowsInternet(dequoted))
        {
            return true;
        }

        if (dequoted.Contains("cidr_blocks", StringComparison.Ordinal)
            && dequoted.Contains("0.0.0.0/0", StringComparison.Ordinal))
        {
            return true;
        }

        if (K8sWildcardSourceRegex().IsMatch(dequoted))
        {
            return true;
        }

        if (dequoted.Contains(" from ", StringComparison.Ordinal)
            && dequoted.Contains('*', StringComparison.Ordinal))
        {
            return true;
        }

        if (ContainsPrivateSourceOnly(dequoted))
        {
            return false;
        }

        return dequoted.Contains(" internet", StringComparison.Ordinal)
            || dequoted.Contains("source=*", StringComparison.Ordinal);
    }

    private static bool SourceAddressPrefixAllowsInternet(string dequoted)
    {
        foreach (Match match in SourceAddressPrefixRegex().Matches(dequoted))
        {
            if (PrefixValueAllowsInternet(match.Groups["value"].Value))
            {
                return true;
            }
        }

        return false;
    }

    private static bool PrefixValueAllowsInternet(string raw)
    {
        string value = raw.Trim().TrimEnd(',', ';');

        if (value.Length >= 2 && value[0] == '[' && value[^1] == ']')
        {
            value = value[1..^1];
        }

        foreach (string part in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            string token = part.Trim().TrimEnd(',', ';');

            if (token is "*" or "internet"
                || token.Contains("0.0.0.0/0", StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
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

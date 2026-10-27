using System.Globalization;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class InventoryDiagramNsgInboundRuleChipBuilder
{
    private const int MaxVisibleChips = 3;

    public static IReadOnlyList<DiagramNsgInboundRuleChip> BuildVisibleChips(
        IReadOnlyList<AzureInventoryNsgSecurityRule> rules,
        bool includeMissingDestinationHonesty = false)
    {
        List<AzureInventoryNsgSecurityRule> inboundRules = rules
            .Where(IsInboundRule)
            .ToList();

        if (inboundRules.Count == 0)
        {
            return [];
        }

        List<AzureInventoryNsgSecurityRule> inboundWithPriority = inboundRules
            .Where(rule => int.TryParse(rule.Priority, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
            .OrderBy(rule => int.Parse(rule.Priority!, CultureInfo.InvariantCulture))
            .ThenBy(rule => rule.RuleName ?? string.Empty, StringComparer.Ordinal)
            .ToList();

        int inboundWithoutPriority = inboundRules.Count - inboundWithPriority.Count;

        if (inboundWithPriority.Count == 0 && inboundWithoutPriority > 0)
        {
            return
            [
                new DiagramNsgInboundRuleChip(
                    $"Priority was not stored for {inboundWithoutPriority} inbound rules.",
                    IsRisky: false),
            ];
        }

        List<DiagramNsgInboundRuleChip> chips = [];

        foreach (AzureInventoryNsgSecurityRule rule in inboundWithPriority.Take(MaxVisibleChips))
        {
            chips.Add(BuildChip(rule, includeMissingDestinationHonesty));
        }

        int remainder = inboundWithPriority.Count - MaxVisibleChips;

        if (remainder > 0)
        {
            chips.Add(new DiagramNsgInboundRuleChip(
                $"{remainder} more inbound rules",
                IsRisky: false));
        }

        if (inboundWithoutPriority > 0)
        {
            chips.Add(new DiagramNsgInboundRuleChip(
                $"Priority was not stored for {inboundWithoutPriority} inbound rules.",
                IsRisky: false));
        }

        return chips;
    }

    private static bool IsInboundRule(AzureInventoryNsgSecurityRule rule) =>
        string.Equals(rule.Direction, "Inbound", StringComparison.OrdinalIgnoreCase);

    private static DiagramNsgInboundRuleChip BuildChip(
        AzureInventoryNsgSecurityRule rule,
        bool includeMissingDestinationHonesty)
    {
        string port = FormatPort(rule);
        string protocol = FormatProtocol(rule.Protocol);
        string source = FormatSource(rule);
        string access = string.IsNullOrWhiteSpace(rule.Access)
            ? "Access was not stored"
            : rule.Access.Trim();
        string text = $"in {port}/{protocol} · {source} · {access}";

        if (includeMissingDestinationHonesty
            && string.Equals(
                FormatDestination(rule),
                "Destination was not stored",
                StringComparison.Ordinal))
        {
            text += " to Destination was not stored";
        }
        bool risky = string.Equals(rule.Direction, "Inbound", StringComparison.OrdinalIgnoreCase)
            && string.Equals(rule.Access, "Allow", StringComparison.OrdinalIgnoreCase)
            && string.Equals(source, "Internet", StringComparison.Ordinal)
            && (port.Equals("3389", StringComparison.Ordinal)
                || port.Equals("22", StringComparison.Ordinal)
                || port.Equals("any", StringComparison.OrdinalIgnoreCase)
                || port.StartsWith("3389,", StringComparison.Ordinal));

        return new DiagramNsgInboundRuleChip(text, risky);
    }

    private static string FormatPort(AzureInventoryNsgSecurityRule rule)
    {
        if (!string.IsNullOrWhiteSpace(rule.DestinationPortRange))
        {
            string trimmed = rule.DestinationPortRange.Trim();

            return trimmed == "*" ? "any" : trimmed;
        }

        if (rule.DestinationPortRanges.Count > 0)
        {
            return string.Join(", ", rule.DestinationPortRanges.Select(static range => range.Trim()));
        }

        return "Port was not stored";
    }

    private static string FormatProtocol(string? protocol)
    {
        return string.IsNullOrWhiteSpace(protocol)
            ? "Protocol was not stored"
            : protocol.Trim() == "*"
            ? "any"
            : protocol.Trim().ToUpperInvariant();
    }

    private static string FormatSource(AzureInventoryNsgSecurityRule rule)
    {
        string? prefix = rule.SourceAddressPrefix;

        if (string.IsNullOrWhiteSpace(prefix) && rule.SourceAddressPrefixes.Count > 0)
        {
            prefix = rule.SourceAddressPrefixes[0];
        }

        if (string.IsNullOrWhiteSpace(prefix))
        {
            return "Source was not stored";
        }

        prefix = prefix.Trim();

        if (prefix == "*"
            || prefix.Equals("Internet", StringComparison.OrdinalIgnoreCase)
            || prefix == "0.0.0.0/0")
        {
            prefix = "Internet";
        }

        if (rule.SourceAddressPrefixes.Count > 1)
        {
            int extra = rule.SourceAddressPrefixes.Count - 1;

            return $"{prefix}; {extra} other source prefixes were not listed on this chip.";
        }

        return prefix;
    }

    private static string FormatDestination(AzureInventoryNsgSecurityRule rule)
    {
        string? prefix = rule.DestinationAddressPrefix;
        int extraPrefixCount = 0;

        if (string.IsNullOrWhiteSpace(prefix) && rule.DestinationAddressPrefixes.Count > 0)
        {
            prefix = rule.DestinationAddressPrefixes[0];
            extraPrefixCount = rule.DestinationAddressPrefixes.Count - 1;
        }

        if (string.IsNullOrWhiteSpace(prefix))
        {
            return "Destination was not stored";
        }

        prefix = prefix.Trim();

        if (prefix == "*")
        {
            prefix = "Any destination";
        }
        else if (prefix == "0.0.0.0/0")
        {
            prefix = "Any IPv4 destination";
        }

        if (extraPrefixCount > 0)
        {
            return $"{prefix}; {extraPrefixCount} other destination prefixes were not listed on this chip.";
        }

        return prefix;
    }
}

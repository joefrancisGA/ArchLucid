using System.Globalization;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.ArtifactSynthesis.Compilers;

internal static class InventoryDiagramNsgInboundRuleChipBuilder
{
    private const int MaxVisibleChips = 3;

    public static IReadOnlyList<DiagramNsgInboundRuleChip> BuildVisibleChips(
        IReadOnlyList<AzureInventoryNsgSecurityRule> rules)
    {
        List<AzureInventoryNsgSecurityRule> inboundAllows = rules
            .Where(IsInboundRuleWithStoredAccessOrDirection)
            .Where(rule => int.TryParse(rule.Priority, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
            .OrderBy(rule => int.Parse(rule.Priority!, CultureInfo.InvariantCulture))
            .ThenBy(rule => rule.RuleName ?? string.Empty, StringComparer.Ordinal)
            .ToList();

        if (inboundAllows.Count == 0)
        {
            return [];
        }

        List<DiagramNsgInboundRuleChip> chips = [];

        foreach (AzureInventoryNsgSecurityRule rule in inboundAllows.Take(MaxVisibleChips))
        {
            chips.Add(BuildChip(rule));
        }

        int remainder = inboundAllows.Count - MaxVisibleChips;

        if (remainder > 0)
        {
            chips.Add(new DiagramNsgInboundRuleChip($"{remainder} more inbound rules", IsRisky: false));
        }

        return chips;
    }

    private static bool IsInboundRuleWithStoredAccessOrDirection(AzureInventoryNsgSecurityRule rule)
    {
        bool inbound = string.Equals(rule.Direction, "Inbound", StringComparison.OrdinalIgnoreCase);
        bool allow = string.Equals(rule.Access, "Allow", StringComparison.OrdinalIgnoreCase);
        bool accessMissing = string.IsNullOrWhiteSpace(rule.Access);
        bool directionMissing = string.IsNullOrWhiteSpace(rule.Direction);

        return (inbound && (allow || accessMissing))
            || (allow && directionMissing);
    }

    private static DiagramNsgInboundRuleChip BuildChip(AzureInventoryNsgSecurityRule rule)
    {
        string port = FormatPort(rule.DestinationPortRange);
        string protocol = FormatProtocol(rule.Protocol);
        string source = FormatSource(rule);
        string missingLabel = string.Join(
            " · ",
            new[]
            {
                string.IsNullOrWhiteSpace(rule.Access) ? "Access was not stored" : null,
                string.IsNullOrWhiteSpace(rule.Direction) ? "Direction was not stored" : null,
            }.Where(static label => label is not null));
        string text = string.IsNullOrWhiteSpace(missingLabel)
            ? $"in {port}/{protocol} · {source}"
            : $"{missingLabel} · in {port}/{protocol} · {source}";
        bool risky = string.Equals(source, "Internet", StringComparison.Ordinal)
            && (port.Equals("3389", StringComparison.Ordinal)
                || port.Equals("22", StringComparison.Ordinal)
                || port.Equals("any", StringComparison.OrdinalIgnoreCase));

        return new DiagramNsgInboundRuleChip(text, risky);
    }

    private static string FormatPort(string? destinationPortRange)
    {
        return string.IsNullOrWhiteSpace(destinationPortRange)
            ? "Port was not stored"
            : destinationPortRange.Trim() == "*"
            ? "any"
            : destinationPortRange.Trim();
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
            return "Internet";
        }

        return prefix;
    }
}

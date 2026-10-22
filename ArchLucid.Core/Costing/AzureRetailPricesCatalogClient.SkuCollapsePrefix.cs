using System.Text.RegularExpressions;

namespace ArchLucid.Core.Costing;

public sealed partial class AzureRetailPricesCatalogClient
{
    internal static bool RowMatchesSku(string armSkuHint, string? retailSkuPricing) =>
        RowMatchesCollapsed(CollapseComparableSku(armSkuHint), CollapseComparableSku(retailSkuPricing));

    internal static bool RowMatchesCollapsed(string targetCollapsed, string retailCollapsed)
    {
        if (targetCollapsed.Length == 0 || retailCollapsed.Length == 0)
            return false;

        return string.Equals(retailCollapsed,
                targetCollapsed,
                StringComparison.OrdinalIgnoreCase)
               ||
               HasCollapsedSkuPrefix(retailCollapsed, targetCollapsed) ||
               HasCollapsedSkuPrefix(targetCollapsed, retailCollapsed) ||
               (targetCollapsed.Length > 4 && CollapsedSkuContains(retailCollapsed, targetCollapsed));
    }

    private static bool HasCollapsedSkuPrefix(string haystack, string needle)
        =>
            HasCollapsedSkuBoundary(haystack, 0, needle.Length)
            && haystack.StartsWith(needle, StringComparison.OrdinalIgnoreCase);

    private static bool HasCollapsedSkuBoundary(string haystack, int index, int needleLength)
    {
        int endIndex = index + needleLength;

        if (endIndex < haystack.Length)
        {
            char next = haystack[endIndex];

            if (next is >= '0' and <= '9' or '-')
                return false;

            // Reject letter-variant suffixes such as Standard_D4 matching Standard_D4s_v5.
            if (endIndex > 0
                && haystack[endIndex - 1] is >= '0' and <= '9'
                && char.IsLetter(next))
                return false;
        }

        if (index > 0)
        {
            char previous = haystack[index - 1];

            if (previous is >= '0' and <= '9')
                return false;

            // Reject letter-variant prefixes such as Standard_VE2s_v5 matching E2s_v5.
            if (char.IsUpper(previous))
                return false;
        }

        return true;
    }

    internal static string CollapseComparableSku(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        return Regex.Replace(value.Trim(),
            @"[\s_]+",
            string.Empty,
            RegexOptions.None,
            TimeSpan.FromSeconds(1));
    }
}

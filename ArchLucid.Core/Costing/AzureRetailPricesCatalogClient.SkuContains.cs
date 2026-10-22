namespace ArchLucid.Core.Costing;

public sealed partial class AzureRetailPricesCatalogClient
{
    private static bool CollapsedSkuContains(string haystack, string needle)
    {
        if (needle.Length == 0 || haystack.Length < needle.Length)
            return false;

        int index = 0;

        while (index <= haystack.Length - needle.Length)
        {
            index = haystack.IndexOf(needle, index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (HasCollapsedSkuBoundary(haystack, index, needle.Length))
                return true;

            index++;
        }

        return false;
    }
}

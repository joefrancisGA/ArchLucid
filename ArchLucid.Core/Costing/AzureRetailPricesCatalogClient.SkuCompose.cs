namespace ArchLucid.Core.Costing;

public sealed partial class AzureRetailPricesCatalogClient
{
    internal static Uri ComposeRetailRelativeUri(string filterClause)
        =>
            new(
                $"{RetailPriceQueries.RetailPricesRelativePath}?{RetailPriceQueries.FilterParameter}={Uri.EscapeDataString(filterClause)}",
                UriKind.Relative);

    internal static string OdataEscape(string literal)
        =>
            literal.Replace("'",
                "''",
                StringComparison.Ordinal);
}

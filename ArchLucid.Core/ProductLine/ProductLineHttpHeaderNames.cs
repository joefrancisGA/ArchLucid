namespace ArchLucid.Core.ProductLine;

/// <summary>Optional request header for narrowing effective product line (OP-03). Omitted inherits deployment.</summary>
public static class ProductLineHttpHeaderNames
{
    public const string Header = "X-ArchLucid-Product-Line";
}

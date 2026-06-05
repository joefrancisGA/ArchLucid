namespace ArchLucid.Api.OpenApi;

/// <summary>
///     OpenAPI extension <c>x-archlucid-audience</c> values for contract partitioning (TB-286).
/// </summary>
internal static class OpenApiAudience
{
    internal const string ExtensionName = "x-archlucid-audience";

    internal const string Buyer = "buyer";

    internal const string Operator = "operator";

    internal const string Internal = "internal";

    internal const string Forensics = "forensics";
}

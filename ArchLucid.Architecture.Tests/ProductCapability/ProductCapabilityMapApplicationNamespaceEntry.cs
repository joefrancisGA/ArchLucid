namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>One Application namespace cluster row in <c>product-capability-map.json</c>.</summary>
internal sealed class ProductCapabilityMapApplicationNamespaceEntry
{
    public string NamespacePrefix { get; set; } = string.Empty;

    public string Capability { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? OwnerNote { get; set; }
}

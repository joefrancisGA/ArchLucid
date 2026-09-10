namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>One API controller row in <c>product-capability-map.json</c>.</summary>
internal sealed class ProductCapabilityMapControllerEntry
{
    public string TypeName { get; set; } = string.Empty;

    public string Capability { get; set; } = string.Empty;

    public string ProductLine { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? OwnerNote { get; set; }
}

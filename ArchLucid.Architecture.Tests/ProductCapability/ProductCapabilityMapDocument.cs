namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>Deserialized OP-01 capability map contract.</summary>
internal sealed class ProductCapabilityMapDocument
{
    public int Version { get; set; }

    public IReadOnlyList<string> Capabilities { get; set; } = [];

    public IReadOnlyList<string> AlwaysAllowedRoutePrefixes { get; set; } = [];

    public IReadOnlyList<ProductCapabilityMapControllerEntry> Controllers { get; set; } = [];

    public IReadOnlyList<ProductCapabilityMapApplicationNamespaceEntry> ApplicationNamespaces { get; set; } = [];

    public IReadOnlyList<string> RequiredApplicationNamespacePrefixes { get; set; } = [];
}

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>OP-02 shrinking allowlist for cross-capability Application dependencies.</summary>
internal sealed class ProductCapabilityNamespaceAllowlistDocument
{
    public int Version { get; set; }

    public IReadOnlyList<ProductCapabilityNamespaceAllowlistEntry> Entries { get; set; } = [];
}

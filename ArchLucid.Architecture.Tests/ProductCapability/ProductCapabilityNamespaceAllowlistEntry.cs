namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>One allowed cross-capability namespace dependency (shrinking allowlist).</summary>
internal sealed class ProductCapabilityNamespaceAllowlistEntry
{
    public string TypeName { get; set; } = string.Empty;

    public string ForbiddenPrefix { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;
}

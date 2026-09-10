using System.Text.Json;

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>Loads the OP-02 namespace dependency allowlist.</summary>
internal static class ProductCapabilityNamespaceAllowlistLoader
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static string AllowlistFilePath =>
        Path.Combine(ProductCapabilityMapPaths.RepoRoot, "docs", "architecture", "data", "product-capability-namespace-allowlist.json");

    internal static ProductCapabilityNamespaceAllowlistDocument Load()
    {
        string path = AllowlistFilePath;

        if (!File.Exists(path))
            throw new FileNotFoundException("Product capability namespace allowlist is missing.", path);

        string json = File.ReadAllText(path);
        ProductCapabilityNamespaceAllowlistDocument? document =
            JsonSerializer.Deserialize<ProductCapabilityNamespaceAllowlistDocument>(json, SerializerOptions);

        if (document is null)
            throw new InvalidOperationException($"Failed to deserialize namespace allowlist: {path}");

        return document;
    }
}

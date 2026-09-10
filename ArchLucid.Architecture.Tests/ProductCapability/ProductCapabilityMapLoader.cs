using System.Text.Json;

namespace ArchLucid.Architecture.Tests.ProductCapability;

/// <summary>Loads and validates the OP-01 product capability map JSON contract.</summary>
internal static class ProductCapabilityMapLoader
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static ProductCapabilityMapDocument Load()
    {
        string path = ProductCapabilityMapPaths.MapFilePath;

        if (!File.Exists(path))
            throw new FileNotFoundException("Product capability map is missing.", path);

        string json = File.ReadAllText(path);
        ProductCapabilityMapDocument? document = JsonSerializer.Deserialize<ProductCapabilityMapDocument>(json, SerializerOptions);

        if (document is null)
            throw new InvalidOperationException($"Failed to deserialize product capability map: {path}");

        return document;
    }
}

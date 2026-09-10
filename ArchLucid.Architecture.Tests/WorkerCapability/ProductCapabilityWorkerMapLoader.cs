using System.Text.Json;

namespace ArchLucid.Architecture.Tests.WorkerCapability;

internal static class ProductCapabilityWorkerMapLoader
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    internal static ProductCapabilityWorkerMapDocument Load()
    {
        string path = ProductCapabilityWorkerMapPaths.MapFilePath;

        if (!File.Exists(path))
            throw new FileNotFoundException("Product capability worker map is missing.", path);

        string json = File.ReadAllText(path);
        ProductCapabilityWorkerMapDocument? document =
            JsonSerializer.Deserialize<ProductCapabilityWorkerMapDocument>(json, SerializerOptions);

        if (document is null)
            throw new InvalidOperationException($"Failed to deserialize product capability worker map: {path}");

        return document;
    }

    internal static void Save(ProductCapabilityWorkerMapDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        string path = ProductCapabilityWorkerMapPaths.MapFilePath;
        string json = JsonSerializer.Serialize(document, SerializerOptions);
        File.WriteAllText(path, json + Environment.NewLine);
    }
}

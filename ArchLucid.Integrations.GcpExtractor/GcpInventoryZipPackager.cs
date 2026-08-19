using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Integrations.GcpExtractor;

public sealed record GcpInventoryResourceEntry(
    string Name,
    string ResourceType,
    string Location,
    string? Sku);

public static class GcpInventoryZipPackager
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static byte[] BuildZip(
        string projectId,
        string collectorVersion,
        IReadOnlyList<GcpInventoryResourceEntry> resources)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(projectId);
        ArgumentException.ThrowIfNullOrWhiteSpace(collectorVersion);

        string collectionTimestamp = TimeProvider.System.GetUtcNow().ToString("o");

        Dictionary<string, object?> manifest = new()
        {
            ["schemaVersion"] = 1,
            ["scriptVersion"] = "1.0.0",
            ["collectionTimestamp"] = collectionTimestamp,
            ["cloudProvider"] = "Gcp",
            ["projectId"] = projectId.Trim(),
            ["scope"] = "project",
            ["switchesUsed"] = Array.Empty<string>(),
            ["collectorVersion"] = collectorVersion
        };

        List<object> resourcePayload = resources
            .Select(resource => new
            {
                name = resource.Name,
                resourceType = resource.ResourceType,
                location = resource.Location,
                sku = resource.Sku
            })
            .Cast<object>()
            .ToList();

        using MemoryStream zipStream = new();

        using (ZipArchive archive = new(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddUtf8Entry(archive, "manifest.json", JsonSerializer.Serialize(manifest, SerializerOptions));
            AddUtf8Entry(archive, "resources.json", JsonSerializer.Serialize(resourcePayload, SerializerOptions));
            AddUtf8Entry(
                archive,
                "README.txt",
                """
                ArchLucid GCP inventory package (read-only).
                Upload this ZIP to POST /v1/extractor/gcp/upload
                Do not share outside your change-management policy.
                """);
        }

        return zipStream.ToArray();
    }

    private static void AddUtf8Entry(ZipArchive archive, string entryName, string content)
    {
        ZipArchiveEntry entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);

        using Stream entryStream = entry.Open();

        entryStream.Write(Encoding.UTF8.GetBytes(content));
    }
}

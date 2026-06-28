using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Integrations.AwsExtractor;

public sealed record AwsInventoryResourceEntry(
    string Name,
    string ResourceType,
    string Location,
    string? Sku);

public static class AwsInventoryZipPackager
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static byte[] BuildZip(
        string accountId,
        string collectorVersion,
        IReadOnlyList<AwsInventoryResourceEntry> resources)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accountId);
        ArgumentException.ThrowIfNullOrWhiteSpace(collectorVersion);

        string collectionTimestamp = TimeProvider.System.GetUtcNow().ToString("o");

        Dictionary<string, object?> manifest = new()
        {
            ["schemaVersion"] = 1,
            ["scriptVersion"] = "1.0.0",
            ["collectionTimestamp"] = collectionTimestamp,
            ["cloudProvider"] = "Aws",
            ["accountId"] = accountId.Trim(),
            ["scope"] = "account",
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
                ArchLucid AWS inventory package (read-only).
                Upload this ZIP to POST /v1/extractor/aws/upload
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

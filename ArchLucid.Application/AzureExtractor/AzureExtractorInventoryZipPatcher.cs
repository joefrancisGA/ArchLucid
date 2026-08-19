using System.IO.Compression;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.AzureExtractor;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Application.AzureExtractor;

/// <summary>Replaces <c>resources.json</c> inside an extractor ZIP with enriched inventory rows.</summary>
internal static class AzureExtractorInventoryZipPatcher
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    internal static byte[] TryPatchResourcesJson(byte[] zipBytes, IReadOnlyList<EnrichedAzureExtractorInventoryLine> enrichedLines)
    {
        ArgumentNullException.ThrowIfNull(zipBytes);
        ArgumentNullException.ThrowIfNull(enrichedLines);

        if (enrichedLines.Count == 0)
            return zipBytes;

        using MemoryStream input = new(zipBytes, writable: false);
        using MemoryStream output = new();

        using (ZipArchive source = new(input, ZipArchiveMode.Read, leaveOpen: true))
        using (ZipArchive target = new(output, ZipArchiveMode.Create, leaveOpen: true))
        {
            string resourcesJson = SerializeResources(enrichedLines);
            bool resourcesReplaced = false;

            foreach (ZipArchiveEntry entry in source.Entries)
            {
                if (IsResourcesEntry(entry.Name))
                {
                    WriteEntry(target, entry.FullName, resourcesJson);
                    resourcesReplaced = true;

                    continue;
                }

                CopyEntry(source, target, entry);
            }

            if (!resourcesReplaced)
                WriteEntry(target, "resources.json", resourcesJson);
        }

        return output.ToArray();
    }

    internal static IReadOnlyList<AzureExtractorInventoryResourceLine> ReadLines(byte[] zipBytes)
    {
        using MemoryStream stream = new(zipBytes, writable: false);
        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, _) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        return lines ?? [];
    }

    private static bool IsResourcesEntry(string name) =>
        string.Equals(name, "resources.json", StringComparison.OrdinalIgnoreCase);

    private static string SerializeResources(IReadOnlyList<EnrichedAzureExtractorInventoryLine> lines)
    {
        List<object> rows = lines.Select(static line => new
        {
            name = BuildArmName(line),
            resourceType = line.ResourceType,
            location = line.Location,
            sku = string.IsNullOrWhiteSpace(line.Tier) ? null : new { name = line.Tier },
            inferred = new
            {
                resourceType = line.ResourceTypeInferred,
                location = line.LocationInferred,
                tier = line.TierInferred,
            },
        }).Cast<object>().ToList();

        return JsonSerializer.Serialize(rows, JsonOptions);
    }

    private static string BuildArmName(EnrichedAzureExtractorInventoryLine line)
    {
        if (!string.IsNullOrWhiteSpace(line.ResourceGroup))
            return $"/subscriptions/unknown/resourceGroups/{line.ResourceGroup}/providers/{line.ResourceType}/{line.Name}";

        return line.Name;
    }

    private static void CopyEntry(ZipArchive source, ZipArchive target, ZipArchiveEntry entry)
    {
        ZipArchiveEntry created = target.CreateEntry(entry.FullName, CompressionLevel.Optimal);

        using Stream sourceStream = entry.Open();
        using Stream targetStream = created.Open();
        sourceStream.CopyTo(targetStream);
    }

    private static void WriteEntry(ZipArchive target, string fullName, string content)
    {
        ZipArchiveEntry created = target.CreateEntry(fullName, CompressionLevel.Optimal);

        using StreamWriter writer = new(created.Open(), Encoding.UTF8);

        writer.Write(content);
    }
}

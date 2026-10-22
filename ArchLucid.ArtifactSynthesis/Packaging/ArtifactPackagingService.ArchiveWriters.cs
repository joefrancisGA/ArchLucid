using System.IO.Compression;
using System.Text;
using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Packaging;

public partial class ArtifactPackagingService
{
    private static void RecordTextEntry(
        ZipArchive archive,
        List<(string Path, byte[] Content)> recordedEntries,
        string entryName,
        string content)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(content);
        RecordBinaryEntry(archive, recordedEntries, entryName, bytes);
    }

    private static void RecordBinaryEntry(
        ZipArchive archive,
        List<(string Path, byte[] Content)> recordedEntries,
        string entryName,
        byte[] content)
    {
        ArgumentNullException.ThrowIfNull(content);

        string normalizedPath = entryName.Replace('\\', '/');
        WriteBytesEntry(archive, normalizedPath, content);
        recordedEntries.Add((normalizedPath, content));
    }

    private static void RecordPackageMetadata(
        ZipArchive archive,
        List<(string Path, byte[] Content)> recordedEntries,
        Guid runId,
        Guid manifestId,
        int artifactCount,
        DateTime createdUtc)
    {
        string metadataJson = JsonSerializer.Serialize(
            new
            {
                CreatedUtc = createdUtc,
                RunId = runId,
                ManifestId = manifestId,
                ArtifactCount = artifactCount
            },
            JsonWriteIndented);

        RecordTextEntry(archive, recordedEntries, "package-metadata.json", metadataJson);
    }

    private static void WriteBytesEntry(ZipArchive archive, string entryName, byte[] content)
    {
        ZipArchiveEntry entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
        using Stream entryStream = entry.Open();
        entryStream.Write(content, 0, content.Length);
    }

    private static void WriteTextEntry(ZipArchive archive, string entryName, string content)
    {
        ZipArchiveEntry entry = archive.CreateEntry(entryName.Replace('\\', '/'), CompressionLevel.Fastest);
        using Stream entryStream = entry.Open();
        using StreamWriter writer = new(entryStream, Encoding.UTF8);
        writer.Write(content);
    }

    private static void WriteBundleIndex(ZipArchive archive, IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        string indexJson = JsonSerializer.Serialize(
            artifacts.Select(x => new
            {
                x.ArtifactId,
                x.ArtifactType,
                x.Name,
                x.Format,
                x.CreatedUtc,
                x.ContentHash
            }),
            JsonWriteIndented);

        WriteTextEntry(archive, "bundle-index.json", indexJson);
    }

    private static void WritePackageMetadata(ZipArchive archive, object payload)
    {
        string metadataJson = JsonSerializer.Serialize(payload, JsonWriteIndented);
        WriteTextEntry(archive, "package-metadata.json", metadataJson);
    }

    /// <summary>Reserves a unique name within the current archive (flat or prefixed paths).</summary>
    private static string AvoidReservedEntryName(string sanitizedFileName, HashSet<string> reserved)
    {
        return reserved.Contains(sanitizedFileName) ? $"artifact-{sanitizedFileName}" : sanitizedFileName;
    }

    private static string AllocateUniqueEntryName(string sanitizedFileName, HashSet<string> usedEntryNames)
    {
        string candidate = sanitizedFileName;
        int n = 1;
        while (!usedEntryNames.Add(candidate))
        {
            string stem = Path.GetFileNameWithoutExtension(sanitizedFileName);
            string ext = Path.GetExtension(sanitizedFileName);
            candidate = $"{stem}_{n++}{ext}";
        }

        return candidate;
    }
}

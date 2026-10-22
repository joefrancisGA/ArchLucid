using System.IO.Compression;
using System.Text;
using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public static class AuditEvidencePackageZipBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static (byte[] ZipBytes, string EvidenceHashesJson) BuildZip(
        IReadOnlyList<AuditEvidencePackageEntry> entries,
        AuditEvidencePackageCollectionManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(entries);
        ArgumentNullException.ThrowIfNull(manifest);

        List<AuditEvidencePackageEntry> sortedEntries = entries
            .OrderBy(entry => entry.RelativePath, StringComparer.Ordinal)
            .ToList();

        using MemoryStream memoryStream = new();
        string evidenceHashesJson;

        using (ZipArchive archive = new(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            List<(string Path, byte[] Content)> recorded = [];

            foreach (AuditEvidencePackageEntry entry in sortedEntries)
            {
                string path = entry.RelativePath.Replace('\\', '/');
                ZipArchiveEntry zipEntry = archive.CreateEntry(path, CompressionLevel.Fastest);
                using Stream stream = zipEntry.Open();
                stream.Write(entry.Content, 0, entry.Content.Length);
                recorded.Add((path, entry.Content));
            }

            string collectionManifestJson = JsonSerializer.Serialize(manifest, JsonOptions);
            RecordEntry(archive, recorded, $"{manifest.RootFolder}/Collection-Manifest.json", collectionManifestJson);

            List<ExportManifestFileEntry> hashEntries = recorded
                .OrderBy(entry => entry.Path, StringComparer.Ordinal)
                .Select(entry => new ExportManifestFileEntry
                {
                    Path = entry.Path,
                    Sha256 = ExportManifestBuilder.ComputeSha256UpperHex(entry.Content),
                    Bytes = entry.Content.Length,
                })
                .ToList();

            AuditEvidenceHashesDocument hashesDocument = new()
            {
                SchemaVersion = 1,
                SnapshotRootHashSha256 = manifest.SnapshotRootHashSha256,
                Files = hashEntries,
            };

            evidenceHashesJson = JsonSerializer.Serialize(hashesDocument, JsonOptions);
            RecordEntry(archive, recorded, $"{manifest.RootFolder}/Evidence-Hashes.json", evidenceHashesJson);
        }

        return (memoryStream.ToArray(), evidenceHashesJson);
    }

    private static void RecordEntry(
        ZipArchive archive,
        List<(string Path, byte[] Content)> recorded,
        string path,
        string content)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(content);
        ZipArchiveEntry zipEntry = archive.CreateEntry(path.Replace('\\', '/'), CompressionLevel.Fastest);
        using Stream stream = zipEntry.Open();
        stream.Write(bytes, 0, bytes.Length);
        recorded.Add((path.Replace('\\', '/'), bytes));
    }

    private sealed class AuditEvidenceHashesDocument
    {
        public int SchemaVersion
        {
            get;
            init;
        }

        public string SnapshotRootHashSha256
        {
            get;
            init;
        } = string.Empty;

        public IReadOnlyList<ExportManifestFileEntry> Files
        {
            get;
            init;
        } = [];
    }
}

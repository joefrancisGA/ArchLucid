using System.IO.Compression;
using System.Text;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Api.Tests;

/// <summary>Test ZIP payloads for AWS/GCP inventory ingest endpoints.</summary>
internal static class CloudInventoryExtractorTestZipBuilder
{
    internal static byte[] BuildValidZip(CloudProvider provider, bool includeManifest, int? schemaVersionOverride = null)
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            if (includeManifest)
            {
                int schemaVersion = schemaVersionOverride ?? 1;

                string manifest = provider switch
                {
                    CloudProvider.Aws => $$"""
                        {"schemaVersion":{{schemaVersion}},"scriptVersion":"1.0.0-tests","collectionTimestamp":"2026-06-25T12:00:00Z",
                        "cloudProvider":"Aws","accountId":"123456789012","scope":"account","switchesUsed":[],"collectorVersion":"tests"}
                        """,
                    CloudProvider.Gcp => $$"""
                        {"schemaVersion":{{schemaVersion}},"scriptVersion":"1.0.0-tests","collectionTimestamp":"2026-06-25T12:00:00Z",
                        "cloudProvider":"Gcp","projectId":"sample-project","scope":"project","switchesUsed":[],"collectorVersion":"tests"}
                        """,
                    _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, "Only Aws or Gcp supported."),
                };

                WriteTextEntry(zip, "manifest.json", manifest);
                WriteTextEntry(zip, "resources.json", "[]");
            }
            else
            {
                WriteTextEntry(zip, "readme.txt", "no manifest\n");
            }
        }

        return ms.ToArray();
    }

    private static void WriteTextEntry(ZipArchive zip, string entryName, string content)
    {
        ZipArchiveEntry entry = zip.CreateEntry(entryName);

        using Stream entryStream = entry.Open();

        byte[] bytes = Encoding.UTF8.GetBytes(content);

        entryStream.Write(bytes, 0, bytes.Length);
    }
}

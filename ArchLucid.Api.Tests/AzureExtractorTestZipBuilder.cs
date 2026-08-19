using System.IO.Compression;
using System.Text;

namespace ArchLucid.Api.Tests;

/// <summary>Test ZIP payloads for Azure extractor ingest endpoints.</summary>
internal static class AzureExtractorTestZipBuilder
{
    internal static byte[] BuildValidZip(bool includeManifest, int? schemaVersionOverride = null)
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {

            if (includeManifest)
            {
                int schemaVersion = schemaVersionOverride ?? 1;

                WriteTextEntry(
                    zip,
                    "manifest.json",
                    $$"""

                    {"schemaVersion":{{schemaVersion}},"scriptVersion":"1.0.0-tests","collectionTimestamp":"2026-05-06T12:00:00Z",

                    "subscriptionId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",

                    "scope":"/subscriptions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",

                    "switchesUsed":[],"azModuleVersion":"0.0.0-test"}

                    """);

                WriteTextEntry(zip, "resources.json", "[]");
            }
            else
            {
                WriteTextEntry(zip, "readme.txt", "no manifest\n");
            }
        }

        return ms.ToArray();
    }

    internal static byte[] BuildZipWithMalformedManifest()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteTextEntry(zip, "manifest.json", "{ not-valid-json");
            WriteTextEntry(zip, "resources.json", "[]");
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

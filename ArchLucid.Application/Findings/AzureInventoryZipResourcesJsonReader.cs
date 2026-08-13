using System.IO.Compression;
using System.Text;

namespace ArchLucid.Application.Findings;

/// <summary>Reads <c>resources.json</c> from a scoped Azure extractor ZIP package.</summary>
internal static class AzureInventoryZipResourcesJsonReader
{
    public static string? TryReadResourcesJson(byte[] packageBytes)
    {
        if (packageBytes is null || packageBytes.Length == 0)
            return null;

        try
        {
            using MemoryStream stream = new(packageBytes);
            using ZipArchive archive = new(stream, ZipArchiveMode.Read, leaveOpen: false);
            ZipArchiveEntry? entry = archive.GetEntry("resources.json")
                                   ?? archive.Entries.FirstOrDefault(static e =>
                                       e.Name.Equals("resources.json", StringComparison.OrdinalIgnoreCase));

            if (entry is null)
                return null;

            using StreamReader reader = new(entry.Open(), Encoding.UTF8);

            return reader.ReadToEnd();
        }
        catch (InvalidDataException)
        {
            return null;
        }
    }
}

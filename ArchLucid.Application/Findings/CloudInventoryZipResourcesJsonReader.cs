using System.IO.Compression;
using System.Text;

namespace ArchLucid.Application.Findings;

/// <summary>Reads <c>resources.json</c> from a Tier-1 AWS/GCP inventory ZIP package.</summary>
internal static class CloudInventoryZipResourcesJsonReader
{
    public static string? TryReadResourcesJson(byte[] packageBytes)
    {
        return TryReadEntry(packageBytes, "resources.json");
    }

    public static string? TryReadEntry(byte[] packageBytes, string entryName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(entryName);

        if (packageBytes is null || packageBytes.Length == 0)
        {
            return null;
        }

        try
        {
            using MemoryStream stream = new(packageBytes);
            using ZipArchive archive = new(stream, ZipArchiveMode.Read, leaveOpen: false);
            ZipArchiveEntry? entry = archive.GetEntry(entryName)
                                   ?? archive.Entries.FirstOrDefault(e =>
                                       e.Name.Equals(entryName, StringComparison.OrdinalIgnoreCase));

            if (entry is null)
            {
                return null;
            }

            using StreamReader reader = new(entry.Open(), Encoding.UTF8);

            return reader.ReadToEnd();
        }
        catch (InvalidDataException)
        {
            return null;
        }
    }
}

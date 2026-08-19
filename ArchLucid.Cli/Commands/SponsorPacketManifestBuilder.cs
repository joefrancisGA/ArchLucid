using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ArchLucid.Cli.Commands;

/// <summary>SHA-256 manifest for deterministic sponsor-packet regeneration checks.</summary>
public static class SponsorPacketManifestBuilder
{
    private static readonly JsonSerializerOptions JsonWrite = new() { WriteIndented = true };

    public static string BuildJson(string runId, bool demoDataWarning, string outputDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(outputDirectory);

        string fullDirectory = Path.GetFullPath(outputDirectory);

        if (!Directory.Exists(fullDirectory))
            throw new DirectoryNotFoundException(fullDirectory);

        List<Dictionary<string, object>> files = [];

        foreach (string path in Directory.EnumerateFiles(fullDirectory))
        {
            string fileName = Path.GetFileName(path);

            if (string.Equals(fileName, SponsorPacketArtifactCatalog.PackManifestFileName, StringComparison.OrdinalIgnoreCase))
                continue;

            byte[] content = File.ReadAllBytes(path);
            files.Add(new Dictionary<string, object>(StringComparer.Ordinal)
            {
                ["path"] = fileName,
                ["sha256"] = Sha256Hex(content),
                ["sizeBytes"] = content.Length,
            });
        }

        files.Sort(static (left, right) =>
            string.CompareOrdinal((string)left["path"], (string)right["path"]));

        Dictionary<string, object> root = new(StringComparer.Ordinal)
        {
            ["formatVersion"] = SponsorPacketArtifactCatalog.FormatVersion,
            ["generatedUtc"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            ["runId"] = runId.Trim(),
            ["demoDataWarning"] = demoDataWarning,
            ["files"] = files,
        };

        return JsonSerializer.Serialize(root, JsonWrite);
    }

    private static string Sha256Hex(byte[] content)
    {
        byte[] hash = SHA256.HashData(content);
        StringBuilder builder = new(hash.Length * 2);

        foreach (byte value in hash)
            builder.Append(value.ToString("x2", CultureInfo.InvariantCulture));

        return builder.ToString();
    }
}

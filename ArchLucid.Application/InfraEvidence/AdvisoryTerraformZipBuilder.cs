using System.Globalization;
using System.IO.Compression;
using System.Text;

using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public static class AdvisoryTerraformZipBuilder
{
    public static byte[] BuildZip(AdvisoryTerraformRepresentationResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        using MemoryStream memoryStream = new();
        using (ZipArchive archive = new(memoryStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (KeyValuePair<string, string> file in result.Files)
            {
                WriteTextEntry(archive, file.Key, file.Value);
            }

            WriteTextEntry(archive, "mapping.csv", BuildMappingCsv(result.Mappings));
        }

        return memoryStream.ToArray();
    }

    private static string BuildMappingCsv(IReadOnlyList<AdvisoryTerraformResourceMappingRecord> mappings)
    {
        StringBuilder builder = new();
        builder.AppendLine(
            "CloudResourceId,AzureResourceId,TerraformAddress,CategoryFolder,GenerationMethod,UncertaintyNotes");

        foreach (AdvisoryTerraformResourceMappingRecord mapping in mappings)
        {
            builder.Append(EscapeCsvField(mapping.CloudResourceId?.ToString("D", CultureInfo.InvariantCulture)))
                .Append(',')
                .Append(EscapeCsvField(mapping.AzureResourceId))
                .Append(',')
                .Append(EscapeCsvField(mapping.TerraformAddress))
                .Append(',')
                .Append(EscapeCsvField(mapping.CategoryFolder))
                .Append(',')
                .Append(EscapeCsvField(mapping.GenerationMethod.ToString()))
                .Append(',')
                .Append(EscapeCsvField(mapping.UncertaintyNotes))
                .AppendLine();
        }

        return builder.ToString();
    }

    private static void WriteTextEntry(ZipArchive archive, string entryName, string content)
    {
        string normalizedPath = entryName.Replace('\\', '/');
        ZipArchiveEntry entry = archive.CreateEntry(normalizedPath, CompressionLevel.Fastest);
        using Stream entryStream = entry.Open();
        using StreamWriter writer = new(entryStream, Encoding.UTF8);
        writer.Write(content);
    }

    private static string EscapeCsvField(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        if (value.Contains('"', StringComparison.Ordinal) || value.Contains(',', StringComparison.Ordinal)
            || value.Contains('\n', StringComparison.Ordinal) || value.Contains('\r', StringComparison.Ordinal))
        {
            return "\"" + value.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
        }

        return value;
    }
}

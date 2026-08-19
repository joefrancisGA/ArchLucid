using System.IO.Compression;
using System.Text.Json;

namespace ArchLucid.Core.CloudInventoryExtractor;

/// <summary>
///     Validates customer AWS/GCP inventory ZIP layout (<c>manifest.json</c> schema version 1 and required companion files)
///     without loading uncompressed entry payloads into memory.
/// </summary>
public static class CloudInventoryExtractorPackageZipValidator
{
    public const string ManifestEntryName = "manifest.json";

    public const string ResourcesEntryName = "resources.json";

    public const int SupportedSchemaVersion = 1;

    public static CloudInventoryExtractorZipValidationResult ValidateFile(string zipPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(zipPath);

        string fullPath = Path.GetFullPath(zipPath.Trim());

        if (!File.Exists(fullPath))
        {
            return new CloudInventoryExtractorZipValidationResult
            {
                IsValid = false,
                ErrorDetail = $"ZIP file not found: {fullPath}",
                IsInvalidArchive = false,
                IsSchemaRejection = false,
            };
        }

        using FileStream stream = new(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);

        return Validate(stream);
    }

    public static CloudInventoryExtractorZipValidationResult Validate(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        try
        {
            using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

            int fileEntryCount = archive.Entries.Count(static entry => !entry.FullName.EndsWith('/'));

            ZipArchiveEntry? manifestEntry = FindEntry(archive, ManifestEntryName);

            if (manifestEntry is null)
            {
                return new CloudInventoryExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = "ZIP does not contain manifest.json.",
                    IsSchemaRejection = true,
                    FileEntryCount = fileEntryCount,
                };
            }

            string? schemaError = TryReadManifestSchemaError(manifestEntry);

            if (schemaError is not null)
            {
                return new CloudInventoryExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = schemaError,
                    IsSchemaRejection = true,
                    FileEntryCount = fileEntryCount,
                };
            }

            ZipArchiveEntry? resourcesEntry = FindEntry(archive, ResourcesEntryName);

            if (resourcesEntry is null)
            {
                return new CloudInventoryExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = "ZIP does not contain resources.json (required extractor output).",
                    IsSchemaRejection = false,
                    FileEntryCount = fileEntryCount,
                };
            }

            return new CloudInventoryExtractorZipValidationResult
            {
                IsValid = true,
                FileEntryCount = fileEntryCount,
            };
        }
        catch (InvalidDataException)
        {
            return new CloudInventoryExtractorZipValidationResult
            {
                IsValid = false,
                ErrorDetail = "Uploaded payload is not a valid ZIP archive.",
                IsInvalidArchive = true,
            };
        }
    }

    private static ZipArchiveEntry? FindEntry(ZipArchive archive, string entryName)
    {
        ArgumentNullException.ThrowIfNull(archive);

        return archive.GetEntry(entryName)
               ?? archive.Entries.FirstOrDefault(entry =>
                   entryName.Equals(entry.Name, StringComparison.OrdinalIgnoreCase));
    }

    private static string? TryReadManifestSchemaError(ZipArchiveEntry manifestEntry)
    {
        ArgumentNullException.ThrowIfNull(manifestEntry);

        try
        {
            using Stream manifestStream = manifestEntry.Open();

            using JsonDocument document = JsonDocument.Parse(manifestStream);

            if (!document.RootElement.TryGetProperty("schemaVersion", out JsonElement schemaVersionElement))
                return "Missing or unsupported schemaVersion in manifest.json (required value: 1).";

            if (schemaVersionElement.ValueKind is not JsonValueKind.Number
                || !schemaVersionElement.TryGetInt32(out int schemaVersion))
            {
                return "Missing or unsupported schemaVersion in manifest.json (required value: 1).";
            }

            if (schemaVersion != SupportedSchemaVersion)
            {
                return FormatUnsupportedSchemaVersionError(schemaVersion);
            }

            return null;
        }
        catch (JsonException)
        {
            return "manifest.json is not valid JSON.";
        }
    }

    private static string FormatUnsupportedSchemaVersionError(int schemaVersion)
    {
        if (schemaVersion < SupportedSchemaVersion)
        {
            return
                $"manifest.json schemaVersion {schemaVersion} is below the required V1 GA minimum ({SupportedSchemaVersion}). Re-pack with Get-ArchLucidAwsPackage.ps1 or Get-ArchLucidGcpPackage.ps1.";
        }

        return $"Unsupported manifest schemaVersion: {schemaVersion}. Required schemaVersion: {SupportedSchemaVersion}.";
    }
}

using System.Globalization;
using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Core.Compression;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Validates customer Azure extractor ZIP layout (<c>manifest.json</c> schema version 1 and required companion files)
///     without loading uncompressed entry payloads into memory.
/// </summary>
public static class AzureExtractorPackageZipValidator
{
    public const string ManifestEntryName = "manifest.json";

    public const string ResourcesEntryName = "resources.json";

    public const int SupportedSchemaVersion = 1;

    public static AzureExtractorZipValidationResult ValidateFile(string zipPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(zipPath);

        string fullPath = Path.GetFullPath(zipPath.Trim());

        if (!File.Exists(fullPath))
        {
            return new AzureExtractorZipValidationResult
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

    public static AzureExtractorZipValidationResult Validate(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        try
        {
            using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

            ZipArchiveSafetyResult safety = ZipArchiveSafety.ValidateArchive(archive);

            if (!safety.Allowed)
            {
                return new AzureExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = safety.ErrorDetail ?? "ZIP archive failed safety validation.",
                    IsSchemaRejection = false,
                    IsInvalidArchive = true,
                };
            }

            int fileEntryCount = safety.FileEntryCount;
            ZipArchiveEntry? manifestEntry = FindEntry(archive, ManifestEntryName);

            if (manifestEntry is null)
            {
                return new AzureExtractorZipValidationResult
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
                return new AzureExtractorZipValidationResult
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
                return new AzureExtractorZipValidationResult
                {
                    IsValid = false,
                    ErrorDetail = "ZIP does not contain resources.json (required extractor output).",
                    IsSchemaRejection = false,
                    FileEntryCount = fileEntryCount,
                };
            }

            return new AzureExtractorZipValidationResult
            {
                IsValid = true,
                FileEntryCount = fileEntryCount,
            };
        }
        catch (InvalidDataException)
        {
            return new AzureExtractorZipValidationResult
            {
                IsValid = false,
                ErrorDetail = "Uploaded payload is not a valid ZIP archive.",
                IsInvalidArchive = true,
            };
        }
    }

    public static int CountFileEntries(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

        return archive.Entries.Count(static entry => !entry.FullName.EndsWith('/'));
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

            if (!TryGetPropertyCaseInsensitive(document.RootElement, "schemaVersion", out JsonElement schemaVersionElement))
                return "Missing or unsupported schemaVersion in manifest.json (required value: 1).";

            if (!TryReadSchemaVersion(schemaVersionElement, out int schemaVersion))
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
                $"manifest.json schemaVersion {schemaVersion} is below the required V1 GA minimum ({SupportedSchemaVersion}). Re-pack with Get-ArchLucidAzurePackage.ps1.";
        }

        return $"Unsupported manifest schemaVersion: {schemaVersion}. Required schemaVersion: {SupportedSchemaVersion}.";
    }

    private static bool TryReadSchemaVersion(JsonElement element, out int schemaVersion)
    {
        if (element.ValueKind == JsonValueKind.Number && TryReadWholeNumberSchemaVersion(element, out schemaVersion))
            return true;

        if (element.ValueKind == JsonValueKind.String)
        {
            string? raw = element.GetString();

            if (TryParseBooleanString(raw, out bool booleanSchema))
            {
                schemaVersion = booleanSchema ? 1 : 0;

                return true;
            }

            if (TryParseWholeNumberString(raw, out schemaVersion))
                return true;
        }

        if (element.ValueKind is JsonValueKind.True or JsonValueKind.False)
        {
            schemaVersion = element.ValueKind == JsonValueKind.True ? 1 : 0;

            return true;
        }

        schemaVersion = default;

        return false;
    }

    private static bool TryReadWholeNumberSchemaVersion(JsonElement element, out int schemaVersion)
    {
        if (element.TryGetInt32(out schemaVersion))
        {
            return true;
        }

        if (element.TryGetDouble(out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            schemaVersion = (int)numeric;

            return true;
        }

        schemaVersion = default;

        return false;
    }

    private static bool TryParseWholeNumberString(string? raw, out int value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
        {
            return true;
        }

        if (double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            && double.IsFinite(numeric)
            && numeric >= 0
            && numeric == Math.Floor(numeric))
        {
            value = (int)numeric;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryParseBooleanString(string? raw, out bool value)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            value = default;

            return false;
        }

        string trimmed = raw.Trim();

        if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("1", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("on", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            value = true;

            return true;
        }

        if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("0", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("no", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("off", StringComparison.OrdinalIgnoreCase)
            || trimmed.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            value = false;

            return true;
        }

        value = default;

        return false;
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}

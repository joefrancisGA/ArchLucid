using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.AzureExtractor;

public static partial class AzureExtractorPackageZipValidator
{
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

            if (!AzureExtractorZipSchema.IsSupported(schemaVersion))
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

        return $"Unsupported manifest schemaVersion: {schemaVersion}. Supported schema versions: {AzureExtractorZipSchema.MinimumSupportedVersion}–{AzureExtractorZipSchema.CurrentVersion}.";
    }

    private static bool TryReadSchemaVersion(JsonElement element, out int schemaVersion) =>
        StrictSchemaVersionReader.TryReadSchemaVersion(element, out schemaVersion);

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

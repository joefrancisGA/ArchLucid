using System.IO.Compression;
using System.Globalization;
using System.Text.Json;

namespace ArchLucid.Application.AzureExtractor;

/// <summary>Reads <c>manifest.json</c> from the schema-versioned Azure extractor ZIP.</summary>
public static class AzureExtractorManifestReader
{
    private const string ManifestEntryName = "manifest.json";

    private static readonly JsonSerializerOptions SerializerOptions =
        new() { PropertyNameCaseInsensitive = true };

    /// <returns>Normalized manifest plus raw JSON text, or a failure detail.</returns>
    public static (AzureExtractorNormalizedManifest? Manifest, string? Error) TryReadNormalizedFromZip(Stream zipStream)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        try

        {
            using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

            ZipArchiveEntry? entry = archive.GetEntry(ManifestEntryName)
                                     ?? archive.Entries.FirstOrDefault(static e => ManifestEntryName.Equals(e.Name, StringComparison.OrdinalIgnoreCase));

            if (entry is null)

                return (null, "ZIP does not contain manifest.json.");

            using Stream manifestStream = entry.Open();

            using JsonDocument document = JsonDocument.Parse(manifestStream);

            if (document.RootElement.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)

                return (null, "manifest.json is empty.");

            ManifestDto? dto = document.RootElement.Deserialize<ManifestDto>(SerializerOptions);

            if (dto is null)

                return (null, "manifest.json could not be deserialized.");

            if (dto.SchemaVersion < 1)

                return (null, "manifest.json schemaVersion is missing or invalid.");

            if (!AzureExtractorZipSchema.AllSupportedVersions.Contains(dto.SchemaVersion))

                return (null, $"Unsupported manifest schemaVersion: {dto.SchemaVersion}.");

            if (string.IsNullOrWhiteSpace(dto.SubscriptionId))

                return (null, "manifest subscriptionId is required.");

            if (!TryParseCollectionTimestamp(dto.CollectionTimestamp, out DateTimeOffset collectionTs))

                return (null, "manifest collectionTimestamp must be ISO-8601 UTC or offset datetime.");

            string scriptVersion = string.IsNullOrWhiteSpace(dto.ScriptVersion) ? "unknown" : dto.ScriptVersion.Trim();

            string scope = string.IsNullOrWhiteSpace(dto.Scope)
                ? "subscription"
                : dto.Scope.Trim();

            string azVersion = string.IsNullOrWhiteSpace(dto.AzModuleVersion)
                ? "unknown"
                : dto.AzModuleVersion.Trim();

            string[] switches = dto.SwitchesUsed is { Length: > 0 }
                ? dto.SwitchesUsed.Where(static s => !string.IsNullOrWhiteSpace(s)).Select(static s => s.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase).ToArray()
                : [];

            string rawJson = document.RootElement.GetRawText();

            AzureExtractorNormalizedManifest normalized = new(
                dto.SchemaVersion,
                scriptVersion,
                collectionTs,
                dto.SubscriptionId.Trim(),
                scope,
                switches,
                azVersion,
                rawJson.Trim());

            return (normalized, null);
        }

        catch (InvalidDataException)

        {
            return (null, "Uploaded payload is not a valid ZIP archive.");
        }
    }

    private static bool TryParseCollectionTimestamp(JsonElement collectionTimestamp, out DateTimeOffset result)

    {
        result = default;

        switch (collectionTimestamp.ValueKind)

        {
            case JsonValueKind.String:

                return DateTimeOffset.TryParse(
                    collectionTimestamp.GetString(),
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.RoundtripKind,
                    out result);

            case JsonValueKind.Null:

            case JsonValueKind.Undefined:

                return false;

            default:

                return DateTimeOffset.TryParse(collectionTimestamp.GetRawText().Trim('"'), out result);
        }
    }

    private sealed record ManifestDto

    {
        public int SchemaVersion
        {
            get;
            init;
        }

        public string? ScriptVersion
        {
            get;
            init;
        }

        public JsonElement CollectionTimestamp
        {
            get;
            init;
        }

        public string SubscriptionId
        {
            get;
            init;
        } = string.Empty;

        public string? Scope
        {
            get;
            init;
        }

        public string[]? SwitchesUsed
        {
            get;
            init;
        }

        public string? AzModuleVersion
        {
            get;
            init;
        }
    }
}

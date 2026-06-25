using System.IO.Compression;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.CloudInventoryExtractor;

/// <summary>Reads <c>manifest.json</c> from schema-versioned AWS/GCP inventory ZIP packages.</summary>
public static class CloudInventoryExtractorManifestReader
{
    private const string ManifestEntryName = "manifest.json";

    private static readonly JsonSerializerOptions SerializerOptions =
        new() { PropertyNameCaseInsensitive = true };

    public static (CloudInventoryExtractorNormalizedManifest? Manifest, string? Error) TryReadNormalizedFromZip(
        Stream zipStream,
        CloudProvider expectedProvider)
    {
        ArgumentNullException.ThrowIfNull(zipStream);

        try
        {
            using ZipArchive archive = new(zipStream, ZipArchiveMode.Read, leaveOpen: true);

            ZipArchiveEntry? entry = archive.GetEntry(ManifestEntryName)
                                     ?? archive.Entries.FirstOrDefault(static e =>
                                         ManifestEntryName.Equals(e.Name, StringComparison.OrdinalIgnoreCase));

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

            if (!TryParseCloudProvider(dto.CloudProvider, out CloudProvider manifestProvider))
                return (null, "manifest cloudProvider must be Aws or Gcp.");

            if (manifestProvider != expectedProvider)
            {
                return (null,
                    $"manifest cloudProvider '{dto.CloudProvider}' does not match upload route ({expectedProvider}).");
            }

            string? scopeId = manifestProvider switch
            {
                CloudProvider.Aws when !string.IsNullOrWhiteSpace(dto.AccountId) => dto.AccountId.Trim(),
                CloudProvider.Gcp when !string.IsNullOrWhiteSpace(dto.ProjectId) => dto.ProjectId.Trim(),
                _ => null,
            };

            if (scopeId is null)
            {
                return (null, manifestProvider == CloudProvider.Aws
                    ? "manifest accountId is required for AWS inventory packages."
                    : "manifest projectId is required for GCP inventory packages.");
            }

            if (!TryParseCollectionTimestamp(dto.CollectionTimestamp, out DateTimeOffset collectionTs))
                return (null, "manifest collectionTimestamp must be ISO-8601 UTC or offset datetime.");

            string scriptVersion = string.IsNullOrWhiteSpace(dto.ScriptVersion) ? "unknown" : dto.ScriptVersion.Trim();

            string scope = string.IsNullOrWhiteSpace(dto.Scope)
                ? manifestProvider == CloudProvider.Aws ? "account" : "project"
                : dto.Scope.Trim();

            string collectorVersion = string.IsNullOrWhiteSpace(dto.CollectorVersion)
                ? "unknown"
                : dto.CollectorVersion.Trim();

            string[] switches = dto.SwitchesUsed is { Length: > 0 }
                ? dto.SwitchesUsed.Where(static s => !string.IsNullOrWhiteSpace(s)).Select(static s => s.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase).ToArray()
                : [];

            string rawJson = document.RootElement.GetRawText();

            CloudInventoryExtractorNormalizedManifest normalized = new(
                dto.SchemaVersion,
                scriptVersion,
                collectionTs,
                manifestProvider,
                scopeId,
                scope,
                switches,
                collectorVersion,
                rawJson.Trim());

            return (normalized, null);
        }
        catch (InvalidDataException)
        {
            return (null, "Uploaded payload is not a valid ZIP archive.");
        }
    }

    private static bool TryParseCloudProvider(string? raw, out CloudProvider provider)
    {
        provider = CloudProvider.None;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        if (raw.Equals("Aws", StringComparison.OrdinalIgnoreCase) || raw.Equals("aws", StringComparison.OrdinalIgnoreCase))
        {
            provider = CloudProvider.Aws;
            return true;
        }

        if (raw.Equals("Gcp", StringComparison.OrdinalIgnoreCase) || raw.Equals("gcp", StringComparison.OrdinalIgnoreCase))
        {
            provider = CloudProvider.Gcp;
            return true;
        }

        return false;
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

        public string? CloudProvider
        {
            get;

            init;
        }

        public string? AccountId
        {
            get;

            init;
        }

        public string? ProjectId
        {
            get;

            init;
        }

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

        public string? CollectorVersion
        {
            get;

            init;
        }
    }
}

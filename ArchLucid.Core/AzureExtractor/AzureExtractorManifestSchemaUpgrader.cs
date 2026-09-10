using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Core.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>In-memory upgrade path for legacy extractor manifest schema versions.</summary>
public static class AzureExtractorManifestSchemaUpgrader
{
    public const int CurrentSchemaVersion = AzureExtractorPackageZipValidator.SupportedSchemaVersion;

    /// <summary>
    ///     Upgrades supported legacy manifests to the current schema version without mutating the ZIP on disk.
    /// </summary>
    public static bool TryUpgradeManifestJson(ref string manifestJson, out string? errorDetail)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestJson);
        errorDetail = null;

        try
        {
            JsonNode? root = JsonNode.Parse(manifestJson);

            if (root is not JsonObject manifest)
            {
                errorDetail = "manifest.json root must be an object.";
                return false;
            }

            if (!TryGetPropertyCaseInsensitive(manifest, "schemaVersion", out JsonNode? versionNode))
            {
                errorDetail = "Missing schemaVersion in manifest.json.";
                return false;
            }

            if (!TryReadSchemaVersion(versionNode, out int schemaVersion))
            {
                errorDetail = "Missing or unsupported schemaVersion in manifest.json.";
                return false;
            }

            while (schemaVersion < CurrentSchemaVersion)
            {
                if (schemaVersion == 0)
                {
                    UpgradeFromZero(manifest);
                }
                else if (schemaVersion == 1)
                {
                    UpgradeFromOneToTwo(manifest);
                }
                else
                {
                    errorDetail = $"Unsupported legacy manifest schemaVersion: {schemaVersion}.";
                    return false;
                }

                if (!TryGetPropertyCaseInsensitive(manifest, "schemaVersion", out versionNode)
                    || !TryReadSchemaVersion(versionNode, out schemaVersion))
                {
                    errorDetail = "Upgraded manifest is missing schemaVersion.";
                    return false;
                }
            }

            manifestJson = manifest.ToJsonString();
            return true;
        }
        catch (JsonException)
        {
            errorDetail = "manifest.json is not valid JSON.";
            return false;
        }
    }

    private static void UpgradeFromOneToTwo(JsonObject manifest)
    {
        RemovePropertyCaseInsensitive(manifest, "schemaVersion");
        manifest["schemaVersion"] = 2;

        if (!ContainsPropertyCaseInsensitive(manifest, "completenessScore"))
            manifest["completenessScore"] = 1.0;

        if (!ContainsPropertyCaseInsensitive(manifest, "warnings"))
            manifest["warnings"] = new JsonArray();

        if (!ContainsPropertyCaseInsensitive(manifest, "errors"))
            manifest["errors"] = new JsonArray();

        if (!ContainsPropertyCaseInsensitive(manifest, "resourceCount"))
            manifest["resourceCount"] = 0;

        if (!ContainsPropertyCaseInsensitive(manifest, "captureMethod"))
            manifest["captureMethod"] = "CustomerScript";

        if (!ContainsPropertyCaseInsensitive(manifest, "collectorVersion"))
            manifest["collectorVersion"] = manifest["scriptVersion"]?.GetValue<string>() ?? "unknown";
    }

    private static void UpgradeFromZero(JsonObject manifest)
    {
        RemovePropertyCaseInsensitive(manifest, "schemaVersion");
        manifest["schemaVersion"] = AzureExtractorZipSchema.Version1;

        if (!ContainsPropertyCaseInsensitive(manifest, "scriptVersion"))
            manifest["scriptVersion"] = "legacy-0.x";

        if (!ContainsPropertyCaseInsensitive(manifest, "switchesUsed"))
            manifest["switchesUsed"] = new JsonArray();
    }

    private static bool ContainsPropertyCaseInsensitive(JsonObject manifest, string propertyName)
    {
        return manifest.Any(property =>
            string.Equals(property.Key, propertyName, StringComparison.OrdinalIgnoreCase));
    }

    private static void RemovePropertyCaseInsensitive(JsonObject manifest, string propertyName)
    {
        string[] keys = manifest
            .Where(property => string.Equals(property.Key, propertyName, StringComparison.OrdinalIgnoreCase))
            .Select(property => property.Key)
            .ToArray();

        foreach (string key in keys)
        {
            manifest.Remove(key);
        }
    }

    private static bool TryGetPropertyCaseInsensitive(JsonObject manifest, string propertyName, out JsonNode? value)
    {
        foreach (KeyValuePair<string, JsonNode?> property in manifest)
        {
            if (!string.Equals(property.Key, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = null;

        return false;
    }

    private static bool TryReadSchemaVersion(JsonNode? versionNode, out int schemaVersion) =>
        StrictSchemaVersionReader.TryReadSchemaVersion(versionNode, out schemaVersion);
}

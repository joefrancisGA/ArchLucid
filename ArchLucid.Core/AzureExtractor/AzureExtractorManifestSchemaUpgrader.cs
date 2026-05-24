using System.Text.Json;
using System.Text.Json.Nodes;

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

            if (!manifest.TryGetPropertyValue("schemaVersion", out JsonNode? versionNode))
            {
                errorDetail = "Missing schemaVersion in manifest.json.";
                return false;
            }

            int schemaVersion = versionNode!.GetValue<int>();

            if (schemaVersion == CurrentSchemaVersion)
                return true;

            if (schemaVersion == 0)
            {
                UpgradeFromZero(manifest);
                manifestJson = manifest.ToJsonString();
                return true;
            }

            if (schemaVersion > CurrentSchemaVersion)
            {
                errorDetail = $"Unsupported manifest schemaVersion: {schemaVersion}.";
                return false;
            }

            errorDetail = $"Unsupported legacy manifest schemaVersion: {schemaVersion}.";
            return false;
        }
        catch (JsonException)
        {
            errorDetail = "manifest.json is not valid JSON.";
            return false;
        }
    }

    private static void UpgradeFromZero(JsonObject manifest)
    {
        manifest["schemaVersion"] = CurrentSchemaVersion;

        if (!manifest.ContainsKey("scriptVersion"))
            manifest["scriptVersion"] = "legacy-0.x";

        if (!manifest.ContainsKey("switchesUsed"))
            manifest["switchesUsed"] = new JsonArray();
    }
}

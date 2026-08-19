using System.Text.Json;
using System.Text.Json.Nodes;

using Json.Schema;

namespace ArchLucid.ReviewApiHarness;

/// <summary>
///     Loads the OpenAPI v1 contract snapshot and exposes JSON Schema evaluation plus property/required metadata.
/// </summary>
public sealed class OpenApiContractCatalog
{
    private const string ComponentsSchemasPrefix = "#/components/schemas/";

    private readonly JsonObject _defs;
    private readonly Dictionary<string, JsonSchema> _schemaCache = new(StringComparer.Ordinal);

    private OpenApiContractCatalog(JsonObject defs)
    {
        _defs = defs;
    }

    public static OpenApiContractCatalog Load(string snapshotPath)
    {
        if (string.IsNullOrWhiteSpace(snapshotPath))
            throw new ArgumentException("OpenAPI snapshot path is required.", nameof(snapshotPath));

        if (!File.Exists(snapshotPath))
            throw new FileNotFoundException($"OpenAPI snapshot not found: {snapshotPath}", snapshotPath);

        string raw = File.ReadAllText(snapshotPath);
        JsonNode? root = JsonNode.Parse(raw);

        if (root is not JsonObject rootObj)
            throw new InvalidOperationException("OpenAPI snapshot root must be a JSON object.");

        if (!rootObj.TryGetPropertyValue("components", out JsonNode? componentsNode) ||
            componentsNode is not JsonObject components ||
            !components.TryGetPropertyValue("schemas", out JsonNode? schemasNode) ||
            schemasNode is not JsonObject schemas)
        {
            throw new InvalidOperationException("OpenAPI snapshot is missing components.schemas.");
        }

        // Rewrite OpenAPI $ref paths so JsonSchema.Net can resolve them under $defs.
        JsonObject defs = RewriteRefs(schemas.DeepClone()!.AsObject());

        return new OpenApiContractCatalog(defs);
    }

    public static string ResolveDefaultSnapshotPath()
    {
        string besideExe = Path.Combine(AppContext.BaseDirectory, "Contracts", "openapi-v1.contract.snapshot.json");

        if (File.Exists(besideExe))
            return besideExe;

        string fromRepo = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..",
                "ArchLucid.Api.Tests", "Contracts", "openapi-v1.contract.snapshot.json"));

        if (File.Exists(fromRepo))
            return fromRepo;

        throw new FileNotFoundException(
            "Could not locate openapi-v1.contract.snapshot.json beside the executable or in the repo.");
    }

    public bool TryGetSchemaNode(string schemaName, out JsonObject schemaNode)
    {
        if (_defs.TryGetPropertyValue(schemaName, out JsonNode? node) && node is JsonObject obj)
        {
            schemaNode = obj;
            return true;
        }

        schemaNode = null!;
        return false;
    }

    public JsonSchema GetEvaluatorSchema(string schemaName)
    {
        if (_schemaCache.TryGetValue(schemaName, out JsonSchema? cached))
            return cached;

        if (!_defs.ContainsKey(schemaName))
            throw new InvalidOperationException($"OpenAPI schema '{schemaName}' was not found in the contract snapshot.");

        JsonObject root = new()
        {
            ["$schema"] = "https://json-schema.org/draft/2020-12/schema",
            ["$ref"] = "#/$defs/" + schemaName,
            ["$defs"] = _defs.DeepClone()
        };

        JsonSchema schema = JsonSchema.FromText(root.ToJsonString());
        _schemaCache[schemaName] = schema;
        return schema;
    }

    public IReadOnlyList<string> GetRequiredProperties(string schemaName)
    {
        if (!TryGetSchemaNode(schemaName, out JsonObject schemaNode))
            return [];

        if (!schemaNode.TryGetPropertyValue("required", out JsonNode? requiredNode) ||
            requiredNode is not JsonArray requiredArray)
        {
            return [];
        }

        List<string> names = [];

        foreach (JsonNode? item in requiredArray)
        {
            if (item is JsonValue value && value.TryGetValue(out string? name) && !string.IsNullOrWhiteSpace(name))
                names.Add(name);
        }

        return names;
    }

    public IReadOnlySet<string> GetDeclaredPropertyNames(string schemaName)
    {
        if (!TryGetSchemaNode(schemaName, out JsonObject schemaNode))
            return new HashSet<string>(StringComparer.Ordinal);

        return CollectPropertyNames(schemaNode);
    }

    public JsonObject? ResolvePropertySchema(string schemaName, string propertyName)
    {
        if (!TryGetSchemaNode(schemaName, out JsonObject schemaNode))
            return null;

        if (!schemaNode.TryGetPropertyValue("properties", out JsonNode? propsNode) ||
            propsNode is not JsonObject props ||
            !props.TryGetPropertyValue(propertyName, out JsonNode? propSchema))
        {
            return null;
        }

        return ResolveSchemaObject(propSchema);
    }

    public string? ResolveRefSchemaName(JsonObject schemaNode)
    {
        if (!schemaNode.TryGetPropertyValue("$ref", out JsonNode? refNode) ||
            refNode is not JsonValue refValue ||
            !refValue.TryGetValue(out string? refText) ||
            string.IsNullOrWhiteSpace(refText))
        {
            return null;
        }

        const string defsPrefix = "#/$defs/";

        if (refText.StartsWith(defsPrefix, StringComparison.Ordinal))
            return refText[defsPrefix.Length..];

        if (refText.StartsWith(ComponentsSchemasPrefix, StringComparison.Ordinal))
            return refText[ComponentsSchemasPrefix.Length..];

        return null;
    }

    private JsonObject? ResolveSchemaObject(JsonNode? node)
    {
        if (node is not JsonObject obj)
            return null;

        string? refName = ResolveRefSchemaName(obj);

        if (refName is not null && TryGetSchemaNode(refName, out JsonObject resolved))
            return resolved;

        // anyOf: [ { type: null }, { $ref: ... } ] — pick the first non-null object schema.
        if (obj.TryGetPropertyValue("anyOf", out JsonNode? anyOfNode) && anyOfNode is JsonArray anyOf)
        {
            foreach (JsonNode? option in anyOf)
            {
                if (option is not JsonObject optionObj)
                    continue;

                if (IsNullOnlySchema(optionObj))
                    continue;

                JsonObject? nested = ResolveSchemaObject(optionObj);

                if (nested is not null)
                    return nested;
            }
        }

        return obj;
    }

    private static bool IsNullOnlySchema(JsonObject schema)
    {
        if (!schema.TryGetPropertyValue("type", out JsonNode? typeNode))
            return false;

        if (typeNode is JsonValue typeValue && typeValue.TryGetValue(out string? typeName))
            return string.Equals(typeName, "null", StringComparison.Ordinal);

        return false;
    }

    private HashSet<string> CollectPropertyNames(JsonObject schemaNode)
    {
        HashSet<string> names = new(StringComparer.Ordinal);

        if (schemaNode.TryGetPropertyValue("properties", out JsonNode? propsNode) &&
            propsNode is JsonObject props)
        {
            foreach (KeyValuePair<string, JsonNode?> pair in props)
                names.Add(pair.Key);
        }

        // allOf composition — union declared properties.
        if (schemaNode.TryGetPropertyValue("allOf", out JsonNode? allOfNode) && allOfNode is JsonArray allOf)
        {
            foreach (JsonNode? part in allOf)
            {
                JsonObject? resolved = ResolveSchemaObject(part);

                if (resolved is null)
                    continue;

                foreach (string name in CollectPropertyNames(resolved))
                    names.Add(name);
            }
        }

        return names;
    }

    private static JsonObject RewriteRefs(JsonObject schemas)
    {
        string json = schemas.ToJsonString();
        string rewritten = json.Replace(
            "\"#/components/schemas/",
            "\"#/$defs/",
            StringComparison.Ordinal);

        JsonNode? node = JsonNode.Parse(rewritten);

        if (node is not JsonObject obj)
            throw new InvalidOperationException("Failed to rewrite OpenAPI schema $ref paths.");

        return obj;
    }
}

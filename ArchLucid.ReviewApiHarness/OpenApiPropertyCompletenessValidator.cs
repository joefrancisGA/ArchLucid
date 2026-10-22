using System.Text.Json;
using System.Text.Json.Nodes;

namespace ArchLucid.ReviewApiHarness;

/// <summary>
///     Walks JSON and asserts every object property is declared on the OpenAPI schema and every
///     <c>required</c> property is present (stricter than default JSON Schema additionalProperties).
/// </summary>
public sealed class OpenApiPropertyCompletenessValidator(OpenApiContractCatalog catalog)
{
    private readonly OpenApiContractCatalog _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));

    public ResponseValidationResult Validate(string schemaName, JsonElement payload)
    {
        if (string.IsNullOrWhiteSpace(schemaName))
            throw new ArgumentException("Schema name is required.", nameof(schemaName));

        List<string> errors = [];
        Walk(schemaName, payload, "$", errors);
        return new ResponseValidationResult(Passed: errors.Count == 0, Errors: errors);
    }

    private void Walk(string schemaName, JsonElement element, string path, List<string> errors)
    {
        if (!_catalog.TryGetSchemaNode(schemaName, out _))
        {
            errors.Add($"Unknown OpenAPI schema '{schemaName}' at {path}.");
            return;
        }

        if (element.ValueKind == JsonValueKind.Null)
            return;

        if (element.ValueKind != JsonValueKind.Object)
            return;

        IReadOnlySet<string> declared = _catalog.GetDeclaredPropertyNames(schemaName);
        IReadOnlyList<string> required = _catalog.GetRequiredProperties(schemaName);

        foreach (string requiredName in required)
        {
            if (!element.TryGetProperty(requiredName, out JsonElement requiredValue) ||
                requiredValue.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            {
                errors.Add($"Missing required property '{requiredName}' at {path} (schema {schemaName}).");
            }
        }

        foreach (JsonProperty property in element.EnumerateObject())
        {
            string childPath = path + "." + property.Name;

            if (declared.Count > 0 && !declared.Contains(property.Name))
            {
                errors.Add($"Unexpected property '{property.Name}' at {path} (not declared on schema {schemaName}).");
                continue;
            }

            JsonObject? propertySchema = _catalog.ResolvePropertySchema(schemaName, property.Name);

            if (propertySchema is null)
                continue;

            string? nestedSchemaName = _catalog.ResolveRefSchemaName(propertySchema);

            if (nestedSchemaName is not null)
            {
                if (property.Value.ValueKind == JsonValueKind.Object)
                    Walk(nestedSchemaName, property.Value, childPath, errors);
                else if (property.Value.ValueKind == JsonValueKind.Array)

                    foreach ((JsonElement item, int index) in EnumerateArray(property.Value))
                        Walk(nestedSchemaName, item, $"{childPath}[{index}]", errors);

                continue;
            }

            if (IsArrayOfRef(propertySchema, out string? itemSchemaName) &&
                property.Value.ValueKind == JsonValueKind.Array &&
                !string.IsNullOrWhiteSpace(itemSchemaName))
            {
                foreach ((JsonElement item, int index) in EnumerateArray(property.Value))
                    Walk(itemSchemaName!, item, $"{childPath}[{index}]", errors);
            }
        }
    }

    private bool IsArrayOfRef(JsonObject propertySchema, out string? itemSchemaName)
    {
        itemSchemaName = null;

        if (!propertySchema.TryGetPropertyValue("items", out JsonNode? itemsNode) ||
            itemsNode is not JsonObject itemsObj)
        {
            return false;
        }

        itemSchemaName = _catalog.ResolveRefSchemaName(itemsObj);
        return !string.IsNullOrWhiteSpace(itemSchemaName);
    }

    private static IEnumerable<(JsonElement Element, int Index)> EnumerateArray(JsonElement array)
    {
        int index = 0;

        foreach (JsonElement item in array.EnumerateArray())
        {
            yield return (item, index);
            index++;
        }
    }
}

using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Shared helpers for post-processing OpenAPI component schemas after Microsoft.AspNetCore.OpenApi inference.
/// </summary>
internal static class OpenApiSchemaContractMutator
{
    internal static bool TryGetMutableSchema(OpenApiDocument document, string schemaKey, out OpenApiSchema schema)
    {
        schema = null!;

        if (document.Components?.Schemas is null || !document.Components.Schemas.TryGetValue(schemaKey, out IOpenApiSchema? found) || found is not OpenApiSchema mutable)
            return false;

        schema = mutable;
        return true;
    }

    internal static void AddBooleanIfMissing(IDictionary<string, IOpenApiSchema> properties, string jsonName)
    {
        if (properties.ContainsKey(jsonName))
            return;

        properties[jsonName] = new OpenApiSchema { Type = JsonSchemaType.Boolean };
    }

    internal static void AddStringArrayIfMissing(IDictionary<string, IOpenApiSchema> properties, string jsonName)
    {
        if (properties.ContainsKey(jsonName))
            return;

        properties[jsonName] = new OpenApiSchema
        {
            Type = JsonSchemaType.Array,
            Items = new OpenApiSchema { Type = JsonSchemaType.String }
        };
    }

    internal static void EnsureRequired(OpenApiSchema schema, params string[] propertyNames)
    {
        if (propertyNames.Length == 0)
            return;

        HashSet<string> required = new(StringComparer.Ordinal);

        if (schema.Required is not null)
        {
            foreach (string existing in schema.Required)
                _ = required.Add(existing);
        }

        foreach (string propertyName in propertyNames)
            _ = required.Add(propertyName);

        schema.Required = required;
    }

    internal static void SetDescriptionIfMissing(OpenApiSchema schema, string description)
    {
        if (!string.IsNullOrWhiteSpace(schema.Description))
            return;

        schema.Description = description;
    }
}

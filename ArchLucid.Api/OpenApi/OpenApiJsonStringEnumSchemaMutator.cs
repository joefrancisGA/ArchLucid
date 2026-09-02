using System.Text.Json;
using System.Text.Json.Nodes;

using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Aligns OpenAPI enum schemas with runtime <see cref="JsonStringEnumConverter" /> wire format.
/// </summary>
internal static class OpenApiJsonStringEnumSchemaMutator
{
    internal static void Apply(OpenApiSchema schema, Type clrType)
    {
        if (!clrType.IsEnum || schema is not OpenApiSchema mutable)
            return;

        mutable.Type = JsonSchemaType.String;
        mutable.Format = null;
        mutable.Enum = Enum.GetNames(clrType)
            .Select(static name => (JsonNode)JsonValue.Create(name)!)
            .ToList();
    }

    /// <summary>
    ///     Rewrites an enum parameter schema <c>default</c> to the CLR enum name so it stays valid after
    ///     the schema is converted to a string enum (the framework emits the raw numeric CLR default).
    ///     Handles both direct schemas and <c>$ref</c> parameter schemas (<see cref="OpenApiSchemaReference" />).
    /// </summary>
    internal static void ApplyParameterDefaultRewrite(IOpenApiSchema schema, Type clrType)
    {
        if (!clrType.IsEnum)
            return;

        JsonNode? existingDefault = schema.Default;

        if (existingDefault is not JsonValue defaultValue)
            return;

        string? enumName = defaultValue.GetValueKind() switch
        {
            JsonValueKind.Number when defaultValue.TryGetValue(out int intDefault)
                => Enum.GetName(clrType, intDefault),
            JsonValueKind.Number when defaultValue.TryGetValue(out long longDefault)
                => Enum.GetName(clrType, longDefault),
            JsonValueKind.String when defaultValue.TryGetValue(out string? stringDefault)
                => Enum.TryParse(clrType, stringDefault, ignoreCase: false, out object? parsed)
                    ? Enum.GetName(clrType, parsed!)
                    : null,
            _ => null,
        };

        if (enumName is null)
            return;

        switch (schema)
        {
            case OpenApiSchema concrete:
                concrete.Default = JsonValue.Create(enumName);
                break;
            case OpenApiSchemaReference reference:
                reference.Default = JsonValue.Create(enumName);
                break;
        }
    }
}

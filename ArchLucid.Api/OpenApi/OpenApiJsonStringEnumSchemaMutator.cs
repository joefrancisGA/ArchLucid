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
        Type enumType = Nullable.GetUnderlyingType(clrType) ?? clrType;

        if (!enumType.IsEnum || schema is not OpenApiSchema mutable)
            return;

        mutable.Type = JsonSchemaType.String;
        mutable.Format = null;
        mutable.Enum = Enum.GetNames(enumType)
            .Select(static name => (JsonNode)JsonValue.Create(name)!)
            .ToList();
    }
}

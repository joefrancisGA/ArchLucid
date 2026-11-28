using System.Text.Json.Serialization.Metadata;

using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Rewrites CLR enum schemas from integer to string values to match API JSON serialization.
/// </summary>
public sealed class MicrosoftOpenApiJsonStringEnumSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(
        OpenApiSchema schema,
        OpenApiSchemaTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        Type clrType = context.JsonTypeInfo.Type;
        Type enumType = Nullable.GetUnderlyingType(clrType) ?? clrType;

        if (enumType.IsEnum)
            OpenApiJsonStringEnumSchemaMutator.Apply(schema, enumType);

        return Task.CompletedTask;
    }
}

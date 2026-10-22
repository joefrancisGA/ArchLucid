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

        if (clrType.IsEnum)
            OpenApiJsonStringEnumSchemaMutator.Apply(schema, clrType);

        return Task.CompletedTask;
    }
}

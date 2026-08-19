using System.Text.Json.Serialization.Metadata;

using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Adds <c>required</c> arrays to request-body schemas based on System.Text.Json metadata.
/// </summary>
public sealed class MicrosoftOpenApiRequiredRequestPropertiesSchemaTransformer : IOpenApiSchemaTransformer
{
    public Task TransformAsync(
        OpenApiSchema schema,
        OpenApiSchemaTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (context.JsonTypeInfo.Kind is not JsonTypeInfoKind.Object)
            return Task.CompletedTask;

        OpenApiRequiredRequestPropertiesSchemaMutator.Apply(schema, context.JsonTypeInfo);
        return Task.CompletedTask;
    }
}

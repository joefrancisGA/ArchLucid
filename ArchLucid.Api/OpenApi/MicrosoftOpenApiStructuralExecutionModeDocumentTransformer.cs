using ArchLucid.Contracts.Common;

using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     MapOpenApi emits an empty <c>StructuralExecutionMode</c> component when the enum carries
///     <see cref="System.Text.Json.Serialization.JsonConverterAttribute" />; NSwag then generates a DTO shell instead of an enum.
///     Pin the schema to string enum values matching <see cref="StructuralExecutionModeJsonConverter" /> wire format.
/// </summary>
public sealed class MicrosoftOpenApiStructuralExecutionModeDocumentTransformer : IOpenApiDocumentTransformer
{
    private const string SchemaName = "StructuralExecutionMode";

    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;

        if (document.Components?.Schemas is null)
            return Task.CompletedTask;

        document.Components.Schemas[SchemaName] = BuildStringEnumSchema(typeof(StructuralExecutionMode));

        return Task.CompletedTask;
    }

    private static OpenApiSchema BuildStringEnumSchema(Type enumType)
    {
        OpenApiSchema schema = new() { Type = JsonSchemaType.String };

        OpenApiJsonStringEnumSchemaMutator.Apply(schema, enumType);

        return schema;
    }
}

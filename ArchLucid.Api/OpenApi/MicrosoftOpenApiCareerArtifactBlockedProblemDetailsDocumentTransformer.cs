using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Adds <see cref="CareerArtifactBlockedProblemDetails"/> to the OpenAPI document (FC-08).
/// </summary>
public sealed class MicrosoftOpenApiCareerArtifactBlockedProblemDetailsDocumentTransformer : IOpenApiDocumentTransformer
{
    public const string SchemaName = "CareerArtifactBlockedProblemDetails";

    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;

        document.Components ??= new OpenApiComponents();
        document.Components.Schemas ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);

        if (document.Components.Schemas.ContainsKey(SchemaName))
        {
            return Task.CompletedTask;
        }

        document.Components.Schemas[SchemaName] = CreateSchema();
        return Task.CompletedTask;
    }

    private static OpenApiSchema CreateSchema()
    {
        OpenApiSchema schema = new()
        {
            AllOf =
            [
                new OpenApiSchemaReference("ProblemDetails"),
            ],
            Properties = new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal)
            {
                ["blockReason"] = new OpenApiSchema
                {
                    Type = JsonSchemaType.String,
                    Description = "User-safe ADR 0078 block sentence explaining why the career export cannot render.",
                },
                ["blockReasonCode"] = new OpenApiSchema
                {
                    Type = JsonSchemaType.String,
                    Description =
                        "Machine-readable ADR 0078 block code (for example transparency_trail_incomplete, measurement_floor_incomplete).",
                },
            },
        };

        OpenApiSchemaContractMutator.EnsureRequired(schema, "blockReason");
        OpenApiSchemaContractMutator.SetDescriptionIfMissing(
            schema,
            "RFC 9457 Problem Details for ADR 0078 career artifact export blocks (HTTP 409).");

        return schema;
    }
}

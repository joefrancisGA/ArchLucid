using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Disambiguates colliding <c>QualityDimension</c> CLR enums in <c>/openapi/v1.json</c>.
///     MapOpenApi collapses both enums into one integer schema; governance policy packs emit
///     <see cref="Coverage.QualityDimension" /> strings at runtime.
/// </summary>
public sealed class MicrosoftOpenApiQualityDimensionDocumentTransformer : IOpenApiDocumentTransformer
{
    private const string GovernanceSchemaName = "GovernanceQualityDimension";
    private const string ArchitectureSchemaName = "ArchitectureQualityDimension";

    private static readonly (string SchemaName, string PropertyName, string TargetRef)[] GovernancePropertyRefs =
    [
        ("PolicyPack", "qualityDimension", GovernanceSchemaName),
        ("ResolvedPolicyPack", "qualityDimension", GovernanceSchemaName),
        ("CoverageAssignmentResponse", "qualityDimension", GovernanceSchemaName),
        ("CoveragePreviewAssignmentResponse", "qualityDimension", GovernanceSchemaName),
    ];

    private static readonly (string SchemaName, string PropertyName, string TargetRef)[] ArchitecturePropertyRefs =
    [
        ("SpecialistReviewFinding", "dimension", ArchitectureSchemaName),
        ("SpecialistReviewResult", "dimension", ArchitectureSchemaName),
    ];

    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;

        if (document.Components?.Schemas is null)
            return Task.CompletedTask;

        document.Components.Schemas[GovernanceSchemaName] =
            BuildStringEnumSchema(typeof(ArchLucid.Contracts.Governance.Coverage.QualityDimension));

        document.Components.Schemas[ArchitectureSchemaName] =
            BuildStringEnumSchema(typeof(ArchLucid.Contracts.ArchitectureIntelligence.QualityDimension));

        foreach ((string schemaName, string propertyName, string targetRef) in GovernancePropertyRefs)
            RewriteNullableEnumPropertyRef(document, schemaName, propertyName, targetRef);

        foreach ((string schemaName, string propertyName, string targetRef) in ArchitecturePropertyRefs)
            RewritePropertyRef(document, schemaName, propertyName, targetRef);

        document.Components.Schemas.Remove("QualityDimension");

        return Task.CompletedTask;
    }

    private static OpenApiSchema BuildStringEnumSchema(Type enumType)
    {
        OpenApiSchema schema = new() { Type = JsonSchemaType.String };

        OpenApiJsonStringEnumSchemaMutator.Apply(schema, enumType);

        return schema;
    }

    private static void RewriteNullableEnumPropertyRef(
        OpenApiDocument document,
        string schemaName,
        string propertyName,
        string targetSchemaName)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, schemaName, out OpenApiSchema host))
            return;

        host.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);

        host.Properties[propertyName] = new OpenApiSchema
        {
            AnyOf =
            [
                new OpenApiSchema { Type = JsonSchemaType.Null },
                new OpenApiSchemaReference($"#/components/schemas/{targetSchemaName}"),
            ],
        };
    }

    private static void RewritePropertyRef(
        OpenApiDocument document,
        string schemaName,
        string propertyName,
        string targetSchemaName)
    {
        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, schemaName, out OpenApiSchema host))
            return;

        host.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);

        host.Properties[propertyName] = new OpenApiSchemaReference($"#/components/schemas/{targetSchemaName}");
    }
}

using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Fills <see cref="ArchLucid.Api.Contracts.RunSummaryResponse" /> schema gaps: the default Microsoft OpenAPI inference used by
///     <c>MapOpenApi</c> historically omitted several serializable properties (wire JSON still includes them).
/// </summary>
public sealed class RunSummaryResponseOpenApiContractTransformer : IOpenApiDocumentTransformer
{
    private const string RunSummarySchemaKey = "RunSummaryResponse";

    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;

        if (document.Components?.Schemas is null || !document.Components.Schemas.TryGetValue(RunSummarySchemaKey, out IOpenApiSchema? schema) || schema is not OpenApiSchema mutable)
            return Task.CompletedTask;

        mutable.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);

        AddBooleanIfMissing(mutable.Properties, "isDemoWelcomeRun");
        AddBooleanIfMissing(mutable.Properties, "isPinned");
        AddBooleanIfMissing(mutable.Properties, "runDegradedExecution");
        AddStringArrayIfMissing(mutable.Properties, "degradedExecutionAgents");

        return Task.CompletedTask;
    }

    private static void AddBooleanIfMissing(IDictionary<string, IOpenApiSchema> properties, string jsonName)
    {
        if (properties.ContainsKey(jsonName))
            return;

        properties[jsonName] = new OpenApiSchema { Type = JsonSchemaType.Boolean };
    }

    private static void AddStringArrayIfMissing(IDictionary<string, IOpenApiSchema> properties, string jsonName)
    {
        if (properties.ContainsKey(jsonName))
            return;

        properties[jsonName] = new OpenApiSchema
        {
            Type = JsonSchemaType.Array,
            Items = new OpenApiSchema { Type = JsonSchemaType.String }
        };
    }
}

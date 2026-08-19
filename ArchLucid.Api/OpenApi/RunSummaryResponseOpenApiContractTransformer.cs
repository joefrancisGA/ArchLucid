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

        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(document, RunSummarySchemaKey, out OpenApiSchema mutable))
            return Task.CompletedTask;

        mutable.Properties ??= new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal);

        OpenApiSchemaContractMutator.AddBooleanIfMissing(mutable.Properties, "isDemoWelcomeRun");
        OpenApiSchemaContractMutator.AddBooleanIfMissing(mutable.Properties, "isPinned");
        OpenApiSchemaContractMutator.AddBooleanIfMissing(mutable.Properties, "runDegradedExecution");
        OpenApiSchemaContractMutator.AddStringArrayIfMissing(mutable.Properties, "degradedExecutionAgents");

        return Task.CompletedTask;
    }
}

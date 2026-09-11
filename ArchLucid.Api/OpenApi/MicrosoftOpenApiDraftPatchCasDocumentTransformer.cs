using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>LW-024: PatchDraftRequest OpenAPI descriptions match fail-closed CAS (ADR 0088).</summary>
public sealed class MicrosoftOpenApiDraftPatchCasDocumentTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;

        if (!OpenApiSchemaContractMutator.TryGetMutableSchema(
                document,
                MicrosoftOpenApiDraftPatchCasSchemaMutator.SchemaName,
                out OpenApiSchema schema))
        {
            return Task.CompletedTask;
        }

        MicrosoftOpenApiDraftPatchCasSchemaMutator.Apply(schema);
        return Task.CompletedTask;
    }
}

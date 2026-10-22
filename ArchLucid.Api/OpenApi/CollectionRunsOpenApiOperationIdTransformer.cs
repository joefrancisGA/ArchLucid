using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
/// Gives the colon-style trigger route a valid generated-client operation name.
/// </summary>
public sealed class CollectionRunsOpenApiOperationIdTransformer : IOpenApiDocumentTransformer
{
    private const string TriggerPath = "/v1/collection-runs:trigger";

    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;

        if (document.Paths is not null
            && document.Paths.TryGetValue(TriggerPath, out IOpenApiPathItem? pathItem)
            && pathItem is OpenApiPathItem concretePathItem
            && concretePathItem.Operations is not null
            && concretePathItem.Operations.TryGetValue(HttpMethod.Post, out OpenApiOperation? operation))
        {
            operation.OperationId = "CollectionRunsTrigger";
        }

        return Task.CompletedTask;
    }
}

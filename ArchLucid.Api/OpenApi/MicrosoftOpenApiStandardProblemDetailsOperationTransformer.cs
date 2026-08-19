using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Documents standard <c>application/problem+json</c> error responses on every operation for Schemathesis parity.
/// </summary>
public sealed class MicrosoftOpenApiStandardProblemDetailsOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = context;
        _ = cancellationToken;
        OpenApiStandardProblemDetailsMutator.ApplyToOperation(operation);
        return Task.CompletedTask;
    }
}

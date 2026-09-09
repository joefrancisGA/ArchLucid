using ArchLucid.Api.ProblemDetails;

using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Documents ADR 0078 <c>blockReason</c> / <c>blockReasonCode</c> extensions on career export 409 responses (FC-08).
/// </summary>
public sealed class MicrosoftOpenApiCareerArtifactExportOperationTransformer : IOpenApiOperationTransformer
{
    private static readonly string[] CareerExportRelativePaths =
    [
        "v1/pilots/runs/{runId}/first-value-report",
        "v1/pilots/runs/{runId}/first-value-report.pdf",
    ];

    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        string path = context.Description.RelativePath?.Trim('/') ?? "";

        if (!CareerExportRelativePaths.Contains(path, StringComparer.OrdinalIgnoreCase))
        {
            return Task.CompletedTask;
        }

        EnsureCareerArtifactBlockedProblemResponse(operation);
        return Task.CompletedTask;
    }

    private static void EnsureCareerArtifactBlockedProblemResponse(OpenApiOperation operation)
    {
        operation.Responses ??= new OpenApiResponses();

        if (!operation.Responses.TryGetValue("409", out IOpenApiResponse? existing)
            || existing is not OpenApiResponse mutable)
        {
            return;
        }

        mutable.Content ??= new Dictionary<string, OpenApiMediaType>(StringComparer.Ordinal);
        mutable.Content[ApplicationProblemMapper.ProblemJsonMediaType] = CreateCareerArtifactBlockedMediaType();
    }

    private static OpenApiMediaType CreateCareerArtifactBlockedMediaType()
    {
        return new OpenApiMediaType
        {
            Schema = new OpenApiSchemaReference(MicrosoftOpenApiCareerArtifactBlockedProblemDetailsDocumentTransformer.SchemaName),
        };
    }
}

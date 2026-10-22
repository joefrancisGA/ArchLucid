using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Forces <c>requestBody.required=true</c> and a direct schema <c>$ref</c> (no <c>null</c> anyOf) for POST
///     endpoints whose controllers accept nullable body parameters for explicit 400 handling but reject omitted bodies at runtime.
/// </summary>
public sealed class MicrosoftOpenApiRequiredJsonRequestBodyOperationTransformer : IOpenApiOperationTransformer
{
    private static readonly (string RelativePath, string SchemaRef)[] RequiredJsonBodies =
    [
        ("v1/governance/coverage/preview", "CoveragePreviewRequest"),
    ];

    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (context.Description.HttpMethod is null || !HttpMethods.IsPost(context.Description.HttpMethod))
            return Task.CompletedTask;

        string path = context.Description.RelativePath?.Trim('/') ?? string.Empty;

        foreach ((string relativePath, string schemaRef) in RequiredJsonBodies)
        {
            if (!string.Equals(path, relativePath, StringComparison.OrdinalIgnoreCase))
                continue;

            EnsureRequiredJsonRequestBody(operation, schemaRef);
            break;
        }

        return Task.CompletedTask;
    }

    private static void EnsureRequiredJsonRequestBody(OpenApiOperation operation, string schemaName)
    {
        if (operation.RequestBody is not OpenApiRequestBody body)
        {
            operation.RequestBody = new OpenApiRequestBody { Required = true };
            body = (OpenApiRequestBody)operation.RequestBody;
        }

        body.Required = true;
        body.Content ??= new Dictionary<string, OpenApiMediaType>(StringComparer.Ordinal);

        OpenApiSchemaReference schema = new(schemaName);

        foreach (string mediaType in new[] { "application/json", "text/json", "application/*+json" })
        {
            body.Content[mediaType] = new OpenApiMediaType { Schema = schema };
        }
    }
}

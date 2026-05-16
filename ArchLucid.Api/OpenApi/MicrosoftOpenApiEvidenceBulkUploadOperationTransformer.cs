using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Ensures <c>POST /v1/architecture/run/{runId}/evidence/bulk</c> documents a
///     <c>multipart/form-data</c> body (<c>files</c> → <c>IFormFileCollection</c>). Microsoft OpenAPI generation can omit this
///     shape for <c>IFormFileCollection</c> even though the action uses <c>[Consumes("multipart/form-data")]</c>.
/// </summary>
public sealed class MicrosoftOpenApiEvidenceBulkUploadOperationTransformer : IOpenApiOperationTransformer
{
    private const string EvidenceBulkRelativePath = "v1/architecture/run/{runId}/evidence/bulk";

    private const string MultipartFormData = "multipart/form-data";

    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!HttpMethods.IsPost(context.Description.HttpMethod))
            return Task.CompletedTask;

        string path = context.Description.RelativePath?.Trim('/') ?? "";

        if (!string.Equals(path, EvidenceBulkRelativePath, StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        EnsureMultipartEvidenceBulkRequestBody(operation);
        return Task.CompletedTask;
    }

    private static void EnsureMultipartEvidenceBulkRequestBody(OpenApiOperation operation)
    {
        if (operation.RequestBody is not OpenApiRequestBody body)
        {
            operation.RequestBody = new OpenApiRequestBody { Required = true };
            body = (OpenApiRequestBody)operation.RequestBody;
        }

        body.Required = true;
        body.Content ??= new Dictionary<string, OpenApiMediaType>(StringComparer.Ordinal);

        if (body.Content.TryGetValue(MultipartFormData, out OpenApiMediaType? existing) && existing?.Schema is not null)
            return;

        OpenApiSchema formSchema = new()
        {
            Type = JsonSchemaType.Object,
            Properties = new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal)
            {
                ["files"] = new OpenApiSchemaReference("IFormFileCollection")
            }
        };

        body.Content[MultipartFormData] = new OpenApiMediaType { Schema = formSchema };
    }
}

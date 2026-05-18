using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Ensures <c>POST /v1/architecture/run/{runId}/evidence/bulk</c> documents
///     <c>multipart/form-data</c> and <c>application/x-www-form-urlencoded</c> bodies with an inline
///     <c>files</c> schema (array of binary). Framework generation can omit or emit a dangling
///     <c>#/components/schemas/IFormFileCollection</c> ref; inlined shapes match <c>OpenApiContractBackwardCompatibilityChecker</c>
///     resolution of the committed snapshot.
/// </summary>
public sealed class MicrosoftOpenApiEvidenceBulkUploadOperationTransformer : IOpenApiOperationTransformer
{
    private const string EvidenceBulkRelativePath = "v1/architecture/run/{runId}/evidence/bulk";

    private const string MultipartFormData = "multipart/form-data";

    private const string UrlEncodedForm = "application/x-www-form-urlencoded";

    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (context.Description.HttpMethod is null || !HttpMethods.IsPost(context.Description.HttpMethod))
            return Task.CompletedTask;

        string path = context.Description.RelativePath?.Trim('/') ?? "";

        if (!string.Equals(path, EvidenceBulkRelativePath, StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        EnsureEvidenceBulkRequestBody(operation);
        return Task.CompletedTask;
    }

    private static void EnsureEvidenceBulkRequestBody(OpenApiOperation operation)
    {
        if (operation.RequestBody is not OpenApiRequestBody body)
        {
            operation.RequestBody = new OpenApiRequestBody { Required = true };
            body = (OpenApiRequestBody)operation.RequestBody;
        }

        body.Required = true;
        body.Content ??= new Dictionary<string, OpenApiMediaType>(StringComparer.Ordinal);

        body.Content[MultipartFormData] = new OpenApiMediaType { Schema = CreateEvidenceBulkRequestBodySchema() };
        body.Content[UrlEncodedForm] = new OpenApiMediaType { Schema = CreateEvidenceBulkRequestBodySchema() };
    }

    private static OpenApiSchema CreateEvidenceBulkRequestBodySchema()
    {
        return new OpenApiSchema
        {
            Type = JsonSchemaType.Object,
            Properties = new Dictionary<string, IOpenApiSchema>(StringComparer.Ordinal)
            {
                ["files"] = CreateEvidenceBulkFilesPropertySchema()
            }
        };
    }

    /// <summary>
    ///     Matches resolved <c>IFormFileCollection</c> in the OpenAPI snapshot: array items are binary strings (<c>IFormFile</c>).
    /// </summary>
    private static OpenApiSchema CreateEvidenceBulkFilesPropertySchema()
    {
        return new OpenApiSchema
        {
            Type = JsonSchemaType.Array,
            Items = new OpenApiSchema
            {
                Type = JsonSchemaType.String,
                Format = "binary"
            }
        };
    }
}

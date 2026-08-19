using ArchLucid.Api.Swagger;

using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Tags each OpenAPI operation with <c>x-archlucid-audience</c> for buyer/operator/internal/forensics partitioning (TB-286).
/// </summary>
public sealed class MicrosoftOpenApiAudienceOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        bool allowsAnonymous = false;

        if (context.Description.ActionDescriptor is ControllerActionDescriptor cad)
            allowsAnonymous = OpenApiAuthAnonymousDetection.AllowsAnonymous(cad);

        string audience = OpenApiAudiencePathClassifier.Classify(context.Description.RelativePath, allowsAnonymous);
        OpenApiAudienceExtensionMutator.SetAudience(operation, audience);

        return Task.CompletedTask;
    }
}

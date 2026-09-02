using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Rewrites numeric CLR defaults on enum parameter schemas (including <c>$ref</c> parameter schemas)
///     to enum names so they stay valid after <see cref="MicrosoftOpenApiJsonStringEnumSchemaTransformer" />
///     converts enum schemas to string values.
/// </summary>
public sealed class MicrosoftOpenApiEnumParameterDefaultOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (operation.Parameters is null)
            return Task.CompletedTask;

        foreach (IOpenApiParameter parameter in operation.Parameters)
        {
            if (parameter is not OpenApiParameter mutable || mutable.Schema is null)
                continue;

            ApiParameterDescription? description = context.Description.ParameterDescriptions
                .FirstOrDefault(candidate =>
                    string.Equals(candidate.Name, mutable.Name, StringComparison.Ordinal));

            if (description?.Type is not { } descriptionType)
                continue;

            OpenApiJsonStringEnumSchemaMutator.ApplyParameterDefaultRewrite(mutable.Schema, descriptionType);
        }

        return Task.CompletedTask;
    }
}

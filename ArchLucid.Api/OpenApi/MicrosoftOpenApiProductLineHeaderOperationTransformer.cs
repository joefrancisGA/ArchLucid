using System.Text.Json.Nodes;

using ArchLucid.Core.ProductLine;

using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Documents optional <see cref="ProductLineHttpHeaderNames.Header" /> on API operations (OP-03).
///     Health and OpenAPI discovery paths are excluded.
/// </summary>
public sealed class MicrosoftOpenApiProductLineHeaderOperationTransformer : IOpenApiOperationTransformer
{
    public Task TransformAsync(
        OpenApiOperation operation,
        OpenApiOperationTransformerContext context,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        string path = context.Description.RelativePath?.Trim('/') ?? string.Empty;

        if (IsExcludedPath(path))
        {
            return Task.CompletedTask;
        }

        operation.Parameters ??= [];

        if (operation.Parameters.Any(parameter =>
                string.Equals(parameter.Name, ProductLineHttpHeaderNames.Header, StringComparison.OrdinalIgnoreCase)))
        {
            return Task.CompletedTask;
        }

        operation.Parameters.Add(new OpenApiParameter
        {
            Name = ProductLineHttpHeaderNames.Header,
            In = ParameterLocation.Header,
            Required = false,
            Description =
                "Optional product shell hint: architecture or security. Omitted inherits ProductLine:Deployment. "
                + "Cannot escalate past deployment; invalid values are ignored.",
            Schema = new OpenApiSchema
            {
                Type = JsonSchemaType.String,
                Enum =
                [
                    JsonValue.Create("architecture"),
                    JsonValue.Create("security"),
                ],
            },
        });

        return Task.CompletedTask;
    }

    private static bool IsExcludedPath(string path)
    {
        if (path.Length == 0)
        {
            return true;
        }

        return path.StartsWith("health", StringComparison.OrdinalIgnoreCase)
               || path.StartsWith("openapi", StringComparison.OrdinalIgnoreCase);
    }
}

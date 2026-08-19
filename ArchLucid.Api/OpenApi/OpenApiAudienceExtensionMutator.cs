using System.Text.Json.Nodes;

using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

internal static class OpenApiAudienceExtensionMutator
{
    internal static void SetAudience(IOpenApiExtensible extensible, string audience)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(audience);

        extensible.Extensions ??= new Dictionary<string, IOpenApiExtension>(StringComparer.Ordinal);
        extensible.Extensions[OpenApiAudience.ExtensionName] = new JsonNodeExtension(JsonValue.Create(audience));
    }
}

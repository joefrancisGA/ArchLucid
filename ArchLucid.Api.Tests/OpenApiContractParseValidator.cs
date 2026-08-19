using System.Text.Json.Nodes;

using Microsoft.OpenApi;
using Microsoft.OpenApi.Reader;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Validates that canonical OpenAPI JSON parses with the bundled Microsoft.OpenAPI reader.
/// </summary>
internal static class OpenApiContractParseValidator
{
    /// <exception cref="InvalidOperationException">Document does not parse as OpenAPI (reader errors).</exception>
    internal static void ThrowIfUnreadable(JsonNode canonicalRoot, string label)
    {
        ArgumentNullException.ThrowIfNull(canonicalRoot);

        OpenApiReaderSettings settings = new();
        settings.AddJsonReader();

        string jsonText = canonicalRoot.ToJsonString();

        try
        {
            _ = OpenApiModelFactory.Parse(jsonText, OpenApiConstants.Json, settings);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"OpenAPI parse failed for {label}: {ex.Message}", ex);
        }
    }
}

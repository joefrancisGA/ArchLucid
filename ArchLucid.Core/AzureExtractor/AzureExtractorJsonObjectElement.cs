using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Hosted inventory sometimes double-encodes JSON objects as string scalars inside arrays
///     (per-element <c>ConvertTo-Json</c> projections), matching route-table row shapes.
/// </summary>
public static class AzureExtractorJsonObjectElement
{
    public static bool TryUnwrapObject(JsonElement element, out JsonElement objectElement)
    {
        if (element.ValueKind is JsonValueKind.Object)
        {
            objectElement = element;

            return true;
        }

        if (element.ValueKind is not JsonValueKind.String)
        {
            objectElement = default;

            return false;
        }

        string? nestedJson = element.GetString();

        if (string.IsNullOrWhiteSpace(nestedJson))
        {
            objectElement = default;

            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(nestedJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Object)
            {
                objectElement = default;

                return false;
            }

            objectElement = document.RootElement.Clone();

            return true;
        }
        catch (JsonException)
        {
            objectElement = default;

            return false;
        }
    }

    /// <summary>
    ///     Accepts object rows, string-scalar ARM ids, or string-scalar wrapped JSON objects (including nested load-balancer address rows).
    /// </summary>
    public static bool TryResolveCollectionElement(
        JsonElement configuration,
        bool nestedAddress,
        out JsonElement configurationElement)
    {
        if (TryUnwrapObject(configuration, out configurationElement))
        {
            return true;
        }

        if (configuration.ValueKind is JsonValueKind.String)
        {
            configurationElement = configuration;

            return true;
        }

        if (configuration.ValueKind is JsonValueKind.Object)
        {
            configurationElement = configuration;

            return true;
        }

        configurationElement = default;

        return false;
    }
}

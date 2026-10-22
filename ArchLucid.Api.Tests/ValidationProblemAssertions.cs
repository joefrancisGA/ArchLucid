using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Shared assertions for RFC 9457 validation problem responses from the API test host.
/// </summary>
internal static class ValidationProblemAssertions
{
    internal static bool ContainsDocumentContentTypeFieldError(JsonElement root)
    {
        if (TryGetValidationErrorsObject(root, out JsonElement errors))
            return ErrorsObjectContainsDocumentContentTypeKey(errors);

        if (root.TryGetProperty("detail", out JsonElement detail)
            && detail.ValueKind == JsonValueKind.String
            && detail.GetString() is string detailText
            && detailText.Contains("contentType", StringComparison.OrdinalIgnoreCase)
            && detailText.Contains("document", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static bool TryGetValidationErrorsObject(JsonElement root, out JsonElement errors)
    {
        foreach (JsonProperty property in root.EnumerateObject())
        {
            if (!property.Name.Equals("errors", StringComparison.OrdinalIgnoreCase))
                continue;

            errors = property.Value;
            return errors.ValueKind == JsonValueKind.Object;
        }

        errors = default;
        return false;
    }

    private static bool ErrorsObjectContainsDocumentContentTypeKey(JsonElement errors)
    {
        foreach (JsonProperty property in errors.EnumerateObject())
        {
            if (!property.Name.Contains("contentType", StringComparison.OrdinalIgnoreCase)
                || !property.Name.Contains("document", StringComparison.OrdinalIgnoreCase))
                continue;

            return true;
        }

        return false;
    }
}

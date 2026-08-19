using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization.Metadata;

using Microsoft.OpenApi;

namespace ArchLucid.Api.OpenApi;

/// <summary>
///     Marks non-optional request properties as required in OpenAPI so fuzzers do not treat empty bodies as valid.
/// </summary>
internal static class OpenApiRequiredRequestPropertiesSchemaMutator
{
    internal static void Apply(OpenApiSchema schema, JsonTypeInfo jsonTypeInfo)
    {
        if (schema is not OpenApiSchema mutable || jsonTypeInfo.Kind is not JsonTypeInfoKind.Object)
            return;

        HashSet<string> required = new(StringComparer.Ordinal);

        if (mutable.Required is not null)
        {
            foreach (string existing in mutable.Required)
                _ = required.Add(existing);
        }

        foreach (JsonPropertyInfo property in jsonTypeInfo.Properties)
        {
            if (!ShouldBeRequired(property))
                continue;

            _ = required.Add(property.Name);
        }

        if (required.Count == 0)
            return;

        mutable.Required = required;
    }

    private static bool ShouldBeRequired(JsonPropertyInfo property)
    {
        if (property.IsRequired)
            return true;

        if (property.AttributeProvider?.IsDefined(typeof(RequiredAttribute), inherit: true) == true)
            return true;

        return false;
    }
}

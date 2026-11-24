using System.Text.Json;

namespace ArchLucid.Core.Json;

/// <summary>Case-insensitive optional property lookup that treats non-object JSON as absent.</summary>
internal static class JsonObjectPropertyLookup
{
    internal static bool TryGetIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.ValueKind is JsonValueKind.Object)
        {
            foreach (JsonProperty property in element.EnumerateObject())
            {
                if (property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }
        }

        value = default;
        return false;
    }
}

using System.Text.Json;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Ordinal-ignore-case JSON property reads for untrusted agent-output payloads at the evaluation boundary.
/// </summary>
internal static class AgentOutputJsonPropertyReader
{
    internal static bool TryGetPropertyIgnoreCase(
        JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            value = default;
            return false;
        }

        if (element.TryGetProperty(propertyName, out value))
            return true;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }
}

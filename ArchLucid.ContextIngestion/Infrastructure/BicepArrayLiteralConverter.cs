using System.Text.Json;
using System.Text.RegularExpressions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Converts lightweight Bicep/HCL array literals into canonical JSON for <c>tf.*</c> property bags.
/// </summary>
internal static class BicepArrayLiteralConverter
{
    private static readonly Regex ScalarAssignmentRegex = new(
        """
        ^\s*(?<key>[A-Za-z0-9_-]+)\s*(?::|=)\s*(?<value>.+?)\s*$
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    internal static bool TryParseToJsonElement(string arrayBody, out JsonElement element)
    {
        element = default;

        if (string.IsNullOrWhiteSpace(arrayBody))
            return false;

        string trimmed = arrayBody.Trim();

        if (trimmed.Length < 2 || trimmed[0] != '[' || trimmed[^1] != ']')
            return false;

        List<Dictionary<string, string>> objects = [];
        int searchIndex = 1;

        while (searchIndex < trimmed.Length - 1)
        {
            int openBraceIndex = trimmed.IndexOf('{', searchIndex);

            if (openBraceIndex < 0)
                break;

            string objectBody = InfrastructureDeclarationBraceBodyExtractor.ExtractBalancedBraceBody(trimmed, openBraceIndex);

            if (string.IsNullOrWhiteSpace(objectBody))
                break;

            Dictionary<string, string> objectProperties = ParseObjectScalars(objectBody);

            if (objectProperties.Count > 0)
                objects.Add(objectProperties);

            searchIndex = openBraceIndex + objectBody.Length;
        }

        if (objects.Count == 0)
            return false;

        string json = JsonSerializer.Serialize(objects);
        using JsonDocument document = JsonDocument.Parse(json);
        element = document.RootElement.Clone();

        return true;
    }

    internal static void TryAddParsedArrayProperty(
        Dictionary<string, string> properties,
        string rawKey,
        JsonElement arrayElement)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (!CanonicalInfrastructurePropertyBag.TryAddTfJsonProperty(properties, rawKey, arrayElement))
            return;

        if (!CanonicalInfrastructurePropertyBag.IsSecurityPriorityProperty(rawKey))
            return;

        string sanitizedKey = CanonicalInfrastructurePropertyBag.SanitizePropertyKey(rawKey).ToLowerInvariant();
        string tfKey = $"tf.{sanitizedKey}";

        if (!properties.TryGetValue(tfKey, out string? serialized) || string.IsNullOrWhiteSpace(serialized))
            return;

        properties[rawKey] = serialized;
    }

    private static Dictionary<string, string> ParseObjectScalars(string objectBody)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);
        string innerBody = objectBody.Trim();

        if (innerBody.Length >= 2 && innerBody[0] == '{' && innerBody[^1] == '}')
            innerBody = innerBody[1..^1];

        foreach (string rawLine in innerBody.Split('\n'))
        {
            string line = rawLine.Trim();

            if (line.Length == 0 || line.StartsWith("//", StringComparison.Ordinal))
                continue;

            Match scalarMatch = ScalarAssignmentRegex.Match(line);

            if (!scalarMatch.Success)
                continue;

            string key = scalarMatch.Groups["key"].Value;
            string rawValue = scalarMatch.Groups["value"].Value.Trim();
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingHclComment(rawValue);
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingSlashSlashComment(rawValue);
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingBlockComment(rawValue);
            string scalarValue = UnquoteScalar(rawValue);

            if (string.IsNullOrWhiteSpace(scalarValue))
                continue;

            properties[key] = CanonicalInfrastructurePropertyBag.CanonicalizeScalarValue(scalarValue);
        }

        return properties;
    }

    private static string UnquoteScalar(string rawValue)
    {
        if (rawValue.Length >= 2 && rawValue[0] == '\'' && rawValue[^1] == '\'')
            return rawValue[1..^1];

        if (rawValue.Length >= 2 && rawValue[0] == '"' && rawValue[^1] == '"')
            return rawValue[1..^1];

        return rawValue;
    }
}

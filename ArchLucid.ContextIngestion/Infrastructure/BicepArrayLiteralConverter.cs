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
            objects.Add(objectProperties);

            searchIndex = openBraceIndex + objectBody.Length;
        }

        if (objects.Count > 0)
        {
            string objectJson = JsonSerializer.Serialize(objects);
            using JsonDocument objectDocument = JsonDocument.Parse(objectJson);
            element = objectDocument.RootElement.Clone();

            return true;
        }

        List<string>? primitiveValues = TryParsePrimitiveStrings(trimmed);

        if (primitiveValues is null)
            return false;

        string primitiveJson = JsonSerializer.Serialize(primitiveValues);
        using JsonDocument primitiveDocument = JsonDocument.Parse(primitiveJson);
        element = primitiveDocument.RootElement.Clone();

        return true;
    }

    internal static void TryAddParsedArrayProperty(
        Dictionary<string, string> properties,
        string rawKey,
        JsonElement arrayElement)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (CanonicalInfrastructurePropertyBag.IsSecurityPriorityProperty(rawKey)
            && !IsObjectArray(arrayElement))
        {
            return;
        }

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

    private static bool IsObjectArray(JsonElement arrayElement)
    {
        if (arrayElement.ValueKind != JsonValueKind.Array || arrayElement.GetArrayLength() == 0)
            return false;

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)
                return false;
        }

        return true;
    }

    private static List<string>? TryParsePrimitiveStrings(string arrayBody)
    {
        string trimmed = arrayBody.Trim();

        if (trimmed.Length < 2 || trimmed[0] != '[' || trimmed[^1] != ']')
            return null;

        string inner = trimmed[1..^1].Trim();

        if (inner.Length == 0)
            return [];

        if (inner.Contains('{', StringComparison.Ordinal))
            return null;

        List<string> values = [];

        foreach (string segment in EnumerateCommaSeparatedAssignmentSegments(inner))
        {
            string rawValue = segment.Trim();
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingHclComment(rawValue);
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingSlashSlashComment(rawValue);
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingBlockComment(rawValue);
            string scalarValue = CanonicalInfrastructurePropertyBag.UnquoteInfrastructureScalar(rawValue);

            if (string.IsNullOrWhiteSpace(scalarValue))
                continue;

            if (scalarValue.Contains('=', StringComparison.Ordinal))
                return null;

            values.Add(CanonicalInfrastructurePropertyBag.CanonicalizeScalarValue(scalarValue));
        }

        return values;
    }

    private static Dictionary<string, string> ParseObjectScalars(string objectBody)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);
        string innerBody = objectBody.Trim();

        if (innerBody.Length >= 2 && innerBody[0] == '{' && innerBody[^1] == '}')
            innerBody = innerBody[1..^1];

        bool inBlockComment = false;

        foreach (string rawLine in innerBody.Split('\n'))
        {
            string line = rawLine.Trim();

            if (InfrastructureDeclarationLineCommentScanner.TryConsumeBlockComment(ref line, ref inBlockComment))
                continue;

            if (line.Length == 0 || line.StartsWith("//", StringComparison.Ordinal) || line.StartsWith('#'))
                continue;

            foreach (string segment in EnumerateCommaSeparatedAssignmentSegments(line))
            {
                Match scalarMatch = ScalarAssignmentRegex.Match(segment);

                if (!scalarMatch.Success)
                    continue;

                string key = scalarMatch.Groups["key"].Value;
                string rawValue = scalarMatch.Groups["value"].Value.Trim();
                rawValue = CanonicalInfrastructurePropertyBag.StripTrailingHclComment(rawValue);
                rawValue = CanonicalInfrastructurePropertyBag.StripTrailingSlashSlashComment(rawValue);
                rawValue = CanonicalInfrastructurePropertyBag.StripTrailingBlockComment(rawValue);
                string scalarValue = CanonicalInfrastructurePropertyBag.UnquoteInfrastructureScalar(rawValue);

                if (string.IsNullOrWhiteSpace(scalarValue))
                    continue;

                properties[key] = CanonicalInfrastructurePropertyBag.CanonicalizeScalarValue(scalarValue);
            }
        }

        return properties;
    }

    private static IEnumerable<string> EnumerateCommaSeparatedAssignmentSegments(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
            yield break;

        int segmentStart = 0;
        bool inDoubleQuotes = false;
        bool inSingleQuotes = false;

        for (int index = 0; index < line.Length; index++)
        {
            char character = line[index];

            if (inDoubleQuotes && character == '\\' && index + 1 < line.Length)
            {
                index++;
                continue;
            }

            if (character == '"' && !inSingleQuotes)
                inDoubleQuotes = !inDoubleQuotes;

            if (character == '\'' && !inDoubleQuotes)
                inSingleQuotes = !inSingleQuotes;

            if (character != ',' || inDoubleQuotes || inSingleQuotes)
                continue;

            string segment = line[segmentStart..index].Trim();

            if (segment.Length > 0)
                yield return segment;

            segmentStart = index + 1;
        }

        string trailingSegment = line[segmentStart..].Trim();

        if (trailingSegment.Length > 0)
            yield return trailingSegment;
    }
}

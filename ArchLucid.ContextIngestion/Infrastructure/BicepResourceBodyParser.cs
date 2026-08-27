using System.Text.RegularExpressions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Line-based scanner for Bicep resource bodies (not a Bicep compiler).
/// </summary>
internal static class BicepResourceBodyParser
{
    private static readonly Regex NestedBlockStartRegex = new(
        """
        ^\s*(?<block>[A-Za-z0-9_-]+)\s*:\s*\{
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ScalarAssignmentRegex = new(
        """
        ^\s*(?<key>[A-Za-z0-9_-]+)\s*:\s*(?<value>.+?)\s*$
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    internal static void ParseBodyIntoProperties(string braceBody, Dictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (string.IsNullOrWhiteSpace(braceBody))
            return;

        string innerBody = braceBody.Trim();

        if (innerBody.StartsWith("{", StringComparison.Ordinal) && innerBody.EndsWith("}", StringComparison.Ordinal))
            innerBody = innerBody[1..^1];

        string[] lines = innerBody.Split('\n');
        int lineIndex = 0;

        while (lineIndex < lines.Length)
        {
            string line = lines[lineIndex].Trim();

            if (line.Length == 0 || line.StartsWith("//", StringComparison.Ordinal))
            {
                lineIndex++;
                continue;
            }

            Match nestedBlockMatch = NestedBlockStartRegex.Match(line);

            if (nestedBlockMatch.Success)
            {
                string blockName = nestedBlockMatch.Groups["block"].Value;
                string fromHere = string.Join('\n', lines[lineIndex..]);
                int braceIndex = fromHere.IndexOf('{', StringComparison.Ordinal);
                string blockBody = InfrastructureDeclarationBraceBodyExtractor.ExtractBalancedBraceBody(fromHere, braceIndex);

                if (!string.IsNullOrWhiteSpace(blockBody))
                {
                    if (IsFlattenableBlockName(blockName))
                        ParseBodyIntoProperties(blockBody, properties);
                    else
                        CanonicalInfrastructurePropertyBag.TryAddTfBlockProperty(properties, blockName, blockBody);

                    int consumedLines = CountConsumedLines(fromHere, blockBody);
                    lineIndex += consumedLines;
                    continue;
                }
            }

            Match scalarMatch = ScalarAssignmentRegex.Match(line);

            if (!scalarMatch.Success)
            {
                lineIndex++;
                continue;
            }

            string key = scalarMatch.Groups["key"].Value;
            string rawValue = scalarMatch.Groups["value"].Value.Trim();

            if (rawValue.Contains("${", StringComparison.Ordinal))
            {
                lineIndex++;
                continue;
            }

            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingSlashSlashComment(rawValue);
            string scalarValue = UnquoteScalar(rawValue);

            InfrastructureDeclarationSecurityPropertyWriter.TryAddTfPropertyWithArmAlias(properties, key, scalarValue);
            lineIndex++;
        }
    }

    private static bool IsFlattenableBlockName(string blockName) =>
        string.Equals(blockName, "properties", StringComparison.OrdinalIgnoreCase)
        || string.Equals(blockName, "siteConfig", StringComparison.OrdinalIgnoreCase)
        || string.Equals(blockName, "site_config", StringComparison.OrdinalIgnoreCase);

    private static int CountConsumedLines(string fromHere, string blockBody)
    {
        if (string.IsNullOrEmpty(blockBody) || string.IsNullOrEmpty(fromHere))
            return 1;

        int length = Math.Min(blockBody.Length, fromHere.Length);
        int newlineCount = 0;

        for (int index = 0; index < length; index++)
        {
            if (fromHere[index] == '\n')
                newlineCount++;
        }

        return newlineCount + 1;
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

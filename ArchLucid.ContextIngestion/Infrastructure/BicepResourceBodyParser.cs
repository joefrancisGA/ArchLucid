using System.Text.Json;
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

    private static readonly Regex ArrayAssignmentRegex = new(
        """
        ^\s*(?<key>[A-Za-z0-9_-]+)\s*:\s*\[
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex MultilineArrayAssignmentRegex = new(
        """
        ^\s*(?<key>[A-Za-z0-9_-]+)\s*:\s*$
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
        bool inBlockComment = false;

        while (lineIndex < lines.Length)
        {
            string line = lines[lineIndex].Trim();

            if (InfrastructureDeclarationLineCommentScanner.TryConsumeBlockComment(ref line, ref inBlockComment))
            {
                lineIndex++;
                continue;
            }

            if (line.Length == 0 || line.StartsWith("//", StringComparison.Ordinal) || line.StartsWith('#'))
            {
                lineIndex++;
                continue;
            }

            Match arrayMatch = ArrayAssignmentRegex.Match(line);

            if (arrayMatch.Success)
            {
                if (TryConsumeArrayAssignment(lines, ref lineIndex, arrayMatch.Groups["key"].Value, properties))
                    continue;
            }

            Match multilineArrayMatch = MultilineArrayAssignmentRegex.Match(line);

            if (multilineArrayMatch.Success
                && TryConsumeMultilineArrayAssignment(lines, ref lineIndex, multilineArrayMatch.Groups["key"].Value, properties))
                continue;

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

            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingHclComment(rawValue);
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingSlashSlashComment(rawValue);
            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingBlockComment(rawValue);
            string scalarValue = CanonicalInfrastructurePropertyBag.UnquoteInfrastructureScalar(rawValue);

            InfrastructureDeclarationSecurityPropertyWriter.TryAddTfPropertyWithArmAlias(properties, key, scalarValue);
            lineIndex++;
        }
    }

    private static bool TryConsumeArrayAssignment(
        string[] lines,
        ref int lineIndex,
        string arrayKey,
        Dictionary<string, string> properties)
    {
        string fromHere = string.Join('\n', lines[lineIndex..]);
        int bracketIndex = fromHere.IndexOf('[', StringComparison.Ordinal);
        string arrayBody = InfrastructureDeclarationBraceBodyExtractor.ExtractBalancedBracketBody(fromHere, bracketIndex);

        if (!string.IsNullOrWhiteSpace(arrayBody)
            && BicepArrayLiteralConverter.TryParseToJsonElement(arrayBody, out JsonElement arrayElement))
        {
            BicepArrayLiteralConverter.TryAddParsedArrayProperty(properties, arrayKey, arrayElement);
        }

        int consumedArrayLines = CountConsumedLines(fromHere, arrayBody);
        lineIndex += consumedArrayLines;

        return true;
    }

    private static bool TryConsumeMultilineArrayAssignment(
        string[] lines,
        ref int lineIndex,
        string arrayKey,
        Dictionary<string, string> properties)
    {
        int probeIndex = lineIndex + 1;
        bool inBlockComment = false;

        while (probeIndex < lines.Length)
        {
            string probeLine = lines[probeIndex].Trim();

            if (InfrastructureDeclarationLineCommentScanner.TryConsumeBlockComment(ref probeLine, ref inBlockComment))
            {
                probeIndex++;
                continue;
            }

            if (probeLine.Length == 0
                || probeLine.StartsWith("//", StringComparison.Ordinal)
                || probeLine.StartsWith('#'))
            {
                probeIndex++;
                continue;
            }

            if (!probeLine.StartsWith("[", StringComparison.Ordinal))
                return false;

            string fromHere = string.Join('\n', lines[probeIndex..]);
            int bracketIndex = fromHere.IndexOf('[', StringComparison.Ordinal);
            string arrayBody = InfrastructureDeclarationBraceBodyExtractor.ExtractBalancedBracketBody(fromHere, bracketIndex);

            if (!string.IsNullOrWhiteSpace(arrayBody)
                && BicepArrayLiteralConverter.TryParseToJsonElement(arrayBody, out JsonElement arrayElement))
            {
                BicepArrayLiteralConverter.TryAddParsedArrayProperty(properties, arrayKey, arrayElement);
            }

            int consumedArrayLines = CountConsumedLines(fromHere, arrayBody);
            lineIndex += probeIndex - lineIndex + consumedArrayLines;

            return true;
        }

        return false;
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
}

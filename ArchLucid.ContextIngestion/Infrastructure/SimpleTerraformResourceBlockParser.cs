using System.Text.Json;
using System.Text.RegularExpressions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Lightweight scanner for <c>simple-terraform</c> resource blocks (not a full HCL parser).
/// </summary>
internal static class SimpleTerraformResourceBlockParser
{
    private static readonly Regex ResourceHeaderRegex = new(
        """
        resource\s+"(?<type>[^"]+)"\s+"(?<name>[^"]+)"|resource\s+'(?<type>[^']+)'\s+'(?<name>[^']+)'
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ScalarAssignmentRegex = new(
        """
        ^\s*(?<key>[A-Za-z0-9_-]+)\s*=\s*(?<value>.+?)\s*$
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ArrayAssignmentRegex = new(
        """
        ^\s*(?<key>[A-Za-z0-9_-]+)\s*=\s*\[
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex NestedBlockStartRegex = new(
        """
        ^\s*(?<block>[A-Za-z0-9_-]+)\s*\{
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    internal readonly record struct SimpleTerraformResourceBlock(string TerraformType, string Name, string Body);

    internal static IReadOnlyList<SimpleTerraformResourceBlock> ExtractBlocks(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return [];

        MatchCollection matches = ResourceHeaderRegex.Matches(content);

        if (matches.Count == 0)
            return [];

        List<SimpleTerraformResourceBlock> blocks = [];

        for (int index = 0; index < matches.Count; index++)
        {
            Match match = matches[index];
            string terraformType = match.Groups["type"].Value.Trim();
            string name = match.Groups["name"].Value.Trim();

            if (string.IsNullOrWhiteSpace(terraformType) || string.IsNullOrWhiteSpace(name))
                continue;

            int bodyStart = match.Index + match.Length;
            int bodyEnd = index + 1 < matches.Count ? matches[index + 1].Index : content.Length;
            string body = content[bodyStart..bodyEnd];

            blocks.Add(new SimpleTerraformResourceBlock(terraformType, name, body));
        }

        return blocks;
    }

    internal static void ParseBodyIntoProperties(string body, Dictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (string.IsNullOrWhiteSpace(body))
            return;

        string[] lines = body.Split('\n');
        bool inBlockComment = false;

        for (int lineIndex = 0; lineIndex < lines.Length; lineIndex++)
        {
            string line = lines[lineIndex].Trim();

            if (TryConsumeBlockComment(ref line, ref inBlockComment))
                continue;

            if (line.Length == 0 || line.StartsWith('#') || line.StartsWith("//", StringComparison.Ordinal))
                continue;

            if (line.StartsWith("${", StringComparison.Ordinal))
                continue;

            Match arrayMatch = ArrayAssignmentRegex.Match(line);

            if (arrayMatch.Success)
            {
                string arrayKey = arrayMatch.Groups["key"].Value;
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
                    {
                        string innerBody = blockBody.Trim();

                        if (innerBody.StartsWith("{", StringComparison.Ordinal) && innerBody.EndsWith("}", StringComparison.Ordinal))
                            innerBody = innerBody[1..^1].Trim();

                        CanonicalInfrastructurePropertyBag.TryAddTfBlockProperty(properties, blockName, innerBody);
                    }
                }

                int consumedLines = CountConsumedLines(fromHere, blockBody);
                lineIndex += consumedLines;
                continue;
            }

            Match scalarMatch = ScalarAssignmentRegex.Match(line);

            if (!scalarMatch.Success)
                continue;

            string key = scalarMatch.Groups["key"].Value;
            string rawValue = scalarMatch.Groups["value"].Value.Trim();

            if (rawValue.StartsWith("${", StringComparison.Ordinal))
                continue;

            rawValue = CanonicalInfrastructurePropertyBag.StripTrailingHclComment(rawValue);
            string scalarValue = UnquoteScalar(rawValue);

            CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, key, scalarValue);
        }
    }

    private static bool IsFlattenableBlockName(string blockName) =>
        string.Equals(blockName, "properties", StringComparison.OrdinalIgnoreCase)
        || string.Equals(blockName, "siteConfig", StringComparison.OrdinalIgnoreCase)
        || string.Equals(blockName, "site_config", StringComparison.OrdinalIgnoreCase);

    private static bool TryConsumeBlockComment(ref string line, ref bool inBlockComment)
    {
        if (inBlockComment)
        {
            int end = line.IndexOf("*/", StringComparison.Ordinal);

            if (end < 0)
            {
                line = string.Empty;

                return true;
            }

            line = line[(end + 2)..].TrimStart();
            inBlockComment = false;
        }

        while (true)
        {
            int start = line.IndexOf("/*", StringComparison.Ordinal);

            if (start < 0)
                break;

            int end = line.IndexOf("*/", start + 2, StringComparison.Ordinal);

            if (end < 0)
            {
                line = line[..start].TrimEnd();
                inBlockComment = true;
                break;
            }

            line = string.Concat(line.AsSpan(0, start), line.AsSpan(end + 2)).Trim();
        }

        return string.IsNullOrWhiteSpace(line) && inBlockComment;
    }

    private static string UnquoteScalar(string rawValue)
    {
        if (rawValue.Length >= 2
            && ((rawValue[0] == '"' && rawValue[^1] == '"')
                || (rawValue[0] == '\'' && rawValue[^1] == '\'')))
            return rawValue[1..^1];

        return rawValue;
    }

    private static int CountConsumedLines(string fromHere, string arrayBody)
    {
        if (string.IsNullOrEmpty(arrayBody) || string.IsNullOrEmpty(fromHere))
            return 1;

        int length = Math.Min(arrayBody.Length, fromHere.Length);
        int newlineCount = 0;

        for (int index = 0; index < length; index++)
        {
            if (fromHere[index] == '\n')
                newlineCount++;
        }

        return newlineCount + 1;
    }
}

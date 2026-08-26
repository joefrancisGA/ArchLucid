using System.Text;
using System.Text.RegularExpressions;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Lightweight scanner for <c>simple-terraform</c> resource blocks (not a full HCL parser).
/// </summary>
internal static class SimpleTerraformResourceBlockParser
{
    private static readonly Regex ResourceHeaderRegex = new(
        """
        resource\s+"(?<type>[^"]+)"\s+"(?<name>[^"]+)"
        """,
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ScalarAssignmentRegex = new(
        """
        ^\s*(?<key>[A-Za-z0-9_-]+)\s*=\s*(?<value>.+?)\s*$
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

        for (int lineIndex = 0; lineIndex < lines.Length; lineIndex++)
        {
            string line = lines[lineIndex].Trim();

            if (line.Length == 0 || line.StartsWith('#') || line.StartsWith("//", StringComparison.Ordinal))
                continue;

            if (line.StartsWith("${", StringComparison.Ordinal))
                continue;

            Match nestedBlockMatch = NestedBlockStartRegex.Match(line);

            if (nestedBlockMatch.Success)
            {
                string blockName = nestedBlockMatch.Groups["block"].Value;
                string remainder = line[(nestedBlockMatch.Index + nestedBlockMatch.Length)..];
                string blockBody = ExtractNestedBlockBody(remainder, lines, lineIndex);

                if (!string.IsNullOrWhiteSpace(blockBody))
                    CanonicalInfrastructurePropertyBag.TryAddTfBlockProperty(properties, blockName, blockBody);

                continue;
            }

            Match scalarMatch = ScalarAssignmentRegex.Match(line);

            if (!scalarMatch.Success)
                continue;

            string key = scalarMatch.Groups["key"].Value;
            string rawValue = scalarMatch.Groups["value"].Value.Trim();

            if (rawValue.StartsWith("${", StringComparison.Ordinal))
                continue;

            string scalarValue = UnquoteScalar(rawValue);

            CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, key, scalarValue);
        }
    }

    private static string ExtractNestedBlockBody(string remainderOnLine, string[] lines, int lineIndex)
    {
        StringBuilder builder = new();
        int depth = 0;
        bool started = false;

        void AppendSegment(string segment)
        {
            if (string.IsNullOrEmpty(segment))
                return;

            if (builder.Length > 0)
                builder.Append(' ');

            builder.Append(segment.Trim());
        }

        AppendSegment(remainderOnLine);

        foreach (char character in remainderOnLine)
        {
            if (character == '{')
            {
                depth++;
                started = true;
            }
            else if (character == '}')
            {
                depth--;

                if (started && depth <= 0)
                    return builder.ToString();
            }
        }

        for (int nextLineIndex = lineIndex + 1; nextLineIndex < lines.Length; nextLineIndex++)
        {
            string nextLine = lines[nextLineIndex];
            AppendSegment(nextLine);

            foreach (char character in nextLine)
            {
                if (character == '{')
                {
                    depth++;
                    started = true;
                }
                else if (character == '}')
                {
                    depth--;

                    if (started && depth <= 0)
                        return builder.ToString();
                }
            }
        }

        return builder.ToString();
    }

    private static string UnquoteScalar(string rawValue)
    {
        if (rawValue.Length >= 2 && rawValue[0] == '"' && rawValue[^1] == '"')
            return rawValue[1..^1];

        return rawValue;
    }
}

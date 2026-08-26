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
        resource\s+"(?<type>[^"]+)"\s+"(?<name>[^"]+)"|resource\s+'(?<type>[^']+)'\s+'(?<name>[^']+)'
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

            Match nestedBlockMatch = NestedBlockStartRegex.Match(line);

            if (nestedBlockMatch.Success)
            {
                string blockName = nestedBlockMatch.Groups["block"].Value;
                string remainder = line[(nestedBlockMatch.Index + nestedBlockMatch.Length)..];
                string blockBody = ExtractNestedBlockBody(remainder, lines, lineIndex, out int endLineIndex);

                if (!string.IsNullOrWhiteSpace(blockBody))
                    CanonicalInfrastructurePropertyBag.TryAddTfBlockProperty(properties, blockName, blockBody);

                lineIndex = endLineIndex;
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

    private static string ExtractNestedBlockBody(
        string remainderOnLine,
        string[] lines,
        int lineIndex,
        out int endLineIndex)
    {
        endLineIndex = lineIndex;
        StringBuilder builder = new();
        int depth = 0;
        bool started = false;

        void AppendSegment(string segment)
        {
            if (string.IsNullOrEmpty(segment))
                return;

            if (builder.Length > 0)
                builder.Append('\n');

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
                {
                    endLineIndex = lineIndex;
                    return builder.ToString();
                }
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
                    {
                        endLineIndex = nextLineIndex;
                        return builder.ToString();
                    }
                }
            }
        }

        endLineIndex = lines.Length - 1;
        return builder.ToString();
    }

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
}

using System.Globalization;
using System.Text;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Strips a level-2 markdown section from comparison export summary text before HTML/PDF/DOCX re-append.
/// </summary>
internal static class ComparisonExportMarkdownSectionRemover
{
    internal static string RemoveSection(string markdown, string heading)
    {
        ArgumentNullException.ThrowIfNull(markdown);
        ArgumentException.ThrowIfNullOrWhiteSpace(heading);

        int start = IndexOfHeadingLine(markdown, heading);

        if (start < 0)
            return markdown;

        int lineEnd = markdown.IndexOf('\n', start);
        int searchFrom = lineEnd < 0 ? start : lineEnd;
        int nextSection = markdown.IndexOf("\n## ", searchFrom, StringComparison.Ordinal);

        if (nextSection < 0)
            return markdown[..start].TrimEnd();

        return (markdown[..start] + markdown[nextSection..]).Trim();
    }

    private static int IndexOfHeadingLine(string markdown, string heading)
    {
        int direct = markdown.IndexOf(heading, StringComparison.Ordinal);

        if (direct >= 0)
            return direct;

        int lineStart = 0;

        while (lineStart <= markdown.Length)
        {
            int lineEnd = markdown.IndexOf('\n', lineStart);

            if (lineEnd < 0)
                lineEnd = markdown.Length;

            ReadOnlySpan<char> line = TrimHeadingLine(markdown.AsSpan(lineStart, lineEnd - lineStart));

            if (LineMatchesHeading(line, heading))
                return lineStart;

            if (lineEnd == markdown.Length)
                break;

            lineStart = lineEnd + 1;
        }

        return -1;
    }

    private static bool LineMatchesHeading(ReadOnlySpan<char> trimmedLine, string heading)
    {
        if (trimmedLine.Equals(heading.AsSpan(), StringComparison.OrdinalIgnoreCase))
            return true;

        return string.Equals(
            NormalizeHeadingLine(trimmedLine.ToString()),
            heading,
            StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeHeadingLine(string line)
    {
        if (line.Length == 0)
            return line;

        char[] buffer = new char[line.Length];
        int writeIndex = 0;

        for (int i = 0; i < line.Length; i++)
        {
            char candidate = line[i];

            if (ShouldRemoveInvisibleFormatting(candidate))
                continue;

            buffer[writeIndex++] = MapHeadingCharacter(candidate);
        }

        string normalized = new string(buffer, 0, writeIndex).Trim();

        while (normalized.Contains("  ", StringComparison.Ordinal))
            normalized = normalized.Replace("  ", " ", StringComparison.Ordinal);

        return normalized.Normalize(NormalizationForm.FormC);
    }

    private static bool ShouldRemoveInvisibleFormatting(char candidate)
    {
        if (candidate == '\uFEFF')
            return true;

        if (candidate is >= '\uFE00' and <= '\uFE0F')
            return true;

        UnicodeCategory category = char.GetUnicodeCategory(candidate);

        return category is UnicodeCategory.Format or UnicodeCategory.NonSpacingMark;
    }

    private static char MapHeadingCharacter(char candidate)
    {
        if (ShouldSubstituteWithAsciiSpace(candidate))
            return ' ';

        if (candidate is >= '\uFF01' and <= '\uFF5E')
            return (char)(candidate - 0xFEE0);

        return candidate;
    }

    private static bool ShouldSubstituteWithAsciiSpace(char candidate)
    {
        if (candidate == ' ')
            return false;

        return char.IsWhiteSpace(candidate);
    }

    private static ReadOnlySpan<char> TrimHeadingLine(ReadOnlySpan<char> line)
    {
        line = line.Trim();

        if (line.Length > 0 && line[0] == '\uFEFF')
            line = line[1..].TrimStart();

        return line;
    }
}

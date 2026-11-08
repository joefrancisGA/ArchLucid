using System.Globalization;
using System.Text;
using ArchLucid.Contracts.Text;

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

        int headingLineEnd = FindLineEnd(markdown, start);
        int searchFrom = AdvancePastLineBreak(markdown, headingLineEnd);
        int nextSection = IndexOfNextSectionBoundaryHeadingLine(markdown, searchFrom, heading);

        if (nextSection < 0)
            return markdown[..start].TrimEnd();

        return (markdown[..start] + markdown[nextSection..]).Trim();
    }

    private static int IndexOfHeadingLine(string markdown, string heading)
    {
        int lineStart = 0;

        while (lineStart < markdown.Length)
        {
            int lineEnd = FindLineEnd(markdown, lineStart);
            ReadOnlySpan<char> line = TrimHeadingLine(markdown.AsSpan(lineStart, lineEnd - lineStart));

            if (LineMatchesHeading(line, heading))
                return lineStart;

            lineStart = AdvancePastLineBreak(markdown, lineEnd);
        }

        return -1;
    }

    private static int IndexOfNextSectionBoundaryHeadingLine(string markdown, int searchFrom, string removedHeading)
    {
        int lineStart = searchFrom;

        while (lineStart < markdown.Length)
        {
            int lineEnd = FindLineEnd(markdown, lineStart);
            ReadOnlySpan<char> line = TrimHeadingLine(markdown.AsSpan(lineStart, lineEnd - lineStart));

            if (IsSectionBoundaryHeadingLine(line) && !LineMatchesHeading(line, removedHeading))
                return lineStart;

            lineStart = AdvancePastLineBreak(markdown, lineEnd);
        }

        return -1;
    }

    private static bool IsSectionBoundaryHeadingLine(ReadOnlySpan<char> trimmedLine) =>
        IsLevel2MarkdownHeadingLine(trimmedLine) || IsLevel1MarkdownHeadingLine(trimmedLine);

    private static bool IsLevel1MarkdownHeadingLine(ReadOnlySpan<char> trimmedLine)
    {
        if (trimmedLine.Length < 2 || trimmedLine[0] != '#')
            return false;

        if (trimmedLine.Length >= 2 && trimmedLine[1] == '#')
            return false;

        return trimmedLine[1] == ' ';
    }

    private static bool IsLevel2MarkdownHeadingLine(ReadOnlySpan<char> trimmedLine)
    {
        if (trimmedLine.Length < 3 || trimmedLine[0] != '#' || trimmedLine[1] != '#')
            return false;

        if (trimmedLine.Length >= 3 && trimmedLine[2] == '#')
            return false;

        return trimmedLine.Length == 2 || trimmedLine[2] == ' ';
    }

    private static int FindLineEnd(string markdown, int lineStart)
    {
        for (int i = lineStart; i < markdown.Length; i++)
        {
            if (markdown[i] is '\n' or '\r')
                return i;
        }

        return markdown.Length;
    }

    private static int AdvancePastLineBreak(string markdown, int lineBreakIndex)
    {
        if (lineBreakIndex >= markdown.Length)
            return markdown.Length;

        if (markdown[lineBreakIndex] == '\r')
        {
            return lineBreakIndex + 1 < markdown.Length && markdown[lineBreakIndex + 1] == '\n'
                ? lineBreakIndex + 2
                : lineBreakIndex + 1;
        }

        return lineBreakIndex + 1;
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
            candidate = (char)(candidate - 0xFEE0);

        return UnicodeLatinHomoglyphMapper.MapToLatinLookalike(candidate);
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

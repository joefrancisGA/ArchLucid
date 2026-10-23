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

            ReadOnlySpan<char> line = markdown.AsSpan(lineStart, lineEnd - lineStart).Trim();

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
        if (trimmedLine.Equals(heading.AsSpan(), StringComparison.Ordinal))
            return true;

        return string.Equals(NormalizeHeadingLine(trimmedLine.ToString()), heading, StringComparison.Ordinal);
    }

    private static string NormalizeHeadingLine(string line)
    {
        string normalized = line
            .Replace('\u00A0', ' ')
            .Replace('\u2007', ' ')
            .Replace('\u2009', ' ')
            .Trim();

        while (normalized.Contains("  ", StringComparison.Ordinal))
            normalized = normalized.Replace("  ", " ", StringComparison.Ordinal);

        return normalized;
    }
}

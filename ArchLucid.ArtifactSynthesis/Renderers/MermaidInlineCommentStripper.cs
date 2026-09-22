namespace ArchLucid.ArtifactSynthesis.Renderers;

/// <summary>
///     Removes trailing <c>%%</c> comments that share a line with flowchart statements.
///     Mermaid only strips comments that start a line, so inline comments parse as NODE_STRING.
/// </summary>
public static class MermaidInlineCommentStripper
{
    /// <summary>Returns <paramref name="mermaid"/> with trailing inline <c>%%</c> comments removed.</summary>
    public static string Strip(string mermaid)
    {
        ArgumentNullException.ThrowIfNull(mermaid);

        if (mermaid.Length == 0)
        {
            return mermaid;
        }

        bool usesCrLf = mermaid.Contains('\r', StringComparison.Ordinal);
        string normalized = mermaid.Replace("\r\n", "\n", StringComparison.Ordinal);
        string[] lines = normalized.Split('\n');

        for (int index = 0; index < lines.Length; index++)
        {
            lines[index] = StripLine(lines[index]);
        }

        string joined = string.Join('\n', lines);

        if (usesCrLf)
        {
            return joined.Replace("\n", "\r\n", StringComparison.Ordinal);
        }

        return joined;
    }

    private static string StripLine(string line)
    {
        string trimmedStart = line.TrimStart();

        if (trimmedStart.StartsWith("%%", StringComparison.Ordinal))
        {
            return line;
        }

        int commentIndex = IndexOfUnquotedComment(line);

        if (commentIndex < 0)
        {
            return line;
        }

        return line[..commentIndex].TrimEnd();
    }

    private static int IndexOfUnquotedComment(string line)
    {
        bool inQuote = false;

        for (int index = 0; index < line.Length; index++)
        {
            if (line[index] == '"')
            {
                inQuote = !inQuote;
                continue;
            }

            if (!inQuote && line[index] == '%' && index + 1 < line.Length && line[index + 1] == '%')
            {
                return index;
            }
        }

        return -1;
    }
}

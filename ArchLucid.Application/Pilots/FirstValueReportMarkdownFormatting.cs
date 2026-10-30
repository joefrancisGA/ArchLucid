namespace ArchLucid.Application.Pilots;

/// <summary>Shared Markdown table-cell helpers for first-value report section formatters.</summary>
internal static class FirstValueReportMarkdownFormatting
{
    internal static string EscapeMarkdownTableCell(string value)
        => value.Replace("|", "\\|", StringComparison.Ordinal).Replace("\r", " ", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal).Trim();

    /// <summary>Wraps persisted text in a CommonMark inline-code span, escaping table breaks and lengthening fences when content contains backticks.</summary>
    internal static string WrapMarkdownInlineCode(string value)
    {
        string escaped = EscapeMarkdownTableCell(value);
        int maxRun = 0;
        int run = 0;

        foreach (char c in escaped)
        {
            if (c == '`')
            {
                run++;
                maxRun = Math.Max(maxRun, run);
            }
            else
            {
                run = 0;
            }
        }

        string fence = new string('`', maxRun + 1);
        return fence + escaped + fence;
    }
}

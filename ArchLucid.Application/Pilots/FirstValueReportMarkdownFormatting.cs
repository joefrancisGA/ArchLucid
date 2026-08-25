namespace ArchLucid.Application.Pilots;

/// <summary>Shared Markdown table-cell helpers for first-value report section formatters.</summary>
internal static class FirstValueReportMarkdownFormatting
{
    internal static string EscapeMarkdownTableCell(string value)
        => value.Replace("|", "\\|", StringComparison.Ordinal).Replace("\r", " ", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal).Trim();
}

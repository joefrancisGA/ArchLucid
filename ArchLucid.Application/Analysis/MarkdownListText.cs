namespace ArchLucid.Application.Analysis;

/// <summary>
///     Customer and agent text rendered on one Markdown bullet.
///     A stored newline would close that bullet and start a new heading.
/// </summary>
internal static class MarkdownListText
{
    internal static string Format(string value)
    {
        string collapsed = value.Replace("\r\n", "\n", StringComparison.Ordinal).Replace('\r', '\n');

        return string.Join(
            ' ',
            collapsed.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }
}

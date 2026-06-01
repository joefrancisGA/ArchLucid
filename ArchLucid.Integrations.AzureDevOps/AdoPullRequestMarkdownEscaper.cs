using System.Text;

namespace ArchLucid.Integrations.AzureDevOps;

/// <summary>
///     Escapes compare-derived strings before they are written into Azure DevOps PR comment Markdown (TB-079).
/// </summary>
public static class AdoPullRequestMarkdownEscaper
{
    private const int MaxBulletTextLength = 500;

    private static readonly string[] DangerousContentMarkers =
    [
        "<script",
        "javascript:",
        "data:",
    ];

    /// <summary>Escapes inline Markdown metacharacters in bullet highlight text.</summary>
    public static string EscapeBulletText(string value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        if (ContainsDangerousContent(value))
            return string.Empty;

        StringBuilder escaped = new(Math.Min(value.Length + 8, MaxBulletTextLength + 8));

        foreach (char ch in value)
        {
            switch (ch)
            {
                case '\\':
                case '*':
                case '_':
                case '#':
                case '[':
                case ']':
                case '(':
                case ')':
                case '`':
                case '|':
                case '<':
                case '>':
                    escaped.Append('\\');
                    escaped.Append(ch);
                    break;

                case '\r':
                case '\n':
                    escaped.Append(' ');
                    break;

                default:
                    escaped.Append(ch);
                    break;
            }
        }

        string result = escaped.ToString();

        if (result.Length > MaxBulletTextLength)
            return result[..MaxBulletTextLength];

        return result;
    }

    private static bool ContainsDangerousContent(string value)
    {
        foreach (string marker in DangerousContentMarkers)
        {
            if (value.Contains(marker, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    /// <summary>
    ///     Returns a safe http/https URL for Markdown link targets, or <see langword="null" /> when unsafe.
    /// </summary>
    public static string? EscapeMarkdownLinkTarget(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return null;

        string trimmed = url.Trim();

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? parsed))
            return null;

        if (!string.Equals(parsed.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(parsed.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return trimmed;
    }
}

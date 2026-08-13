using System.Globalization;
using System.IO;
using System.Text;

namespace ArchLucid.Api.Support;

/// <summary>
///     Route-level run identifier parsing and comparison shared by authority read endpoints.
/// </summary>
/// <remarks>
///     Operator deep links carry both hyphenated (<c>D</c>) and compact (<c>N</c>) GUID formats, so parsing and equality
///     must ignore hyphenation to avoid spurious 404s.
/// </remarks>
public static class AuthorityRunIdentifier
{
    private const string UnknownRunStem = "unknown-run";

    /// <summary>Parses a route run id accepting both compact (<c>N</c>) and standard GUID formats.</summary>
    public static bool TryParse(string? runId, out Guid runGuid)
    {
        runGuid = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runId))
            return false;

        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }

    /// <summary>Hyphen/format-insensitive GUID comparison (aligned with UI <c>sameAuthorityRunId</c>).</summary>
    public static bool Matches(string routeRunId, Guid payloadRunId)
    {
        ArgumentNullException.ThrowIfNull(routeRunId);

        return string.Equals(
            Normalize(routeRunId),
            Normalize(payloadRunId.ToString("D", CultureInfo.InvariantCulture)),
            StringComparison.Ordinal);
    }

    /// <summary>Reduces an unparsable run id to a file-name-safe stem for export attachment names.</summary>
    public static string SanitizeForFileStem(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return UnknownRunStem;

        string trimmed = runId.Trim();
        ReadOnlySpan<char> invalidChars = Path.GetInvalidFileNameChars();
        StringBuilder stem = new(trimmed.Length);

        foreach (char candidate in trimmed)
        {
            stem.Append(invalidChars.Contains(candidate) ? '_' : candidate);
        }

        string built = stem.ToString();

        return string.IsNullOrWhiteSpace(built) ? UnknownRunStem : built;
    }

    private static string Normalize(string value)
    {
        return value.Replace("-", string.Empty, StringComparison.Ordinal).Trim().ToUpperInvariant();
    }
}

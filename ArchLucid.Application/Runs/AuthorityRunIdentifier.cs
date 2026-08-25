using System.Globalization;
using System.IO;
using System.Text;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Route-level run identifier parsing and comparison shared by authority read endpoints.
/// </summary>
public static class AuthorityRunIdentifier
{
    private const string UnknownRunStem = "unknown-run";

    public static bool TryParse(string? runId, out Guid runGuid)
    {
        runGuid = Guid.Empty;

        if (string.IsNullOrWhiteSpace(runId))
            return false;

        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }

    public static bool Matches(string routeRunId, Guid payloadRunId)
    {
        ArgumentNullException.ThrowIfNull(routeRunId);

        return string.Equals(
            Normalize(routeRunId),
            Normalize(payloadRunId.ToString("D", CultureInfo.InvariantCulture)),
            StringComparison.Ordinal);
    }

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

    private static string Normalize(string value) =>
        value.Replace("-", string.Empty, StringComparison.Ordinal).Trim().ToUpperInvariant();
}

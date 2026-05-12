using System.Diagnostics.CodeAnalysis;
using System.Text.RegularExpressions;

using Microsoft.Extensions.Primitives;

namespace ArchLucid.Host.Core.Middleware;

/// <summary>Parses and validates inbound <c>X-Correlation-ID</c> headers (shared by correlation middleware + Serilog request logging).</summary>
public static class CorrelationIdHeaderParser
{
    public const string HeaderName = "X-Correlation-ID";
    private const int MaxCorrelationIdLength = 64;

    // Only allow safe characters: alphanumeric, hyphens, underscores, and dots.
    private static readonly Regex SafeCorrelationIdPattern =
        new(@"^[a-zA-Z0-9\-_.]+$", RegexOptions.Compiled);

    /// <summary>Returns false when absent, malformed, unsafe, or over length budget.</summary>
    public static bool TryGetValidIncomingCorrelationId(IHeaderDictionary requestHeaders,
        [NotNullWhen(true)] out string? correlationId)
    {
        correlationId = null;

        StringValues hv = requestHeaders[HeaderName];

        if (hv.Count == 0)

            return false;

        string? raw = hv[0]?.Trim();

        if (!IsValidCorrelationId(raw))

            return false;

        correlationId = raw!;

        return true;
    }

    private static bool IsValidCorrelationId(string? value) =>
        value is not null
        && !string.IsNullOrWhiteSpace(value)
        && value.Length <= MaxCorrelationIdLength
        && SafeCorrelationIdPattern.IsMatch(value);
}

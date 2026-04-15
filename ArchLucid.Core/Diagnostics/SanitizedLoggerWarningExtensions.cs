using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
/// Structured <see cref="ILogger"/> helpers for Warning-level messages that include two
/// externally influenced strings (CWE-117).
/// </summary>
/// <remarks>
/// CodeQL <c>cs/log-forging</c> may not propagate the custom <see cref="LogSanitizer.Sanitize"/> barrier
/// through <see cref="LoggerExtensions.LogWarning(ILogger, string?, params object?[])"/> <c>params</c>
/// boxing at call sites. Sanitizing in this helper keeps barrier and sink adjacent (see <c>docs/CODEQL_TRIAGE.md</c>).
/// </remarks>
public static class SanitizedLoggerWarningExtensions
{
    /// <summary>
    /// Logs a warning whose template has two placeholders filled from externally influenced strings after sanitization.
    /// </summary>
    public static void LogWarningWithTwoSanitizedUserStrings(
        this ILogger logger,
        string messageTemplate,
        string? userDerivedFirst,
        string? userDerivedSecond)
    {
        ArgumentNullException.ThrowIfNull(logger);

        string safeFirst = LogSanitizer.Sanitize(userDerivedFirst);
        string safeSecond = LogSanitizer.Sanitize(userDerivedSecond);

        // codeql[cs/log-forging]: user-derived values sanitized immediately above.
        logger.LogWarning(messageTemplate, safeFirst, safeSecond);
    }
}

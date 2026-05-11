using Microsoft.Extensions.Primitives;

using Serilog.AspNetCore;

namespace ArchLucid.Api.Startup;

/// <summary>
///     Serilog.AspNetCore request logging: excludes query strings from paths; enriches with
///     <c>X-Correlation-ID</c> when the client sends that header (does not log bodies or Authorization).
/// </summary>
internal static class ArchLucidSerilogRequestLogging
{
    public static void ConfigureRequestLogging(RequestLoggingOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        // Never attach raw query strings (tokens often appear there).
        options.IncludeQueryInRequestPath = false;

        options.EnrichDiagnosticContext = static (diagnosticContext, httpContext) =>
        {
            if (!httpContext.Request.Headers.TryGetValue("X-Correlation-ID", out StringValues values))
                return;

            if (values.Count == 0)
                return;

            string? raw = values[0];

            if (string.IsNullOrWhiteSpace(raw))
                return;

            string trimmed = raw.Trim();

            if (trimmed.Length > 64)
                trimmed = trimmed[..64];

            diagnosticContext.Set("RequestCorrelationId", trimmed);
        };
    }
}

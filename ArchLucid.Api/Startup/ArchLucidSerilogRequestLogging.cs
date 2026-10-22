using ArchLucid.Host.Core.Middleware;

using Serilog.AspNetCore;

namespace ArchLucid.Api.Startup;

/// <summary>
///     Serilog.AspNetCore request logging: excludes query strings from paths; attaches <c>XCorrelationId</c> when an
///     inbound <c>X-Correlation-ID</c> validates (same rules as <see cref="CorrelationIdMiddleware" /> — no bodies /
///     Authorization logged).
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
            if (!CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(
                    httpContext.Request.Headers,
                    out string? xCorrelationId))
                return;

            diagnosticContext.Set("XCorrelationId", xCorrelationId);
        };
    }
}

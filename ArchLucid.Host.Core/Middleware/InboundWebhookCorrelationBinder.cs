using System.Diagnostics;

using ArchLucid.Core.Diagnostics;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Host.Core.Middleware;

/// <summary>
///     Ensures inbound vendor webhook requests propagate a validated <c>X-Correlation-ID</c> onto
///     <see cref="Activity" /> after ASP.NET Core / OpenTelemetry may have switched
///     <see cref="Activity.Current" /> to a child span that did not inherit middleware tags.
/// </summary>
public static class InboundWebhookCorrelationBinder
{
    public static void EnsureIncomingCorrelationTags(HttpContext httpContext)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        if (!CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(httpContext.Request.Headers, out string? correlationId))
            return;

        string? existing =
            ActivityCorrelation.FindTagValueInChain(Activity.Current, ActivityCorrelation.LogicalCorrelationIdTag);

        if (string.Equals(existing, correlationId, StringComparison.Ordinal))
            return;

        Activity.Current?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, correlationId);
    }
}

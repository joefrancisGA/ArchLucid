using System.Diagnostics;

using ArchLucid.Core.Diagnostics;

using Serilog.Context;

namespace ArchLucid.Host.Core.Middleware;

public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        string correlationId = CorrelationIdHeaderParser.TryGetValidIncomingCorrelationId(
                context.Request.Headers,
                out string? fromHeader)
            ? fromHeader
            : context.TraceIdentifier;

        context.Response.Headers[CorrelationIdHeaderParser.HeaderName] = correlationId;
        context.TraceIdentifier = correlationId;

        Activity? activity = Activity.Current;

        if (activity is not null)
        {
            activity.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, correlationId);
            activity.SetTag("http.request_id", context.TraceIdentifier);

            string? runId = context.Request.RouteValues["runId"]?.ToString();

            if (!string.IsNullOrEmpty(runId))

                activity.SetTag("archlucid.run_id", runId);
        }

        using (LogContext.PushProperty("CorrelationId", correlationId))

            await next(context);
    }
}

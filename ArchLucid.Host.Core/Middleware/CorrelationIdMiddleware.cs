using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Serilog.Context;

namespace ArchLucid.Host.Core.Middleware;

public sealed class CorrelationIdMiddleware(RequestDelegate next, IScopeContextProvider scopeContextProvider)
{
    private readonly RequestDelegate _next = next ?? throw new ArgumentNullException(nameof(next));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

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

            ActivityScopeTags.ApplyTenantWorkspace(activity, _scopeContextProvider.GetCurrentScope());
        }

        // Re-apply scope tags after auth/scope middleware so JWT claims win over header-only early resolution.
        context.Response.OnStarting(() =>
        {
            Activity? current = Activity.Current;

            if (current is not null)
                ActivityScopeTags.ApplyTenantWorkspace(current, _scopeContextProvider.GetCurrentScope());

            return Task.CompletedTask;
        });

        using (LogContext.PushProperty("CorrelationId", correlationId))

            await _next(context);
    }
}

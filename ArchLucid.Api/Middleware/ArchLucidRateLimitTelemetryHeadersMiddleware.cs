using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Emits policy-identifying rate-limit headers on successful responses for endpoints that participate in throttling.
/// </summary>
internal sealed class ArchLucidRateLimitTelemetryHeadersMiddleware(RequestDelegate next)
{
    public Task Invoke(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        Endpoint? endpoint = context.GetEndpoint();

        if (endpoint?.Metadata.GetMetadata<DisableRateLimitingAttribute>() is not null)
            return next(context);

        EnableRateLimitingAttribute? rl = endpoint?.Metadata.GetMetadata<EnableRateLimitingAttribute>();

        if (rl?.PolicyName is { Length: > 0 })
        {
            context.Response.OnStarting(static state =>
            {
                HttpContext ctx = (HttpContext)state;

                EnableRateLimitingAttribute? attr =
                    ctx.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>();

                if (attr?.PolicyName is { Length: > 0 } name && !ctx.Response.HasStarted)
                    ctx.Response.Headers[ArchLucidRateLimitResponseHeaders.Policy] = name;

                return Task.CompletedTask;
            }, context);
        }

        return next(context);
    }
}

using System.Globalization;
using System.Threading.RateLimiting;

using ArchLucid.Api.Filters;
using ArchLucid.Api.Middleware;
using ArchLucid.Api.ProblemDetails;

using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Startup;

internal static partial class InfrastructureExtensions
{
    private static void ConfigureRateLimitRejection(RateLimiterOptions options)
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.OnRejected = async (context, cancellationToken) =>
        {
            HttpContext httpContext = context.HttpContext;
            httpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

            EnableRateLimitingAttribute? rateLimitAttribute =
                httpContext.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>();
            string policyName = rateLimitAttribute?.PolicyName ?? "unknown";
            string correlationId = httpContext.TraceIdentifier;
            ILogger rateLimitLogger =
                httpContext.RequestServices.GetRequiredService<ILoggerFactory>()
                    .CreateLogger("ArchLucid.RateLimiting");

            if (rateLimitLogger.IsEnabled(LogLevel.Warning))
            {
                rateLimitLogger.LogWarning(
                    "Rate limit rejected request. Policy={RateLimitPolicy} CorrelationId={CorrelationId} Path={Path}",
                    policyName,
                    correlationId,
                    httpContext.Request.Path.Value);
            }

            ArchLucidRateLimitResponseHeaders.AttachRejectionHeaders(httpContext.Response, context.Lease);

            if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfter))
            {
                int seconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
                httpContext.Response.Headers.RetryAfter = seconds.ToString(NumberFormatInfo.InvariantInfo);
            }

            Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
            {
                Type = "https://archlucid.net/problems/rate-limit-exceeded",
                Title = "Rate limit exceeded",
                Status = StatusCodes.Status429TooManyRequests,
                Detail =
                    "Rate limit exceeded. Honor the Retry-After response header (seconds) before retrying this client identity.",
                Instance = httpContext.Request.Path
            };

            if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfterMeta))
            {
                int seconds = Math.Max(1, (int)Math.Ceiling(retryAfterMeta.TotalSeconds));
                problem.Extensions["retryAfterSeconds"] = seconds;
            }

            ProblemCorrelation.Attach(problem, httpContext);
            await httpContext.Response.WriteAsJsonAsync(
                problem,
                options: null,
                contentType: ApplicationProblemMapper.ProblemJsonMediaType,
                cancellationToken: cancellationToken).ConfigureAwait(false);
        };
    }
}

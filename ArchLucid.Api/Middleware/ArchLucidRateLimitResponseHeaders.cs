using System.Globalization;
using System.Threading.RateLimiting;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Canonical names and helpers for rate-limit telemetry headers on restricted routes.
/// </summary>
/// <remarks>
///     Successful responses do not include <c>X-Rate-Limit-Remaining</c> / <c>X-Rate-Limit-Reset</c>: the ASP.NET Core
///     endpoint limiter is internal to the middleware, and duplicating <see cref="PartitionedRateLimiter{TResource}" />
///     partitions would diverge from enforced counters. Callers should treat remaining/reset on <c>429</c> responses as
///     authoritative when the rejected lease exposes <see cref="MetadataName.RetryAfter" /> (mapped to reset).
/// </remarks>
internal static class ArchLucidRateLimitResponseHeaders
{
    internal const string Remaining = "X-Rate-Limit-Remaining";
    internal const string Reset = "X-Rate-Limit-Reset";
    internal const string Policy = "X-Rate-Limit-Policy";

    internal static void AttachRejectionHeaders(HttpResponse response, RateLimitLease lease)
    {
        ArgumentNullException.ThrowIfNull(response);
        ArgumentNullException.ThrowIfNull(lease);

        response.Headers[Remaining] = "0";

        if (lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfter))
        {
            long resetUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds() +
                             Math.Max(1L, (long)Math.Ceiling(retryAfter.TotalSeconds));

            response.Headers[Reset] = resetUnix.ToString(NumberFormatInfo.InvariantInfo);
        }
    }
}

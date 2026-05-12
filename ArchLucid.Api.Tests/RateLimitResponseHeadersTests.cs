using System.Net;

using ArchLucid.Api.Middleware;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Pins Top 25 improvement #15: standard rate-limit telemetry headers on throttled routes.
/// </summary>
[Trait("Suite", "Core")]
public sealed class RateLimitResponseHeadersTests
{
    [Fact]
    public async Task Successful_rate_limited_endpoint_exposes_policy_header()
    {
        await using RateLimitProbeWebAppFactory factory = new();
        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync(new Uri("/version", UriKind.Relative));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        IEnumerable<string>? policyValues =
            response.Headers.TryGetValues(ArchLucidRateLimitResponseHeaders.Policy, out IEnumerable<string>? pv)
                ? pv
                : null;

        policyValues.Should().NotBeNull();
        policyValues!.Single().Should().Be("fixed");
    }

    [Fact]
    public async Task Rejected_request_exposes_remaining_reset_and_retry_after_headers()
    {
        await using RateLimitProbeWebAppFactory factory = new();
        HttpClient client = factory.CreateClient();

        _ = await client.GetAsync(new Uri("/version", UriKind.Relative));

        HttpResponseMessage rejected = await client.GetAsync(new Uri("/version", UriKind.Relative));

        rejected.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);

        IEnumerable<string>? remaining =
            rejected.Headers.TryGetValues(ArchLucidRateLimitResponseHeaders.Remaining, out IEnumerable<string>? rv)
                ? rv
                : null;

        remaining.Should().NotBeNull();
        remaining!.Single().Should().Be("0");

        IEnumerable<string>? reset =
            rejected.Headers.TryGetValues(ArchLucidRateLimitResponseHeaders.Reset, out IEnumerable<string>? sv)
                ? sv
                : null;

        reset.Should().NotBeNull();
        long.TryParse(reset!.Single(), out long resetUnix).Should().BeTrue();
        resetUnix.Should().BeGreaterThan(0);

        IEnumerable<string>? retryAfter =
            rejected.Headers.TryGetValues("Retry-After", out IEnumerable<string>? raValues)
                ? raValues
                : null;

        retryAfter.Should().NotBeNull();
        retryAfter!.Single().Should().NotBeNullOrWhiteSpace();
    }
}

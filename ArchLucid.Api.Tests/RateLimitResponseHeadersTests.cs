using System.Net;
using System.Net.Http.Json;

using FluentAssertions;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

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

    [Fact]
    public async Task Rejected_request_returns_problem_details_shape_with_retryAfterSeconds_extension()
    {
        await using RateLimitProbeWebAppFactory factory = new();
        HttpClient client = factory.CreateClient();

        _ = await client.GetAsync(new Uri("/version", UriKind.Relative));
        HttpResponseMessage rejected = await client.GetAsync(new Uri("/version", UriKind.Relative));

        rejected.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        rejected.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        MvcProblemDetails? problem = await rejected.Content.ReadFromJsonAsync<MvcProblemDetails>();
        problem.Should().NotBeNull();
        problem!.Type.Should().Be("https://archlucid.net/problems/rate-limit-exceeded");
        problem.Title.Should().Be("Rate limit exceeded");
        problem.Status.Should().Be((int)HttpStatusCode.TooManyRequests);
        problem.Extensions.Should().ContainKey("retryAfterSeconds");
        problem.Extensions["retryAfterSeconds"].Should().NotBeNull();
    }
}

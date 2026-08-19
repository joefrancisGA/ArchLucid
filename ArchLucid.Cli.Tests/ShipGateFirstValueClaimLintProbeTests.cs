using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ShipGateFirstValueClaimLintProbeTests
{
    private const string BaseUrl = "https://pilot.archlucid.test";
    private const string RunId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public async Task EvaluateAsync_Pass_WhenMarkdownHasNoForbiddenClaims()
    {
        StubHandler handler = new()
        {
            OnRequest = _ => Task.FromResult(TextResponse(
                HttpStatusCode.OK,
                "# First value\n\nCommitted run summary with source labels.",
                "text/markdown")),
        };

        using HttpClient http = CreateClient(handler);

        ShipGateFirstValueClaimLintResult result =
            await ShipGateFirstValueClaimLintProbe.EvaluateAsync(http, RunId, skipClaimLint: false);

        result.Success.Should().BeTrue();
        result.ViolationCount.Should().Be(0);
        result.Detail.Should().Contain("claimLint=pass");
    }

    [Fact]
    public async Task EvaluateAsync_Fail_WhenMarkdownContainsForbiddenClaim()
    {
        StubHandler handler = new()
        {
            OnRequest = _ => Task.FromResult(TextResponse(
                HttpStatusCode.OK,
                "# First value\n\nThis pilot delivered guaranteed savings for the sponsor.",
                "text/markdown")),
        };

        using HttpClient http = CreateClient(handler);

        ShipGateFirstValueClaimLintResult result =
            await ShipGateFirstValueClaimLintProbe.EvaluateAsync(http, RunId, skipClaimLint: false);

        result.Success.Should().BeFalse();
        result.ViolationCount.Should().BeGreaterThan(0);
        result.Detail.Should().Contain("claimLint=fail");
    }

    [Fact]
    public async Task EvaluateAsync_Skipped_WhenFlagSet()
    {
        using HttpClient http = CreateClient(new StubHandler
        {
            OnRequest = _ => Task.FromResult(TextResponse(HttpStatusCode.NotFound, "missing", "text/plain")),
        });

        ShipGateFirstValueClaimLintResult result =
            await ShipGateFirstValueClaimLintProbe.EvaluateAsync(http, RunId, skipClaimLint: true);

        result.Success.Should().BeTrue();
        result.Skipped.Should().BeTrue();
        result.Detail.Should().Contain("--skip-claim-lint");
    }

    private static HttpClient CreateClient(HttpMessageHandler handler)
    {
        HttpClient http = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return http;
    }

    private static HttpResponseMessage TextResponse(HttpStatusCode status, string body, string contentType) =>
        new(status)
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, contentType),
        };

    private sealed class StubHandler : HttpMessageHandler
    {
        public required Func<HttpRequestMessage, Task<HttpResponseMessage>> OnRequest
        {
            get;
            init;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            OnRequest(request);
    }
}

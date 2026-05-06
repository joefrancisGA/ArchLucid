using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DeploymentEvidenceProbeRunnerTests
{
    private static readonly JsonSerializerOptions JsonCamel = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [Fact]
    public async Task RunOnceAsync_all_green_succeeds_bundle()
    {
        Dictionary<string, Func<HttpResponseMessage>> routes = new(StringComparer.Ordinal)
        {
            ["/health/live"] = () => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("OK") },
            ["/health/ready"] =
                () => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(new { status = "Healthy", entries = Array.Empty<object>() }, JsonCamel))
                },
            ["/openapi/v1.json"] =
                () => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(new { info = new { title = "ArchLucid" } }, JsonCamel))
                },
            ["/version"] =
                () => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(
                            new { informationalVersion = "1.0.0-test", commit = "abc" },
                            JsonCamel))
                }
        };

        using HttpClient http = new(new RouterHandler(routes)) { BaseAddress = new Uri("https://api.example/") };

        DeploymentEvidenceProbeBundle bundle = await DeploymentEvidenceProbeRunner.RunOnceAsync(
            http,
            "https://api.example.com",
            "/version",
            allowMissingOpenApi: false,
            CancellationToken.None);

        bundle.AllRequiredPassed.Should().BeTrue();
        bundle.Probes.Should().HaveCount(5);
    }

    [Fact]
    public async Task RunOnceAsync_allow_missing_openapi_accepts_404()
    {
        Dictionary<string, Func<HttpResponseMessage>> routes = new(StringComparer.Ordinal)
        {
            ["/health/live"] = () => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("OK") },
            ["/health/ready"] =
                () => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(new { status = "Healthy" }, JsonCamel))
                },
            ["/openapi/v1.json"] = () => new HttpResponseMessage(HttpStatusCode.NotFound) { Content = new StringContent("") },
            ["/version"] =
                () => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(
                            new { informationalVersion = "1.0.0-test" },
                            JsonCamel))
                }
        };

        using HttpClient http = new(new RouterHandler(routes)) { BaseAddress = new Uri("https://api.example/") };

        DeploymentEvidenceProbeBundle bundle = await DeploymentEvidenceProbeRunner.RunOnceAsync(
            http,
            "https://api.example.com",
            "/version",
            allowMissingOpenApi: true,
            CancellationToken.None);

        bundle.AllRequiredPassed.Should().BeTrue();
    }

    private sealed class RouterHandler(Dictionary<string, Func<HttpResponseMessage>> routes) : HttpMessageHandler
    {
        private readonly Dictionary<string, Func<HttpResponseMessage>> _routes = routes;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            string path = request.RequestUri?.AbsolutePath ?? "";

            if (_routes.TryGetValue(path, out Func<HttpResponseMessage>? factory))
                return Task.FromResult(factory());

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }
    }
}

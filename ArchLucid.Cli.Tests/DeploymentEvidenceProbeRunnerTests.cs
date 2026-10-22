using System.Net;
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
        Dictionary<string, Func<HttpRequestMessage, HttpResponseMessage>> routes = new(StringComparer.Ordinal)
        {
            ["/health/live"] = _ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("OK") },
            ["/health/ready"] =
                _ => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(new
                        {
                            status = "Healthy",
                            entries = Array.Empty<object>()
                        }, JsonCamel))
                },
            ["/openapi/v1.json"] =
                _ => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(new
                        {
                            info = new
                            {
                                title = "ArchLucid"
                            }
                        }, JsonCamel))
                },
            ["/version"] =
                _ => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(
                            new
                            {
                                informationalVersion = "1.0.0-test",
                                commit = "abc"
                            },
                            JsonCamel))
                }
        };

        using HttpClient http = new(new RouterHandler(routes));
        http.BaseAddress = new Uri("https://api.example/");

        DeploymentEvidenceProbeBundle bundle = await DeploymentEvidenceProbeRunner.RunOnceAsync(
            http,
            "https://api.example.com",
            "/version",
            allowMissingOpenApi: false,
            syntheticProbeApiKey: null,
            syntheticProbeBearerToken: null,
            CancellationToken.None);

        bundle.AllRequiredPassed.Should().BeTrue();
        bundle.Probes.Should().HaveCount(5);
    }

    [Fact]
    public async Task RunOnceAsync_allow_missing_openapi_accepts_404()
    {
        Dictionary<string, Func<HttpRequestMessage, HttpResponseMessage>> routes = new(StringComparer.Ordinal)
        {
            ["/health/live"] = _ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("OK") },
            ["/health/ready"] =
                _ => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(new
                        {
                            status = "Healthy"
                        }, JsonCamel))
                },
            ["/openapi/v1.json"] = _ => new HttpResponseMessage(HttpStatusCode.NotFound) { Content = new StringContent("") },
            ["/version"] =
                _ => new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        JsonSerializer.Serialize(
                            new
                            {
                                informationalVersion = "1.0.0-test"
                            },
                            JsonCamel))
                }
        };

        using HttpClient http = new(new RouterHandler(routes));
        http.BaseAddress = new Uri("https://api.example/");

        DeploymentEvidenceProbeBundle bundle = await DeploymentEvidenceProbeRunner.RunOnceAsync(
            http,
            "https://api.example.com",
            "/version",
            allowMissingOpenApi: true,
            syntheticProbeApiKey: null,
            syntheticProbeBearerToken: null,
            CancellationToken.None);

        bundle.AllRequiredPassed.Should().BeTrue();
    }

    [Fact]
    public async Task RunOnceAsync_authenticated_synthetic_sends_api_key_header()
    {
        string? capturedApiKey = null;

        Dictionary<string, Func<HttpRequestMessage, HttpResponseMessage>> routes =
            new(StringComparer.Ordinal)
            {
                ["/health/live"] =
                    _ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("OK") },
                ["/health/ready"] =
                    _ => new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(
                            JsonSerializer.Serialize(new { status = "Healthy" }, JsonCamel))
                    },
                ["/openapi/v1.json"] =
                    _ => new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(
                            JsonSerializer.Serialize(new { info = new { title = "ArchLucid" } }, JsonCamel))
                    },
                ["/version"] =
                    _ => new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(
                            JsonSerializer.Serialize(new { informationalVersion = "1.0.0-test" }, JsonCamel))
                    },
                ["/api/auth/me"] =
                    request =>
                    {
                        capturedApiKey = request.Headers.TryGetValues("X-Api-Key", out IEnumerable<string>? values)
                            ? values.FirstOrDefault()
                            : null;

                        return new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(
                                JsonSerializer.Serialize(new { name = "smoke-admin" }, JsonCamel))
                        };
                    }
            };

        using HttpClient http = new(new RouterHandler(routes));
        http.BaseAddress = new Uri("https://api.example/");

        DeploymentEvidenceProbeBundle bundle = await DeploymentEvidenceProbeRunner.RunOnceAsync(
            http,
            "https://api.example.com",
            "/api/auth/me",
            allowMissingOpenApi: false,
            syntheticProbeApiKey: "smoke-key",
            syntheticProbeBearerToken: null,
            CancellationToken.None);

        bundle.AllRequiredPassed.Should().BeTrue();
        capturedApiKey.Should().Be("smoke-key");
        bundle.Probes.Should().ContainSingle(probe =>
            probe.Name.Contains("/api/auth/me", StringComparison.Ordinal) && probe.Passed);
    }

    private sealed class RouterHandler(Dictionary<string, Func<HttpRequestMessage, HttpResponseMessage>> routes)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            string path = request.RequestUri?.AbsolutePath ?? "";

            return Task.FromResult(
                routes.TryGetValue(path, out Func<HttpRequestMessage, HttpResponseMessage>? factory)
                    ? factory(request)
                    : new HttpResponseMessage(HttpStatusCode.NotFound));
        }
    }
}

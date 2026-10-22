using System.Net;
using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotInitOrchestratorTests
{
    private const string BaseUrl = "https://pilot-init.test";

    [Fact]
    public async Task RunAsync_HappyPath_ReportsPassWhenRemoteAndTokenChecksSucceed()
    {
        Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", "admin-test-key");

        try
        {
            StubHandler handler = CreateHappyPathHandler();
            using HttpClient http = CreateClient(handler);
            PilotInitOrchestrator orchestrator = new(http);

            IConfiguration localConfiguration = MinimalPassingLocalConfiguration();

            PilotInitOptions options = new()
            {
                BaseUrl = BaseUrl,
                SimulateProduction = false,
                BearerToken = "eyJ.test",
                SkipTokenTest = false,
                RunOpenAiSmoke = false,
            };

            PilotInitReportDocument report = await orchestrator.RunAsync(options, localConfiguration);

            report.BlockingCount.Should().Be(0);
            report.Checks.Should().Contain(c => c.Name == "health/ready" && c.Passed);
            report.Checks.Should().Contain(c => c.Name == "auth:test-token" && c.Passed);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", null);
        }
    }

    [Fact]
    public async Task RunAsync_ReadyProbeFails_DispositionIsHold()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path == "/health/live")
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { }));

                if (path == "/health/ready")
                    return Task.FromResult(JsonResponse(HttpStatusCode.ServiceUnavailable, new { }));

                return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        PilotInitOrchestrator orchestrator = new(http);

        PilotInitOptions options = new()
        {
            BaseUrl = BaseUrl,
            SimulateProduction = false,
            SkipTokenTest = true,
            RunOpenAiSmoke = false,
        };

        PilotInitReportDocument report = await orchestrator.RunAsync(options, MinimalPassingLocalConfiguration());

        report.OverallDisposition.Should().Be("HOLD");
        report.Checks.Should().Contain(c => c.Name == "health/ready" && c.Disposition == PilotPreflightDisposition.Block);
    }

    private static IConfiguration MinimalPassingLocalConfiguration()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ConnectionStrings:ArchLucid"] = "Server=.;Database=ArchLucid;Trusted_Connection=True;Encrypt=True;",
            ["AgentExecution:Mode"] = "Simulator",
            ["ASPNETCORE_ENVIRONMENT"] = "Development",
        };

        return new ConfigurationBuilder().AddInMemoryCollection(values!).Build();
    }

    private static StubHandler CreateHappyPathHandler() =>
        new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path is "/health/live" or "/health/ready" or "/version")
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { status = "Healthy" }));

                if (path == "/openapi/v1.json")
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        openapi = "3.0.1",
                        info = new { version = "1.0.0" },
                    }));
                }

                if (path == "/v1/admin/auth/diagnose-token")
                {
                    return Task.FromResult(JsonResponse(
                        HttpStatusCode.OK,
                        new
                        {
                            resolvedRoles = new[] { "Admin" },
                            unmappedValues = Array.Empty<string>(),
                            warnings = Array.Empty<string>(),
                        }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

    private static HttpClient CreateClient(StubHandler handler) =>
        new(handler, disposeHandler: true) { BaseAddress = new Uri(BaseUrl + "/") };

    private static HttpResponseMessage JsonResponse(HttpStatusCode status, object payload) =>
        new(status)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json"),
        };

    private sealed class StubHandler : HttpMessageHandler
    {
        public Func<HttpRequestMessage, Task<HttpResponseMessage>>? OnRequest
        {
            get;
            init;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (OnRequest is null)
                throw new InvalidOperationException("OnRequest was not configured.");

            return OnRequest(request);
        }
    }
}

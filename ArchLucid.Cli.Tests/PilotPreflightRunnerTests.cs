using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Cli.Commands;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotPreflightRunnerTests
{
    private const string BaseUrl = "https://pilot.archlucid.test";

    [Fact]
    public async Task RunAsync_HappyPath_PassesRemoteProbes()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path == "/health/live" || path == "/health/ready" || path == "/version")
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { status = "Healthy" }));

                if (path == "/openapi/v1.json")
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        openapi = "3.0.1",
                        info = new { version = "1.0.0" },
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        PilotPreflightRunner runner = new(http);

        IReadOnlyList<PilotPreflightStepResult> localSteps =
        [
            new()
            {
                Name = "config:Auth",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = "DevelopmentBypass",
            },
        ];

        PilotPreflightReport report = await runner.RunAsync(BaseUrl, localSteps);

        report.AllBlockingPassed.Should().BeTrue();
        report.Steps.Should().Contain(s => s.Name == "health/ready" && s.Passed);
        report.Steps.Should().Contain(s => s.Name == "openapi/v1.json" && s.Passed);
    }

    [Fact]
    public async Task RunAsync_ReadyProbeFails_MarksBlock()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path == "/health/live")
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { }));

                if (path == "/health/ready")
                    return Task.FromResult(JsonResponse(HttpStatusCode.ServiceUnavailable, new { status = "Unhealthy" }));

                return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        PilotPreflightRunner runner = new(http);
        PilotPreflightReport report = await runner.RunAsync(BaseUrl, []);

        report.AllBlockingPassed.Should().BeFalse();
        report.Steps.Should().Contain(s => s.Name == "health/ready" && s.Disposition == PilotPreflightDisposition.Block);
    }

    [Fact]
    public void LocalSteps_MissingAuthMode_IsBlocking()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ConnectionStrings:ArchLucid"] = "Server=.;Database=ArchLucid;Trusted_Connection=True;Encrypt=True;",
            ["AgentExecution:Mode"] = "Simulator",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();
        IReadOnlyList<PilotPreflightStepResult> steps = PilotPreflightLocalSteps.Evaluate(configuration);

        steps.Should().Contain(s =>
            s.Name == "config:ArchLucidAuth:Mode" && s.Disposition == PilotPreflightDisposition.Block);
    }

    [Fact]
    public void LocalSteps_SimulateProduction_WithDevelopmentBypass_IsBlocking()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["ConnectionStrings:ArchLucid"] = "Server=.;Database=ArchLucid;Trusted_Connection=True;Encrypt=True;",
            ["AgentExecution:Mode"] = "Simulator",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();
        IReadOnlyList<PilotPreflightStepResult> steps = PilotPreflightLocalSteps.Evaluate(configuration, simulateProduction: true);

        steps.Should().Contain(s =>
            s.Name == "auth-lint:auth_mode_development_bypass_disallowed"
            && s.Disposition == PilotPreflightDisposition.Block
            && !string.IsNullOrWhiteSpace(s.Remediation));
    }

    [Fact]
    public void LocalSteps_SimulateProduction_JwtMissingAuthorityAndAudience_IsBlocking()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ConnectionStrings:ArchLucid"] = "Server=.;Database=ArchLucid;Trusted_Connection=True;Encrypt=True;",
            ["AgentExecution:Mode"] = "Simulator",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();
        IReadOnlyList<PilotPreflightStepResult> steps = PilotPreflightLocalSteps.Evaluate(configuration, simulateProduction: true);

        steps.Should().Contain(s =>
            s.Name == "auth-lint:jwt_bearer_missing_authority_and_pem"
            && s.Disposition == PilotPreflightDisposition.Block);
    }

    [Fact]
    public void LocalSteps_SimulateProduction_ApiKeyModeWithoutEnabledKeys_IsBlocking()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["Authentication:ApiKey:Enabled"] = "false",
            ["ConnectionStrings:ArchLucid"] = "Server=.;Database=ArchLucid;Trusted_Connection=True;Encrypt=True;",
            ["AgentExecution:Mode"] = "Simulator",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();
        IReadOnlyList<PilotPreflightStepResult> steps = PilotPreflightLocalSteps.Evaluate(configuration, simulateProduction: true);

        steps.Should().Contain(s =>
            s.Name == "auth-lint:api_key_mode_disabled_when_api_key_auth_configured"
            && s.Disposition == PilotPreflightDisposition.Block);
    }

    [Fact]
    public void LocalSteps_SimulateProduction_SamlEnabledWithoutMetadata_IsBlocking()
    {
        Dictionary<string, string?> values = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "ApiKey",
            ["Authentication:ApiKey:Enabled"] = "true",
            ["Authentication:ApiKey:AdminKey"] = "test-admin-key",
            ["ArchLucidAuth:Saml2:Enabled"] = "true",
            ["ConnectionStrings:ArchLucid"] = "Server=.;Database=ArchLucid;Trusted_Connection=True;Encrypt=True;",
            ["AgentExecution:Mode"] = "Simulator",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(values!).Build();
        IReadOnlyList<PilotPreflightStepResult> steps = PilotPreflightLocalSteps.Evaluate(configuration, simulateProduction: true);

        steps.Should().Contain(s =>
            s.Name == "auth-lint:saml2.idp_metadata_missing"
            && s.Disposition == PilotPreflightDisposition.Block);
    }

    private static HttpClient CreateClient(HttpMessageHandler handler)
    {
        HttpClient http = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return http;
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode status, object body)
    {
        string json = System.Text.Json.JsonSerializer.Serialize(body);
        HttpResponseMessage response = new(status)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json"),
        };

        return response;
    }

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

using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.QuickScan;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>TB-901 HTTP adversarial scenarios for anonymous marketing Quick Scan.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "QuickScanAdversarial")]
public sealed class QuickScanAdversarialMarketingApiTests
{
    [SkippableFact]
    public async Task Adversarial_post_when_emergency_disabled_never_calls_orchestrator()
    {
        Mock<IQuickScanExecutionOrchestrator> orchestrator = new();

        Mock<IQuickScanSafetyOperationalStateProvider> operational = CreateOperationalMock(
            new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = true,
                PublicMessage = "Emergency stop.",
                StoreHealthy = true,
            });

        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services => RegisterMocks(services, orchestrator, operational)));

        HttpClient client = factory.CreateClient();
        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/marketing/quick-scan",
            CreatePayload());

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        orchestrator.Verify(
            o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.IsAny<QuickScanExecutionRequestContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task Adversarial_post_when_sample_only_never_calls_orchestrator()
    {
        Mock<IQuickScanExecutionOrchestrator> orchestrator = new();

        Mock<IQuickScanSafetyOperationalStateProvider> operational = CreateOperationalMock(
            new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.SampleOnly,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = true,
                PublicMessage = "Sample only.",
                StoreHealthy = true,
            });

        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services => RegisterMocks(services, orchestrator, operational)));

        HttpClient client = factory.CreateClient();
        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/marketing/quick-scan",
            CreatePayload());

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        orchestrator.Verify(
            o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.IsAny<QuickScanExecutionRequestContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task Adversarial_sample_get_returns_static_payload_without_orchestrator()
    {
        Mock<IQuickScanExecutionOrchestrator> orchestrator = new();

        Mock<IQuickScanSafetyOperationalStateProvider> operational = CreateOperationalMock(
            new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.SampleOnly,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = true,
                PublicMessage = "Sample only.",
                StoreHealthy = true,
            });

        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services => RegisterMocks(services, orchestrator, operational)));

        HttpClient client = factory.CreateClient();
        HttpResponseMessage response = await client.GetAsync("/v1/marketing/quick-scan/sample?sourceState=SampleOnly");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        ArchitectureQuickScanResponse? body =
            await response.Content.ReadFromJsonAsync<ArchitectureQuickScanResponse>(IntegrationTestQuickScanJson.Options);
        body.Should().NotBeNull();
        body!.IsSampleResult.Should().BeTrue();
        body.ScanId.Should().Be("sample-quick-scan");

        orchestrator.Verify(
            o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.IsAny<QuickScanExecutionRequestContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task Adversarial_forged_session_header_is_accepted_but_still_routes_through_orchestrator_once()
    {
        ArchitectureQuickScanResponse scanBody = new()
        {
            ScanId = "forged-session-scan",
            SystemName = "Demo",
            PrimaryEnvironment = "Azure",
            Summary = "ok",
            CompletedUtc = DateTime.UtcNow,
        };

        Mock<IQuickScanExecutionOrchestrator> orchestrator = new();
        orchestrator
            .Setup(o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.IsAny<QuickScanExecutionRequestContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanExecutionResult.Success(scanBody));

        Mock<IQuickScanSafetyOperationalStateProvider> operational = CreateOperationalMock(
            QuickScanSafetyOperationalSnapshot.NormalExecution(new QuickScanSafetyOptions
            {
                Enabled = true,
                AnonymousExecutionEnabled = true,
            }));

        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services => RegisterMocks(services, orchestrator, operational)));

        HttpClient client = factory.CreateClient();
        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/marketing/quick-scan")
        {
            Content = JsonContent.Create(CreatePayload()),
        };

        request.Headers.Add("X-Quick-Scan-Session", "forged-session-id");

        HttpResponseMessage response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        orchestrator.Verify(
            o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.Is<QuickScanExecutionRequestContext>(c => c.SessionId == "forged-session-id"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static object CreatePayload() =>
        new
        {
            systemName = "Demo",
            primaryEnvironment = "Azure",
            description = "Three-tier web app with internal APIs.",
        };

    private static Mock<IQuickScanSafetyOperationalStateProvider> CreateOperationalMock(
        QuickScanSafetyOperationalSnapshot snapshot)
    {
        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        return operational;
    }

    private static void RegisterMocks(
        IServiceCollection services,
        Mock<IQuickScanExecutionOrchestrator> orchestrator,
        Mock<IQuickScanSafetyOperationalStateProvider> operational)
    {
        services.RemoveAll<IQuickScanExecutionOrchestrator>();
        services.AddSingleton(orchestrator.Object);
        services.RemoveAll<IQuickScanSafetyOperationalStateProvider>();
        services.AddSingleton(operational.Object);
    }
}

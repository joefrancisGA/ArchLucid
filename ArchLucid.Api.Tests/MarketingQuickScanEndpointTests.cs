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

/// <summary>
/// HTTP coverage for anonymous <c>/v1/marketing/quick-scan</c> (TB-895).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class MarketingQuickScanEndpointTests
{
    [SkippableFact]
    public async Task GetStatus_without_auth_returns_200()
    {
        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(_ => { });

        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/v1/marketing/quick-scan/status");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        QuickScanStatusResponse? body = await response.Content.ReadFromJsonAsync<QuickScanStatusResponse>();
        body.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task PostQuickScan_without_auth_delegates_to_orchestrator()
    {
        ArchitectureQuickScanResponse scanBody = new()
        {
            ScanId = "marketing-scan-1",
            SystemName = "Demo",
            PrimaryEnvironment = "Azure",
            Summary = "Marketing quick scan result.",
            CompletedUtc = DateTime.UtcNow,
        };

        Mock<IQuickScanExecutionOrchestrator> orchestrator = new();
        orchestrator
            .Setup(o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.IsAny<QuickScanExecutionRequestContext>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanExecutionResult.Success(scanBody));

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(QuickScanSafetyOperationalSnapshot.NormalExecution(new QuickScanSafetyOptions
            {
                Enabled = true,
                AnonymousExecutionEnabled = true,
            }));

        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services =>
            {
                services.RemoveAll<IQuickScanExecutionOrchestrator>();
                services.AddSingleton(orchestrator.Object);
                services.RemoveAll<IQuickScanSafetyOperationalStateProvider>();
                services.AddSingleton(operational.Object);
            }));

        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/v1/marketing/quick-scan",
            new
            {
                systemName = "Demo",
                primaryEnvironment = "Azure",
                description = "Three-tier web app with internal APIs.",
            });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        ArchitectureQuickScanResponse? body = await response.Content.ReadFromJsonAsync<ArchitectureQuickScanResponse>();
        body.Should().NotBeNull();
        body!.ScanId.Should().Be("marketing-scan-1");

        orchestrator.Verify(
            o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.Is<QuickScanExecutionRequestContext>(c => c.SessionId.Length > 0),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}

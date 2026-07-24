using ArchLucid.Api.Controllers.Marketing;
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

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class MarketingQuickScanEmergencyDisabledTests
{
    [SkippableFact]
    public async Task PostQuickScan_when_emergency_disabled_returns_503_without_calling_orchestrator()
    {
        Mock<IQuickScanExecutionOrchestrator> orchestrator = new();

        Mock<IQuickScanSafetyOperationalStateProvider> operational = new();
        operational
            .Setup(p => p.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QuickScanSafetyOperationalSnapshot
            {
                Mode = QuickScanSafetyOperationalMode.EmergencyDisabled,
                AnonymousExecutionAllowed = false,
                SampleResultAvailable = true,
                PublicMessage = "Emergency stop.",
                StoreHealthy = true,
            });

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
                systemName = "Test",
                primaryEnvironment = "Azure",
                description = "desc",
            });

        response.StatusCode.Should().Be(System.Net.HttpStatusCode.ServiceUnavailable);
        orchestrator.Verify(
            o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.IsAny<QuickScanExecutionRequestContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}

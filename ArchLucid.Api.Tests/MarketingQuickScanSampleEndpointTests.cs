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

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class MarketingQuickScanSampleEndpointTests
{
    [SkippableFact]
    public async Task GetSample_returns_labeled_static_result_without_calling_orchestrator()
    {
        Mock<IQuickScanExecutionOrchestrator> orchestrator = new();

        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(b =>
            b.ConfigureTestServices(services =>
            {
                services.RemoveAll<IQuickScanExecutionOrchestrator>();
                services.AddSingleton(orchestrator.Object);
            }));

        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync(
            "/v1/marketing/quick-scan/sample?sourceState=SampleOnly");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        ArchitectureQuickScanResponse? body =
            await response.Content.ReadFromJsonAsync<ArchitectureQuickScanResponse>(IntegrationTestQuickScanJson.Options);
        body.Should().NotBeNull();
        body!.IsSampleResult.Should().BeTrue();
        body.SystemName.Should().Be("Claims intake API");
        body.SystemName.Should().NotBe("Visitor system");

        orchestrator.Verify(
            o => o.ExecuteAsync(
                It.IsAny<ArchitectureQuickScanRequest?>(),
                It.IsAny<QuickScanExecutionRequestContext>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task GetStatus_includes_capacity_state()
    {
        await using OpenApiContractWebAppFactory baseFactory = new();
        await using WebApplicationFactory<Program> factory = baseFactory.WithWebHostBuilder(_ => { });

        HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/v1/marketing/quick-scan/status");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        QuickScanStatusResponse? body = await response.Content.ReadFromJsonAsync<QuickScanStatusResponse>();
        body.Should().NotBeNull();
        body!.CapacityState.Should().NotBeNullOrWhiteSpace();
        body.CapacityStateMessage.Should().NotBeNullOrWhiteSpace();
    }
}

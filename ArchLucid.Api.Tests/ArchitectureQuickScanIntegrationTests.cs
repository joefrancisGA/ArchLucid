using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Smoke coverage for minimal quick-scan path (simulator / fake LLM by default).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ArchitectureQuickScanIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Post_quick_scan_returns_findings_for_minimal_request()
    {
        ArchitectureQuickScanRequest payload = new()
        {
            SystemName = "orders-api",
            CloudProvider = "Azure",
            Description = "Stateful API on AKS with Service Bus and Azure SQL."
        };

        HttpResponseMessage response = await Client.PostAsync("/v1/architecture/quick-scan", JsonContent(payload));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        ArchitectureQuickScanResponse? body =
            await response.Content.ReadFromJsonAsync<ArchitectureQuickScanResponse>(JsonOptions);
        body.Should().NotBeNull();
        body!.Findings.Should().NotBeEmpty();
        body.Findings.Count.Should().BeLessOrEqualTo(5);
        body.Findings.Should().OnlyContain(f => !string.IsNullOrWhiteSpace(f.Title));
        body.Findings.Should().OnlyContain(f => !string.IsNullOrWhiteSpace(f.Description));
    }
}

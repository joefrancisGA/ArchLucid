using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Run Details.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureRunDetailsTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetRun_ReturnsTypedRunDetailsResponse()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        string systemName = TestRequestFactory.SystemNameForRequest(finalized.RequestId);
        HttpResponseMessage runResponse = await Client.GetAsync($"/v1/architecture/review/{finalized.RunId}");
        RunDetailsResponseDto? payload =
            await runResponse.ReadJsonForTestAsync<RunDetailsResponseDto>(JsonOptions);

        payload.Should().NotBeNull();
        payload.Run.RunId.Should().Be(finalized.RunId);
        payload.Tasks.Should().HaveCount(4);
        payload.Results.Should().HaveCount(4);
        payload.Manifest.Should().NotBeNull();
        payload.Manifest!.SystemName.Should().Be(systemName);
        payload.DecisionTraces.Should().NotBeEmpty();
        payload.ExecutionFlavorBuyerSummary.Should().NotBeNullOrWhiteSpace();
        payload.TrustEvidenceCard.Should().NotBeNull();
        payload.TrustEvidenceCard!.SelfAttestationNotice.Should().NotBeNullOrWhiteSpace();
        payload.TrustEvidenceCard.AuditTrail.Status.Should().NotBeNullOrWhiteSpace();

        Guid authorityRunKey = Guid.Parse(finalized.RunId);
        HttpResponseMessage authorityDetailResponse =
            await Client.GetAsync($"/v1/authority/reviews/{authorityRunKey:D}");
        await authorityDetailResponse.EnsureSuccessForTestAsync();
        using JsonDocument authorityDetailDoc =
            JsonDocument.Parse(await authorityDetailResponse.Content.ReadAsStringAsync());
        authorityDetailDoc.RootElement.GetProperty("executionFlavorBuyerSummary").GetString().Should().NotBeNullOrWhiteSpace();

        HttpResponseMessage roiResponse = await Client.GetAsync($"/v1/architecture/review/{finalized.RunId}/roi");
        await roiResponse.EnsureSuccessForTestAsync();
        using JsonDocument doc = JsonDocument.Parse(await roiResponse.Content.ReadAsStringAsync());

        doc.RootElement.GetProperty("finalized.RunId").GetString().Should().Be(finalized.RunId);
        doc.RootElement.GetProperty("estimatedManualHoursSaved").GetDouble().Should().BeGreaterThan(0);
    }
}

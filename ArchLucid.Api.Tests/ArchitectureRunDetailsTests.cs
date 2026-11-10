using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Architecture;

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
        RunDetailsResponseDto payload = await finalized.GetRunDetailsAsync(Client, JsonOptions);

        payload.Should().NotBeNull();
        payload.Run.RunId.Should().Be(finalized.RunId);
        payload.Tasks.Should().HaveCount(4);
        payload.Results.Should().HaveCount(4);
        payload.Manifest.Should().NotBeNull();
        payload.Manifest!.SystemName.Should().Be(finalized.SystemName);
        payload.DecisionTraces.Should().NotBeEmpty();
        payload.ExecutionFlavorBuyerSummary.Should().NotBeNullOrWhiteSpace();
        payload.TrustEvidenceCard.Should().NotBeNull();
        payload.TrustEvidenceCard!.SelfAttestationNotice.Should().NotBeNullOrWhiteSpace();
        payload.TrustEvidenceCard.AuditTrail.Status.Should().NotBeNullOrWhiteSpace();

        HttpResponseMessage authorityDetailResponse =
            await Client.GetAsync($"/v1/authority/reviews/{finalized.RunGuid:D}");
        await authorityDetailResponse.EnsureSuccessForTestAsync();
        using JsonDocument authorityDetailDoc =
            JsonDocument.Parse(await authorityDetailResponse.Content.ReadAsStringAsync());
        authorityDetailDoc.RootElement.GetProperty("executionFlavorBuyerSummary").GetString().Should().NotBeNullOrWhiteSpace();

        RunRoiScorecardDto roi = await finalized.GetRoiAsync(Client, JsonOptions);
        roi.RunId.Should().Be(finalized.RunId);
        roi.EstimatedManualHoursSaved.Should().BeGreaterThan(0);
    }
}

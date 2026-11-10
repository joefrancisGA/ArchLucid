using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Compare.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureCompareTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareManifests_ReturnsDiff()
    {
        FinalizedRun finalized = await CreateFinalizedRunAsync(TestRequestIds.ForScenario(nameof(ArchitectureCompareTests)));
        const string requestedReplayManifestVersion = "v1-replay";

        HttpResponseMessage replayResponse = await Client.PostReviewReplayForTestAsync(Factory, 
            finalized.RunId,
            commitReplay: true,
            manifestVersionOverride: requestedReplayManifestVersion);

                ReplayRunResponseDto? replayPayload =
            await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions);
        replayPayload.Should().NotBeNull();
        replayPayload.Manifest.Should().NotBeNull();
        string rightVersion = replayPayload.Manifest!.Metadata.ManifestVersion;
        rightVersion.Should().Be(requestedReplayManifestVersion);

        HttpResponseMessage compareResponse = await Client.GetAsync(
            $"/v1/architecture/manifest/compare?leftVersion={Uri.EscapeDataString(finalized.ManifestVersion)}&rightVersion={Uri.EscapeDataString(rightVersion)}");

        compareResponse.StatusCode.Should().Be(HttpStatusCode.OK, await compareResponse.Content.ReadAsStringAsync());

        ManifestCompareResponse? payload =
            await compareResponse.ReadJsonForTestAsync<ManifestCompareResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Diff.Should().NotBeNull();
        payload.Diff.LeftManifestVersion.Should().Be(finalized.ManifestVersion);
        payload.Diff.RightManifestVersion.Should().Be(rightVersion);
    }
}

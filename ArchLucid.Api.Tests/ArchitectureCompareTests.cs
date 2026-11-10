using System.Net;

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

        string rightVersion = await Replay.CommitReplayManifestVersionAsync(
            finalized.RunId,
            requestedReplayManifestVersion);
        rightVersion.Should().Be(requestedReplayManifestVersion);

        HttpResponseMessage compareResponse = await Client.GetAsync(
            $"/v1/architecture/manifest/compare?leftVersion={Uri.EscapeDataString(finalized.ManifestVersion)}&rightVersion={Uri.EscapeDataString(rightVersion)}");

        compareResponse.StatusCode.Should().Be(HttpStatusCode.OK, await compareResponse.Content.ReadAsStringAsync());

        ManifestCompareResponse payload =
            await compareResponse.ReadJsonForTestAsync<ManifestCompareResponse>(JsonOptions);
        payload.Diff.Should().NotBeNull();
        payload.Diff.LeftManifestVersion.Should().Be(finalized.ManifestVersion);
        payload.Diff.RightManifestVersion.Should().Be(rightVersion);
    }
}

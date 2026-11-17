using System.Net;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Compare Summary.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureCompareSummaryTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareManifestsSummary_ReturnsMarkdownSummary()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        const string requestedReplayManifestVersion = "v1-replay";

        string rightVersion = await Replay.CommitReplayManifestVersionAsync(
            finalized.RunId,
            requestedReplayManifestVersion);
        rightVersion.Should().Be(requestedReplayManifestVersion);

        HttpResponseMessage response = await Client.GetAsync(
            $"/v1/architecture/manifest/compare/summary?leftVersion={Uri.EscapeDataString(finalized.ManifestVersion)}&rightVersion={Uri.EscapeDataString(rightVersion)}");

        ManifestCompareSummaryResponse payload =
            await response.ReadJsonForTestAsync<ManifestCompareSummaryResponse>(JsonOptions);
        payload.Format.Should().Be("markdown");
        payload.Summary.Should().Contain("# Manifest Comparison");
        payload.Diff.LeftManifestVersion.Should().Be(finalized.ManifestVersion);
        payload.Diff.RightManifestVersion.Should().Be(rightVersion);
    }
}

using System.Net;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Compare Export.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureCompareExportTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareManifestsExport_ReturnsMarkdownExport()
    {
        FinalizedRun finalized = await CreateFinalizedRunAsync(TestRequestIds.ForScenario(nameof(ArchitectureCompareExportTests)));
        const string requestedReplayManifestVersion = "v1-replay";

        string rightVersion = await Replay.CommitReplayManifestVersionAsync(
            finalized.RunId,
            requestedReplayManifestVersion);
        rightVersion.Should().Be(requestedReplayManifestVersion);

        HttpResponseMessage response = await Client.GetAsync(
            $"/v1/architecture/manifest/compare/export?leftVersion={Uri.EscapeDataString(finalized.ManifestVersion)}&rightVersion={Uri.EscapeDataString(rightVersion)}");

        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        ManifestCompareExportResponse payload =
            await response.ReadJsonForTestAsync<ManifestCompareExportResponse>(JsonOptions);
        payload.Format.Should().Be("markdown");
        payload.Content.Should().Contain("# ArchLucid Manifest Comparison Export");
        payload.Content.Should().Contain(finalized.ManifestVersion);
        payload.Content.Should().Contain(rightVersion);
    }
}

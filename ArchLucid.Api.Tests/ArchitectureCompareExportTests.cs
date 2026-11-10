using System.Net;
using System.Net.Http.Json;

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
        FinalizedRun finalized = await CreateFinalizedRunAsync("REQ-COMPARE-EXPORT-001");
        const string requestedReplayManifestVersion = "v1-replay";

        HttpResponseMessage replayResponse = await PostReviewReplayAsync(
            finalized.RunId,
            commitReplay: true,
            manifestVersionOverride: requestedReplayManifestVersion);
        await replayResponse.EnsureSuccessForTestAsync();
        ReplayRunResponseDto? replayPayload =
            await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions);
        replayPayload.Should().NotBeNull();
        replayPayload.Manifest.Should().NotBeNull();
        string rightVersion = replayPayload.Manifest!.Metadata.ManifestVersion;
        rightVersion.Should().Be(requestedReplayManifestVersion);

        HttpResponseMessage response = await Client.GetAsync(
            $"/v1/architecture/manifest/compare/export?leftVersion={Uri.EscapeDataString(finalized.ManifestVersion)}&rightVersion={Uri.EscapeDataString(rightVersion)}");

        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());

        ManifestCompareExportResponse? payload =
            await response.ReadJsonForTestAsync<ManifestCompareExportResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Format.Should().Be("markdown");
        payload.Content.Should().Contain("# ArchLucid Manifest Comparison Export");
        payload.Content.Should().Contain(finalized.ManifestVersion);
        payload.Content.Should().Contain(rightVersion);
    }
}

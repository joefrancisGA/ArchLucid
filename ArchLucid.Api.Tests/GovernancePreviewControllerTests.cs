using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Governance Preview Controller.
/// </summary>
[Trait("Category", "Integration")]
public sealed class GovernancePreviewControllerTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CompareEnvironments_ReturnsOk()
    {
        var body = new { sourceEnvironment = "dev", targetEnvironment = "test" };
        HttpResponseMessage response = await Client.PostAsync(
            "/v1/governance-preview/compare-environments",
            JsonContent(body));        GovernanceEnvironmentComparisonResultDto? payload =
            await response.ReadJsonForTestAsync<GovernanceEnvironmentComparisonResultDto>(JsonOptions);
        payload.Should().NotBeNull();
        payload.SourceEnvironment.Should().Be("dev");
        payload.TargetEnvironment.Should().Be("test");
        payload.Notes.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task Preview_ReturnsNotFound_WhenRunMissing()
    {
        string missingRunId = Guid.NewGuid().ToString("D");
        var body = new { runId = missingRunId, manifestVersion = "v1", environment = "dev" };

        HttpResponseMessage response = await Client.PostAsync("/v1/governance-preview/preview", JsonContent(body));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Preview_ReturnsOk_AfterCommittedRun()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        var previewBody = new { runId = finalized.RunId, manifestVersion = finalized.ManifestVersion, environment = "dev" };
        HttpResponseMessage previewResponse =
            await Client.PostAsync("/v1/governance-preview/preview", JsonContent(previewBody));        GovernancePreviewResultDto? preview =
            await previewResponse.ReadJsonForTestAsync<GovernancePreviewResultDto>(JsonOptions);
        preview.Should().NotBeNull();
        preview.PreviewRunId.Should().Be(finalized.RunId);
        preview.PreviewManifestVersion.Should().Be(finalized.ManifestVersion);
        preview.Environment.Should().Be("dev");
    }
}

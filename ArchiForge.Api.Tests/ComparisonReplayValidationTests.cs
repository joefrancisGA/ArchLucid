using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace ArchiForge.Api.Tests;

/// <summary>Asserts that invalid comparison replay request body returns 400 with validation errors.</summary>
[Trait("Category", "Integration")]
public sealed class ComparisonReplayValidationTests : IntegrationTestBase
{
    public ComparisonReplayValidationTests(ArchiForgeApiFactory factory)
        : base(factory)
    {
    }

    [Fact]
    public async Task ReplayComparison_InvalidFormatAndReplayMode_Returns400WithValidationErrors()
    {
        var (runId, replayRunId) = await ComparisonReplayTestFixture.CreateRunExecuteCommitReplayAsync(
            Client, JsonOptions, "REQ-VALIDATE-001");
        var comparisonRecordId = await ComparisonReplayTestFixture.PersistEndToEndComparisonAsync(
            Client, runId, replayRunId);

        var invalidBody = new { format = "invalid", replayMode = "bad" };
        var response = await Client.PostAsync(
            $"/v1/architecture/comparisons/{comparisonRecordId}/replay",
            JsonContent(invalidBody));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().ContainEquivalentOf("Format");
        body.Should().ContainEquivalentOf("ReplayMode");
    }
}

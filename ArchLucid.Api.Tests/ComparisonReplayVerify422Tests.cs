using System.Net;
using System.Text;
using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Comparison Replay Verify422.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ComparisonReplayVerify422Tests(ComparisonVerify422ApiFactory factory)
    : IntegrationTestBase(factory), IClassFixture<ComparisonVerify422ApiFactory>
{
    [SkippableFact]
    public async Task ReplayComparison_WhenVerificationFails_Returns422ProblemDetailsWithDrift()
    {
        CommittedReplayPair pair = await ArrangeCommittedPairAsync();
        PersistedComparison persisted = await Replay.PersistEndToEndComparisonAsync(pair.RunId, pair.ReplayRunId);
        string comparisonRecordId = persisted.ComparisonRecordId;

        string body =
            JsonSerializer.Serialize(new { format = "markdown", replayMode = "verify", persistReplay = false });
        HttpResponseMessage response = await Client.PostAsync(
            $"/v1/architecture/comparisons/{Uri.EscapeDataString(comparisonRecordId)}/replay",
            new StringContent(body, Encoding.UTF8, "application/json"));

        JsonDocument doc = await response.AssertProblemForTestAsync(HttpStatusCode.UnprocessableEntity);
        doc.RootElement.GetProperty("type").GetString().Should().Contain("comparison-verification-failed");
        doc.RootElement.GetProperty("driftDetected").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("driftSummary").GetString().Should().Be("integration-test drift");
    }
}

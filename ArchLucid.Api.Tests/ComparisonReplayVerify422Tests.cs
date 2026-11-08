using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Metadata;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Tests;

/// <summary>Replaces comparison replay with a service that always fails verify, to assert HTTP 422 pipeline.</summary>
public sealed class ComparisonVerify422ApiFactory : ArchLucidApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IComparisonReplayService>();
            services.AddScoped<IComparisonReplayService, ForcedComparisonVerificationFailureReplayService>();
        });
    }
}

internal sealed class ForcedComparisonVerificationFailureReplayService : IComparisonReplayService
{
    public Task<ReplayComparisonResult> ReplayAsync(
        ReplayComparisonRequest request,
        CancellationToken cancellationToken = default)
    {
        throw new ComparisonVerificationFailedException(
            "Regenerated comparison does not match stored payload.",
            new DriftAnalysisResult { DriftDetected = true, Summary = "integration-test drift" });
    }

    public Task<DriftAnalysisResult> AnalyzeDriftAsync(
        string comparisonRecordId,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new DriftAnalysisResult());
    }

    public Task EnsureArtifactReplayAccessAllowedAsync(
        ComparisonRecord record,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}

/// <summary>
///     Tests for Comparison Replay Verify422.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ComparisonReplayVerify422Tests(ComparisonVerify422ApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ReplayComparison_WhenVerificationFails_Returns422ProblemDetailsWithDrift()
    {
        (string runId, string replayRunId) = await ComparisonReplayTestFixture.CreateRunExecuteCommitReplayAsync(
            Client, JsonOptions, Factory, "REQ-VERIFY-422-001");
        string comparisonRecordId = await ComparisonReplayTestFixture.PersistEndToEndComparisonAsync(
            Client, runId, replayRunId);

        string body =
            JsonSerializer.Serialize(new { format = "markdown", replayMode = "verify", persistReplay = false });
        HttpResponseMessage response = await Client.PostAsync(
            $"/v1/architecture/comparisons/{Uri.EscapeDataString(comparisonRecordId)}/replay",
            new StringContent(body, Encoding.UTF8, "application/json"));

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        string json = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(json);
        doc.RootElement.GetProperty("status").GetInt32().Should().Be(422);
        doc.RootElement.GetProperty("title").GetString().Should().Be("Unprocessable Entity");
        doc.RootElement.GetProperty("type").GetString().Should().Contain("comparison-verification-failed");
        doc.RootElement.GetProperty("driftDetected").GetBoolean().Should().BeTrue();
        doc.RootElement.GetProperty("driftSummary").GetString().Should().Be("integration-test drift");
    }
}

using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>RC30 harness coverage: real-AI gate cost-estimate token paths and journey report DTOs.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReviewApiHarnessPackageCoverageBatchRc30Tests
{
    [Fact]
    public void RealAiExecutionGate_ReadFromRunDetail_reads_cost_estimate_token_counts()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "run": {
                "structuralExecutionMode": 1,
                "realModeFellBackToSimulator": false
              },
              "agentExecutionLlmCostEstimate": {
                "tokenCounts": {
                  "Prompt": "12",
                  "completion": 8
                }
              }
            }
            """);

        (string? mode, bool fellBack, long tokens) = RealAiExecutionGate.ReadFromRunDetail(document.RootElement);

        mode.Should().Be("1");
        fellBack.Should().BeFalse();
        tokens.Should().Be(20);
    }

    [Fact]
    public void RealAiExecutionGate_Evaluate_accepts_numeric_real_mode_and_missing_mode_errors()
    {
        RealAiExecutionGate.Evaluate("1", false, 5).Passed.Should().BeTrue();

        ResponseValidationResult missingMode = RealAiExecutionGate.Evaluate(null, false, 5);
        missingMode.Passed.Should().BeFalse();
        missingMode.Errors.Should().Contain(e => e.Contains("structuralExecutionMode is missing", StringComparison.Ordinal));
    }

    [Fact]
    public void JourneyReport_and_JourneyOptions_defaults_expose_operator_journey_contract()
    {
        JourneyOptions options = new()
        {
            ApiBaseUrl = "https://api.example.test",
            RequireNonZeroLlmTokens = false,
        };

        options.TimeoutSeconds.Should().Be(JourneyOptions.DefaultTimeoutSeconds);
        options.PollIntervalSeconds.Should().Be(JourneyOptions.DefaultPollIntervalSeconds);
        options.ReviewerActorId.Should().Be(JourneyOptions.DefaultReviewerActorId);
        options.RequireNonZeroLlmTokens.Should().BeFalse();

        JourneyReport report = new()
        {
            Steps = [
                new JourneyStepResult
                {
                    Name = "create",
                    Passed = true,
                    Detail = "ok",
                    ElapsedMilliseconds = 42,
                },
            ],
            AllPassed = true,
            RunId = "run-1",
            CorrelationId = "corr-1",
            FinalRunStatus = "Committed",
            ManifestVersion = "v2",
            ApprovalRequestId = "approval-1",
            TotalLlmTokens = 120,
            StructuralExecutionMode = "Real",
            TotalElapsedMilliseconds = 5000,
        };

        report.AllPassed.Should().BeTrue();
        report.Steps[0].Passed.Should().BeTrue();
        report.TotalLlmTokens.Should().Be(120);
    }
}

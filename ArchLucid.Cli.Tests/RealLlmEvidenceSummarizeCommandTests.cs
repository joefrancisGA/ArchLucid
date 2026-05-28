using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RealLlmEvidenceSummarizeCommandTests
{
    [Fact]
    public void Summarize_simulator_only_skips()
    {
        const string json = """{"simulatorOnlyRelease":true}""";

        (int code, string md) = RealLlmEvidenceSummarizeCommand.Summarize(json);

        code.Should().Be(CliExitCode.Success);
        md.Should().Contain("SKIPPED");
    }

    [Fact]
    public void Summarize_complete_fixture_succeeds()
    {
        const string json = """
                            {
                              "simulatorOnlyRelease": false,
                              "promptRedactionEnabled": true,
                              "rawPromptIncludedInExport": false,
                              "deploymentId": "dep-1",
                              "modelLabel": "gpt-4o",
                              "inputTokens": 10,
                              "outputTokens": 20,
                              "totalCostUsd": 0.01,
                              "qualityGateOutcome": "pass",
                              "committedFindingsCount": 2,
                              "topFindingEvidenceChainResolved": true,
                              "reportRelativePath": "artifacts/session.md"
                            }
                            """;

        (int code, string md) = RealLlmEvidenceSummarizeCommand.Summarize(json);

        code.Should().Be(CliExitCode.Success);
        md.Should().Contain("COMPLETE");
        md.Should().Contain("dep-1");
    }

    [Fact]
    public void Summarize_missing_cost_fails()
    {
        const string json = """
                            {
                              "simulatorOnlyRelease": false,
                              "promptRedactionEnabled": true,
                              "rawPromptIncludedInExport": false,
                              "deploymentId": "dep-1",
                              "inputTokens": 1,
                              "outputTokens": 1,
                              "qualityGateOutcome": "pass",
                              "committedFindingsCount": 1,
                              "topFindingEvidenceChainResolved": true
                            }
                            """;

        (int code, string md) = RealLlmEvidenceSummarizeCommand.Summarize(json);

        code.Should().Be(CliExitCode.OperationFailed);
        md.Should().Contain("total cost USD missing");
    }

    [Fact]
    public void Summarize_rejected_quality_gate_fails()
    {
        const string json = """
                            {
                              "simulatorOnlyRelease": false,
                              "promptRedactionEnabled": true,
                              "rawPromptIncludedInExport": false,
                              "deploymentId": "dep-1",
                              "inputTokens": 1,
                              "outputTokens": 1,
                              "totalCostUsd": 0.01,
                              "qualityGateOutcome": "rejected",
                              "committedFindingsCount": 1,
                              "topFindingEvidenceChainResolved": true
                            }
                            """;

        (int code, string md) = RealLlmEvidenceSummarizeCommand.Summarize(json);

        code.Should().Be(CliExitCode.OperationFailed);
        md.Should().Contain("quality gate outcome not passing: rejected");
    }
}

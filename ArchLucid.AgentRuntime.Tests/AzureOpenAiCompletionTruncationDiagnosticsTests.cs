using ArchLucid.AgentRuntime;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AzureOpenAiCompletionTruncationDiagnosticsTests
{
    [Fact]
    public void IsOutputTruncated_returns_true_only_for_length_finish_reason()
    {
        AzureOpenAiCompletionTruncationDiagnostics.IsOutputTruncated(ChatFinishReason.Length).Should().BeTrue();
        AzureOpenAiCompletionTruncationDiagnostics.IsOutputTruncated(ChatFinishReason.Stop).Should().BeFalse();
    }

    [Fact]
    public void ReportIfOutputTruncated_invokes_reporter_when_finish_reason_is_length()
    {
        Mock<ILlmCompletionOutputTruncationReporter> reporter = new();

        AzureOpenAiCompletionTruncationDiagnostics.ReportIfOutputTruncated(
            ChatFinishReason.Length,
            maxOutputTokens: 4096,
            deploymentName: "gpt-5.6-terra",
            outputTokenCount: 4096,
            reasoningTokenCount: 0,
            logger: NullLogger.Instance,
            reporter: reporter.Object);

        reporter.Verify(
            r => r.Report(
                It.Is<LlmCompletionOutputTruncationEvent>(e =>
                    e.DeploymentName == "gpt-5.6-terra"
                    && e.MaxOutputTokens == 4096
                    && e.OutputTokenCount == 4096)),
            Times.Once);
    }

    [Fact]
    public void ReportIfOutputTruncated_does_not_invoke_reporter_when_finish_reason_is_stop()
    {
        Mock<ILlmCompletionOutputTruncationReporter> reporter = new();

        AzureOpenAiCompletionTruncationDiagnostics.ReportIfOutputTruncated(
            ChatFinishReason.Stop,
            maxOutputTokens: 4096,
            deploymentName: "gpt-5.6-terra",
            outputTokenCount: 120,
            reasoningTokenCount: 0,
            logger: NullLogger.Instance,
            reporter: reporter.Object);

        reporter.Verify(r => r.Report(It.IsAny<LlmCompletionOutputTruncationEvent>()), Times.Never);
    }
}

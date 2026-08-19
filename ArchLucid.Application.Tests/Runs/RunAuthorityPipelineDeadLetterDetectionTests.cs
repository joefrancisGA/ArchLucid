using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunAuthorityPipelineDeadLetterDetectionTests
{
    [Fact]
    public void IsDeadLettered_returns_true_for_pipeline_dead_letter_failure_class()
    {
        AgentExecutionFailureSummary summary = new()
        {
            FailureClass = AgentExecutionFailureClasses.PipelineDeadLetter,
        };

        string json = AgentExecutionFailureSummaryJson.Serialize(summary);

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeTrue();
    }

    [Fact]
    public void IsDeadLettered_returns_false_for_other_failure_classes()
    {
        AgentExecutionFailureSummary summary = new()
        {
            FailureClass = AgentExecutionFailureClasses.Timeout,
        };

        string json = AgentExecutionFailureSummaryJson.Serialize(summary);

        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(json).Should().BeFalse();
    }

    [Fact]
    public void IsDeadLettered_returns_false_for_null_or_non_json()
    {
        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered((string?)null).Should().BeFalse();
        RunAuthorityPipelineDeadLetterDetection.IsDeadLettered("plain text").Should().BeFalse();
    }
}

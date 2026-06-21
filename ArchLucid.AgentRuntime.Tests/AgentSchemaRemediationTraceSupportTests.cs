using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentSchemaRemediationTraceSupportTests
{
    [Fact]
    public void ShouldSkipHandlerFailureTrace_for_schema_and_validation_failures()
    {
        AgentSchemaRemediationTraceSupport
            .ShouldSkipHandlerFailureTrace(new AgentResultSchemaViolationException(
                "schema failed",
                ["bad field"],
                "{}",
                AgentType.Topology))
            .Should()
            .BeTrue();

        AgentSchemaRemediationTraceSupport
            .ShouldSkipHandlerFailureTrace(new AgentResultValidationException("run mismatch"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ShouldSkipHandlerFailureTrace_for_retryable_parse_failures()
    {
        InvalidOperationException ex = new("Failed to deserialize AgentResult from JSON.");

        AgentSchemaRemediationTraceSupport.ShouldSkipHandlerFailureTrace(ex).Should().BeTrue();
    }

    [Fact]
    public void ShouldSkipHandlerFailureTrace_false_for_unrelated_exceptions()
    {
        AgentSchemaRemediationTraceSupport
            .ShouldSkipHandlerFailureTrace(new InvalidOperationException("network timeout"))
            .Should()
            .BeFalse();
    }
}

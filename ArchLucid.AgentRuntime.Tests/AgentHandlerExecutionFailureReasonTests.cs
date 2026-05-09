using ArchLucid.Contracts.Agents;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AgentHandlerExecutionFailureReasonTests
{
    [SkippableFact]
    public void ResolveFailureReasonCode_llm_quota()
    {
        LlmTokenQuotaExceededException ex = new("q", TimeProvider.System.GetUtcNow().AddHours(1));

        string? code = AgentHandlerExecutionFailureReason.ResolveFailureReasonCode(ex);

        code.Should().Be(AgentExecutionTraceFailureReasonCodes.LlmTokenQuotaExceeded);
    }
}

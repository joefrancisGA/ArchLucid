using ArchLucid.Core.Metering;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Metering;

[Trait("Category", "Unit")]
public sealed class UsageEventIdempotencyKeysTests
{
    [Theory]
    [InlineData(UsageMeterKind.LlmPromptTokens, "llm:activity-1:LlmPromptTokens")]
    [InlineData(UsageMeterKind.LlmCompletionTokens, "llm:activity-1:LlmCompletionTokens")]
    public void ForLlmTokens_builds_stable_kind_specific_key(UsageMeterKind kind, string expected)
    {
        string key = UsageEventIdempotencyKeys.ForLlmTokens("activity-1", kind);

        key.Should().Be(expected);
    }

    [SkippableFact]
    public void ForApiRequest_uses_trace_identifier()
    {
        UsageEventIdempotencyKeys.ForApiRequest("trace-abc").Should().Be("api:trace-abc");
    }

    [SkippableFact]
    public void ForArchitectureRun_uses_run_id()
    {
        UsageEventIdempotencyKeys.ForArchitectureRun("run-123").Should().Be("run:run-123");
    }
}

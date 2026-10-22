using ArchLucid.Core.Metering;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Metering;

[Trait("Category", "Unit")]
public sealed class UsageEventIdempotencyKeysTests
{
    [SkippableFact]
    public void ForLlmTokens_builds_stable_kind_specific_key()
    {
        string key = UsageEventIdempotencyKeys.ForLlmTokens("activity-1", UsageMeterKind.LlmPromptTokens);

        key.Should().Be("llm:activity-1:LlmPromptTokens");
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

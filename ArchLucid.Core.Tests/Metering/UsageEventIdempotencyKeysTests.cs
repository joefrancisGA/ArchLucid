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
    public void ForApiRequest_uses_stable_event_identity_in_new_namespace()
    {
        Guid eventId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string key = UsageEventIdempotencyKeys.ForApiRequest(eventId);

        key.Should().Be("api-event:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        UsageEventIdempotencyKeys.ForApiRequest(eventId).Should().Be(key);
        UsageEventIdempotencyKeys.ForApiRequest(Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"))
            .Should().NotBe(key);
        key.Length.Should().BeLessThanOrEqualTo(UsageEventIdempotencyKeys.MaxLength);
    }

    [SkippableFact]
    public void ForApiRequest_rejects_empty_event_id()
    {
        Action act = () => UsageEventIdempotencyKeys.ForApiRequest(Guid.Empty);
        act.Should().Throw<ArgumentException>();
    }

    [SkippableFact]
    public void ForArchitectureRun_uses_run_id()
    {
        UsageEventIdempotencyKeys.ForArchitectureRun("run-123").Should().Be("run:run-123");
    }
}

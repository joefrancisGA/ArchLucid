using ArchLucid.AgentRuntime.Safety;
using ArchLucid.Core.Safety;

using Azure;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Safety;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureContentSafetyGuardSdkFailureTests
{
    [SkippableTheory]
    [InlineData(503)]
    [InlineData(429)]
    public void HandleSdkFailure_when_fail_closed_blocks_on_http_errors(int statusCode)
    {
        RequestFailedException ex = new(statusCode, "Content safety unavailable", null, null);

        ContentSafetyResult result = AzureContentSafetyGuard.HandleSdkFailure(ex, failClosedOnSdkError: true);

        result.IsAllowed.Should().BeFalse();
        result.Category.Should().Be("SdkError");
        result.BlockReason.Should().Contain("Content safety service error");
    }

    [SkippableTheory]
    [InlineData(503)]
    [InlineData(429)]
    public void HandleSdkFailure_when_fail_open_allows_on_http_errors(int statusCode)
    {
        RequestFailedException ex = new(statusCode, "Content safety throttled", null, null);

        ContentSafetyResult result = AzureContentSafetyGuard.HandleSdkFailure(ex, failClosedOnSdkError: false);

        result.IsAllowed.Should().BeTrue();
        result.Category.Should().BeNull();
    }
}

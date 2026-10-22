using ArchLucid.Core.Authority;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Authority;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DisabledAsyncAuthorityPipelineModeResolverTests
{
    [Fact]
    public async Task DisabledAsyncAuthorityPipelineModeResolver_never_queues_stages()
    {
        DisabledAsyncAuthorityPipelineModeResolver sut = new();

        bool shouldQueue = await sut.ShouldQueueContextAndGraphStagesAsync(CancellationToken.None);

        shouldQueue.Should().BeFalse();
    }
}

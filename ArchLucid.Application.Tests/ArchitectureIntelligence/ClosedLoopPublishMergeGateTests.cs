using ArchLucid.Application.ArchitectureIntelligence.Stages;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Application")]
[Trait("Category", "Unit")]
public sealed class ClosedLoopPublishMergeGateTests
{
    [Fact]
    public void ShouldMergeAuthorityFindings_is_false_when_publish_is_blocked()
    {
        bool merge = ClosedLoopPublishMergeGate.ShouldMergeAuthorityFindings(
            publishBlocked: true,
            publishToProductRequested: true);

        merge.Should().BeFalse();
    }

    [Fact]
    public void ShouldMergeAuthorityFindings_is_false_when_product_publish_was_not_requested()
    {
        bool merge = ClosedLoopPublishMergeGate.ShouldMergeAuthorityFindings(
            publishBlocked: false,
            publishToProductRequested: false);

        merge.Should().BeFalse();
    }

    [Fact]
    public void ShouldMergeAuthorityFindings_is_true_when_unblocked_and_requested()
    {
        bool merge = ClosedLoopPublishMergeGate.ShouldMergeAuthorityFindings(
            publishBlocked: false,
            publishToProductRequested: true);

        merge.Should().BeTrue();
    }
}

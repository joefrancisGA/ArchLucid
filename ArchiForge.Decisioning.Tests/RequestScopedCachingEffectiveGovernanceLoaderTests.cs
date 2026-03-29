using ArchiForge.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// Tests for Request Scoped Caching Effective Governance Loader.
/// </summary>

public sealed class RequestScopedCachingEffectiveGovernanceLoaderTests
{
    [Fact]
    public async Task LoadEffectiveContentAsync_SecondCallSameScope_DoesNotCallInnerTwice()
    {
        Mock<IEffectiveGovernanceLoader> inner = new();
        PolicyPackContentDocument doc = new();
        inner
            .Setup(x => x.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(doc);

        RequestScopedCachingEffectiveGovernanceLoader sut = new(inner.Object);
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        CancellationToken cancellation = CancellationToken.None;

        PolicyPackContentDocument first = await sut.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, cancellation);
        PolicyPackContentDocument second = await sut.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, cancellation);

        first.Should().BeSameAs(second);
        inner.Verify(
            x => x.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, cancellation),
            Times.Once);
    }

    [Fact]
    public async Task LoadEffectiveContentAsync_DifferentProject_CallsInnerAgain()
    {
        Mock<IEffectiveGovernanceLoader> inner = new();
        inner
            .Setup(x => x.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());

        RequestScopedCachingEffectiveGovernanceLoader sut = new(inner.Object);
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectA = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid projectB = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        CancellationToken cancellation = CancellationToken.None;

        await sut.LoadEffectiveContentAsync(tenantId, workspaceId, projectA, cancellation);
        await sut.LoadEffectiveContentAsync(tenantId, workspaceId, projectB, cancellation);

        inner.Verify(
            x => x.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                cancellation),
            Times.Exactly(2));
    }
}

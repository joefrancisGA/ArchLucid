using ArchLucid.Application.Architecture;
using ArchLucid.Application.Runs.Orchestration.Create.Hooks;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.GoldenCorpus;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration.Create.Hooks;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunCreateIdentityLinkHookTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task TryLinkReviewRunArchitectureIdentityAsync_pins_version_when_greenfield_identity_is_minted()
    {
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid architectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(
            new GoldenCohortItem
            {
                Id = "gc-001",
                Title = "Baseline Azure web workload (single region)",
            });

        Mock<IArchitectureIdentityService> identityService = new();
        identityService
            .Setup(s => s.TryEnsureReviewRunLinkedAsync(
                Scope,
                reviewRunId,
                request,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord { ArchitectureId = architectureId });

        Mock<IArchitectureVersionService> versionService = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ArchitectureRunCreateIdentityLinkHook sut = new(
            identityService.Object,
            versionService.Object,
            scopeProvider.Object);

        await sut.TryLinkReviewRunArchitectureIdentityAsync(request, reviewRunId.ToString("N"), CancellationToken.None);

        versionService.Verify(
            s => s.EnsureRunVersionPinnedAsync(
                Scope,
                reviewRunId,
                architectureId,
                request,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryLinkReviewRunArchitectureIdentityAsync_throws_when_identity_cannot_be_resolved()
    {
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ArchitectureRequest request = new()
        {
            RequestId = "review-missing-source",
            Description = "Second review whose source architecture cannot be resolved.",
            SystemName = "Platform",
        };

        Mock<IArchitectureIdentityService> identityService = new();
        identityService
            .Setup(s => s.TryEnsureReviewRunLinkedAsync(
                Scope,
                reviewRunId,
                request,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureIdentityRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ArchitectureRunCreateIdentityLinkHook sut = new(
            identityService.Object,
            Mock.Of<IArchitectureVersionService>(),
            scopeProvider.Object);

        Func<Task> act = () => sut.TryLinkReviewRunArchitectureIdentityAsync(
            request,
            reviewRunId.ToString("N"),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArchitecturePinningFailedException>()
            .WithMessage("*identity link failed*");
    }
}

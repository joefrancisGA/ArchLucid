using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureWorkLeaseServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid DraftId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ArchitectureId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly Guid HolderA = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid HolderB = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private readonly Mock<IDraftRequestRepository> _drafts = new();
    private readonly InMemoryArchitectureWorkLeaseRepository _leases = new();
    private readonly Mock<IArchitectureWorkLeaseHolderResolver> _holderResolver = new();

    public ArchitectureWorkLeaseServiceTests()
    {
        _drafts
            .Setup(d => d.GetAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, DraftId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DraftRequestResponse
            {
                DraftId = DraftId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ProjectId = Scope.ProjectId,
                ArchitectureId = ArchitectureId,
                Status = DraftRequestStatus.Drafting,
            });
    }

    [Fact]
    public async Task Acquire_second_holder_returns_held_by_other_until_expired()
    {
        string actorA = ArchitectureSharePlatformUserActorOid.FromUserId(HolderA);
        string actorB = ArchitectureSharePlatformUserActorOid.FromUserId(HolderB);

        _holderResolver.Setup(r => r.TryResolveHolderUserIdAsync(Scope, actorA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(HolderA);
        _holderResolver.Setup(r => r.TryResolveHolderUserIdAsync(Scope, actorB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(HolderB);

        ArchitectureWorkLeaseService sut = BuildSut();

        ArchitectureWorkLeaseAcquireResult first = await sut.AcquireAsync(Scope, DraftId, actorA, CancellationToken.None);
        ArchitectureWorkLeaseAcquireResult second = await sut.AcquireAsync(Scope, DraftId, actorB, CancellationToken.None);

        first.Status.Should().Be(ArchitectureWorkLeaseAcquireStatus.Acquired);
        second.Status.Should().Be(ArchitectureWorkLeaseAcquireStatus.HeldByOther);
        second.Conflict?.HolderUserId.Should().Be(HolderA);
    }

    [Fact]
    public async Task Acquire_after_expiry_allows_new_holder()
    {
        string actorA = ArchitectureSharePlatformUserActorOid.FromUserId(HolderA);
        string actorB = ArchitectureSharePlatformUserActorOid.FromUserId(HolderB);

        _holderResolver.Setup(r => r.TryResolveHolderUserIdAsync(Scope, actorA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(HolderA);
        _holderResolver.Setup(r => r.TryResolveHolderUserIdAsync(Scope, actorB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(HolderB);

        DateTimeOffset expired = DateTimeOffset.UtcNow.AddMinutes(-1);

        await _leases.UpsertAsync(
            Scope,
            new ArchitectureWorkLeaseRecord
            {
                DraftId = DraftId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                ArchitectureId = ArchitectureId,
                HolderUserId = HolderA,
                AcquiredUtc = expired.AddMinutes(-5),
                LastHeartbeatUtc = expired.AddMinutes(-5),
                ExpiresUtc = expired,
            },
            CancellationToken.None);

        ArchitectureWorkLeaseService sut = BuildSut();

        ArchitectureWorkLeaseAcquireResult result = await sut.AcquireAsync(Scope, DraftId, actorB, CancellationToken.None);

        result.Status.Should().Be(ArchitectureWorkLeaseAcquireStatus.Acquired);
        result.Response?.HolderUserId.Should().Be(HolderB);
    }

    [Fact]
    public async Task Heartbeat_extends_expiry_for_holder()
    {
        string actorA = ArchitectureSharePlatformUserActorOid.FromUserId(HolderA);

        _holderResolver.Setup(r => r.TryResolveHolderUserIdAsync(Scope, actorA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(HolderA);

        DateTimeOffset soon = DateTimeOffset.UtcNow.AddSeconds(30);

        await _leases.UpsertAsync(
            Scope,
            new ArchitectureWorkLeaseRecord
            {
                DraftId = DraftId,
                TenantId = Scope.TenantId,
                WorkspaceId = Scope.WorkspaceId,
                ScopeProjectId = Scope.ProjectId,
                ArchitectureId = ArchitectureId,
                HolderUserId = HolderA,
                AcquiredUtc = DateTimeOffset.UtcNow.AddMinutes(-2),
                LastHeartbeatUtc = DateTimeOffset.UtcNow.AddMinutes(-2),
                ExpiresUtc = soon,
            },
            CancellationToken.None);

        ArchitectureWorkLeaseService sut = BuildSut();

        ArchitectureWorkLeaseHeartbeatResult result = await sut.HeartbeatAsync(Scope, DraftId, actorA, CancellationToken.None);

        result.Status.Should().Be(ArchitectureWorkLeaseHeartbeatStatus.Extended);
        result.Response?.ExpiresUtc.Should().BeAfter(soon);
    }

    private ArchitectureWorkLeaseService BuildSut() =>
        new(_drafts.Object, _leases, _holderResolver.Object);
}

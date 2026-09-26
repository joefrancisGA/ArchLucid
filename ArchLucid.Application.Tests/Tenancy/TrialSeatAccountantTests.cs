using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
public sealed class TrialSeatAccountantTests
{
    [SkippableFact]
    public async Task TryReserveSeatAsync_same_user_twice_invokes_repository_twice_without_short_circuit()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateActiveTrialTenant(tenantId));
        tenants.Setup(t => t.TryClaimTrialSeatAsync(tenantId, "user-1", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TrialSeatAccountant accountant = CreateAccountant(tenants.Object);
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        Func<Task> twice = async () =>
        {
            await accountant.TryReserveSeatAsync(scope, "user-1", CancellationToken.None);
            await accountant.TryReserveSeatAsync(scope, "user-1", CancellationToken.None);
        };

        await twice.Should().NotThrowAsync();
        tenants.Verify(t => t.TryClaimTrialSeatAsync(tenantId, "user-1", It.IsAny<CancellationToken>()), Times.Exactly(2));
        // GetById is request-cached via TenantGetByIdRequestCache; claim still runs twice.
        tenants.Verify(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task TryReserveSeatAsync_empty_tenant_skips_repository()
    {
        Mock<ITenantRepository> tenants = new();
        TrialSeatAccountant accountant = CreateAccountant(tenants.Object);
        ScopeContext scope = new() { TenantId = Guid.Empty, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        await accountant.TryReserveSeatAsync(scope, "user-1", CancellationToken.None);

        tenants.Verify(
            t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        tenants.Verify(
            t => t.TryClaimTrialSeatAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryReserveSeatAsync_converted_tenant_skips_updlock_claim()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "paid",
                    Slug = "paid",
                    TrialStatus = TrialLifecycleStatus.Converted,
                    TrialSeatsLimit = 3,
                });

        TrialSeatAccountant accountant = CreateAccountant(tenants.Object);
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        await accountant.TryReserveSeatAsync(scope, "user-1", CancellationToken.None);

        tenants.Verify(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
        tenants.Verify(
            t => t.TryClaimTrialSeatAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryReserveSeatAsync_lowercase_active_trial_enforces_seat_cap()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        InMemoryTenantRepository repo = new();
        await repo.InsertTenantAsync(
            tenantId,
            "Legacy active casing",
            "legacy-seat-" + tenantId.ToString("N")[..8],
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await repo.CommitSelfServiceTrialAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(14),
            runsLimit: 10,
            seatsLimit: 2,
            sampleRunId: Guid.NewGuid(),
            baselineReviewCycleHours: null,
            baselineReviewCycleSource: null,
            baselineReviewCycleCapturedUtc: null,
            companySize: null,
            architectureTeamSize: null,
            industryVertical: null,
            industryVerticalOther: null,
            ct: CancellationToken.None);

        (await repo.TryRecordTrialLifecycleTransitionAsync(
                tenantId,
                TrialLifecycleStatus.Active,
                "active",
                "legacy-import",
                CancellationToken.None))
            .Should()
            .BeTrue();

        TrialSeatAccountant accountant = CreateAccountant(repo);
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        await accountant.TryReserveSeatAsync(scope, "principal-a", CancellationToken.None);
        await accountant.TryReserveSeatAsync(scope, "principal-b", CancellationToken.None);

        TenantRecord? tenant = await repo.GetByIdAsync(tenantId, CancellationToken.None);
        tenant.Should().NotBeNull();
        tenant!.TrialSeatsUsed.Should().Be(2, "seat claims must honor metered trial when persisted status is lowercase active");

        Func<Task> thirdClaim = async () =>
            await accountant.TryReserveSeatAsync(scope, "principal-c", CancellationToken.None);

        (await thirdClaim.Should().ThrowAsync<TrialLimitExceededException>())
            .Which.Reason.Should()
            .Be(TrialLimitReason.SeatsExceeded);
    }

    [SkippableFact]
    public async Task TryReserveSeatAsync_cached_non_trial_skips_get_by_id_and_claim()
    {
        Guid tenantId = Guid.NewGuid();
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "paid",
                    Slug = "paid",
                    TrialStatus = TrialLifecycleStatus.Converted,
                });

        TrialSeatAccountant accountant = CreateAccountant(tenants.Object);
        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        await accountant.TryReserveSeatAsync(scope, "user-1", CancellationToken.None);
        await accountant.TryReserveSeatAsync(scope, "user-1", CancellationToken.None);

        tenants.Verify(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
        tenants.Verify(
            t => t.TryClaimTrialSeatAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static TrialSeatAccountant CreateAccountant(ITenantRepository tenants)
    {
        ITenantTrialSeatSkipCache skipCache = new TenantTrialSeatSkipCache(new MemoryCache(new MemoryCacheOptions()));

        return new TrialSeatAccountant(new TenantGetByIdRequestCache(tenants), tenants, skipCache);
    }

    private static TenantRecord CreateActiveTrialTenant(Guid tenantId)
    {
        return new TenantRecord
        {
            Id = tenantId,
            Name = "trial",
            Slug = "trial",
            TrialStatus = TrialLifecycleStatus.Active,
            TrialSeatsLimit = 5,
        };
    }
}

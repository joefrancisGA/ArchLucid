using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TrialSeatBootstrapPrincipalParityTests
{
    [SkippableFact]
    public async Task Self_service_bootstrap_and_middleware_claim_one_seat_for_registering_admin()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        Guid platformUserId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        InMemoryTenantRepository repo = new();
        await repo.InsertTenantAsync(
            tenantId,
            "Seat parity tenant",
            "seat-parity-" + tenantId.ToString("N")[..8],
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        DateTimeOffset start = DateTimeOffset.UtcNow.AddDays(-1);
        await repo.CommitSelfServiceTrialAsync(
            tenantId,
            start,
            start.AddDays(14),
            runsLimit: 10,
            seatsLimit: 3,
            sampleRunId: Guid.NewGuid(),
            baselineReviewCycleHours: null,
            baselineReviewCycleSource: null,
            baselineReviewCycleCapturedUtc: null,
            companySize: null,
            architectureTeamSize: null,
            industryVertical: null,
            industryVerticalOther: null,
            ct: CancellationToken.None);

        TrialSeatAccountant accountant = new(
            new TenantGetByIdRequestCache(repo),
            repo,
            new TenantTrialSeatSkipCache(new MemoryCache(new MemoryCacheOptions())));

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        // Mirrors TrialSeatReservationMiddleware principal key (JWT sub = platform user id).
        await accountant.TryReserveSeatAsync(scope, platformUserId.ToString("D"), CancellationToken.None);

        TenantRecord? tenant = await repo.GetByIdAsync(tenantId, CancellationToken.None);
        tenant.Should().NotBeNull();
        tenant!.TrialSeatsUsed.Should().Be(1, "bootstrap and middleware must not double-count the registering admin");
    }
}

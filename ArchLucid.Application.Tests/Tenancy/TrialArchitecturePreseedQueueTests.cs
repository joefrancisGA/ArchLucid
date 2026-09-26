using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Application")]
public sealed class TrialArchitecturePreseedQueueTests
{
    [Fact]
    public async Task ListTenantIdsPendingTrialArchitecturePreseed_includes_lowercase_active_trial_status()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        InMemoryTenantRepository repo = new();
        await repo.InsertTenantAsync(
            tenantId,
            "Preseed casing tenant",
            "preseed-casing-" + tenantId.ToString("N")[..8],
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await repo.CommitSelfServiceTrialAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(14),
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

        (await repo.TryRecordTrialLifecycleTransitionAsync(
                tenantId,
                TrialLifecycleStatus.Active,
                "active",
                "legacy-import",
                CancellationToken.None))
            .Should()
            .BeTrue();

        await repo.EnqueueTrialArchitecturePreseedAsync(tenantId, CancellationToken.None);

        IReadOnlyList<Guid> pending =
            await repo.ListTenantIdsPendingTrialArchitecturePreseedAsync(10, CancellationToken.None);

        pending.Should().Contain(tenantId,
            "trial bootstrap enqueues preseed for active trials; worker poll must include legacy lowercase Active labels");
    }
}

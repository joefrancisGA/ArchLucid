using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Application")]
public sealed class TrialActiveRunIncrementTests
{
    [Fact]
    public async Task TryIncrementActiveTrialRun_enforces_cap_for_lowercase_active_trial_status()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        InMemoryTenantRepository repo = new();
        await repo.InsertTenantAsync(
            tenantId,
            "Run cap casing tenant",
            "run-cap-" + tenantId.ToString("N")[..8],
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await repo.CommitSelfServiceTrialAsync(
            tenantId,
            now.AddDays(-1),
            now.AddDays(14),
            runsLimit: 1,
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

        await repo.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);

        TenantRecord? tenant = await repo.GetByIdAsync(tenantId, CancellationToken.None);
        tenant!.TrialRunsUsed.Should().Be(1);

        Func<Task> secondIncrement = async () =>
            await repo.TryIncrementActiveTrialRunAsync(tenantId, CancellationToken.None);

        (await secondIncrement.Should().ThrowAsync<TrialLimitExceededException>())
            .Which.Reason.Should()
            .Be(TrialLimitReason.RunsExceeded);
    }
}

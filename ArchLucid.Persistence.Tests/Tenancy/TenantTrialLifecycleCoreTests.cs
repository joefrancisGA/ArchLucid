using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantTrialLifecycleCoreTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");

    [Fact]
    public void ApplyCommitSelfServiceTrial_sets_active_trial_fields()
    {
        TenantRecord existing = CreateTenant();
        DateTimeOffset start = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        DateTimeOffset expires = start.AddDays(14);
        Guid sampleRunId = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");

        TenantTrialLifecycleCore.CommitSelfServiceTrialMutation mutation =
            TenantTrialLifecycleCore.CreateCommitSelfServiceTrialMutation(
                start,
                expires,
                runsLimit: 5,
                seatsLimit: 3,
                sampleRunId,
                baselineReviewCycleHours: 40m,
                baselineReviewCycleSource: "signup",
                baselineReviewCycleCapturedUtc: start,
                companySize: "51-200",
                architectureTeamSize: 4,
                industryVertical: "Finance",
                industryVerticalOther: null);

        TenantRecord updated = TenantTrialLifecycleCore.ApplyCommitSelfServiceTrial(existing, mutation);

        updated.TrialStartUtc.Should().Be(start);
        updated.TrialExpiresUtc.Should().Be(expires);
        updated.TrialRunsLimit.Should().Be(5);
        updated.TrialRunsUsed.Should().Be(0);
        updated.TrialSeatsLimit.Should().Be(3);
        updated.TrialSeatsUsed.Should().Be(0);
        updated.TrialStatus.Should().Be(TrialLifecycleStatus.Active);
        updated.TrialSampleRunId.Should().Be(sampleRunId);
        updated.BaselineReviewCycleHours.Should().Be(40m);
        updated.CompanySize.Should().Be("51-200");
    }

    [Fact]
    public void TryApplyMarkTrialConverted_returns_null_when_not_active()
    {
        TenantRecord existing = CreateTenant(trialStatus: TrialLifecycleStatus.Converted);

        TenantRecord? updated = TenantTrialLifecycleCore.TryApplyMarkTrialConverted(existing, TenantTier.Standard);

        updated.Should().BeNull();
    }

    [Fact]
    public void IsTrialLifecycleAutomationCandidate_requires_expiry_and_non_converted_status()
    {
        TenantRecord candidate = CreateTenant(
            trialExpiresUtc: DateTimeOffset.UtcNow.AddDays(7),
            trialStatus: TrialLifecycleStatus.Active);
        TenantRecord converted = CreateTenant(
            trialExpiresUtc: DateTimeOffset.UtcNow.AddDays(7),
            trialStatus: TrialLifecycleStatus.Converted);

        TenantTrialLifecycleCore.IsTrialLifecycleAutomationCandidate(candidate).Should().BeTrue();
        TenantTrialLifecycleCore.IsTrialLifecycleAutomationCandidate(converted).Should().BeFalse();
    }

    [Fact]
    public void IsTrialLifecycleAutomationCandidate_excludes_offboarded_tenants()
    {
        TenantRecord offboarded = new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Free,
            CreatedUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z"),
            TrialStatus = TrialLifecycleStatus.ExportOnly,
            TrialExpiresUtc = DateTimeOffset.UtcNow.AddDays(7),
            OffboardedUtc = DateTimeOffset.UtcNow.AddDays(-1),
        };

        TenantTrialLifecycleCore.IsTrialLifecycleAutomationCandidate(offboarded).Should().BeFalse();
    }

    [Fact]
    public void ComputeFirstManifestCommitOutcome_uses_trial_start_and_run_ratio()
    {
        DateTimeOffset created = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
        DateTimeOffset trialStart = created.AddHours(2);
        DateTimeOffset committed = trialStart.AddHours(10);

        TrialFirstManifestCommitOutcome outcome = TenantTrialLifecycleCore.ComputeFirstManifestCommitOutcome(
            new TenantTrialLifecycleCore.TrialFirstManifestSourceRow
            {
                TrialRunsUsed = 2,
                TrialRunsLimit = 4,
                CreatedUtc = created,
                TrialStartUtc = trialStart,
            },
            committed);

        outcome.SignupToCommitSeconds.Should().Be(36_000);
        outcome.TrialRunUsageRatio.Should().Be(0.5);
    }

    private static TenantRecord CreateTenant(
        string? trialStatus = null,
        DateTimeOffset? trialExpiresUtc = null) =>
        new()
        {
            Id = TenantId,
            Name = "Acme",
            Slug = "acme",
            Tier = TenantTier.Free,
            CreatedUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z"),
            TrialStatus = trialStatus,
            TrialExpiresUtc = trialExpiresUtc,
        };
}

using ArchLucid.Core.Tenancy; using ArchLucid.Persistence.Tenancy; using FluentAssertions;
namespace ArchLucid.Persistence.Tests.Tenancy;
public sealed class TenantTrialLifecycleCoreTests {
  [Fact] public void ApplyCommitSelfServiceTrial_sets_active_trial_fields() {
    var existing = new TenantRecord { Id = Guid.NewGuid(), Name = "A", Slug = "a", Tier = TenantTier.Free, CreatedUtc = DateTimeOffset.UtcNow };
    var mutation = TenantTrialLifecycleCore.CreateCommitSelfServiceTrialMutation(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(14), 5, 3, Guid.NewGuid(), null, null, null, null, null, null, null);
    TenantTrialLifecycleCore.ApplyCommitSelfServiceTrial(existing, mutation).TrialStatus.Should().Be(TrialLifecycleStatus.Active);
  }
  [Fact] public void TryApplyMarkTrialConverted_returns_null_when_not_active() {
    var existing = new TenantRecord { Id = Guid.NewGuid(), Name = "A", Slug = "a", Tier = TenantTier.Free, CreatedUtc = DateTimeOffset.UtcNow, TrialStatus = TrialLifecycleStatus.Converted };
    TenantTrialLifecycleCore.TryApplyMarkTrialConverted(existing, TenantTier.Standard).Should().BeNull();
  }
  [Fact] public void IsTrialLifecycleAutomationCandidate_requires_expiry_and_non_converted_status() {
    var candidate = new TenantRecord { Id = Guid.NewGuid(), Name = "A", Slug = "a", Tier = TenantTier.Free, CreatedUtc = DateTimeOffset.UtcNow, TrialExpiresUtc = DateTimeOffset.UtcNow.AddDays(1), TrialStatus = TrialLifecycleStatus.Active };
    TenantTrialLifecycleCore.IsTrialLifecycleAutomationCandidate(candidate).Should().BeTrue();
  }
  [Fact] public void ComputeFirstManifestCommitOutcome_uses_trial_start_and_run_ratio() {
    var created = DateTimeOffset.Parse("2026-01-01T00:00:00Z"); var trialStart = created.AddHours(2);
    var outcome = TenantTrialLifecycleCore.ComputeFirstManifestCommitOutcome(new TenantTrialLifecycleCore.TrialFirstManifestSourceRow { TrialRunsUsed = 2, TrialRunsLimit = 4, CreatedUtc = created, TrialStartUtc = trialStart }, trialStart.AddHours(10));
    outcome.SignupToCommitSeconds.Should().Be(36000); outcome.TrialRunUsageRatio.Should().Be(0.5);
  }
}

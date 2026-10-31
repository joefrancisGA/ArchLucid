using System.Diagnostics.Metrics;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Identity;
using ArchLucid.Application.AiUsage;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.TestSupport.Diagnostics;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialTenantBootstrapServiceTests
{
    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_when_was_already_provisioned()
    {
        Mock<IDemoSeedService> demo = new();
        Mock<ITenantRepository> repo = new();
        Mock<IAuditService> audit = new();
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = Guid.NewGuid(),
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = true,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "a@b.com", null, null, CancellationToken.None);

        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
        repo.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_seeds_and_commits_trial()
    {
        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = workspaceId,
            DefaultProjectId = projectId,
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Once);
        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Once);
        repo.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                10,
                3,
                ContosoRetailDemoIds.ForTenant(tenantId).AuthorityRunBaselineId,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialProvisioned), It.IsAny<CancellationToken>()),
            Times.Once);
        repo.Verify(r => r.EnqueueTrialArchitecturePreseedAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
        repo.Verify(
            r => r.TryClaimTrialSeatAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_persists_default_trial_ai_budget_policy()
    {
        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.TryClaimTrialSeatAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        Mock<ISelfServiceTrialAiBudgetPolicyProvisioner> budgetProvisioner = CreateTrialAiBudgetProvisionerMock();

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            budgetProvisioner.Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        await sut.TryBootstrapAfterSelfRegistrationAsync(
            new TenantProvisioningResult
            {
                TenantId = tenantId,
                DefaultWorkspaceId = Guid.NewGuid(),
                DefaultProjectId = Guid.NewGuid(),
                WasAlreadyProvisioned = false,
            },
            "owner@example.com",
            null,
            null,
            CancellationToken.None);

        budgetProvisioner.Verify(
            p => p.EnsureDefaultTrialPolicyIfAbsentAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_commits_trial_with_welcome_run_when_full_demo_seed_fails()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated heavy seed failure"));

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                10,
                3,
                ContosoRetailDemoIds.TrialWelcomeAuthorityRunId(tenantId),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialProvisioned), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_commits_trial_with_welcome_run_id_when_welcome_seed_fails()
    {
        Guid tenantId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("simulated welcome seed failure"));

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                10,
                3,
                ContosoRetailDemoIds.TrialWelcomeAuthorityRunId(tenantId),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialProvisioned), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_email_verification_failure_audit_when_offboard_completes_before_audit()
    {
        Guid tenantId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync("x@y.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "x@y.com", null, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_trial_bootstrap_failure_audit_when_offboard_completes_after_commit_failure_before_audit()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111112");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("commit failed"));
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_trial_bootstrap_failure_audit_when_offboard_completes_after_failure_metric_before_audit()
    {
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        DateTimeOffset anchor = new(2026, 10, 21, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("commit failed"));
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_email_verification_failure_audit_when_offboard_completes_after_failure_metric_before_audit()
    {
        Guid tenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        DateTimeOffset anchor = new(2026, 10, 21, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync("x@y.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "x@y.com", null, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_email_verification_failure_metric_when_offboard_completes_after_pre_metric_check_before_audit()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();
        _ = ArchLucidInstrumentation.TrialSignupFailuresTotal;

        long failureMeasurements = 0;

        using MeterListener meterListener = new();
        meterListener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Name == "archlucid_trial_signup_failures_total")
                listener.EnableMeasurementEvents(instrument);
        };

        meterListener.SetMeasurementEventCallback<long>(
            (instrument, measurement, _, _) =>
            {
                if (instrument.Name == "archlucid_trial_signup_failures_total")
                    failureMeasurements += measurement;
            });

        meterListener.Start();

        Guid tenantId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        DateTimeOffset anchor = new(2026, 10, 21, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync("x@y.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "x@y.com", null, null, CancellationToken.None);

        Assert.Equal(0, failureMeasurements);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_when_email_verification_policy_blocks()
    {
        Mock<IDemoSeedService> demo = new();
        Mock<ITenantRepository> repo = new();
        Mock<IAuditService> audit = new();
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync("x@y.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = Guid.NewGuid(),
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "x@y.com", null, null, CancellationToken.None);

        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Never);
        repo.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialProvisioned), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.TrialSignupFailed
                    && e.ActorUserId == "x@y.com"
                    && e.ActorUserName == "x@y.com"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_signup_baseline_persist_when_tenant_in_erasure_quarantine()
    {
        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222223");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new();
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        DateTimeOffset captured = DateTimeOffset.Parse("2026-05-02T12:00:00Z");
        TrialSignupBaselineReviewCycleCapture baseline = new(22m, "note", captured);

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", baseline, null, CancellationToken.None);

        repo.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        email.Verify(
            e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_signup_baseline_persist_when_offboard_completes_after_entry_before_baseline()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new(MockBehavior.Strict);
        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new(MockBehavior.Strict);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        DateTimeOffset captured = DateTimeOffset.Parse("2026-05-02T12:00:00Z");
        TrialSignupBaselineReviewCycleCapture baseline = new(22m, "note", captured);

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", baseline, null, CancellationToken.None);

        repo.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        email.Verify(
            e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_signup_baseline_persist_when_offboard_completes_after_baseline_check_before_persist()
    {
        Guid tenantId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        DateTimeOffset anchor = new(2026, 10, 21, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new(MockBehavior.Strict);
        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new(MockBehavior.Strict);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        DateTimeOffset captured = DateTimeOffset.Parse("2026-05-02T12:00:00Z");
        TrialSignupBaselineReviewCycleCapture baseline = new(22m, "note", captured);

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", baseline, null, CancellationToken.None);

        repo.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterPostAuthWorkspaceAsync_skips_demo_seed_when_tenant_in_erasure_quarantine()
    {
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333334");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(offboarded);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            new Mock<IAuditService>().Object,
            new Mock<ITrialBootstrapEmailVerificationPolicy>().Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterPostAuthWorkspaceAsync(
            result,
            "owner@example.com",
            null,
            includeDemoSeed: true,
            CancellationToken.None);

        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Never);
        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterPostAuthWorkspaceAsync_skips_welcome_demo_seed_when_offboard_completes_after_entry_before_welcome()
    {
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333336");
        DateTimeOffset anchor = new(2026, 10, 21, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new(MockBehavior.Strict);

        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            new Mock<IAuditService>().Object,
            new Mock<ITrialBootstrapEmailVerificationPolicy>().Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterPostAuthWorkspaceAsync(
            result,
            "owner@example.com",
            null,
            includeDemoSeed: true,
            CancellationToken.None);

        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Never);
        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterPostAuthWorkspaceAsync_skips_full_demo_seed_when_offboard_completes_after_welcome_before_full_seed()
    {
        Guid tenantId = Guid.Parse("33333333-3333-3333-3333-333333333335");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            new Mock<IAuditService>().Object,
            new Mock<ITrialBootstrapEmailVerificationPolicy>().Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterPostAuthWorkspaceAsync(
            result,
            "owner@example.com",
            null,
            includeDemoSeed: true,
            CancellationToken.None);

        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Once);
        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_persists_signup_baseline_when_capture_present_even_when_email_blocked()
    {
        Mock<IDemoSeedService> demo = new();
        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync("blocked@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        DateTimeOffset captured = DateTimeOffset.Parse("2026-05-02T12:00:00Z");
        TrialSignupBaselineReviewCycleCapture baseline = new(22m, "note", captured);

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "blocked@example.com", baseline, null, CancellationToken.None);

        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
        repo.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(tenantId, 22m, "note", captured, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_coalesces_whitespace_only_baseline_source_note_to_null_on_persist()
    {
        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync("owner@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        DateTimeOffset captured = DateTimeOffset.Parse("2026-05-02T12:00:00Z");
        TrialSignupBaselineReviewCycleCapture baseline = new(22m, "   ", captured);

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", baseline, null, CancellationToken.None);

        repo.Verify(
            r => r.PersistTrialSignupBaselineReviewCycleAsync(tenantId, 22m, null, captured, It.IsAny<CancellationToken>()),
            Times.Once);
        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                22m,
                null,
                captured,
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_coalesces_whitespace_only_industry_vertical_other_to_null_on_commit()
    {
        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync("owner@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        TrialSignupCompanyProfileCapture profile = new(null, null, "Other", "   ");

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, profile, CancellationToken.None);

        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                "Other",
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_persists_signup_baseline_before_demo_seed_when_capture_present()
    {
        List<string> steps = [];

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>()))
            .Callback(() => steps.Add("seed"))
            .Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()))
            .Callback(() => steps.Add("welcome"))
            .Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.PersistTrialSignupBaselineReviewCycleAsync(
                It.IsAny<Guid>(),
                It.IsAny<decimal>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .Callback(() => steps.Add("persist"))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = Guid.NewGuid(),
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        TrialSignupBaselineReviewCycleCapture baseline = new(11m, "ordered", DateTimeOffset.Parse("2026-05-03T08:00:00Z"));

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "ok@example.com", baseline, null, CancellationToken.None);

        int persistAt = steps.IndexOf("persist");
        int seedAt = steps.IndexOf("seed");

        Assert.True(persistAt >= 0);
        Assert.True(seedAt >= 0);
        Assert.True(persistAt < seedAt);
    }

    [Fact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_commits_trial_window_using_injected_clock()
    {
        DateTimeOffset start = DateTimeOffset.Parse("2020-06-01T12:00:00Z");
        FixedUtcTimeProvider clock = new(start);

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            clock,
            NullLogger<TrialTenantBootstrapService>.Instance);

        Guid tenantId = Guid.NewGuid();
        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                start,
                start.AddDays(14),
                10,
                3,
                It.IsAny<Guid>(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_trial_commit_when_offboard_completes_after_demo_seed_before_commit()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_trial_ai_budget_policy_when_offboard_completes_after_commit_before_policy()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<ISelfServiceTrialAiBudgetPolicyProvisioner> policy = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            policy.Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        policy.Verify(
            p => p.EnsureDefaultTrialPolicyIfAbsentAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_preseed_and_signup_metric_when_offboard_completes_after_provisioned_audit()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        DateTimeOffset anchor = new(2026, 10, 20, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        audit.Verify(
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialProvisioned), It.IsAny<CancellationToken>()),
            Times.Once);
        repo.Verify(r => r.EnqueueTrialArchitecturePreseedAsync(tenantId, It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_signup_metric_when_offboard_completes_after_preseed_enqueue_before_metric()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();
        _ = ArchLucidInstrumentation.TrialSignupsTotal;

        long signupMeasurements = 0;

        using MeterListener meterListener = new();
        meterListener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Name == "archlucid_trial_signups_total")
                listener.EnableMeasurementEvents(instrument);
        };

        meterListener.SetMeasurementEventCallback<long>(
            (instrument, measurement, _, _) =>
            {
                if (instrument.Name == "archlucid_trial_signups_total")
                    signupMeasurements += measurement;
            });

        meterListener.Start();

        Guid tenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        DateTimeOffset anchor = new(2026, 10, 21, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.Setup(r => r.EnqueueTrialArchitecturePreseedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        repo.Verify(r => r.EnqueueTrialArchitecturePreseedAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal(0, signupMeasurements);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_trial_provisioned_audit_when_offboard_completes_after_commit_before_audit()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        demo.Setup(s => s.SeedAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        repo.Verify(r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
        repo.Verify(r => r.EnqueueTrialArchitecturePreseedAsync(tenantId, It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_full_demo_seed_when_offboard_completes_after_welcome_before_full_seed()
    {
        Guid tenantId = Guid.Parse("99999999-9999-9999-9999-999999999991");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new();
        demo.Setup(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Once);
        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task TryBootstrapAfterSelfRegistrationAsync_skips_demo_seed_when_offboard_completes_after_email_verification_before_seed()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<IDemoSeedService> demo = new(MockBehavior.Strict);
        Mock<ITenantRepository> repo = new();
        repo.SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<ITrialBootstrapEmailVerificationPolicy> email = new();
        email.Setup(e => e.CanProvisionTrialForRegisteredEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TrialTenantBootstrapService sut = new(
            demo.Object,
            repo.Object,
            audit.Object,
            email.Object,
            CreateTrialAiBudgetProvisionerMock().Object,
            TimeProvider.System,
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId,
            DefaultWorkspaceId = Guid.NewGuid(),
            DefaultProjectId = Guid.NewGuid(),
            WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Never);
        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Never);
        repo.Verify(
            r => r.CommitSelfServiceTrialAsync(
                tenantId,
                It.IsAny<DateTimeOffset>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<Guid>(),
                It.IsAny<decimal?>(),
                It.IsAny<string?>(),
                It.IsAny<DateTimeOffset?>(),
                It.IsAny<string?>(),
                It.IsAny<int?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private sealed class FixedUtcTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private static Mock<ISelfServiceTrialAiBudgetPolicyProvisioner> CreateTrialAiBudgetProvisionerMock()
    {
        Mock<ISelfServiceTrialAiBudgetPolicyProvisioner> mock = new();
        mock.Setup(p => p.EnsureDefaultTrialPolicyIfAbsentAsync(
                It.IsAny<Guid>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        return mock;
    }
}

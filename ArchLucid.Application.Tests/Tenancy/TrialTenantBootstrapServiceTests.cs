using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Identity;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Xunit;

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
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = Guid.NewGuid(), DefaultWorkspaceId = Guid.NewGuid(), DefaultProjectId = Guid.NewGuid(), WasAlreadyProvisioned = true,
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
            NullLogger<TrialTenantBootstrapService>.Instance);

        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        TenantProvisioningResult result = new()
        {
            TenantId = tenantId, DefaultWorkspaceId = workspaceId, DefaultProjectId = projectId, WasAlreadyProvisioned = false,
        };

        await sut.TryBootstrapAfterSelfRegistrationAsync(result, "owner@example.com", null, null, CancellationToken.None);

        demo.Verify(s => s.SeedAsync(It.IsAny<CancellationToken>()), Times.Once);
        demo.Verify(s => s.SeedTrialWelcomeRunAsync(It.IsAny<CancellationToken>()), Times.Once);
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
            NullLogger<TrialTenantBootstrapService>.Instance);

        TenantProvisioningResult result = new()
        {
            TenantId = Guid.NewGuid(), DefaultWorkspaceId = Guid.NewGuid(), DefaultProjectId = Guid.NewGuid(), WasAlreadyProvisioned = false,
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
            a => a.LogAsync(It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.TrialSignupFailed), It.IsAny<CancellationToken>()),
            Times.Once);
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
    public async Task TryBootstrapAfterSelfRegistrationAsync_persists_signup_baseline_before_demo_seed_when_capture_present()
    {
        List<string> steps = new();

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
}

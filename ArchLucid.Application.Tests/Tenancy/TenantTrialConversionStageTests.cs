using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantTrialConversionStageTests
{
    [Fact]
    public async Task ConvertTrialAsync_when_trial_status_is_lowercase_active_succeeds()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                TrialStatus = "active",
                Tier = TenantTier.Free,
            });
        tenants
            .Setup(r => r.MarkTrialConvertedAsync(tenantId, It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        tenants.Verify(
            r => r.MarkTrialConvertedAsync(tenantId, It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ConvertTrialAsync_when_persisted_trial_status_differs_only_by_casing_marks_converted()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        DateTimeOffset anchor = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);
        InMemoryTenantRepository repo = new();
        await repo.InsertTenantAsync(
            tenantId,
            "Legacy casing tenant",
            "legacy-convert-" + tenantId.ToString("N")[..8],
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);
        await repo.CommitSelfServiceTrialAsync(
            tenantId,
            anchor.AddDays(-14),
            anchor.AddDays(14),
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

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(repo, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        TenantRecord? updated = await repo.GetByIdAsync(tenantId, CancellationToken.None);
        updated.Should().NotBeNull();
        updated!.TrialStatus.Should().Be(TrialLifecycleStatus.Converted);
    }
}

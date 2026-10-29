using System.Diagnostics.Metrics;

using ArchLucid.Application.Tenancy;
using ArchLucid.Application.Tenancy.Trial;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.TestSupport.Diagnostics;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Collection("ArchLucidInstrumentation")]
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

    [Fact]
    public async Task ConvertTrialAsync_returns_success_without_audit_when_offboard_completes_after_mark_before_audit()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        DateTimeOffset anchor = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(r => r.MarkTrialConvertedAsync(tenantId, It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConvertTrialAsync_returns_success_without_conversion_metric_when_offboard_completes_after_post_mark_read_before_audit()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();
        _ = ArchLucidInstrumentation.TrialConversionTotal;

        long conversionMeasurements = 0;

        using MeterListener meterListener = new();
        meterListener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Name == "archlucid_trial_conversion_total")
                listener.EnableMeasurementEvents(instrument);
        };

        meterListener.SetMeasurementEventCallback<long>(
            (instrument, measurement, _, _) =>
            {
                if (instrument.Name == "archlucid_trial_conversion_total")
                    conversionMeasurements += measurement;
            });

        meterListener.Start();

        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset anchor = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(r => r.MarkTrialConvertedAsync(tenantId, It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        conversionMeasurements.Should().Be(0);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConvertTrialAsync_returns_success_without_conversion_metric_when_offboard_completes_after_audit_before_metric()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();
        _ = ArchLucidInstrumentation.TrialConversionTotal;

        long conversionMeasurements = 0;

        using MeterListener meterListener = new();
        meterListener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Name == "archlucid_trial_conversion_total")
                listener.EnableMeasurementEvents(instrument);
        };

        meterListener.SetMeasurementEventCallback<long>(
            (instrument, measurement, _, _) =>
            {
                if (instrument.Name == "archlucid_trial_conversion_total")
                    conversionMeasurements += measurement;
            });

        meterListener.Start();

        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset anchor = new(2026, 5, 1, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);
        tenants
            .Setup(r => r.MarkTrialConvertedAsync(tenantId, It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        conversionMeasurements.Should().Be(0);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ConvertTrialAsync_returns_success_without_mark_or_conversion_metric_when_offboard_completes_before_mark()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();
        _ = ArchLucidInstrumentation.TrialConversionTotal;

        long conversionMeasurements = 0;

        using MeterListener meterListener = new();
        meterListener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Name == "archlucid_trial_conversion_total")
                listener.EnableMeasurementEvents(instrument);
        };

        meterListener.SetMeasurementEventCallback<long>(
            (instrument, measurement, _, _) =>
            {
                if (instrument.Name == "archlucid_trial_conversion_total")
                    conversionMeasurements += measurement;
            });

        meterListener.Start();

        Guid tenantId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        DateTimeOffset anchor = new(2026, 10, 13, 17, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        tenants.Verify(
            r => r.MarkTrialConvertedAsync(It.IsAny<Guid>(), It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
        conversionMeasurements.Should().Be(0);
    }

    [Fact]
    public async Task ConvertTrialAsync_returns_success_without_billing_when_offboard_completes_after_entry_before_billing_gate()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset anchor = new(2026, 10, 13, 16, 30, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new(MockBehavior.Strict);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        gate.Verify(
            g => g.EnsureManualConversionAllowedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        tenants.Verify(
            r => r.MarkTrialConvertedAsync(It.IsAny<Guid>(), It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConvertTrialAsync_returns_success_without_mark_when_offboard_completes_after_billing_before_convert()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset anchor = new(2026, 10, 13, 0, 0, 0, TimeSpan.Zero);
        TenantRecord active = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
        };
        TenantRecord offboarded = new()
        {
            Id = tenantId,
            TrialStatus = TrialLifecycleStatus.Active,
            Tier = TenantTier.Free,
            OffboardedUtc = anchor,
            ErasureEligibleUtc = anchor.AddDays(30),
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(active)
            .ReturnsAsync(active)
            .ReturnsAsync(offboarded);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(null, "actor", CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        tenants.Verify(
            r => r.MarkTrialConvertedAsync(It.IsAny<Guid>(), It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConvertTrialAsync_trims_surrounding_whitespace_on_target_tier_in_conversion_audit()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord
            {
                Id = tenantId,
                TrialStatus = TrialLifecycleStatus.Active,
                Tier = TenantTier.Free,
            });
        tenants
            .Setup(r => r.MarkTrialConvertedAsync(tenantId, TenantTier.Enterprise, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = tenantId, WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        AuditEvent? captured = null;
        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((e, _) => captured = e)
            .Returns(Task.CompletedTask);

        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(tenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        TenantTrialConversionStage sut = new(tenants.Object, scopeProvider.Object, audit.Object, gate.Object);

        TenantTrialConvertResult result = await sut.ConvertTrialAsync(
            new TenantTrialConvertBody { TargetTier = "  Enterprise  " },
            "actor",
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        captured.Should().NotBeNull();
        captured!.EventType.Should().Be(AuditEventTypes.TenantTrialConverted);
        captured.DataJson.Should().Contain("\"targetTier\":\"Enterprise\"");
        captured.DataJson.Should().NotContain("  Enterprise  ");
    }
}

using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantDeletionServiceTests
{
    private static IOptionsMonitor<TrialLifecycleSchedulerOptions> DefaultLifecycleOptions()
    {
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> lifecycleOptions = new();
        lifecycleOptions.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        return lifecycleOptions.Object;
    }

    [Fact]
    public async Task DeleteTenantAsync_purges_sql_and_blobs_and_emits_platform_audit()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Mock<ITenantHardPurgeService> purge = new();
        purge
            .Setup(p => p.PurgeTenantAsync(
                tenantId,
                It.Is<TenantHardPurgeOptions>(o => !o.DryRun && o.DeleteTenantScopedAuditEvents),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult
            {
                RowsDeleted = 12,
                RowCountsByTable = new Dictionary<string, int> { ["dbo.Runs"] = 12 }
            });

        Mock<ITenantBlobPrefixDeletionService> blobs = new();
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult
            {
                BlobsDeletedByContainer = new Dictionary<string, int> { ["artifacts"] = 3 }
            });

        Mock<IPlatformAuditRepository> platformAudit = new();
        platformAudit
            .Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> lifecycleOptions = new();
        lifecycleOptions.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions { HardPurgeMaxRowsPerStatement = 500 });

        Mock<ITenantRepository> tenantRepo = new();
        tenantRepo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, TenantErasureApprovedUtc = DateTimeOffset.UtcNow });

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            lifecycleOptions.Object,
            tenantRepo.Object);

        TenantDeletionResult result = await sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete"
            },
            CancellationToken.None);

        result.TenantId.Should().Be(tenantId);
        result.SqlRowsDeleted.Should().Be(12);
        result.BlobsDeletedByContainer.Should().ContainKey("artifacts");

        platformAudit.Verify(
            a => a.AppendAsync(
                It.Is<PlatformAuditEvent>(e =>
                    e.EventType == AuditEventTypes.TenantDataDeleted
                    && e.SubjectTenantId == tenantId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeleteTenantAsync_trims_correlation_id_on_hard_purge_platform_audit()
    {
        Guid tenantId = Guid.Parse("cccccccc-dddd-eeee-ffff-111111111111");
        PlatformAuditEvent? captured = null;

        Mock<ITenantHardPurgeService> purge = new();
        purge
            .Setup(p => p.PurgeTenantAsync(
                tenantId,
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 1, RowCountsByTable = new Dictionary<string, int>() });

        Mock<ITenantBlobPrefixDeletionService> blobs = new();
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult());

        Mock<IPlatformAuditRepository> platformAudit = new();
        platformAudit
            .Setup(a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<PlatformAuditEvent, CancellationToken>((auditEvent, _) => captured = auditEvent)
            .Returns(Task.CompletedTask);

        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> lifecycleOptions = new();
        lifecycleOptions.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        Mock<ITenantRepository> tenantRepo = new();
        tenantRepo
            .Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, TenantErasureApprovedUtc = DateTimeOffset.UtcNow });

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            lifecycleOptions.Object,
            tenantRepo.Object);

        await sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "  corr-trim-delete  ",
            },
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.EventType.Should().Be(AuditEventTypes.TenantDataDeleted);
        captured.CorrelationId.Should().Be("corr-trim-delete");
    }

    [Fact]
    public async Task DeleteTenantAsync_throws_not_found_when_tenant_row_is_missing()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<ITenantRepository> tenantRepo = new();
        tenantRepo
            .Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);

        TenantDeletionService sut = new(
            Mock.Of<ITenantHardPurgeService>(),
            Mock.Of<ITenantBlobPrefixDeletionService>(),
            Mock.Of<IPlatformAuditRepository>(),
            Mock.Of<IOptionsMonitor<TrialLifecycleSchedulerOptions>>(),
            tenantRepo.Object);

        Func<Task> act = () => sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{tenantId:D}*not found*");
    }

    [Fact]
    public async Task DeleteTenantAsync_throws_when_active_legal_hold_set_before_purge()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset now = new(2026, 10, 13, 12, 0, 0, TimeSpan.Zero);
        DateTimeOffset approvedUtc = now.AddHours(-2);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = now.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord withHold = new()
        {
            Id = tenantId,
            OffboardedUtc = now.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
            LegalHoldUntilUtc = now.AddDays(30),
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(withHold);

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            Mock.Of<ITenantBlobPrefixDeletionService>(),
            Mock.Of<IPlatformAuditRepository>(),
            DefaultLifecycleOptions(),
            tenantRepo.Object,
            new FixedUtcTimeProvider(now));

        Func<Task> act = () => sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*legal hold*");

        purge.Verify(
            p => p.PurgeTenantAsync(It.IsAny<Guid>(), It.IsAny<TenantHardPurgeOptions>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_throws_when_erasure_approval_cleared_after_revalidate_before_destructive_purge()
    {
        Guid tenantId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        DateTimeOffset approvedUtc = DateTimeOffset.UtcNow.AddHours(-1);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = approvedUtc.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord restored = new()
        {
            Id = tenantId,
            OffboardedUtc = null,
            TenantErasureApprovedUtc = null,
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(restored);

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);
        Mock<ITenantBlobPrefixDeletionService> blobs = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            Mock.Of<IPlatformAuditRepository>(),
            DefaultLifecycleOptions(),
            tenantRepo.Object);

        Func<Task> act = () => sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*explicitly approved*");

        blobs.Verify(
            b => b.DeleteAllTenantPrefixesAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        purge.Verify(
            p => p.PurgeTenantAsync(It.IsAny<Guid>(), It.IsAny<TenantHardPurgeOptions>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_throws_when_erasure_approval_cleared_after_blob_deletion_before_sql_purge()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        DateTimeOffset approvedUtc = DateTimeOffset.UtcNow.AddHours(-1);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = approvedUtc.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord restored = new()
        {
            Id = tenantId,
            OffboardedUtc = null,
            TenantErasureApprovedUtc = null,
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(restored);

        Mock<ITenantBlobPrefixDeletionService> blobs = new(MockBehavior.Strict);
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult());

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            Mock.Of<IPlatformAuditRepository>(),
            DefaultLifecycleOptions(),
            tenantRepo.Object);

        Func<Task> act = () => sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*explicitly approved*");

        blobs.Verify(
            b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()),
            Times.Once);
        purge.Verify(
            p => p.PurgeTenantAsync(It.IsAny<Guid>(), It.IsAny<TenantHardPurgeOptions>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_throws_when_erasure_approval_cleared_before_purge()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset approvedUtc = DateTimeOffset.UtcNow.AddHours(-1);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = approvedUtc.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord restored = new()
        {
            Id = tenantId,
            OffboardedUtc = null,
            TenantErasureApprovedUtc = null,
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(restored);

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            Mock.Of<ITenantBlobPrefixDeletionService>(),
            Mock.Of<IPlatformAuditRepository>(),
            DefaultLifecycleOptions(),
            tenantRepo.Object);

        Func<Task> act = () => sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*explicitly approved*");

        purge.Verify(
            p => p.PurgeTenantAsync(It.IsAny<Guid>(), It.IsAny<TenantHardPurgeOptions>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_returns_without_platform_audit_when_erasure_approval_cleared_after_sql_purge()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset approvedUtc = DateTimeOffset.UtcNow.AddHours(-1);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = approvedUtc.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord restored = new()
        {
            Id = tenantId,
            OffboardedUtc = null,
            TenantErasureApprovedUtc = null,
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(restored);

        Mock<ITenantBlobPrefixDeletionService> blobs = new(MockBehavior.Strict);
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult());

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);
        purge
            .Setup(p => p.PurgeTenantAsync(
                tenantId,
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 4 });

        Mock<IPlatformAuditRepository> platformAudit = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            DefaultLifecycleOptions(),
            tenantRepo.Object);

        TenantDeletionResult result = await sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        result.SqlRowsDeleted.Should().Be(4);
        platformAudit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_returns_without_platform_audit_when_active_legal_hold_set_after_purge_before_audit()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DateTimeOffset now = new(2026, 10, 14, 15, 0, 0, TimeSpan.Zero);
        DateTimeOffset approvedUtc = now.AddHours(-2);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = now.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord approvedWithHold = new()
        {
            Id = tenantId,
            OffboardedUtc = now.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
            LegalHoldUntilUtc = now.AddDays(30),
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approvedWithHold);

        Mock<ITenantBlobPrefixDeletionService> blobs = new(MockBehavior.Strict);
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult());

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);
        purge
            .Setup(p => p.PurgeTenantAsync(
                tenantId,
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 6 });

        Mock<IPlatformAuditRepository> platformAudit = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            DefaultLifecycleOptions(),
            tenantRepo.Object,
            new FixedUtcTimeProvider(now));

        TenantDeletionResult result = await sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        result.SqlRowsDeleted.Should().Be(6);
        platformAudit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_returns_without_platform_audit_when_erasure_approval_cleared_after_pre_deletion_audit_read_before_audit()
    {
        Guid tenantId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        DateTimeOffset approvedUtc = DateTimeOffset.UtcNow.AddHours(-1);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = approvedUtc.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord restored = new()
        {
            Id = tenantId,
            OffboardedUtc = null,
            TenantErasureApprovedUtc = null,
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(restored);

        Mock<ITenantBlobPrefixDeletionService> blobs = new(MockBehavior.Strict);
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult());

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);
        purge
            .Setup(p => p.PurgeTenantAsync(
                tenantId,
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 3 });

        Mock<IPlatformAuditRepository> platformAudit = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            DefaultLifecycleOptions(),
            tenantRepo.Object);

        TenantDeletionResult result = await sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        result.SqlRowsDeleted.Should().Be(3);
        platformAudit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_returns_without_platform_audit_when_active_legal_hold_set_after_pre_deletion_audit_append_read_before_audit()
    {
        Guid tenantId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        DateTimeOffset now = new(2026, 10, 22, 4, 15, 0, TimeSpan.Zero);
        DateTimeOffset approvedUtc = now.AddHours(-2);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = now.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord approvedWithHold = new()
        {
            Id = tenantId,
            OffboardedUtc = now.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
            LegalHoldUntilUtc = now.AddDays(30),
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approvedWithHold);

        Mock<ITenantBlobPrefixDeletionService> blobs = new(MockBehavior.Strict);
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult());

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);
        purge
            .Setup(p => p.PurgeTenantAsync(
                tenantId,
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 5 });

        Mock<IPlatformAuditRepository> platformAudit = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            DefaultLifecycleOptions(),
            tenantRepo.Object,
            new FixedUtcTimeProvider(now));

        TenantDeletionResult result = await sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        result.SqlRowsDeleted.Should().Be(5);
        platformAudit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_returns_without_platform_audit_when_erasure_approval_cleared_after_immediately_before_deletion_audit_append_read_before_audit()
    {
        Guid tenantId = Guid.Parse("12121212-1212-1212-1212-121212121212");
        DateTimeOffset approvedUtc = DateTimeOffset.UtcNow.AddHours(-1);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = approvedUtc.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord restored = new()
        {
            Id = tenantId,
            OffboardedUtc = null,
            TenantErasureApprovedUtc = null,
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(restored);

        Mock<ITenantBlobPrefixDeletionService> blobs = new(MockBehavior.Strict);
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult());

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);
        purge
            .Setup(p => p.PurgeTenantAsync(
                tenantId,
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 2 });

        Mock<IPlatformAuditRepository> platformAudit = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            DefaultLifecycleOptions(),
            tenantRepo.Object);

        TenantDeletionResult result = await sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        result.SqlRowsDeleted.Should().Be(2);
        platformAudit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_returns_without_platform_audit_when_active_legal_hold_set_after_platform_deletion_audit_append_read_before_audit()
    {
        Guid tenantId = Guid.Parse("13131313-1313-1313-1313-131313131313");
        DateTimeOffset now = new(2026, 10, 22, 4, 45, 0, TimeSpan.Zero);
        DateTimeOffset approvedUtc = now.AddHours(-2);
        TenantRecord approved = new()
        {
            Id = tenantId,
            OffboardedUtc = now.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
        };
        TenantRecord approvedWithHold = new()
        {
            Id = tenantId,
            OffboardedUtc = now.AddDays(-1),
            TenantErasureApprovedUtc = approvedUtc,
            LegalHoldUntilUtc = now.AddDays(30),
        };

        Mock<ITenantRepository> tenantRepo = new(MockBehavior.Strict);
        tenantRepo
            .SetupSequence(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approved)
            .ReturnsAsync(approvedWithHold);

        Mock<ITenantBlobPrefixDeletionService> blobs = new(MockBehavior.Strict);
        blobs
            .Setup(b => b.DeleteAllTenantPrefixesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantBlobPrefixDeletionResult());

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);
        purge
            .Setup(p => p.PurgeTenantAsync(
                tenantId,
                It.IsAny<TenantHardPurgeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHardPurgeResult { RowsDeleted = 7 });

        Mock<IPlatformAuditRepository> platformAudit = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            DefaultLifecycleOptions(),
            tenantRepo.Object,
            new FixedUtcTimeProvider(now));

        TenantDeletionResult result = await sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        result.SqlRowsDeleted.Should().Be(7);
        platformAudit.Verify(
            a => a.AppendAsync(It.IsAny<PlatformAuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DeleteTenantAsync_throws_when_erasure_not_approved()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<ITenantRepository> tenantRepo = new();
        tenantRepo
            .Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = tenantId, TenantErasureApprovedUtc = null });

        TenantDeletionService sut = new(
            Mock.Of<ITenantHardPurgeService>(),
            Mock.Of<ITenantBlobPrefixDeletionService>(),
            Mock.Of<IPlatformAuditRepository>(),
            Mock.Of<IOptionsMonitor<TrialLifecycleSchedulerOptions>>(),
            tenantRepo.Object);

        Func<Task> act = () => sut.DeleteTenantAsync(
            tenantId,
            new TenantDeletionInvocation
            {
                ActorUserId = "actor-1",
                ActorUserName = "actor@example.com",
                CorrelationId = "corr-delete",
            },
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*explicitly approved*");
    }

    private sealed class FixedUtcTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}

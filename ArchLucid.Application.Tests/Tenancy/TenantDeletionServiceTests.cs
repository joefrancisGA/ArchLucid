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
            .ReturnsAsync(restored);

        Mock<ITenantHardPurgeService> purge = new(MockBehavior.Strict);

        TenantDeletionService sut = new(
            purge.Object,
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

        purge.Verify(
            p => p.PurgeTenantAsync(It.IsAny<Guid>(), It.IsAny<TenantHardPurgeOptions>(), It.IsAny<CancellationToken>()),
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
}

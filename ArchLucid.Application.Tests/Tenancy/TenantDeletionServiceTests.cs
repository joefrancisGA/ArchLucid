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

        TenantDeletionService sut = new(
            purge.Object,
            blobs.Object,
            platformAudit.Object,
            lifecycleOptions.Object);

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
}

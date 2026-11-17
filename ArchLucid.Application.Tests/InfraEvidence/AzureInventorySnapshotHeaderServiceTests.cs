using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotHeaderServiceTests
{
    [Fact]
    public async Task Committed_header_is_audited_when_the_caller_cancels()
    {
        using CancellationTokenSource cancellation = new();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Guid packageId = Guid.NewGuid();
        Mock<IAzureExtractorPackageRepository> packages = new();
        packages.Setup(repo => repo.TryGetDownloadByPackageIdAsync(scope, packageId, cancellation.Token))
            .ReturnsAsync(new AzureExtractorPackageDownloadRecord { PackageId = packageId });
        Mock<IAzureInventorySnapshotRepository> snapshots = new();
        AzureInventorySnapshotRecord? inserted = null;
        snapshots.Setup(repo => repo.InsertHeaderAsync(It.IsAny<AzureInventorySnapshotRecord>(), cancellation.Token))
            .Callback((AzureInventorySnapshotRecord record, CancellationToken _) =>
            {
                inserted = record;
                cancellation.Cancel();
            })
            .Returns(Task.CompletedTask);
        Mock<IAuditService> audit = new();
        audit.Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns((AuditEvent _, CancellationToken ct) =>
                ct.IsCancellationRequested ? Task.FromCanceled(ct) : Task.CompletedTask);
        AzureInventorySnapshotHeaderService service = new(
            snapshots.Object, packages.Object, audit.Object, NullLogger<AzureInventorySnapshotHeaderService>.Instance);

        AzureInventorySnapshotHeaderCreateResult result = await service.TryCreatePendingFromPackageAsync(
            scope, packageId, null, null, null, null, null, "collector", false, cancellation.Token);

        result.Succeeded.Should().BeTrue();
        inserted.Should().NotBeNull();
        result.SnapshotId.Should().Be(inserted!.SnapshotId);
        audit.Verify(log => log.LogAsync(
            It.Is<AuditEvent>(entry => entry.EventType == AuditEventTypes.AzureInventorySnapshotCreated),
            CancellationToken.None), Times.Once);
    }
}

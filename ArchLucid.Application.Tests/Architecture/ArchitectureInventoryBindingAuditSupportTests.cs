using ArchLucid.Application.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureInventoryBindingAuditSupportTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task LogSnapshotBoundAsync_uses_required_fail_closed_audit_path()
    {
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureInventoryBindingAuditSupport sut = new(
            audit.Object,
            NullLogger<ArchitectureInventoryBindingAuditSupport>.Instance);

        Guid architectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid snapshotId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        await sut.LogSnapshotBoundAsync(
            Scope,
            "reviewer@example.com",
            architectureId,
            snapshotId,
            CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord =>
                    eventRecord.EventType == AuditEventTypes.ArchitectureInventorySnapshotBound
                    && eventRecord.TenantId == Scope.TenantId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task LogSnapshotDetachedAsync_propagates_durable_audit_write_failure()
    {
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store unavailable"));

        ArchitectureInventoryBindingAuditSupport sut = new(
            audit.Object,
            NullLogger<ArchitectureInventoryBindingAuditSupport>.Instance);

        Func<Task> act = () => sut.LogSnapshotDetachedAsync(
            Scope,
            "reviewer@example.com",
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            CancellationToken.None);

        await act.Should().ThrowAsync<DurableAuditWriteFailedException>();
    }
}

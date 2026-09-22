using ArchLucid.Application.Common;
using ArchLucid.Application.Drafts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DraftForceOverwriteAuditSupportTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task LogForceOverwriteAsync_uses_required_fail_closed_audit_path()
    {
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        DraftForceOverwriteAuditSupport sut = CreateSut(audit.Object);
        Guid draftId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        DateTime previousUpdatedUtc = DateTime.Parse("2026-09-10T12:00:00Z").ToUniversalTime();

        await sut.LogForceOverwriteAsync(Scope, draftId, previousUpdatedUtc, CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(eventRecord =>
                    eventRecord.EventType == AuditEventTypes.DraftIntakeForceOverwriteApplied
                    && eventRecord.TenantId == Scope.TenantId
                    && eventRecord.ActorUserId == "jwt:test:operator"
                    && eventRecord.DataJson.Contains(draftId.ToString(), StringComparison.OrdinalIgnoreCase)
                    && eventRecord.DataJson.Contains("previousUpdatedUtc", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task LogForceOverwriteAsync_propagates_durable_audit_write_failure()
    {
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store unavailable"));

        DraftForceOverwriteAuditSupport sut = CreateSut(audit.Object);

        Func<Task> act = () => sut.LogForceOverwriteAsync(
            Scope,
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            DateTime.UtcNow,
            CancellationToken.None);

        await act.Should().ThrowAsync<DurableAuditWriteFailedException>();
    }

    private static DraftForceOverwriteAuditSupport CreateSut(IAuditService audit)
    {
        Mock<IActorContext> actor = new();
        actor.Setup(context => context.GetActor()).Returns("operator@test");
        actor.Setup(context => context.GetActorId()).Returns("jwt:test:operator");

        return new DraftForceOverwriteAuditSupport(
            audit,
            actor.Object,
            NullLogger<DraftForceOverwriteAuditSupport>.Instance);
    }
}

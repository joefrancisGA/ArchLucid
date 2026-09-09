using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Authority;

[Trait("Category", "Unit")]
public sealed class AuthorityCommittedChainDurableAuditTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task LogRequiredAsync_when_audit_fails_throws_DurableAuditWriteFailedException()
    {
        Guid runId = Guid.NewGuid();
        AuthorityManifestPersistResult chain = new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid());
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit down"));

        Func<Task> act = () => AuthorityCommittedChainDurableAudit.LogRequiredAsync(
            auditService.Object,
            scopeProvider.Object,
            "actor-1",
            NullLogger.Instance,
            runId,
            "AlphaSys",
            chain,
            "authority-career-commit",
            richFindingsAndGraph: true,
            CancellationToken.None);

        (await act.Should().ThrowAsync<DurableAuditWriteFailedException>())
            .Which.OperationLabel.Should().Contain("AuthorityCommittedChainPersisted");
    }

    [Fact]
    public async Task TryLogAsync_when_audit_fails_does_not_throw()
    {
        Guid runId = Guid.NewGuid();
        AuthorityManifestPersistResult chain = new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid());
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit down"));
        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("demo-seed");

        Func<Task> act = () => AuthorityCommittedChainDurableAudit.TryLogAsync(
            auditService.Object,
            scopeProvider.Object,
            actorContext.Object,
            NullLogger.Instance,
            runId,
            "AlphaSys",
            chain,
            "demo-seed",
            richFindingsAndGraph: true,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public void FromManifestDocument_maps_chain_ids()
    {
        ManifestDocument manifest = new()
        {
            ManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            ContextSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            GraphSnapshotId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            FindingsSnapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            DecisionTraceId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
        };

        AuthorityManifestPersistResult result = AuthorityCommittedChainDurableAudit.FromManifestDocument(manifest);

        result.GoldenManifestId.Should().Be(manifest.ManifestId);
        result.ContextSnapshotId.Should().Be(manifest.ContextSnapshotId);
        result.GraphSnapshotId.Should().Be(manifest.GraphSnapshotId);
        result.FindingsSnapshotId.Should().Be(manifest.FindingsSnapshotId);
        result.DecisionTraceId.Should().Be(manifest.DecisionTraceId);
    }
}

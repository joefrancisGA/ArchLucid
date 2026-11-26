using ArchLucid.Application.Analysis;
using ArchLucid.Application.Architecture;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Export;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class RunExportBlobPushRequesterAuthorizationTests
{
    [Theory]
    [InlineData("inactive")]
    [InlineData("replaced")]
    [InlineData("role")]
    [InlineData("share")]
    [InlineData("foreign-run")]
    [InlineData("foreign-tenant")]
    [InlineData("foreign-workspace")]
    [InlineData("removed")]
    [InlineData("sql-failure")]
    [InlineData("none")]
    public async Task Worker_reads_evidence_only_when_current_requester_access_matches_enqueue(string change)
    {
        CancellationToken ct = CancellationToken.None;
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid()
        };
        Guid requesterId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid architectureId = Guid.NewGuid();
        string directoryObjectId = Guid.NewGuid().ToString("D");
        string actorKey = $"jwt:{Guid.NewGuid():D}:{directoryObjectId}";
        bool changed = false;

        Mock<IScimUserRepository> users = new(MockBehavior.Strict);
        users.Setup(u => u.GetByExternalIdForAuthorizationAsync(scope.TenantId, directoryObjectId, ct))
            .ReturnsAsync(() => changed && change == "sql-failure" ? throw new InvalidOperationException("SQL unavailable") : new ScimUserRecord
            {
                TenantId = scope.TenantId, ExternalId = directoryObjectId,
                DirectoryRemovedUtc = changed && change == "removed" ? DateTime.UtcNow : null,
                Id = changed && change == "replaced" ? Guid.NewGuid() : requesterId,
                Active = !changed || change != "inactive"
            });
        Mock<IProjectRoleAssignmentRepository> roles = new(MockBehavior.Strict);
        roles.Setup(r => r.GetHighestRoleAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, requesterId, ct))
            .ReturnsAsync(() => changed && change == "role" ? ProjectScopedEffectiveRole.Reader : ProjectScopedEffectiveRole.Operator);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), runId, ct))
            .ReturnsAsync(() => new RunRecord
            {
                TenantId = changed && change == "foreign-tenant" ? Guid.NewGuid() : scope.TenantId,
                WorkspaceId = changed && change == "foreign-workspace" ? Guid.NewGuid() : scope.WorkspaceId,
                ScopeProjectId = changed && change == "foreign-run" ? Guid.NewGuid() : scope.ProjectId,
                RunId = runId, ArchitectureId = architectureId
            });
        Mock<IArchitectureShareAccessService> shares = new(MockBehavior.Strict);
        shares.Setup(s => s.EvaluateAsync(It.Is<ScopeContext>(s => SameScope(s, scope)), architectureId, actorKey,
                true, true, false, ct))
            .ReturnsAsync(() => new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true, RestrictToShares = true, CanRead = !changed || change != "share"
            });
        RunExportBlobPushAuthorization authorization = new(users.Object, roles.Object, runs.Object, shares.Object);

        Guid? verified = await authorization.AuthorizeAsync(scope, runId, actorKey, null, ct);
        verified.Should().Be(requesterId);
        InMemoryRunExportBlobPushOutboxRepository outbox = new();
        await outbox.EnqueueAsync(runId, scope.TenantId, scope.WorkspaceId, scope.ProjectId,
            "https://acct.blob.core.windows.net/c/b?sas=fixture", actorKey, requesterId, ct);
        changed = true;

        Mock<IAuthorityQueryService> evidence = new(MockBehavior.Strict);
        Mock<IRunExportPackageBuilder> packaging = new(MockBehavior.Strict);
        Mock<IRunExportBlobPushService> push = new(MockBehavior.Strict);
        if (change == "none")
            evidence.Setup(e => e.GetRunDetailForManifestCompareAsync(
                    It.Is<ScopeContext>(s => SameScope(s, scope)), runId, ct))
                .ReturnsAsync((RunDetailDto?)null);
        ServiceCollection services = [];
        services.AddScoped<IRunExportBlobPushOutboxRepository>(_ => outbox);
        services.AddScoped<IRunExportBlobPushAuthorization>(_ => authorization);
        services.AddScoped(_ => evidence.Object);
        services.AddScoped(_ => packaging.Object);
        services.AddScoped(_ => push.Object);
        services.AddScoped(_ => Mock.Of<IAuditService>());
        if (change == "none")
            services.AddScoped(_ => Mock.Of<IManifestHashService>());
        await using ServiceProvider provider = services.BuildServiceProvider();
        RunExportBlobPushOutboxProcessor processor = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new RunExportBlobPushOutboxProcessorOptions()), TimeProvider.System,
            NullLogger<RunExportBlobPushOutboxProcessor>.Instance);

        (await processor.ProcessPendingBatchAsync(ct)).Should().Be(1);

        (await outbox.CountDeadLetteredAsync(ct)).Should().Be(change is "none" or "sql-failure" ? 0 : 1);
        (await outbox.CountPendingAsync(ct)).Should().Be(change == "sql-failure" ? 1 : 0);
        users.Verify(u => u.GetByExternalIdForAuthorizationAsync(scope.TenantId, directoryObjectId, ct), Times.Exactly(2));
        evidence.Verify(e => e.GetRunDetailForManifestCompareAsync(
                It.Is<ScopeContext>(s => SameScope(s, scope)), runId, ct),
            change == "none" ? Times.Once() : Times.Never());
        evidence.VerifyNoOtherCalls();
        packaging.VerifyNoOtherCalls();
        push.VerifyNoOtherCalls();
    }

    private static bool SameScope(ScopeContext actual, ScopeContext expected) =>
        actual.TenantId == expected.TenantId && actual.WorkspaceId == expected.WorkspaceId &&
        actual.ProjectId == expected.ProjectId;
}

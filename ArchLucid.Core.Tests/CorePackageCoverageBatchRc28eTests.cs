using ArchLucid.Contracts.Scoping;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>
///     RC28e package-coverage batch: read-scope projection, run-child scope derivation, disabled async authority
///     resolver, and outbox gauge value struct fields.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc28eTests
{
    [Fact]
    public void ReadScopeTripleMapping_ToReadScope_projects_scope_triple()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        ReadScopeTriple readScope = scope.ToReadScope();

        readScope.TenantId.Should().Be(tenantId);
        readScope.WorkspaceId.Should().Be(workspaceId);
        readScope.ProjectId.Should().Be(projectId);
    }

    [Fact]
    public void ReadScopeTripleMapping_ToReadScope_throws_when_scope_null()
    {
        ScopeContext? scope = null;

        FluentActions
            .Invoking(() => scope!.ToReadScope())
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public void ScopeContextRunChildExtensions_FromRunRecord_maps_run_header_scope()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        RunRecord run = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ScopeProjectId = projectId,
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ProjectId = "slug-not-scope-project",
        };

        ScopeContext scope = ScopeContextRunChildExtensions.FromRunRecord(run);

        scope.TenantId.Should().Be(tenantId);
        scope.WorkspaceId.Should().Be(workspaceId);
        scope.ProjectId.Should().Be(projectId);
    }

    [Fact]
    public void ScopeContextRunChildExtensions_FromRunRecord_throws_when_run_null()
    {
        RunRecord? run = null;

        FluentActions
            .Invoking(() => ScopeContextRunChildExtensions.FromRunRecord(run!))
            .Should()
            .Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task DisabledAsyncAuthorityPipelineModeResolver_never_queues_stages()
    {
        DisabledAsyncAuthorityPipelineModeResolver resolver = new();

        bool shouldQueue = await resolver.ShouldQueueContextAndGraphStagesAsync(CancellationToken.None);

        shouldQueue.Should().BeFalse();
    }

    [Fact]
    public void OutboxDepthGaugeValues_exposes_all_outbox_depth_fields()
    {
        OutboxDepthGaugeValues values = new(
            AuthorityPipelineWorkPending: 1,
            AuthorityPipelineWorkOldestPendingAgeSeconds: 2.5,
            RetrievalIndexingOutboxPending: 3,
            RetrievalIndexingOutboxOldestPendingAgeSeconds: 4.5,
            RetrievalIndexingOutboxDeadLetter: 5,
            IntegrationEventOutboxPublishPending: 6,
            IntegrationEventOutboxDeadLetter: 7,
            IntegrationEventOutboxOldestActionablePendingAgeSeconds: 8.5,
            AuthorityPipelineWorkDeadLetter: 9,
            RunExportBlobPushOutboxPending: 10,
            RunExportBlobPushOutboxOldestPendingAgeSeconds: 11.5,
            RunExportBlobPushOutboxDeadLetter: 12,
            PostCommitProjectionOutboxPending: 13,
            PostCommitProjectionOutboxOldestPendingAgeSeconds: 14.5,
            PostCommitProjectionOutboxDeadLetter: 15);

        values.AuthorityPipelineWorkPending.Should().Be(1);
        values.RetrievalIndexingOutboxPending.Should().Be(3);
        values.IntegrationEventOutboxPublishPending.Should().Be(6);
        values.RunExportBlobPushOutboxPending.Should().Be(10);
        values.PostCommitProjectionOutboxDeadLetter.Should().Be(15);
        values.Should().Be(values);
    }
}

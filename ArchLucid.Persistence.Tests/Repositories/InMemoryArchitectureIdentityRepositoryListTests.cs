using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
public sealed class InMemoryArchitectureIdentityRepositoryListTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task ListAsync_includes_child_counts_from_linked_drafts_and_runs()
    {
        InMemoryDraftRequestRepository draftRepository = new();
        InMemoryRunRepository runRepository = new();
        InMemoryArchitectureIdentityRepository repository = new(draftRepository, runRepository);

        ArchitectureIdentityRecord identity = await repository.CreateAsync(Scope, "Vertex", "model-1");

        DraftRequestResponse draft = await draftRepository.CreateAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            "operator-1",
            new DraftRequestDocument { FreeTextIntent = "Draft body with enough characters." },
            CancellationToken.None);
        await draftRepository.SetArchitectureIdAsync(
            Scope.TenantId,
            Scope.WorkspaceId,
            Scope.ProjectId,
            draft.DraftId,
            identity.ArchitectureId,
            CancellationToken.None);

        RunRecord run = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            ArchitectureId = identity.ArchitectureId,
            Description = "Review run",
            CreatedUtc = DateTime.UtcNow,
        };
        await runRepository.SaveAsync(run, CancellationToken.None);

        var page = await repository.ListAsync(Scope, 1, 50, includeArchived: true, CancellationToken.None);

        page.TotalCount.Should().Be(1);
        page.Items[0].DraftCount.Should().Be(1);
        page.Items[0].ReviewCount.Should().Be(1);
        page.Items[0].CurrentDraftId.Should().Be(draft.DraftId);
        page.Items[0].LatestReviewId.Should().Be(run.RunId);
    }
}

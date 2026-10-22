using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.Coverage;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CoverageAssignmentRepositoryTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Add_and_list_by_run_returns_rows_in_created_order()
    {
        InMemoryCoverageAssignmentRepository repository = new();
        string runId = Guid.NewGuid().ToString("N");
        CoverageAssignment first = CreateAssignment(runId, DateTime.UtcNow.AddMinutes(-1));
        CoverageAssignment second = CreateAssignment(runId, DateTime.UtcNow);

        await repository.AddAsync(first);
        await repository.AddAsync(second);

        IReadOnlyList<CoverageAssignment> rows = await repository.ListByRunIdAsync(TestScope, runId);

        rows.Should().HaveCount(2);
        rows[0].CoverageAssignmentId.Should().Be(first.CoverageAssignmentId);
        rows[1].CoverageAssignmentId.Should().Be(second.CoverageAssignmentId);
    }

    [Fact]
    public async Task List_by_scope_returns_only_null_run_rows()
    {
        InMemoryCoverageAssignmentRepository repository = new();
        CoverageAssignment tenantDefault = CreateAssignment(runId: null, createdUtc: DateTime.UtcNow);
        CoverageAssignment runScoped = CreateAssignment(runId: Guid.NewGuid().ToString("N"), createdUtc: DateTime.UtcNow);

        await repository.AddAsync(tenantDefault);
        await repository.AddAsync(runScoped);

        IReadOnlyList<CoverageAssignment> rows = await repository.ListByScopeAsync(
            TestScope.TenantId,
            TestScope.WorkspaceId,
            TestScope.ProjectId);

        rows.Should().ContainSingle();
        rows[0].RunId.Should().BeNull();
    }

    [Fact]
    public void Repository_exposes_append_only_surface()
    {
        Type repositoryType = typeof(ICoverageAssignmentRepository);

        repositoryType.GetMethod("AddAsync").Should().NotBeNull();
        repositoryType.GetMethod("UpdateAsync").Should().BeNull();
        repositoryType.GetMethod("DeleteAsync").Should().BeNull();
    }

    private static CoverageAssignment CreateAssignment(string? runId, DateTime createdUtc) => new()
    {
        CoverageAssignmentId = Guid.NewGuid(),
        TenantId = TestScope.TenantId,
        WorkspaceId = TestScope.WorkspaceId,
        ProjectId = TestScope.ProjectId,
        RunId = runId,
        PolicyPackId = Guid.NewGuid(),
        PolicyPackVersion = "1.0.0",
        CoverageType = CoverageType.AdditionalOptional,
        SelectionState = CoverageSelectionState.OptionalAndNotSelected,
        ActorUserId = "operator",
        CreatedUtc = createdUtc,
        EvaluationVersion = "coverage-v1",
    };
}

using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CoverageAssignmentRepositoryCoreTests
{
    [Fact]
    public void FilterByRunId_matches_run_id()
    {
        CoverageAssignment row = new()
        {
            CoverageAssignmentId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = "run-a",
            PolicyPackId = Guid.NewGuid(),
            PolicyPackVersion = "1",
            CoverageType = ArchLucid.Contracts.Governance.Coverage.CoverageType.ProviderNeutralBaseline,
            SelectionState = CoverageSelectionState.OptionalAndSelected,
            ActorUserId = "user",
            CreatedUtc = DateTime.UtcNow,
            EvaluationVersion = "v1",
        };

        CoverageAssignmentRepositoryCore.FilterByRunId([row], "run-a").Should().ContainSingle();
        CoverageAssignmentRepositoryCore.FilterByRunId([row], "run-b").Should().BeEmpty();
    }
}

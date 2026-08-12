using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingPriorityRankUpdateBatchTests
{
    [Fact]
    public void Normalize_trims_ids_and_drops_blank_entries()
    {
        List<(string FindingId, int PriorityRank)> normalized = FindingPriorityRankUpdateBatch.Normalize(
        [
            ("  f-1  ", 1),
            ("   ", 2),
            ("f-2", 3),
        ]);

        normalized.Should().HaveCount(2);
        normalized[0].Should().Be(("f-1", 1));
        normalized[1].Should().Be(("f-2", 3));
    }

    [Fact]
    public void Normalize_rejects_null_input()
    {
        Action act = () => FindingPriorityRankUpdateBatch.Normalize(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void BuildChunk_emits_one_values_row_per_rank_in_the_chunk_window()
    {
        List<(string FindingId, int PriorityRank)> ranks = [("f-1", 10), ("f-2", 20), ("f-3", 30)];

        SqlChunkedBatchCommand command = FindingPriorityRankUpdateBatch.BuildChunk(
            Guid.NewGuid(),
            new ScopeContext(),
            ranks,
            offset: 1,
            rowCount: 2);

        command.CommandText.Should().Contain("(@FindingId0,@PriorityRank0),(@FindingId1,@PriorityRank1)");
        command.CommandText.Should().EndWith(";");
        command.Parameters.ParameterNames.Should().Contain(["FsId", "FindingId0", "PriorityRank1"]);
        command.Parameters.Get<string>("FindingId0").Should().Be("f-2");
        command.Parameters.Get<int>("PriorityRank1").Should().Be(30);
    }

    [Fact]
    public void BuildChunk_omits_scope_predicate_for_trusted_job_scope()
    {
        SqlChunkedBatchCommand command = FindingPriorityRankUpdateBatch.BuildChunk(
            Guid.NewGuid(),
            new ScopeContext(),
            [("f-1", 1)],
            offset: 0,
            rowCount: 1);

        command.CommandText.Should().NotContain("fr.TenantId");
        command.Parameters.ParameterNames.Should().NotContain("ScopeTenantId");
    }

    [Fact]
    public void BuildChunk_scopes_the_update_to_the_tenant_triple()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        SqlChunkedBatchCommand command = FindingPriorityRankUpdateBatch.BuildChunk(
            Guid.NewGuid(),
            scope,
            [("f-1", 1)],
            offset: 0,
            rowCount: 1);

        command.CommandText.Should().Contain("fr.TenantId = @ScopeTenantId");
        command.CommandText.Should().Contain("fr.WorkspaceId = @ScopeWorkspaceId");
        command.CommandText.Should().Contain("fr.ProjectId = @ScopeProjectId");
        command.Parameters.ParameterNames.Should().Contain("ScopeTenantId");
    }

    [Fact]
    public void BuildChunk_rejects_null_arguments()
    {
        Action nullScope = () => FindingPriorityRankUpdateBatch.BuildChunk(Guid.NewGuid(), null!, [], 0, 0);
        Action nullRanks = () =>
            FindingPriorityRankUpdateBatch.BuildChunk(Guid.NewGuid(), new ScopeContext(), null!, 0, 0);

        nullScope.Should().Throw<ArgumentNullException>();
        nullRanks.Should().Throw<ArgumentNullException>();
    }
}

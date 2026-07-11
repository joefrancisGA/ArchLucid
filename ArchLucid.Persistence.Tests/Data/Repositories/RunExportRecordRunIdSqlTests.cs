using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class RunExportRecordRunIdSqlTests
{
    [Fact]
    public void LookupKeys_dashed_route_id_includes_canonical_N_form()
    {
        Guid runGuid = DemoWorkspaceStableIds.RegulatedScenarioArchitectureReviewRunId;

        IReadOnlyList<string> keys = RunExportRecordRunIdSql.LookupKeys(runGuid.ToString("D"));

        keys.Should().Contain(runGuid.ToString("N"));
        keys.Should().Contain(runGuid.ToString("D"));
    }

    [Fact]
    public void LookupKeys_N_form_returns_single_canonical_key()
    {
        Guid runGuid = Guid.NewGuid();
        string canonical = runGuid.ToString("N");

        RunExportRecordRunIdSql.LookupKeys(canonical).Should().Equal([canonical]);
    }

    [Fact]
    public async Task InMemoryGetByRunId_finds_N_stored_row_when_queried_with_D_format()
    {
        Guid runGuid = DemoWorkspaceStableIds.RegulatedScenarioArchitectureReviewRunId;
        InMemoryRunExportRecordRepository repository = new();

        await repository.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = Guid.NewGuid().ToString("N"),
                RunId = runGuid.ToString("N"),
                ExportType = "ArchitectureAnalysis",
                Format = "Markdown",
                FileName = "seed.md",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        IReadOnlyList<RunExportRecord> rows =
            await repository.GetByRunIdAsync(runGuid.ToString("D"), CancellationToken.None);

        rows.Should().ContainSingle();
    }
}

using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Contracts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InMemoryRunExportRecordRepositoryContractTests : RunExportRecordRepositoryContractTests
{
    protected override IRunExportRecordRepository CreateRepository()
    {
        return new InMemoryRunExportRecordRepository();
    }

    [Fact]
    public async Task CreateAsync_replaces_run_list_entry_when_only_export_id_padding_differs()
    {
        InMemoryRunExportRecordRepository repo = new();
        string runId = Guid.NewGuid().ToString("N");
        string exportId = "exp-dup-" + Guid.NewGuid().ToString("N");
        DateTime older = new(2026, 4, 3, 10, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 3, 11, 0, 0, DateTimeKind.Utc);

        await repo.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = exportId,
                RunId = runId,
                ExportType = "analysis",
                Format = "markdown",
                FileName = "a.md",
                CreatedUtc = older,
            },
            CancellationToken.None);

        await repo.CreateAsync(
            new RunExportRecord
            {
                ExportRecordId = $"  {exportId}  ",
                RunId = runId,
                ExportType = "analysis",
                Format = "markdown",
                FileName = "b.md",
                CreatedUtc = newer,
            },
            CancellationToken.None);

        IReadOnlyList<RunExportRecord> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        list.Should().HaveCount(1);
        list[0].FileName.Should().Be("b.md");
    }
}

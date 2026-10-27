using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Core.Scoping;
namespace ArchLucid.Persistence.Tests.Contracts;
[Trait("Category", "Unit")]

/// <summary>
///     Shared contract assertions for <see cref="IRunExportRecordRepository" />.
/// </summary>
public abstract class RunExportRecordRepositoryContractTests
{
    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    protected abstract IRunExportRecordRepository CreateRepository();

    protected virtual Task PrepareRunAsync(string requestId, string runId, CancellationToken ct)
    {
        _ = requestId;
        _ = runId;
        _ = ct;

        return Task.CompletedTask;
    }

    [SkippableFact]
    public async Task Create_then_GetById_round_trips()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-exp-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        string exportId = "exp-" + Guid.NewGuid().ToString("N");

        RunExportRecord record = NewRecord(exportId, runId, new DateTime(2026, 4, 1, 12, 0, 0, DateTimeKind.Utc));

        await repo.CreateAsync(record, CancellationToken.None);

        RunExportRecord? loaded = await repo.GetByIdAsync(exportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded.ExportRecordId.Should().Be(exportId);
        loaded.RunId.Should().Be(runId);
    }

    [SkippableFact]
    public async Task GetById_matches_when_stored_primary_key_has_surrounding_whitespace()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-exp-pad-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        string exportId = "exp-" + Guid.NewGuid().ToString("N");

        await repo.CreateAsync(NewRecord($"  {exportId}  ", runId, new DateTime(2026, 4, 2, 12, 0, 0, DateTimeKind.Utc)), CancellationToken.None);

        RunExportRecord? loaded = await repo.GetByIdAsync(exportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ExportRecordId.Should().Be(exportId);
    }

    [SkippableFact]
    public async Task Create_trims_export_record_id_on_persist()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-exp-create-trim-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        string exportId = "exp-" + Guid.NewGuid().ToString("N");

        await repo.CreateAsync(NewRecord($"  {exportId}  ", runId, new DateTime(2026, 4, 3, 12, 0, 0, DateTimeKind.Utc)), CancellationToken.None);

        RunExportRecord? loaded = await repo.GetByIdAsync(exportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ExportRecordId.Should().Be(exportId);
    }

    [SkippableFact]
    public async Task Create_trims_compare_manifest_version_on_persist()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-exp-cmpver-trim-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        string exportId = "exp-" + Guid.NewGuid().ToString("N");
        RunExportRecord record = NewRecord(exportId, runId, new DateTime(2026, 4, 4, 12, 0, 0, DateTimeKind.Utc));
        record.CompareManifestVersion = "  v5  ";

        await repo.CreateAsync(record, CancellationToken.None);

        RunExportRecord? loaded = await repo.GetByIdAsync(exportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.CompareManifestVersion.Should().Be("v5");
    }

    [SkippableFact]
    public async Task GetById_matches_when_lookup_export_id_differs_only_by_casing()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-exp-case-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        const string storedExportId = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const string lookupExportId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

        await repo.CreateAsync(
            NewRecord(storedExportId, runId, new DateTime(2026, 4, 2, 14, 0, 0, DateTimeKind.Utc)),
            CancellationToken.None);

        RunExportRecord? loaded = await repo.GetByIdAsync(lookupExportId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ExportRecordId.Should().Be(storedExportId);
    }

    [SkippableFact]
    public async Task GetById_matches_when_lookup_id_has_surrounding_whitespace()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-exp-pad2-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        string exportId = "exp-" + Guid.NewGuid().ToString("N");

        await repo.CreateAsync(NewRecord(exportId, runId, new DateTime(2026, 4, 2, 13, 0, 0, DateTimeKind.Utc)), CancellationToken.None);

        RunExportRecord? loaded = await repo.GetByIdAsync($"  {exportId}  ", CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.ExportRecordId.Should().Be(exportId);
    }

    [SkippableFact]
    public async Task GetByRunId_finds_exports_when_stored_run_id_differs_only_by_casing()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string uppercaseRunId = runId.ToUpperInvariant();
        string requestId = "req-exp-run-case-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        string exportId = "exp-" + Guid.NewGuid().ToString("N");

        await repo.CreateAsync(
            NewRecord(exportId, uppercaseRunId, new DateTime(2026, 4, 5, 12, 0, 0, DateTimeKind.Utc)),
            CancellationToken.None);

        IReadOnlyList<RunExportRecord> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        list.Should().ContainSingle(r => r.ExportRecordId == exportId);
    }

    [SkippableFact]
    public async Task GetByRunId_finds_exports_when_stored_run_id_has_surrounding_whitespace()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-exp-run-pad-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        string exportId = "exp-" + Guid.NewGuid().ToString("N");

        await repo.CreateAsync(
            NewRecord(exportId, $"  {runId}  ", new DateTime(2026, 4, 4, 12, 0, 0, DateTimeKind.Utc)),
            CancellationToken.None);

        IReadOnlyList<RunExportRecord> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        list.Should().ContainSingle(r => r.ExportRecordId == exportId);
    }

    [SkippableFact]
    public async Task GetByRunId_orders_descending_by_CreatedUtc()
    {
        SkipIfSqlServerUnavailable();
        IRunExportRecordRepository repo = CreateRepository();
        string runId = Guid.NewGuid().ToString("N");
        string requestId = "req-exp2-" + Guid.NewGuid().ToString("N");
        await PrepareRunAsync(requestId, runId, CancellationToken.None);
        DateTime older = new(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 1, 11, 0, 0, DateTimeKind.Utc);

        await repo.CreateAsync(NewRecord("e-old", runId, older), CancellationToken.None);
        await repo.CreateAsync(NewRecord("e-new", runId, newer), CancellationToken.None);

        IReadOnlyList<RunExportRecord> list = await repo.GetByRunIdAsync(runId, CancellationToken.None);

        list.Should().HaveCount(2);
        list[0].ExportRecordId.Should().Be("e-new");
        list[1].ExportRecordId.Should().Be("e-old");
    }

    private static RunExportRecord NewRecord(string exportId, string runId, DateTime createdUtc)
    {
        return new RunExportRecord
        {
            ExportRecordId = exportId,
            RunId = runId,
            ExportType = "analysis",
            Format = "markdown",
            FileName = "out.md",
            CreatedUtc = createdUtc
        };
    }
}

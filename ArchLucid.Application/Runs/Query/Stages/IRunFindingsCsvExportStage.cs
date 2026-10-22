namespace ArchLucid.Application.Runs.Query.Stages;

public interface IRunFindingsCsvExportStage
{
    Task<RunFindingsCsvExportQueryResult> ExportRunFindingsCsvAsync(
        string runId,
        CancellationToken cancellationToken);
}
